from datetime import time
from time import sleep
import random
from pathlib import Path
import re
import pandas as pd
import os
import sys
from contextlib import contextmanager
if sys.platform.startswith('win'):
	import msvcrt
else:
	import fcntl
from collections.abc import Callable
from MyTypes import *
#from typing import NewType, Literal

# You should move this inside the StorageManager class
# Then you can put the looping directly inside instead of repeating it over and over
def create_unique_id(type: DataFlavor) -> MovID|UserID: #type is a string, 'movie' or 'user'
	if type == 'movie':
		id = 'mov_'
	elif type == 'user':
		id = 'usr_'
	else:
		raise Exception("Invalid type. Must be 'movie' or 'user'.")
	return id + f'{random.randint(0, 0xFFFFFF):06x}'
	


class StorageManager:
	def __init__(self, database_directory):
		self.dir = Path(database_directory)
		self.retry_interval = 0.1
		self.max_retries = 10
		self.flavor_list = ['movies', 'users', 'nominations', 'categories', 'watchlist']
		self.flavor_aliases = {
			'm': 'movies', 'u': 'users', 'n': 'nominations', 'c': 'categories', 'w': 'watchlist',
			'movies': 'movies', 'users': 'users', 'nominations': 'nominations', 
					'categories': 'categories', 'watchlist': 'watchlist',
			'mov': 'movies', 'usr': 'users', 'cat': 'categories'
			}
		# Default dataframes for file creation
		self.DEFAULT_MOVIES = pd.DataFrame(columns=['id', 'title']).set_index('id')
		self.DEFAULT_MOVIES.dtypes({'id': 'string', 'title': 'string'})
		self.DEFAULT_NOMINATIONS = pd.DataFrame(columns=['movie', 'category', 'note'])
		self.DEFAULT_NOMINATIONS.dtypes({'movie': str, 'category': str, 'note': str})
		self.DEFAULT_USERS = pd.DataFrame(
			columns=['id', 'username', 'letterboxd', 'email']).set_index('id')
		self.DEFAULT_USERS.dtypes(
			{'id': 'string', 'username': 'string', 'letterboxd': 'string', 'email': 'string'})
		self.DEFAULT_CATEGORIES = pd.DataFrame(
			columns=['id', 'name', 'maxNoms', 'isShort', 'hasNote']).set_index('id')
		self.DEFAULT_CATEGORIES.dtypes(
			{'id': 'string', 'name': 'string', 'maxNoms': int, 'isShort': bool, 'hasNote': bool})
		self.DEFAULT_WATCHLIST = pd.DataFrame(columns=['userId', 'movieId', 'status'])
		self.DEFAULT_WATCHLIST.dtypes({'userId': 'string', 'movieId': 'string', 'status': 'string'})

	# Never, ever specify a filepath in string format. Do everything in Path objects. 
	# The initialization of the StorageManager class may take a string as input, but after that we do it all programatically.

	# Converts flavor from alias
	# Throws on invalid flavor
	def format_flavor(self, flavor):
		assert flavor in self.flavor_aliases.keys(), f"Invalid flavor '{flavor}'."
		return self.flavor_aliases[flavor]

	# Returns the filenames for the data of a certain flavor and year
	def get_filename(self, flavor, year=None):
		# Format inputs
		if len(flavor) == 1:
			flavor = self.flavor_aliases[flavor]
		assert flavor in self.flavor_list, f"Invalid flavor '{flavor}'."
		if flavor in ['movies', 'nominations']:
			assert year is not None
		year = str(year)
		# Create filename
		filename = self.dir 
		if flavor in ['movies', 'nominations']:
			filename = filename / year
		filenames = filename / f'table_{flavor}.csv', filename / f'table_{flavor}.json'
		return filenames
	
	# 'flavor_indic' can be a DataFlavor or a Path object
	# if 'is_filename=False', then function WILL throw on invalid flavor
	# 'shape' tells you if the flavor in question refers to an edge list or an entity list
	#		An entity list has each row as a separate entity, with an ID column, 
	# 			and the rest of the columns represent attributes
	#		An edge list has no ID column. The first two columns are IDs for the related entities,
	# 			and the remaining columns are properties of that relationship
	# 'static' tells you if the flavor is a static table that should not be edited
	# 'annual' tells you if the tables exist only once or if there are copies in each year folder
	def flavor_props(self, flavor_indic, is_filename=False) -> dict['shape': str, 'static': bool, 'annual': bool]:
		props = {'shape': None, 'static': False, 'annual': True}
		if is_filename:
			file = flavor_indic
			name = file.name
			for flv in self.flavor_list:
				if flv in name:
					flavor = flv
		else:
			assert flavor_indic in self.flavor_aliases.keys(), f"Invalid flavor '{flavor_indic}'."
			flavor = self.flavor_aliases[flavor_indic]
		# After this point, `flavor` is a string of type DataFlavor
		if flavor in ['nominations', 'watchlist']:
			props['shape'] = 'edge'
		else:
			props['shape'] = 'entity'
		if flavor in ['categories', 'c']:
			props['static'] = True
		if flavor in ['categories', 'users']:
			props['annual'] = False
		return props
	
	# Checks if an ID is valid for a certain flavor
	def validate_id(self, id, flavor=None):
		if flavor:
			flavor = self.format_flavor(flavor)
		else:
			flavor = self.format_flavor(id[:2])
		if flavor == 'movies':
			assert re.match(r'^mov_[0-9a-fA-F]{6}$', id)!=None, f"Invalid movie id '{id}'."
		elif flavor == 'users':
			assert re.match(r'^usr_[0-9a-fA-F]{6}$', id)!=None, f"Invalid user id '{id}'."
		elif flavor == 'categories':
			assert re.match(r'^cat_[a-z]{4}$', id)!=None, f"Invalid category id '{id}'."
		else:
			raise Exception(f"Invalid flavor '{flavor}' for ID number.")
	
	def files_to_df(self, files, flavor) -> pd.DataFrame:
		flavor_props = self.flavor_props(flavor)
		tfile, jfile = files
		data = pd.read_csv(tfile)
		dtypes = pd.read_json(jfile, typ='series')
		data = data.astype(dtypes)
		if flavor_props['shape'] == 'entity':
			data.set_index('id', inplace=True)
		return data
	
	def df_to_files(self, data, files) -> None:
		tfile, jfile = files
		for file in files:
			file.seek(0)
			file.truncate()
		data.to_csv(tfile, index=not 'nominations' in tfile.name)
		data.dtypes.apply(str).to_json(jfile)
	
	@contextmanager
	def file_access(self, filepath: Path, mode='r', **kwargs):
		assert mode in ['r', 'w', 'r+', 'x']
		if mode == 'w':
			mode = 'r+'
		default_args = {'retry': True, 'max_retries': self.max_retries, 'retry_interval': self.retry_interval}
		args = {**default_args, **kwargs}
		retry = args['retry']
		max_retries = args['max_retries']
		retry_interval = args['retry_interval']
		attempts = 0
		should_delete = args['should_delete'] if 'should_delete' in args else False
		wants_exclusive = ('+' in mode)

		if not filepath[0].exists():
			if 'movies' in filepath[0].name:
				with open(filepath[0], 'w') as file:
					self.DEFAULT_MOVIES.to_csv(file, index_label='id')
				with open(filepath[1], 'w') as file:
					self.DEFAULT_MOVIES.dtypes.apply(str).to_json(file)
			elif 'nominations' in filepath[0].name:
				with open(filepath[0], 'w') as file:
					self.DEFAULT_NOMINATIONS.to_csv(file, index=False)
				with open(filepath[1], 'w') as file:
					self.DEFAULT_NOMINATIONS.dtypes.apply(str).to_json(file)
			else:
				raise Exception(f"File {filepath} does not exist but should exist. I won't create it automatically.")
		
		#while True:
		try:
			with open(filepath[0], mode, encoding="utf-8") as file:
				with open(filepath[1], mode, encoding="utf-8") as file2:
					try:
						if sys.platform.startswith('win'):
							msvcrt.locking(file.fileno(), 
										msvcrt.LK_NBLCK if wants_exclusive else msvcrt.LK_NBRLCK,
										1)
							#print(f"locked {file}")
						else:
							fcntl.flock(file.fileno(), 
									fcntl.LOCK_EX if wants_exclusive else fcntl.LOCK_SH)
						yield file, file2
					finally:
						if sys.platform.startswith('win'):
							file.seek(0)
							msvcrt.locking(file.fileno(), msvcrt.LK_UNLCK, 1)
							#print(f"unlocked {file}")
						else:
							fcntl.flock(file.fileno(), fcntl.LOCK_UN)
		except (BlockingIOError, OSError) as e:
			print(f"Error opening file {filepath}.")
			raise e
			#finally:
			#	if sys.platform.startswith('win'):
			#		msvcrt.locking(file.fileno(), msvcrt.LK_UNLCK, 1)
			#		print("unlocked")
			#	else:
			#		fcntl.flock(file.fileno(), fcntl.LOCK_UN)
		
	def read(self, flavor, year=None, **kwargs):
		filename = self.get_filename(flavor, year)
		try:
			with self.file_access(filename, **kwargs) as files:
				data = self.files_to_df(files, flavor)
			return data
		except Exception as e:
			print(f"Unable to load data from {filename}.")
			raise e
	
	# Applies an operation to the data in the file
	# `operation` is a function that takes a pandas DataFrame as input and returns two outputs: 
	# 		a pandas DataFrame, and feedback to the function caller
	def edit(self, operation: Callable[[pd.DataFrame], tuple[pd.DataFrame, any]], flavor, year=None, **kwargs):
		filename = self.get_filename(flavor, year)
		try:
			with self.file_access(filename, 'r+', **kwargs) as files:
				old_data = self.files_to_df(files, flavor)
				new_data, feedback = operation(old_data)
				self.df_to_files(new_data, files)
			return feedback
		except Exception as e:
			print(f"Unable to write data to {filename}.")
			raise e
		
	def delete(self, flavor, year='test'):
		filename = self.get_filename(flavor, year)
		with self.file_access(filename, 'w') as files:
			if flavor in ['movies', 'm']:
				self.df_to_files(self.DEFAULT_MOVIES, files)
			elif flavor in ['nominations', 'n']:
				self.df_to_files(self.DEFAULT_NOMINATIONS, files)
			else:
				raise Exception(f"Invalid type '{flavor}' for deletion.")
	
	# Makes sure that a table has the columns specified in a dictionary with types
	def add_columns(self, flavor: str, year: str | int, columns: dict):
		def operation(data):
			for column, dtype in columns:
				if column not in data.columns:
					data.loc[column] = pd.Series(dtype=dtype)
			return data, None
		self.edit(operation, flavor, year)
	
	# Adds a new movie to the database, or updates an existing one
	# `movie` is usually the id of the movie to update
	# If try_title_lookup, then `movie` is interpreted as the title of the movie
	# 		In that case, the id of the movie is returned (whether it was found or created)
	# `new_data` is a dictionary of new data to add or update
	def update_movie(self, movie, year, new_data: dict = {}, try_title_lookup=False) -> MovID|bool:
		if not try_title_lookup:
			try:
				self.validate_id(movie, 'm')
			except:
				raise(f"Invalid movie id '{movie}'.\n"
					"Did you mean to send a title? Consider try_title_lookup=True.")
			def operation(data):
				was_there = (movie in data.index)
				data.loc[movie, new_data.keys()] = new_data.values()
				return data, was_there
		else:
			def operation(data):
				if movie in data['title'].tolist():
					movie_id = data.loc[data['title'] == movie].index[0]
					data.loc[movie_id, new_data.keys()] = new_data.values()
				else:
					while True: # Loops if id already exists
						movie_id = create_unique_id('movie')
						if movie_id not in data.index:
							break
					data.loc[movie_id] = {'title': movie, **new_data}
				return data, movie_id
		
		feedback = self.edit(operation, 'movies', year)
		#print(f"utils line 183, feedback={feedback}, type={type(feedback)}")
		return feedback
	
	def blank_test_data(self):
		self.delete('movies', year='test')
		self.delete('nominations', year='test')

	# Note: This function does not check if the nomination already exists in the database
	#	If there's a possibliity of duplicates, you've done something wrong
	# Checks if `movie`, `category` are formatted as IDs
	# Does NOT check if they actually exist in the database
	# 	If you didn't already add/confirm them yourself, you're doing something wrong
	# If `validate` is True, the function will at least check if there are too many nominations in a category
	def add_nomination(self, year, nomination: Nom, validate = False, expect_full = False):
		movie = nomination['movie']
		category = nomination['category']
		note = nomination['note'] if 'note' in nomination else None
		#print(f"{movie}, {type(movie)}")
		assert re.match(r'^mov_[0-9a-fA-F]{6}$', movie)!=None, f"Invalid movie id '{movie}'."
		assert re.match(r'^cat_[a-z]{4}$', category)!=None, f"Invalid category id '{category}'."
		def operation(data: pd.DataFrame):
			data = data._append({'movie': movie, 'category': category, 'note': note}, ignore_index=True)
			return data, None
		if validate:
			bad_cats = self.validate_nomination_list(year, expect_full)
			if bad_cats:
				raise Exception(("Wrong number of" if expect_full else "Too many") + f" nominations in these categories: {bad_cats}.")
		self.edit(operation, 'nominations', year)

	# Checks if the database entry table_nominations.csv has the right number of entries in each category
	def validate_nomination_list(self, year, expect_full = False):
		nominations = self.read('nominations', year)
		category_counts = nominations['category'].value_counts()
		cat_df = self.read('c')
		expected_counts = cat_df['maxNoms']
		bad_cats = []
		for category, count in category_counts.items():
			if ((category not in expected_counts.index) or (count > expected_counts[category]) or
				(expect_full and count < expected_counts[category])):
				bad_cats.append(category)
		return bad_cats
	
	def add_user(self, username, letterboxd = None, email = None) -> UserID:
		userIdList = self.read('users').index.tolist()
		def operation(data: pd.DataFrame):
			while True:
				user_id = create_unique_id('user')
				if user_id not in userIdList:
					break
			data.loc[user_id] = {'username': username, 'letterboxd': letterboxd, 'email': email}
			return data, user_id
		return self.edit(operation, 'users')
	
	def delete_user(self, userId):
		def operation(data: pd.DataFrame):
			data = data.drop(userId)
			return data, None
		return self.edit(operation, 'users')
