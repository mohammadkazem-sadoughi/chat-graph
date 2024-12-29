from models import Session, Node
from database import db
import uuid
from flask import abort
from llm import LLM

class SessionService:
    def __init__(self):
        self.llm = LLM()

    def get_all_sessions(self):
        sessions = Session.query.all()
        return [
            {
                'session_id': session.session_id,
                'session_name': session.session_name,
                'status': session.status,
                'current_active_node_index': session.current_active_node_index
            } for session in sessions
        ]

    def create_session(self):
        session_id = str(uuid.uuid4())
        new_session = Session(
            session_id=session_id,
            session_name=f"New Session {session_id[:2]} ...",
            status="active"
        )
        db.session.add(new_session)
        db.session.commit()
        return new_session.to_dict()

    def update_active_node(self, session_id, node_index):
        session = Session.query.get(session_id)
        if not session:
            abort(404, description="Session not found")
        session.current_active_node_index = node_index
        db.session.commit()
        return session.to_dict()

    def get_session(self, session_id):
        session = Session.query.get(session_id)
        if not session:
            abort(404, description="Session not found")
        return session.to_dict()

    def delete_session(self, session_id):
        session = Session.query.get(session_id)
        if not session:
            abort(404, description="Session not found")
        
        # Delete all nodes associated with this session
        Node.query.filter_by(session_id=session_id).delete()
        
        # Delete the session
        db.session.delete(session)
        db.session.commit()
        return {'message': f'Session {session_id} and associated nodes deleted successfully'}

    def get_active_node(self, session_id):
        session = Session.query.get(session_id)
        if not session:
            return {'error': 'Session not found'}
        return {'active_node_id': session.current_active_node_index}

    def update_session_name(self, session_id, user_message, ai_response):
        session = Session.query.get(session_id)
        if not session:
            abort(404, description="Session not found")
        
        context_messages = [
            {"role": "system", "content": "You are a naming AI. Your task is to create an EXTREMELY concise session name."},
            {"role": "system", "content": "CRITICAL INSTRUCTION: Your response MUST be EXACTLY 4 WORDS OR LESS. No exceptions."},
            {"role": "system", "content": "DO NOT include any text other than the session name itself. No introductions or explanations."},
            {"role": "user", "content": f"Create a 4-word or less name for this chat session:\nUser: {user_message}\nAI: {ai_response}"}
        ]
        
        session_name = self.llm.call(context_messages).strip()
        
        # Ensure the session name is no longer than 4 words
        words = session_name.split()
        if len(words) > 4:
            session_name = ' '.join(words[:4]) + '...'
        
        session.session_name = session_name
        db.session.commit()
        return session.to_dict()

    def clear_all_sessions(self):
        try:
            # Delete all nodes first
            Node.query.delete()
            
            # Then delete all sessions
            Session.query.delete()
            
            db.session.commit()
            return {'message': 'All sessions and nodes cleared successfully'}
        except Exception as e:
            db.session.rollback()
            return {'error': f'Failed to clear sessions: {str(e)}'}, 500
