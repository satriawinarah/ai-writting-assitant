# Author AI IDE - Deployment Makefile
# Usage: make <target>
# Run 'make help' to see all available commands

.PHONY: help install-deps setup-backend setup-frontend build deploy restart \
        status logs stop start update backup clean test-local \
        setup-systemd setup-nginx setup-firewall setup-ssl

# Variables
PROJECT_DIR := $(shell pwd)
BACKEND_DIR := $(PROJECT_DIR)/backend
FRONTEND_DIR := $(PROJECT_DIR)/frontend
VENV := $(BACKEND_DIR)/venv
PYTHON := $(VENV)/bin/python
PIP := $(VENV)/bin/pip
SERVICE_NAME := authorai
BACKUP_DIR := ~/backups
CURRENT_USER := $(shell whoami)

# Colors for output
GREEN := \033[0;32m
YELLOW := \033[1;33m
RED := \033[0;31m
NC := \033[0m

#------------------------------------------------------------------------------
# HELP
#------------------------------------------------------------------------------
help:
	@echo "$(GREEN)Author AI IDE - Deployment Commands$(NC)"
	@echo ""
	@echo "$(YELLOW)Quick Commands:$(NC)"
	@echo "  make deploy          - Full deployment (backend + frontend + restart)"
	@echo "  make update          - Pull latest code and redeploy"
	@echo "  make restart         - Restart the application service"
	@echo "  make status          - Check service status"
	@echo "  make logs            - View live application logs"
	@echo ""
	@echo "$(YELLOW)Setup Commands (Fresh Install):$(NC)"
	@echo "  make install-deps    - Install system dependencies (requires sudo)"
	@echo "  make setup-backend   - Setup Python virtual environment and dependencies"
	@echo "  make setup-frontend  - Install Node.js dependencies"
	@echo "  make setup-systemd   - Create and enable systemd service (requires sudo)"
	@echo "  make setup-nginx     - Setup Nginx reverse proxy (requires sudo)"
	@echo "  make setup-firewall  - Configure firewall rules (requires sudo)"
	@echo "  make setup-ssl       - Setup SSL with Let's Encrypt (requires sudo)"
	@echo ""
	@echo "$(YELLOW)Build Commands:$(NC)"
	@echo "  make build           - Build frontend for production"
	@echo "  make build-backend   - Install/update backend dependencies"
	@echo "  make migrate         - Run database migrations"
	@echo ""
	@echo "$(YELLOW)Service Commands:$(NC)"
	@echo "  make start           - Start the application service"
	@echo "  make stop            - Stop the application service"
	@echo "  make restart         - Restart the application service"
	@echo "  make status          - Check service status"
	@echo "  make logs            - View live logs (Ctrl+C to exit)"
	@echo ""
	@echo "$(YELLOW)Maintenance Commands:$(NC)"
	@echo "  make backup          - Backup database and .env file"
	@echo "  make clean           - Clean build artifacts and cache"
	@echo "  make test-local      - Test application locally (port 8000)"
	@echo ""
	@echo "$(YELLOW)Full Setup (Fresh VPS):$(NC)"
	@echo "  make full-setup      - Complete fresh installation"

#------------------------------------------------------------------------------
# QUICK DEPLOYMENT
#------------------------------------------------------------------------------
deploy: setup-backend migrate build
	@echo "$(GREEN)Deployment complete!$(NC)"
	@echo "Run 'make restart' to restart the service"

update:
	@echo "$(YELLOW)Pulling latest changes...$(NC)"
	git pull
	@$(MAKE) deploy
	@$(MAKE) restart
	@echo "$(GREEN)Update complete!$(NC)"

#------------------------------------------------------------------------------
# SYSTEM DEPENDENCIES (requires sudo)
#------------------------------------------------------------------------------
install-deps:
	@echo "$(YELLOW)Installing system dependencies...$(NC)"
	@if command -v apt-get > /dev/null; then \
		sudo apt update && sudo apt upgrade -y && \
		sudo apt install -y python3.11 python3.11-venv python3-pip git nginx build-essential libpq-dev && \
		curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash - && \
		sudo apt install -y nodejs; \
	elif command -v yum > /dev/null; then \
		sudo yum update -y && \
		sudo yum install -y python3.11 python3.11-devel git nginx && \
		curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash - && \
		sudo yum install -y nodejs && \
		sudo yum groupinstall -y "Development Tools"; \
	else \
		echo "$(RED)Unsupported package manager. Please install dependencies manually.$(NC)"; \
		exit 1; \
	fi
	@echo "$(GREEN)System dependencies installed!$(NC)"
	@echo "Versions:"
	@python3.11 --version || python3 --version
	@node --version
	@npm --version

#------------------------------------------------------------------------------
# BACKEND SETUP
#------------------------------------------------------------------------------
setup-backend: $(VENV)/bin/activate build-backend
	@echo "$(GREEN)Backend setup complete!$(NC)"

$(VENV)/bin/activate:
	@echo "$(YELLOW)Creating Python virtual environment...$(NC)"
	cd $(BACKEND_DIR) && python3.11 -m venv venv || python3 -m venv venv
	$(PIP) install --upgrade pip

build-backend:
	@echo "$(YELLOW)Installing Python dependencies...$(NC)"
	$(PIP) install -r $(BACKEND_DIR)/requirements.txt
	@echo "$(GREEN)Python dependencies installed!$(NC)"

migrate:
	@echo "$(YELLOW)Running database migrations...$(NC)"
	cd $(BACKEND_DIR) && $(VENV)/bin/alembic upgrade head
	@echo "$(GREEN)Migrations complete!$(NC)"

#------------------------------------------------------------------------------
# FRONTEND SETUP & BUILD
#------------------------------------------------------------------------------
setup-frontend:
	@echo "$(YELLOW)Installing Node.js dependencies...$(NC)"
	cd $(FRONTEND_DIR) && npm install
	@echo "$(GREEN)Frontend dependencies installed!$(NC)"

build: setup-frontend
	@echo "$(YELLOW)Building frontend for production...$(NC)"
	cd $(FRONTEND_DIR) && npm run build
	@echo "$(GREEN)Frontend build complete!$(NC)"
	@echo "Static files generated in $(BACKEND_DIR)/static/"
	@ls -la $(BACKEND_DIR)/static/ 2>/dev/null || echo "$(RED)Warning: static directory not found$(NC)"

#------------------------------------------------------------------------------
# SERVICE MANAGEMENT
#------------------------------------------------------------------------------
start:
	@echo "$(YELLOW)Starting $(SERVICE_NAME) service...$(NC)"
	sudo systemctl start $(SERVICE_NAME)
	@$(MAKE) status

stop:
	@echo "$(YELLOW)Stopping $(SERVICE_NAME) service...$(NC)"
	sudo systemctl stop $(SERVICE_NAME)

restart:
	@echo "$(YELLOW)Restarting $(SERVICE_NAME) service...$(NC)"
	sudo systemctl restart $(SERVICE_NAME)
	@sleep 2
	@$(MAKE) status

status:
	@echo "$(YELLOW)Service status:$(NC)"
	@sudo systemctl status $(SERVICE_NAME) --no-pager || true

logs:
	@echo "$(YELLOW)Viewing live logs (Ctrl+C to exit)...$(NC)"
	sudo journalctl -u $(SERVICE_NAME) -f

#------------------------------------------------------------------------------
# SYSTEMD SERVICE SETUP
#------------------------------------------------------------------------------
setup-systemd:
	@echo "$(YELLOW)Creating systemd service...$(NC)"
	@echo "[Unit]" | sudo tee /etc/systemd/system/$(SERVICE_NAME).service > /dev/null
	@echo "Description=Author AI IDE - FastAPI Application" | sudo tee -a /etc/systemd/system/$(SERVICE_NAME).service > /dev/null
	@echo "After=network.target" | sudo tee -a /etc/systemd/system/$(SERVICE_NAME).service > /dev/null
	@echo "" | sudo tee -a /etc/systemd/system/$(SERVICE_NAME).service > /dev/null
	@echo "[Service]" | sudo tee -a /etc/systemd/system/$(SERVICE_NAME).service > /dev/null
	@echo "Type=simple" | sudo tee -a /etc/systemd/system/$(SERVICE_NAME).service > /dev/null
	@echo "User=$(CURRENT_USER)" | sudo tee -a /etc/systemd/system/$(SERVICE_NAME).service > /dev/null
	@echo "WorkingDirectory=$(BACKEND_DIR)" | sudo tee -a /etc/systemd/system/$(SERVICE_NAME).service > /dev/null
	@echo "Environment=PATH=$(VENV)/bin" | sudo tee -a /etc/systemd/system/$(SERVICE_NAME).service > /dev/null
	@echo "ExecStart=$(VENV)/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 2" | sudo tee -a /etc/systemd/system/$(SERVICE_NAME).service > /dev/null
	@echo "" | sudo tee -a /etc/systemd/system/$(SERVICE_NAME).service > /dev/null
	@echo "Restart=always" | sudo tee -a /etc/systemd/system/$(SERVICE_NAME).service > /dev/null
	@echo "RestartSec=10" | sudo tee -a /etc/systemd/system/$(SERVICE_NAME).service > /dev/null
	@echo "StandardOutput=append:$(BACKEND_DIR)/app.log" | sudo tee -a /etc/systemd/system/$(SERVICE_NAME).service > /dev/null
	@echo "StandardError=append:$(BACKEND_DIR)/error.log" | sudo tee -a /etc/systemd/system/$(SERVICE_NAME).service > /dev/null
	@echo "" | sudo tee -a /etc/systemd/system/$(SERVICE_NAME).service > /dev/null
	@echo "[Install]" | sudo tee -a /etc/systemd/system/$(SERVICE_NAME).service > /dev/null
	@echo "WantedBy=multi-user.target" | sudo tee -a /etc/systemd/system/$(SERVICE_NAME).service > /dev/null
	sudo systemctl daemon-reload
	sudo systemctl enable $(SERVICE_NAME)
	@echo "$(GREEN)Systemd service created and enabled!$(NC)"
	@echo "Run 'make start' to start the service"

#------------------------------------------------------------------------------
# NGINX SETUP
#------------------------------------------------------------------------------
setup-nginx:
	@echo "$(YELLOW)Setting up Nginx reverse proxy...$(NC)"
	@read -p "Enter your domain name (or press Enter to use server IP): " domain; \
	if [ -z "$$domain" ]; then domain="_"; fi; \
	echo "server {" | sudo tee /etc/nginx/sites-available/$(SERVICE_NAME) > /dev/null; \
	echo "    listen 80;" | sudo tee -a /etc/nginx/sites-available/$(SERVICE_NAME) > /dev/null; \
	echo "    server_name $$domain;" | sudo tee -a /etc/nginx/sites-available/$(SERVICE_NAME) > /dev/null; \
	echo "" | sudo tee -a /etc/nginx/sites-available/$(SERVICE_NAME) > /dev/null; \
	echo "    client_max_body_size 10M;" | sudo tee -a /etc/nginx/sites-available/$(SERVICE_NAME) > /dev/null; \
	echo "" | sudo tee -a /etc/nginx/sites-available/$(SERVICE_NAME) > /dev/null; \
	echo "    location / {" | sudo tee -a /etc/nginx/sites-available/$(SERVICE_NAME) > /dev/null; \
	echo "        proxy_pass http://127.0.0.1:8000;" | sudo tee -a /etc/nginx/sites-available/$(SERVICE_NAME) > /dev/null; \
	echo "        proxy_http_version 1.1;" | sudo tee -a /etc/nginx/sites-available/$(SERVICE_NAME) > /dev/null; \
	echo "        proxy_set_header Upgrade \$$http_upgrade;" | sudo tee -a /etc/nginx/sites-available/$(SERVICE_NAME) > /dev/null; \
	echo "        proxy_set_header Connection 'upgrade';" | sudo tee -a /etc/nginx/sites-available/$(SERVICE_NAME) > /dev/null; \
	echo "        proxy_set_header Host \$$host;" | sudo tee -a /etc/nginx/sites-available/$(SERVICE_NAME) > /dev/null; \
	echo "        proxy_cache_bypass \$$http_upgrade;" | sudo tee -a /etc/nginx/sites-available/$(SERVICE_NAME) > /dev/null; \
	echo "        proxy_set_header X-Real-IP \$$remote_addr;" | sudo tee -a /etc/nginx/sites-available/$(SERVICE_NAME) > /dev/null; \
	echo "        proxy_set_header X-Forwarded-For \$$proxy_add_x_forwarded_for;" | sudo tee -a /etc/nginx/sites-available/$(SERVICE_NAME) > /dev/null; \
	echo "        proxy_set_header X-Forwarded-Proto \$$scheme;" | sudo tee -a /etc/nginx/sites-available/$(SERVICE_NAME) > /dev/null; \
	echo "    }" | sudo tee -a /etc/nginx/sites-available/$(SERVICE_NAME) > /dev/null; \
	echo "" | sudo tee -a /etc/nginx/sites-available/$(SERVICE_NAME) > /dev/null; \
	echo "    location /static/ {" | sudo tee -a /etc/nginx/sites-available/$(SERVICE_NAME) > /dev/null; \
	echo "        alias $(BACKEND_DIR)/static/;" | sudo tee -a /etc/nginx/sites-available/$(SERVICE_NAME) > /dev/null; \
	echo "        expires 30d;" | sudo tee -a /etc/nginx/sites-available/$(SERVICE_NAME) > /dev/null; \
	echo "        add_header Cache-Control \"public, immutable\";" | sudo tee -a /etc/nginx/sites-available/$(SERVICE_NAME) > /dev/null; \
	echo "    }" | sudo tee -a /etc/nginx/sites-available/$(SERVICE_NAME) > /dev/null; \
	echo "}" | sudo tee -a /etc/nginx/sites-available/$(SERVICE_NAME) > /dev/null
	sudo ln -sf /etc/nginx/sites-available/$(SERVICE_NAME) /etc/nginx/sites-enabled/
	sudo rm -f /etc/nginx/sites-enabled/default
	sudo nginx -t
	sudo systemctl restart nginx
	sudo systemctl enable nginx
	@echo "$(GREEN)Nginx configured and restarted!$(NC)"

#------------------------------------------------------------------------------
# FIREWALL SETUP
#------------------------------------------------------------------------------
setup-firewall:
	@echo "$(YELLOW)Configuring firewall...$(NC)"
	@if command -v ufw > /dev/null; then \
		sudo ufw allow 22/tcp; \
		sudo ufw allow 80/tcp; \
		sudo ufw allow 443/tcp; \
		sudo ufw --force enable; \
		sudo ufw status; \
	elif command -v firewall-cmd > /dev/null; then \
		sudo firewall-cmd --permanent --add-service=ssh; \
		sudo firewall-cmd --permanent --add-service=http; \
		sudo firewall-cmd --permanent --add-service=https; \
		sudo firewall-cmd --reload; \
		sudo firewall-cmd --list-all; \
	else \
		echo "$(RED)No supported firewall found (ufw or firewalld)$(NC)"; \
	fi
	@echo "$(GREEN)Firewall configured!$(NC)"

#------------------------------------------------------------------------------
# SSL SETUP
#------------------------------------------------------------------------------
setup-ssl:
	@echo "$(YELLOW)Setting up SSL with Let's Encrypt...$(NC)"
	@read -p "Enter your domain name: " domain; \
	if [ -z "$$domain" ]; then \
		echo "$(RED)Domain name is required for SSL$(NC)"; \
		exit 1; \
	fi; \
	if command -v apt-get > /dev/null; then \
		sudo apt install -y certbot python3-certbot-nginx; \
	elif command -v yum > /dev/null; then \
		sudo yum install -y certbot python3-certbot-nginx; \
	fi; \
	sudo certbot --nginx -d $$domain; \
	sudo certbot renew --dry-run
	@echo "$(GREEN)SSL certificate installed!$(NC)"

#------------------------------------------------------------------------------
# MAINTENANCE
#------------------------------------------------------------------------------
backup:
	@echo "$(YELLOW)Creating backup...$(NC)"
	@mkdir -p $(BACKUP_DIR)
	@TIMESTAMP=$$(date +%Y%m%d_%H%M%S); \
	if [ -f $(BACKEND_DIR)/diksiai.db ]; then \
		cp $(BACKEND_DIR)/diksiai.db $(BACKUP_DIR)/diksiai_$$TIMESTAMP.db; \
		echo "Database backed up to $(BACKUP_DIR)/diksiai_$$TIMESTAMP.db"; \
	fi; \
	if [ -f $(BACKEND_DIR)/.env ]; then \
		cp $(BACKEND_DIR)/.env $(BACKUP_DIR)/.env_$$TIMESTAMP; \
		echo ".env backed up to $(BACKUP_DIR)/.env_$$TIMESTAMP"; \
	fi
	@echo "$(GREEN)Backup complete!$(NC)"

clean:
	@echo "$(YELLOW)Cleaning build artifacts...$(NC)"
	rm -rf $(FRONTEND_DIR)/node_modules/.cache
	rm -rf $(FRONTEND_DIR)/dist
	rm -rf $(BACKEND_DIR)/__pycache__
	find $(BACKEND_DIR) -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
	find $(BACKEND_DIR) -type f -name "*.pyc" -delete 2>/dev/null || true
	@echo "$(GREEN)Clean complete!$(NC)"

test-local:
	@echo "$(YELLOW)Starting local test server on port 8000...$(NC)"
	@echo "Press Ctrl+C to stop"
	cd $(BACKEND_DIR) && $(VENV)/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

#------------------------------------------------------------------------------
# FULL SETUP (Fresh VPS)
#------------------------------------------------------------------------------
full-setup: install-deps setup-backend build setup-systemd setup-nginx setup-firewall
	@echo ""
	@echo "$(GREEN)========================================$(NC)"
	@echo "$(GREEN)Full setup complete!$(NC)"
	@echo "$(GREEN)========================================$(NC)"
	@echo ""
	@echo "$(YELLOW)Next steps:$(NC)"
	@echo "1. Configure $(BACKEND_DIR)/.env with your settings"
	@echo "2. Run 'make migrate' to setup the database"
	@echo "3. Run 'make start' to start the application"
	@echo "4. (Optional) Run 'make setup-ssl' to enable HTTPS"
	@echo ""
	@echo "$(YELLOW)Important:$(NC)"
	@echo "- Set your GROQ_API_KEY in .env"
	@echo "- Change SECRET_KEY in .env"
	@echo "- Set DEBUG=False in .env"

#------------------------------------------------------------------------------
# ENV FILE SETUP HELPER
#------------------------------------------------------------------------------
setup-env:
	@echo "$(YELLOW)Setting up .env file...$(NC)"
	@if [ ! -f $(BACKEND_DIR)/.env ]; then \
		if [ -f $(BACKEND_DIR)/.env.example ]; then \
			cp $(BACKEND_DIR)/.env.example $(BACKEND_DIR)/.env; \
			echo "$(GREEN).env file created from .env.example$(NC)"; \
			echo "$(YELLOW)Please edit $(BACKEND_DIR)/.env with your settings$(NC)"; \
		else \
			echo "$(RED).env.example not found$(NC)"; \
		fi \
	else \
		echo ".env file already exists"; \
	fi
