from flask import Blueprint, jsonify, request
from services import node_service

bp = Blueprint('nodes', __name__, url_prefix='/api')

@bp.route('/chat', methods=['POST'])
def chat():
    print("Received chat request")
    data = request.json
    print("Request data:", data)
    return jsonify(node_service.create_node(data))

@bp.route('/nodes/<session_id>', methods=['GET'])
def get_nodes(session_id):
    return jsonify(node_service.get_nodes(session_id))

@bp.route('/sessions/<session_id>/nodes', methods=['DELETE'])
def delete_nodes(session_id):
    node_indices = request.json.get('node_indices', [])
    result = node_service.delete_nodes(session_id, node_indices)
    return jsonify(result)
