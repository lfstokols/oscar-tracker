# Nomination Import File Format

This document describes the JSON format required for importing Oscar nominations via the `/admin/nominations/import` endpoint.

## Endpoint

```
POST /api/admin/nominations/import
```

## Request Format

The endpoint expects a JSON body with the following structure:

```json
{
  "year": 2025,
  "rows": [
    {
      "title": "Movie Title",
      "category_id": "cat_pict",
      "note": null
    },
    {
      "title": "Movie Title",
      "category_id": "cat_mact",
      "note": "Actor Name"
    }
  ]
}
```

## Field Descriptions

### Top Level

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `year` | integer | Yes | The year (1927-present) these nominations are for - N.B.: when the movies were released, not when the ceremony was held |
| `rows` | array | Yes | List of nomination entries |

### Row Object

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | string | Yes | Movie title (will be normalized for grouping) |
| `category_id` | string | Yes | Category identifier (see table below) |
| `note` | string or null | No | Additional info (e.g., actor name, song title) |

## Category IDs

Use these exact category IDs in the `category_id` field:

| Category ID | Short Name | Full Name | Has Note |
|-------------|------------|-----------|----------|
| `cat_pict` | Best Picture | Best Picture | No |
| `cat_dirc` | Director | Best Director | No |
| `cat_mact` | Actor | Best Actor | Yes |
| `cat_fact` | Actress | Best Actress | Yes |
| `cat_msac` | Supporting Actor | Best Supporting Actor | Yes |
| `cat_fsac` | Supporting Actress | Best Supporting Actress | Yes |
| `cat_oscp` | Original Screenplay | Best Original Screenplay | No |
| `cat_ascp` | Adapted Screenplay | Best Adapted Screenplay | No |
| `cat_anim` | Animated | Best Animated Feature | No |
| `cat_frgn` | International | Best International Feature Film | Yes |
| `cat_docu` | Documentary | Best Documentary Feature Film | No |
| `cat_cine` | Cinematography | Best Cinematography | No |
| `cat_edit` | Editing | Best Film Editing | No |
| `cat_soun` | Sound | Best Sound | No |
| `cat_scor` | Score | Best Original Score | No |
| `cat_song` | Original Song | Best Original Song | Yes |
| `cat_prod` | Production Design | Best Production Design | No |
| `cat_mkup` | Makeup & Hair | Best Makeup and Hairstyling | No |
| `cat_cstu` | Costumes | Best Costume Design | No |
| `cat_vfxx` | Visual Effects | Best Visual Effects | No |
| `cat_shla` | Short (Live-Action) | Best Live Action Short Film | No |
| `cat_sanm` | Short (Animated) | Best Animated Short Film | No |
| `cat_sdoc` | Short (Documentary) | Best Documentary Short Film | No |

## Notes Field Usage

The `note` field is used for categories that require additional context:

- **Acting categories** (`cat_mact`, `cat_fact`, `cat_msac`, `cat_fsac`): Actor/actress name
- **Original Song** (`cat_song`): Song title
- **International** (`cat_frgn`): Country name

For categories without notes, set `note` to `null` or omit the field.

## Example: Complete Import File

```json
{
  "year": 2025,
  "rows": [
    {"title": "Anora", "category_id": "cat_pict", "note": null},
    {"title": "The Brutalist", "category_id": "cat_pict", "note": null},
    {"title": "Conclave", "category_id": "cat_pict", "note": null},

    {"title": "Anora", "category_id": "cat_dirc", "note": null},
    {"title": "The Brutalist", "category_id": "cat_dirc", "note": null},

    {"title": "The Brutalist", "category_id": "cat_mact", "note": "Adrien Brody"},
    {"title": "Conclave", "category_id": "cat_mact", "note": "Ralph Fiennes"},

    {"title": "Anora", "category_id": "cat_fact", "note": "Mikey Madison"},
    {"title": "Wicked", "category_id": "cat_fact", "note": "Cynthia Erivo"},

    {"title": "Emilia Pérez", "category_id": "cat_song", "note": "El Mal"},
    {"title": "The Wild Robot", "category_id": "cat_song", "note": "Kiss the Sky"},

    {"title": "I'm Still Here", "category_id": "cat_frgn", "note": "Brazil"},
    {"title": "The Girl with the Needle", "category_id": "cat_frgn", "note": "Denmark"}
  ]
}
```

## Title Normalization

The import system normalizes movie titles to group nominations together:
- Titles are compared case-insensitively
- Minor variations (punctuation, "The" prefix) are handled
- Similar but distinct titles will generate warnings in the preview endpoint

## Preview Endpoint

Before importing, you can validate your data using:

```
POST /api/admin/nominations/preview
```

This accepts the same format and returns:
- List of movies that will be created
- Warnings about similar titles that might be duplicates
- Total nomination count

## Category ID Format

Category IDs follow the pattern `cat_XXXX` where `XXXX` is a 4-letter lowercase code:
- Must match regex: `^cat_[a-z]{4}$`
- Only the IDs listed above are valid
