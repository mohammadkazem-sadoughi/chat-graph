from flask import Flask, jsonify
from flask_cors import CORS
from database import db
from config import Config
from routes import main, sessions, nodes

def create_app():
    app = Flask(__name__, static_folder='../frontend/build', static_url_path='')
    app.config.from_object(Config)
    
    # Even more permissive CORS for development troubleshooting
    CORS(app, resources={r"/*": {"origins": "*"}})
    
    db.init_app(app)

    with app.app_context():
        db.create_all()

    # Add a test route to verify the server is working
    @app.route('/test')
    def test():
        return jsonify({"status": "Backend is running!"})

    app.register_blueprint(main.bp)
    app.register_blueprint(sessions.bp)
    app.register_blueprint(nodes.bp)

    return app

if __name__ == '__main__':
    app = create_app()
    # Use port 5001 to avoid conflict with Control Center
    app.run(debug=True, port=5001, host='0.0.0.0')