import logging
import re
import requests
from bs4 import BeautifulSoup
from bs4.element import Tag
import backend.utils.env_reader as env
from backend.routing_lib.error_handling import externalAPIError

movie_db_key = env.TMDB_API_KEY

def get_justwatch(tmdb_id: int) -> tuple[str, int]:
    """
    Get the JustWatch URL for a given TMDB ID.
    """
    url = f"{movie_db_url(tmdb_id)}/watch"
    response = requests.get(url)
    soup = BeautifulSoup(response.text, "html.parser")
    ott_div = soup.find("div", class_="ott_title")
    if ott_div is None or type(ott_div) != Tag:
        raise externalAPIError(f"No JustWatch URL found for {tmdb_id}: no ott_title block found")
    text = ott_div.find_next('p')
    if text is None or type(text) != Tag:
        raise externalAPIError(f"No JustWatch URL found for {tmdb_id}: no text found after ott_title block")
    if re.fullmatch(r"^(There are no offers).*", text.text.strip()):
        return text.text.strip(), 1
    link = text.find("a")
    if link is None or type(link) != Tag or "href" not in link.attrs:
        logging.debug(f"No link found for {tmdb_id}: {text.text.strip()}")
        raise externalAPIError(f"No JustWatch URL found for {tmdb_id}: no link found after ott_title block")
    justwatch_url = link["href"]
    if type(justwatch_url) == list and len(justwatch_url) > 0 and type(justwatch_url[0]) == str:
        justwatch_url = justwatch_url[0]
    if justwatch_url is None or type(justwatch_url) != str:
        raise externalAPIError(f"No JustWatch URL found for {tmdb_id}: link href is not a string")
    return justwatch_url, 0

def movie_db_url(tmdb_id: int) -> str:
    """
    Get the MovieDB URL for a given TMDB ID.
    """
    url = f"https://www.themoviedb.org/movie/{tmdb_id}"
    return url

def get_Imdb(movie_db_id: int) -> str:
    """
    Get the IMDB URL for a given TMDB ID.
    """
    url = "https://api.themoviedb.org/3/"
    headers = {"Authorization": f"Bearer {movie_db_key}", "accept": "application/json"}
    endpoint = f"{url}movie/{movie_db_id}/external_ids"
    response = requests.get(endpoint, headers=headers)
    data = response.json()
    if "imdb_id" not in data:
        raise externalAPIError(f"No IMDB URL found for {movie_db_id}: no imdb_id found in external_ids")
    imdb_id = data["imdb_id"]
    return f"https://www.imdb.com/title/{imdb_id}"