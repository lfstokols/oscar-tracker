from flask import Blueprint, send_from_directory, request, jsonify, abort
#from flask_cors import CORS
import os
from pathlib import Path
from logic.StorageManager import StorageManager
from logic.MyTypes import *

storage = StorageManager(os.path.join(os.path.dirname(__file__), 'database'))

oscars = Blueprint('oscars', __name__,
				   static_folder='../dist/',
				   static_url_path='/oscars/')
#CORS(oscars)  # Enable CORS for all routes



TEST_DATA = '{ "users": [{ "username": "Logan", "watchedMovies": ["Oppenheimer"] }], "movies": [ { "title": "Oppenheimer", "nominations": [ "Best Picture", "Actor", "Actress" ] }, { "title": "Poor Things", "nominations": [ "Best Picture", "Actor", "Actress" ] }, { "title": "Killers of the Flower Moon", "nominations": [ "Best Picture", "Actor", "Actress" ] }, { "title": "Barbie", "nominations": [ "Best Picture", "Actor", "Actress" ] } ] }'

# Serve data
@oscars.route('/api/nominations', methods=['GET'])
def get_noms():
	year = request.args.get('year')
	if year is None:
		return jsonify({"error": "No year provided"})
	return jsonify(storage.json_read('n', year))
@oscars.route('/api/movies', methods=['GET'])
def get_movies():
	year = request.args.get('year')
	if year is None:
		return jsonify({"error": "No year provided"})
	return jsonify(storage.json_read('m', year))
@oscars.route('/api/users', methods=['GET', 'POST', 'PUT', 'DELETE'])
def get_users():
	#user = None if 'userId' not in request.headers else request.headers['userId']
	user = request.args.get('userId')
	if request.method == 'GET':
		return jsonify(storage.json_read('u'))
	elif request.method == 'POST':
		# Expects a username, possibly a letterboxd and/or email
		return jsonify({'userId': storage.add_user(user)})#, **request.args)})
	elif request.method == 'PUT':
		# Expects any dictionary of user data
		storage.update_user(user, request.json)
		return
	elif request.method == 'DELETE':
		storage.delete_user(user)
		return
@oscars.route('/api/categories', methods=['GET'])
def get_categories():
	return jsonify(storage.json_read('c'))
# Expect userId, can be 'all'
# If PUT, expect movieId and status
@oscars.route('/api/watchlist', methods=['GET', 'PUT'])
def get_watchlist():
	userId = request.args.get('userId')
	year = request.args.get('year')
	if userId == 'all' and request.method == 'GET':
		return jsonify(storage.json_read('w', year))
	elif request.method == 'GET':
		data = storage.read('w', year)
		return jsonify(data.loc[data['userId']==userId].to_dict(orient='records'))
	elif request.method == 'PUT':
		movieId = request.args.get('movieId')
		status = request.args.get('status')
		storage.add_watchlist_entry(year, userId, movieId, status)
		return

# Serve React App
@oscars.route('/')
def serve_root():
	return send_from_directory(oscars.static_folder, 'index.html')
@oscars.route('/favicon<path:_>')
def serve_favicon(_):
	return send_from_directory('../public', 'favicon.ico')

@oscars.route('/<path:relpath>')
def serve(relpath):
	filepath = Path(oscars.static_folder) / relpath
	if not filepath.is_relative_to(oscars.static_folder):
		return abort(403)
	if filepath.exists():
		return send_from_directory(filepath.parent, filepath.name)

if __name__ == '__main__':
	oscars.run(debug=True)