from typing import NewType, Literal, Dict, TypedDict, NotRequired

IDNum = NewType("IDNum", str)
MovID = NewType("MovID", IDNum)
UserID = NewType("UserID", IDNum)
CatID = NewType("CatID", IDNum)
DataFlavor = Literal["movies", "users", "nominations", "categories", "watchlist"]
WatchStatus = Literal["seen", "todo", "blank"]


# Nom = NewType('Nom', TypedDict['movie': MovID, 'category': CatID, 'note': str|None])
class Nom(TypedDict):
    movie: MovID
    category: CatID
    note: NotRequired[str | None]


__all__ = ["MovID", "UserID", "CatID", "Nom", "DataFlavor", "IDNum", "WatchStatus"]
