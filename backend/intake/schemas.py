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


class NominationPreviewResponse(BaseModel):
    """Response from the nominations preview endpoint."""
    movies_to_create: list[MovieToCreate]
    warnings: list[SimilarTitleWarning]
    nomination_count: int


class NominationImportResponse(BaseModel):
    """Response from the nominations import endpoint."""
    movies_created: int
    nominations_created: int
    movie_ids: list[MovieID]


class EnrichRequest(BaseModel):
    """Request body for the TMDB enrichment endpoint."""
    year: int = Field(ge=1927, le=2100)
    force: bool = False


class EnrichmentResult(BaseModel):
    """Result of enriching a single movie."""
    movie_id: MovieID
    title: str
    tmdb_id: int | None = None
    confidence: float | None = None
    status: str  # "success", "not_found", "error"
    error: str | None = None


class EnrichResponse(BaseModel):
    """Response from the TMDB enrichment endpoint."""
    enriched: int
    skipped: int
    not_found: int
    errors: int
    results: list[EnrichmentResult]
