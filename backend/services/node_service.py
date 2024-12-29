from models import Node, Session
from database import db
from sqlalchemy import func, and_
from flask import abort
from llm import LLM
from services.session_service import SessionService

class NodeService:
    def __init__(self):
        self.llm = LLM()
        self.session_service = SessionService()

    def create_node(self, data):
        user_message = data.get('message', '')
        parent_id = data.get('parentId')
        session_id = data.get('sessionId')

        max_index = db.session.query(func.max(Node.node_index)).filter_by(session_id=session_id).scalar()

        next_index = (max_index or 0) + 1

        # Collect parent messages
        context_messages, summary_messages = self.get_parent_messages(session_id, parent_id)
        
        # Prepare the full context for the LLM
        full_context = [
            {"role": "system", "content": "You are a helpful AI assistant. Provide short and concise answers to users' questions. Do not make long responses that are unnecessary."}
        ] + context_messages + [{"role": "user", "content": user_message}]
        
        # Call LLM with the full context
        ai_response = self.llm.call(full_context)

        # Generate summary
        summary = self.generate_summary(summary_messages, user_message, ai_response)

        new_node = Node(
            session_id=session_id,
            node_index=next_index,
            user_message=user_message,
            ai_response=ai_response,
            summary=summary,
            parent_node_index=parent_id
        )
        db.session.add(new_node)

        session = Session.query.get(session_id)
        if not session:
            abort(404, description="Session not found")
        session.current_active_node_index = next_index
        db.session.commit()

        # Update session name if this is the first message
        if next_index == 1:
            self.session_service.update_session_name(session_id, user_message, ai_response)

        return new_node.to_dict()

    def generate_summary(self, summary_messages, user_message, ai_response):
        previous_summaries = "\n".join(summary_messages)
        context_messages = [
            {"role": "system", "content": "You are a summarization AI. Your task is to create an EXTREMELY concise summary."},
            {"role": "system", "content": "CRITICAL INSTRUCTION: Your response MUST be EXACTLY 10 WORDS OR LESS. No exceptions."},
            {"role": "system", "content": "DO NOT include any text other than the summary itself. No introductions or explanations."},
            {"role": "system", "content": "Examples of good summaries:"},
            {"role": "system", "content": "User asked about Python; AI explained basic syntax"},
            {"role": "system", "content": "Discussed benefits and drawbacks of machine learning"},
            {"role": "system", "content": "User requested recipe; AI provided pasta instructions"},
            {"role": "system", "content": f"Previous summaries for context:\n{previous_summaries}"},
            {"role": "user", "content": f"Summarize this exchange in 10 words or less:\nUser: {user_message}\nAI: {ai_response}\n\nHere is the summary:"}
        ]
        summary = self.llm.call(context_messages)
        
        # Ensure the summary is no longer than 10 words
        words = summary.split()
        if len(words) > 10:
            summary = ' '.join(words[:10]) + '...'
        
        return summary.strip()

    def get_parent_messages(self, session_id, node_index):
        messages = []
        summary_messages = []
        while node_index is not None:
            node = Node.query.filter_by(session_id=session_id, node_index=node_index).first()
            if node:
                messages.insert(0, {"role": "assistant", "content": node.ai_response})
                messages.insert(0, {"role": "user", "content": node.user_message})
                summary_messages.insert(0, node.summary)
                node_index = node.parent_node_index
            else:
                break
        return messages, summary_messages

    def get_nodes(self, session_id):
        nodes = Node.query.filter_by(session_id=session_id).all()
        return [node.to_dict() for node in nodes]

    def delete_nodes(self, session_id, node_indices):
        session = Session.query.get(session_id)
        if not session:
            return {'error': 'Session not found'}, 404
    
        nodes_to_delete = set(node_indices)
        self._find_child_nodes(session_id, nodes_to_delete)
    
        nodes_to_delete_list = list(nodes_to_delete)
        nodes_to_delete_objects = Node.query.filter(Node.session_id == session_id, Node.node_index.in_(nodes_to_delete_list)).all()
        
        for node in nodes_to_delete_objects:
            db.session.delete(node)
        
        db.session.commit()
    
        # After deletion, find the most recent remaining node
        most_recent_node = Node.query.filter_by(session_id=session_id).order_by(Node.timestamp.desc()).first()
        
        if most_recent_node:
            session.current_active_node_index = most_recent_node.node_index
        else:
            session.current_active_node_index = None
        
        db.session.commit()
    
        return {'message': 'Nodes deleted successfully', 'new_active_node': session.current_active_node_index}
    
    def _find_child_nodes(self, session_id, nodes_to_delete):
        child_nodes = Node.query.filter(
            and_(
                Node.session_id == session_id,
                Node.parent_node_index.in_(nodes_to_delete),
                ~Node.node_index.in_(nodes_to_delete)
            )
        ).all()

        if child_nodes:
            new_nodes = set(node.node_index for node in child_nodes)
            nodes_to_delete.update(new_nodes)
            self._find_child_nodes(session_id, nodes_to_delete)

    def delete_nodes(self, session_id, node_indices):
        session = Session.query.get(session_id)
        if not session:
            return {'error': 'Session not found'}, 404

        nodes_to_delete = set(node_indices)
        self._find_child_nodes(session_id, nodes_to_delete)

        nodes_to_delete_list = list(nodes_to_delete)
        nodes_to_delete_objects = Node.query.filter(Node.session_id == session_id, Node.node_index.in_(nodes_to_delete_list)).all()
        
        for node in nodes_to_delete_objects:
            db.session.delete(node)
        
        db.session.commit()

        # After deletion, find the most recent remaining node
        most_recent_node = Node.query.filter_by(session_id=session_id).order_by(Node.timestamp.desc()).first()
        
        if (most_recent_node):
            session.current_active_node_index = most_recent_node.node_index
        else:
            session.current_active_node_index = None
        
        db.session.commit()

        return {'message': 'Nodes deleted successfully', 'new_active_node': session.current_active_node_index}
