from pydantic import BaseModel, Field

from backend.types.api_schemas import CategoryID, MovieID


class NominationRow(BaseModel):
    """A single row from the nominations CSV."""
    title: str
    category_id: CategoryID
    note: str | None = None


class NominationPreviewRequest(BaseModel):
    """Request body for the nominations preview endpoint."""
    year: int = Field(ge=1927, le=2100)
    rows: list[NominationRow]


class MovieToCreate(BaseModel):
    """A movie that will be created during import."""
    normalized_title: str
    original_titles: list[str]
    row_indices: list[int]


class SimilarTitleWarning(BaseModel):
    """Warning about titles that are similar but will be treated as different."""
    type: str = "similar_titles"
    titles: list[str]
    message: str


class SpellingVariationWarning(BaseModel):
    """Warning about different spellings that will be merged into one movie."""
    type: str = "spelling_variation"
    titles: list[str]
    chosen_title: str
    message: str


# Union type for all warning types
ImportWarning = SimilarTitleWarning | SpellingVariationWarning


class NominationPreviewResponse(BaseModel):
    """Response from the nominations preview endpoint."""
    movies_to_create: list[MovieToCreate]
    warnings: list[ImportWarning]
    nomination_count: int


class NominationImportResponse(BaseModel):
    """Response from the nominations import endpoint."""
    movies_created: int
    nominations_created: int
    movie_ids: list[MovieID]


class EnrichRequest(BaseModel):
    """
    Request body for the TMDB enrichment endpoint.

    Operations:
    - search: Find TMDB IDs for movies by searching by title
    - hydrate: Fetch metadata (poster, runtime, etc.) for movies that have TMDB IDs

    By default, both operations only process movies missing the relevant data.
    Use force_search/force_hydrate to reprocess all movies.
    """
    year: int = Field(ge=1927, le=2100)
    search: bool = True
    force_search: bool = False
    hydrate: bool = True
    force_hydrate: bool = False


class SearchResult(BaseModel):
    """Result of searching for a single movie's TMDB ID."""
    movie_id: MovieID
    title: str
    tmdb_id: int | None = None
    confidence: float | None = None
    status: str  # "found", "not_found", "skipped", "error"
    error: str | None = None


class HydrateResult(BaseModel):
    """Result of hydrating a single movie's metadata."""
    movie_id: MovieID
    title: str
    status: str  # "success", "skipped", "error"
    error: str | None = None


class EnrichResponse(BaseModel):
    """Response from the TMDB enrichment endpoint."""
    search_found: int = 0
    search_not_found: int = 0
    search_skipped: int = 0
    search_errors: int = 0
    search_results: list[SearchResult] = []
    hydrate_success: int = 0
    hydrate_skipped: int = 0
    hydrate_errors: int = 0
    hydrate_results: list[HydrateResult] = []
