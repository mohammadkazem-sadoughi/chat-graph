from database import db
from datetime import datetime

class Node(db.Model):
    session_id = db.Column(db.String(36), db.ForeignKey('session.session_id'), primary_key=True)
    node_index = db.Column(db.Integer, primary_key=True)
    user_message = db.Column(db.String(500), nullable=False)
    ai_response = db.Column(db.String(5000), nullable=False)
    summary = db.Column(db.String(100))
    parent_node_index = db.Column(db.Integer, nullable=True)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)

    __table_args__ = (
        db.ForeignKeyConstraint(
            ['session_id', 'parent_node_index'],
            ['node.session_id', 'node.node_index']
        ),
    )

    def to_dict(self):
        return {
            'session_id': self.session_id,
            'node_index': self.node_index,
            'user': self.user_message,
            'ai': self.ai_response,
            'parentId': self.parent_node_index,
            'summary': self.summary,
            'timestamp': self.timestamp.isoformat()
        }
