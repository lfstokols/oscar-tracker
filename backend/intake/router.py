import sqlalchemy as sa
from fastapi import APIRouter

from backend.data.db_connections import Session
from backend.data.db_schema import Movie, Nomination
from backend.data.utils import create_unique_movie_id
from backend.intake.schemas import (
    EnrichRequest,
    EnrichResponse,
    HydrateResult,
    ImportWarning,
    MovieToCreate,
    NominationImportResponse,
    NominationPreviewRequest,
    NominationPreviewResponse,
    SearchResult,
    SimilarTitleWarning,
    SpellingVariationWarning,
)
from backend.intake.title_matching import (
    find_similar_titles,
    get_original_titles_for_normalized,
    group_by_normalized_title,
)
from backend.intake.tmdb_enrichment import (
    extract_enrichment_data,
    get_tmdb_movie_details,
    search_movie_tmdb_id,
)
from backend.types.api_schemas import MovieID

router = APIRouter()


@router.post("/nominations/preview", response_model=NominationPreviewResponse)
async def preview_nominations(request: NominationPreviewRequest) -> NominationPreviewResponse:
    """
    Preview nomination import - validates data and warns about similar-but-distinct titles.

    This is a dry-run that performs the same normalization logic as the real endpoint.
    If the user is happy with the groupings shown, they submit the same data to /import.
    """
    # Group rows by normalized title
    groups = group_by_normalized_title(request.rows)

    # Build list of movies that will be created
    movies_to_create: list[MovieToCreate] = []
    for normalized_title, row_indices in groups.items():
        original_titles = get_original_titles_for_normalized(
            request.rows, normalized_title
        )
        movies_to_create.append(
            MovieToCreate(
                normalized_title=normalized_title,
                original_titles=original_titles,
                row_indices=row_indices,
            )
        )

    # Find similar titles to warn about
    warnings: list[ImportWarning] = []
    normalized_titles = list(groups.keys())
    similar_pairs = find_similar_titles(normalized_titles)

    for title1, title2, score in similar_pairs:
        # Get original titles for both
        orig1 = get_original_titles_for_normalized(request.rows, title1)
        orig2 = get_original_titles_for_normalized(request.rows, title2)
        warnings.append(
            SimilarTitleWarning(
                titles=[orig1[0] if orig1 else title1, orig2[0] if orig2 else title2],
                message=f"These titles are similar ({score:.0f}% match) but will be treated as different movies",
            )
        )

    # Warn about spelling variations that will be merged
    for movie in movies_to_create:
        if len(movie.original_titles) > 1:
            warnings.append(
                SpellingVariationWarning(
                    titles=movie.original_titles,
                    chosen_title=movie.original_titles[0],
                    message=f"Multiple spellings found - will use \"{movie.original_titles[0]}\"",
                )
            )

    return NominationPreviewResponse(
        movies_to_create=movies_to_create,
        warnings=warnings,
        nomination_count=len(request.rows),
    )


@router.post("/nominations/import", response_model=NominationImportResponse)
async def import_nominations(request: NominationPreviewRequest) -> NominationImportResponse:
    """
    Import nominations - creates movies and nominations in the database.

    Uses the same normalization logic as /preview, so the results are deterministic.
    """
    # Group rows by normalized title
    groups = group_by_normalized_title(request.rows)

    movie_ids: list[MovieID] = []
    nominations_created = 0

    with Session() as session:
        for normalized_title, row_indices in groups.items():
            # Get the first original title to use as the movie title
            original_titles = get_original_titles_for_normalized(
                request.rows, normalized_title
            )
            display_title = original_titles[0] if original_titles else normalized_title

            # Create the movie
            movie_id = create_unique_movie_id(request.year)
            _ = session.execute(
                sa.insert(Movie).values(
                    movie_id=movie_id,
                    year=request.year,
                    title=display_title,
                )
            )
            movie_ids.append(movie_id)

            # Create nominations for each row that maps to this movie
            for row_idx in row_indices:
                row = request.rows[row_idx]
                _ = session.execute(
                    sa.insert(Nomination).values(
                        year=request.year,
                        movie_id=movie_id,
                        category_id=row.category_id,
                        note=row.note,
                    )
                )
                nominations_created += 1

        session.commit()

    return NominationImportResponse(
        movies_created=len(movie_ids),
        nominations_created=nominations_created,
        movie_ids=movie_ids,
    )


@router.post("/enrich", response_model=EnrichResponse)
async def enrich_movies(request: EnrichRequest) -> EnrichResponse:
    """
    Enrich movies with TMDB data. Two operations available:

    - search: Find TMDB IDs for movies by searching by title
    - hydrate: Fetch metadata (poster, runtime, etc.) for movies that have TMDB IDs

    By default, both operations run and only process movies missing the relevant data.
    Use force_search/force_hydrate to reprocess all movies.
    """
    response = EnrichResponse()

    # Step 1: Search for TMDB IDs
    if request.search:
        with Session() as session:
            query = sa.select(Movie.movie_id, Movie.title).where(
                Movie.year == request.year
            )
            if not request.force_search:
                query = query.where(Movie.movie_db_id.is_(None))
            result = session.execute(query)
            movies_to_search = result.fetchall()

        for movie_id, title in movies_to_search:
            search_result = await search_movie_tmdb_id(movie_id, title, request.year)
            response.search_results.append(search_result)

            if search_result.status == "found" and search_result.tmdb_id:
                # Save the TMDB ID to database
                with Session() as session:
                    _ = session.execute(
                        sa.update(Movie)
                        .where(Movie.movie_id == movie_id)
                        .values(movie_db_id=str(search_result.tmdb_id))
                    )
                    session.commit()
                response.search_found += 1
            elif search_result.status == "not_found":
                response.search_not_found += 1
            elif search_result.status == "error":
                response.search_errors += 1
            else:
                response.search_skipped += 1

    # Step 2: Hydrate metadata for movies with TMDB IDs
    if request.hydrate:
        with Session() as session:
            query = sa.select(Movie.movie_id, Movie.title, Movie.movie_db_id).where(
                Movie.year == request.year,
                Movie.movie_db_id.isnot(None),
            )
            if not request.force_hydrate:
                # Only hydrate movies missing metadata (poster_path as proxy)
                query = query.where(Movie.poster_path.is_(None))
            result = session.execute(query)
            movies_to_hydrate = result.fetchall()

        for movie_id, title, movie_db_id in movies_to_hydrate:
            try:
                tmdb_id = int(movie_db_id)
                details = await get_tmdb_movie_details(tmdb_id)

                if details:
                    update_data = extract_enrichment_data(details)
                    # Don't overwrite movie_db_id since it's already set
                    del update_data["movie_db_id"]

                    with Session() as session:
                        _ = session.execute(
                            sa.update(Movie)
                            .where(Movie.movie_id == movie_id)
                            .values(**update_data)
                        )
                        session.commit()

                    response.hydrate_results.append(
                        HydrateResult(
                            movie_id=movie_id,
                            title=title,
                            status="success",
                        )
                    )
                    response.hydrate_success += 1
                else:
                    response.hydrate_results.append(
                        HydrateResult(
                            movie_id=movie_id,
                            title=title,
                            status="error",
                            error="Failed to fetch TMDB details",
                        )
                    )
                    response.hydrate_errors += 1

            except Exception as e:
                response.hydrate_results.append(
                    HydrateResult(
                        movie_id=movie_id,
                        title=title,
                        status="error",
                        error=str(e),
                    )
                )
                response.hydrate_errors += 1

    return response
