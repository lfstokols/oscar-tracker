# oscars.py

from flask import Blueprint, jsonify, request
import json
from datetime import datetime
#from sqlalchemy import create_engine, ForeignKey, DateTime, Text
#from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship
from typing import List, Optional

YEAR = 2024
#with open("data/cat_names.json", r) as file:
#	CAT_NAMES = json.load(file)
CAT_NAMES = {'Best Picture': 'Best Picture', 'Actor': 'Best Actor', 'Actress': 'Best Actress', 'Supporting Actor': 'Best Supporting Actor', 'Supporting Actress': 'Best Supporting Actress', 'International': 'Best International Feature', 'Original Song': 'Best Original Song'}

NOM_TYPES = {'Actor': 'name', 'Actress': 'name', 'Supporting Actor': 'name', 'Supporting Actress': 'name', 'International': 'country'}
FLAIRED_NOMS = {'Actor', 'Actress', 'Supporting Actor', 'Supporting Actress', 'International', 'Original Song'}
All_NOMS = set()

class Movie:
	def __init__(self, title):
		self.title = title
		self.alias = set(title)
		self.runtime = None
		self.studio = None
		self.imdbid = None
		self.nominations = set()
		self.where_available = None
	
	def add_nomination(self, cat):
		self.nominations.add(cat)
	
	def __repr__(self):
		return f"<Movie(title={self.title})>"
	
class Category:
	def __init__(self, label, is_short = False):
		self.label = label
		self.long_name = CAT_NAMES[label]
		if (self.label == 'Best Picture'):
			self.max_nominees = 10
		else:
			self.max_nominees = 5
		self.nominees = set()

	def add_nominee(self, cat):
		self.nominees.add(cat)
	
	def isFlaired(self):
		return self.label in FLAIRED_NOMS
	
	def setFlair(self, data):
		if self.isFlared():
			self.flair = data
			return True
		else:
			return False
	
	def getFlair(self):
		if self.isFlared():
			return self.flair
	
	def __repr__(self):
		return f"<Category(name={self.name})>"
"""		
	id: Mapped[int] = mapped_column(primary_key=True)
	title: Mapped[str]
	runtime: Mapped[int]  # in minutes
	studio: Mapped[Optional[str]]
	where_available: Mapped[str]
	poster_url: Mapped[Optional[str]]
	
	# Relationships
	nominations: Mapped[List["Nomination"]] = relationship(back_populates="movie")
	watched_by: Mapped[List["UserWatchlist"]] = relationship(back_populates="movie")
	


class Category(Base):
	__tablename__ = "categories"
	
	id: Mapped[int] = mapped_column(primary_key=True)
	name: Mapped[str]
	long_name: Mapped[str]
	max_nominees: Mapped[int] = mapped_column(default=5)
	has_decoration: Mapped[bool] # for example, actor name or country name
	
	# Relationships
	nominations: Mapped[List["Nomination"]] = relationship(back_populates="category")
	
	def __repr__(self):
		return f"<Category(name={self.name})>"
"""

class User:
	def __init__(self, username):
		self.username = username
		#email: Mapped[str]
		self.letterboxd = None
		self.created_at = datetime.utcnow()
		#self.last_login = datetime.utcnow
		
		self.seen_list = set()
		self.todo_list = set()
	
	def mark_watched(self, movie):
		self.seen_list.add(movie)
	
	def remove_watched(self, movie):
		self.seen_list.discard(movie)
	
	def mark_todo(self, movie):
		self.todo_list.add(movie)
	
	def remove_todo(self, movie):
		self.todo_list.remove(movie)

	def __repr__(self):
		return f"<User(username={self.username})>"

class Nomination:
	def __init__(self, movie, category, flair = None, tracking_list = All_NOMS):
		self.movie = movie
		self.movietitle = movie.title
		self.category = category
		self.categoryname = category.label
		if (category.label in FLAIRED_NOMS):
			self.flair = flair
		self.won = False
		self.year = YEAR
		tracking_list.add(self)
		self.movie.add_nomination(self)
		self.category.add_nominee(self)
	
	def __repr__(self):
		if (self.flair):
			return f"<Nomination(movie={self.movietitle}, flair={self.flair}, category={self.categoryname}, year={self.year})>"
		return f"<Nomination(movie={self.movietitle}, category={self.categoryname}, year={self.year})>"

"""
class UserWatchlist(Base):
	__tablename__ = "user_watchlist"
	
	id: Mapped[int] = mapped_column(primary_key=True)
	user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
	movie_id: Mapped[int] = mapped_column(ForeignKey("movies.id"))
	watched_date: Mapped[datetime]
	rating: Mapped[Optional[int]]
	notes: Mapped[Optional[str]] = mapped_column(Text)
	
	# Relationships
	user: Mapped["User"] = relationship(back_populates="watchlist")
	movie: Mapped["Movie"] = relationship(back_populates="watched_by")
	
	def __repr__(self):
		return f"<UserWatchlist(user={self.user.username}, movie={self.movie.title})>"
"""



def get_user_watched_movies(user):
	"""Get all movies a user has watched."""
	return [entry.movie for entry in user.seen_list]

def get_category_nominees(cat):
	"""Get all movies nominated in a category for a specific year."""
	return [nominee.movie for nominee in cat.nominees]

def get_movie_nominations(movie):
	"""Get all nominations for a specific movie."""
	return [nom for nom in All_NOMS if nom.movie == movie]

example_movies = []
example_categories = []
example_users = []
example_users.append(User("Logan"))
example_movies.append(Movie("Oppenheimer"))
example_movies.append(Movie("Poor Things"))
example_movies.append(Movie("Killers of the Flower Moon"))
example_movies.append(Movie("Barbie"))
example_categories.append(Category("Best Picture"))
example_categories.append(Category("Actor"))
example_categories.append(Category("Actress"))
for (movie, cat) in zip(example_movies, example_categories):
	Nomination(movie, cat, tracking_list=All_NOMS)
example_users[0].mark_watched(example_movies[0])



#def imdbScrape