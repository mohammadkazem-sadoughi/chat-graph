from database import db
from datetime import datetime

class Session(db.Model):
    session_id = db.Column(db.String(36), primary_key=True)
    session_name = db.Column(db.String(100), nullable=False)
    status = db.Column(db.String(20), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    current_active_node_index = db.Column(db.Integer, nullable=True)

    def to_dict(self):
        return {
            'session_id': self.session_id,
            'session_name': self.session_name,
            'status': self.status,
            'created_at': self.created_at.isoformat(),
            'current_active_node_index': self.current_active_node_index
        }
