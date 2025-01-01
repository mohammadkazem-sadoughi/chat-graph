# Makefile for setting up and running the full stack application

# Variables
VENV_NAME := venv
PYTHON := python3
PIP := pip
FLASK_APP := backend/app.py
REACT_APP_DIR := frontend
BACKEND_PORT := 5001
FRONTEND_PORT := 3000
PID_FILE := .server.pid

# Phony targets
.PHONY: all setup setup-backend setup-frontend setup-ollama run run-backend clean kill-servers

# Default target
all: setup run

# Setup both backend and frontend, and ensure Ollama is installed
setup: setup-system setup-ollama setup-backend setup-frontend

# Setup system dependencies
setup-system:
	@echo "Setting up system dependencies..."
	@if ! command -v node >/dev/null 2>&1; then \
		echo "Node.js not found, please install it manually"; \
		exit 1; \
	fi
	@if ! command -v npm >/dev/null 2>&1; then \
		echo "npm not found, please install it manually"; \
		exit 1; \
	fi
	@if ! command -v python3 >/dev/null 2>&1; then \
		echo "Python 3 not found, please install it manually"; \
		exit 1; \
	fi
	@if ! command -v pip3 >/dev/null 2>&1; then \
		echo "pip3 not found, please install it manually"; \
		exit 1; \
	fi
	@echo "System dependencies check complete."

# Setup Ollama LLM dependencies
setup-ollama:
	@echo "Checking and installing Ollama..."
	@if ! command -v ollama >/dev/null 2>&1; then \
		echo "Ollama not found, installing it..."; \
		if [ "$$(uname)" = "Darwin" ]; then \
			brew install ollama; \
		else \
			curl https://ollama.ai/install.sh | sh; \
		fi \
	fi
	@echo "Starting Ollama service..."
	@if [ "$$(uname)" = "Darwin" ]; then \
		brew services start ollama; \
		sleep 5; \
	fi
	@echo "Pulling LLM model..."
	ollama pull phi3:3.8b
	@echo "Ollama setup complete."

# Setup backend
setup-backend:
	@echo "Setting up backend Python virtual environment and dependencies..."
	@if [ ! -d "$(VENV_NAME)" ]; then \
        if echo "$$(uname -s)" | grep -q "MINGW64_NT"; then \
            python -m venv $(VENV_NAME); \
        else \
            python3 -m venv $(VENV_NAME); \
        fi; \
    fi
	@if echo "$$(uname -s)" | grep -q "MINGW64_NT"; then \
        . $(VENV_NAME)/Scripts/activate; \
	else \
        . $(VENV_NAME)/bin/activate; \
	fi && \
	$(PIP) install --upgrade pip && \
	$(PIP) install -r backend/requirements.txt
	@echo "Backend setup complete."

# Setup frontend
setup-frontend:
	@echo "Setting up frontend..."
	cd $(REACT_APP_DIR) && npm install
	cd $(REACT_APP_DIR) && npm install --save-dev @babel/plugin-proposal-private-property-in-object
	@echo "Frontend setup complete."

# Run both backend and frontend
run:
	@echo "Starting backend and frontend..."
	@echo "Killing any existing servers..."
	@$(MAKE) kill-servers
	@trap '$(MAKE) kill-servers' EXIT && \
	if echo "$$(uname -s)" | grep -q "MINGW64_NT"; then \
        . $(VENV_NAME)/Scripts/activate && \
        cd backend && \
        python app.py & echo $$! > $(PID_FILE).backend; \
	else \
        . $(VENV_NAME)/bin/activate && \
        cd backend && \
        python3 app.py & echo $$! > $(PID_FILE).backend; \
	fi && \
    echo "Backend started on port $(BACKEND_PORT)" && \
    sleep 2 && \
    cd $(REACT_APP_DIR) && npm start & echo $$! > $(PID_FILE).frontend && \
    wait

# Run just the backend
run-backend:
	@echo "Starting backend..."
	@if echo "$$(uname -s)" | grep -q "MINGW64_NT"; then \
        . $(VENV_NAME)/Scripts/activate && \
        cd backend && \
        python app.py; \
    else \
        . $(VENV_NAME)/bin/activate && \
        cd backend && \
        python3 app.py; \
    fi

# Clean up
clean:
	@echo "Cleaning up..."
	rm -rf $(VENV_NAME)
	cd $(REACT_APP_DIR) && rm -rf node_modules
	@echo "Cleanup complete."

# Add kill-servers target
kill-servers:
	@echo "Killing any existing servers..."
	@if echo "$$(uname -s)" | grep -q "MINGW64_NT"; then \
        taskkill //F //IM "python.exe" //T || true; \
        taskkill //F //IM "node.exe" //T || true; \
	else \
        pkill -f "python3 app.py" || true; \
        pkill -f "npm start" || true; \
	fi
