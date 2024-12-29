from flask import Blueprint, send_from_directory
import os

bp = Blueprint('main', __name__)

@bp.route('/', defaults={'path': ''})
@bp.route('/<path:path>')
def serve(path):
    static_folder = bp.root_path + '/../frontend/build'
    if path != "" and os.path.exists(static_folder + '/' + path):
        return send_from_directory(static_folder, path)
    else:
        return send_from_directory(static_folder, 'index.html')
