from flask import Blueprint, jsonify, request
from services import session_service

bp = Blueprint('sessions', __name__, url_prefix='/api/sessions')

@bp.route('', methods=['GET'])
def get_sessions():
    return jsonify(session_service.get_all_sessions())

@bp.route('', methods=['POST'])
def create_session():
    return jsonify(session_service.create_session())

@bp.route('/<session_id>/active-node', methods=['PUT'])
def update_active_node(session_id):
    data = request.json
    node_index = data.get('node_index')
    return jsonify(session_service.update_active_node(session_id, node_index))

@bp.route('/<session_id>', methods=['GET'])
def get_session(session_id):
    return jsonify(session_service.get_session(session_id))

@bp.route('/<session_id>', methods=['DELETE'])
def delete_session(session_id):
    return jsonify(session_service.delete_session(session_id))

@bp.route('/<session_id>/active-node', methods=['GET'])
def get_active_node(session_id):
    result = session_service.get_active_node(session_id)
    if 'error' in result:
        return jsonify(result), 404
    return jsonify(result)

@bp.route('', methods=['DELETE'])
def clear_all_sessions():
    result = session_service.clear_all_sessions()
    return jsonify(result)
