import re
from collections import defaultdict

from rapidfuzz import fuzz

from backend.intake.schemas import NominationRow


def normalize_title(title: str) -> str:
    """
    Normalize a movie title for matching.

    - Lowercase
    - Remove leading articles (The, A, An)
    - Normalize dashes/colons to spaces
    - Remove special characters
    - Collapse whitespace
    """
    result = title.lower().strip()

    # Remove leading articles
    for article in ["the ", "a ", "an "]:
        if result.startswith(article):
            result = result[len(article):]
            break

    # Normalize dashes and colons to spaces
    result = re.sub(r"[-:]+", " ", result)

    # Remove special characters (keep alphanumeric and spaces)
    result = re.sub(r"[^a-z0-9\s]", "", result)

    # Collapse whitespace
    result = re.sub(r"\s+", " ", result).strip()

    return result


def group_by_normalized_title(
    rows: list[NominationRow],
) -> dict[str, list[int]]:
    """
    Groups rows by normalized title.

    Returns {normalized_title: [row_indices]}
    """
    groups: dict[str, list[int]] = defaultdict(list)

    for idx, row in enumerate(rows):
        normalized = normalize_title(row.title)
        groups[normalized].append(idx)

    return dict(groups)


def find_similar_titles(
    normalized_titles: list[str], threshold: float = 85.0
) -> list[tuple[str, str, float]]:
    """
    Finds pairs of normalized titles that are similar but not identical.

    Args:
        normalized_titles: List of normalized titles to compare
        threshold: Minimum similarity score (0-100) to consider titles as similar

    Returns [(title1, title2, similarity_score), ...]
    Used to warn user about potential duplicates.
    """
    similar_pairs: list[tuple[str, str, float]] = []
    titles = list(set(normalized_titles))  # Deduplicate

    for i, title1 in enumerate(titles):
        for title2 in titles[i + 1:]:
            # Skip if identical (already handled by grouping)
            if title1 == title2:
                continue

            # Calculate similarity using token sort ratio for better matching
            # of titles with words in different orders
            score = fuzz.token_sort_ratio(title1, title2)

            if score >= threshold:
                similar_pairs.append((title1, title2, score))

    return similar_pairs


def get_original_titles_for_normalized(
    rows: list[NominationRow], normalized_title: str
) -> list[str]:
    """
    Get all original title variations that normalize to the same title.
    """
    original_titles: set[str] = set()

    for row in rows:
        if normalize_title(row.title) == normalized_title:
            original_titles.add(row.title)

    return list(original_titles)
