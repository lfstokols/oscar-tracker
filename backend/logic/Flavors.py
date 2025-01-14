from typing import Literal
from backend.logic.MyTypes import DataFlavor


flavor_list: dict[DataFlavor] = [
    "movies",
    "users",
    "nominations",
    "categories",
    "watchlist",
]
flavor_aliases = {
    **{
        flavor: flavor for flavor in flavor_list
    },  # Each flavor is its own alias
    **{
        flavor[:1]: flavor for flavor in flavor_list
    },  # First letter of each flavor is an alias
    "mov": "movies",
    "usr": "users",
    "cat": "categories",  # aliases from id prefixes
}

# Converts flavor from alias
# Throws on invalid flavor
def format_flavor(flavor: str) -> DataFlavor:
    assert flavor in flavor_aliases.keys(), f"Invalid flavor '{flavor}'."
    return flavor_aliases[flavor]

def flavor_props(
    flavor_indic, is_filename=False
) -> dict[Literal["shape", "static", "annual"], str | bool]:
    """
    'flavor_indic' can be a DataFlavor or a Path object
    if 'is_filename=False', then function WILL throw on invalid flavor
    'shape' tells you if the flavor in question refers to an edge list or an entity list
            An entity list has each row as a separate entity, with an ID column,
                and the rest of the columns represent attributes
            An edge list has no ID column. The first two columns are IDs for the related entities,
                and the remaining columns are properties of that relationship
    'static' tells you if the flavor is a static table that should not be edited
    'annual' tells you if the tables exist only once or if there are copies in each year folder
    """
    props = {"shape": None, "static": False, "annual": True}
    if is_filename:
        file = flavor_indic
        name = file.name
        for flv in flavor_list:
            if flv in name:
                flavor = flv
    else:
        flavor = format_flavor(flavor_indic)
    # After this point, `flavor` is a string of type DataFlavor
    if flavor in ["nominations", "watchlist"]:
        props["shape"] = "edge"
    else:
        props["shape"] = "entity"
    if flavor in ["categories", "c"]:
        props["static"] = True
    if flavor in ["categories", "users"]:
        props["annual"] = False
    return props