import sqlalchemy as sa
from fastapi import APIRouter

from backend.data.db_connections import Session
from backend.data.db_schema import Movie, Nomination
from backend.data.utils import create_unique_movie_id
from backend.intake.schemas import (
    EnrichRequest,
    EnrichResponse,
    EnrichmentResult,
    MovieToCreate,
    NominationImportResponse,
    NominationPreviewRequest,
    NominationPreviewResponse,
    SimilarTitleWarning,
)
from backend.intake.title_matching import (
    find_similar_titles,
    get_original_titles_for_normalized,
    group_by_normalized_title,
)
from backend.intake.tmdb_enrichment import (
    enrich_movie,
    extract_enrichment_data,
    get_tmdb_movie_details,
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
    warnings: list[SimilarTitleWarning] = []
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
    Batch fill TMDB data for movies missing movie_db_id.

    If force=True, re-enrich all movies for the year, even if they already have TMDB data.
    """
    # Get movies that need enrichment
    with Session() as session:
        query = sa.select(Movie.movie_id, Movie.title).where(Movie.year == request.year)
        if not request.force:
            query = query.where(Movie.movie_db_id.is_(None))
        result = session.execute(query)
        movies_to_enrich = result.fetchall()

    results: list[EnrichmentResult] = []
    enriched = 0
    skipped = 0
    not_found = 0
    errors = 0

    for movie_id, title in movies_to_enrich:
        # Call TMDB to find and enrich the movie
        enrichment_result = await enrich_movie(movie_id, title, request.year)
        results.append(enrichment_result)

        if enrichment_result.status == "success" and enrichment_result.tmdb_id:
            # Fetch full details and save to database
            details = await get_tmdb_movie_details(enrichment_result.tmdb_id)
            if details:
                update_data = extract_enrichment_data(details)
                with Session() as session:
                    _ = session.execute(
                        sa.update(Movie)
                        .where(Movie.movie_id == movie_id)
                        .values(**update_data)
                    )
                    session.commit()
                enriched += 1
            else:
                errors += 1
                enrichment_result.status = "error"
                enrichment_result.error = "Failed to fetch details after successful search"
        elif enrichment_result.status == "not_found":
            not_found += 1
        elif enrichment_result.status == "error":
            errors += 1
        else:
            skipped += 1

    return EnrichResponse(
        enriched=enriched,
        skipped=skipped,
        not_found=not_found,
        errors=errors,
        results=results,
    )
