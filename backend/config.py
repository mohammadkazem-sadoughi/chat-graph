import os

class Config:
    SQLALCHEMY_DATABASE_URI = 'sqlite:///chat_graph.db'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    MODEL_NAME = 'claude-3-haiku-20240307'