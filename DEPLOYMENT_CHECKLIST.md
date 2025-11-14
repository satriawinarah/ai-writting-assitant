# Deployment Checklist - VPS (No Docker)

## Project Overview
**Application**: Author AI IDE - AI-powered writing assistant for Indonesian authors
**Stack**: FastAPI (Python) + React (served as static files)
**Deployment**: Monolithic - Single service on port 8000
**Database**: SQLite (lightweight) or PostgreSQL (production)

---

## Pre-Deployment Requirements

### 1. VPS Server Specifications
- [ ] **OS**: Ubuntu 20.04+ / Debian 11+ / CentOS 8+
- [ ] **RAM**: Minimum 1GB (2GB recommended)
- [ ] **Storage**: Minimum 2GB free space
- [ ] **CPU**: 1 vCPU minimum
- [ ] **Network**: Public IP address with port 80/443 access

### 2. Required Software on VPS
- [ ] **Python**: 3.11 or higher
  ```bash
  python3 --version  # Should be 3.11+
  ```
- [ ] **Node.js**: 18.x or higher
  ```bash
  node --version  # Should be 18.x+
  npm --version
  ```
- [ ] **Git**: For cloning repository
  ```bash
  git --version
  ```
- [ ] **Nginx**: For reverse proxy (optional but recommended)
  ```bash
  nginx -v
  ```
- [ ] **PostgreSQL**: 14+ (optional, can use SQLite)
  ```bash
  psql --version  # If using PostgreSQL
  ```

### 3. API Keys & Credentials
- [ ] **Groq API Key**: Get free key from https://console.groq.com
- [ ] **Domain Name**: (Optional) For production deployment
- [ ] **SSL Certificate**: (Optional) For HTTPS using Let's Encrypt

---

## Installation Steps

### Step 1: Install System Dependencies

#### On Ubuntu/Debian:
```bash
# Update package list
sudo apt update && sudo apt upgrade -y

# Install Python 3.11+ (if not installed)
sudo apt install python3.11 python3.11-venv python3-pip -y

# Install Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install nodejs -y

# Install Git
sudo apt install git -y

# Install Nginx
sudo apt install nginx -y

# Install PostgreSQL (optional)
sudo apt install postgresql postgresql-contrib -y

# Install build tools
sudo apt install build-essential libpq-dev -y
```

#### On CentOS/RHEL:
```bash
# Update packages
sudo yum update -y

# Install Python 3.11+
sudo yum install python3.11 python3.11-devel -y

# Install Node.js 18.x
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install nodejs -y

# Install Git
sudo yum install git -y

# Install Nginx
sudo yum install nginx -y

# Install PostgreSQL (optional)
sudo yum install postgresql-server postgresql-contrib -y

# Install development tools
sudo yum groupinstall "Development Tools" -y
```

- [ ] **Verify installations**:
  ```bash
  python3.11 --version
  node --version
  npm --version
  git --version
  nginx -v
  ```

---

### Step 2: Create Deployment User

```bash
# Create dedicated user for the app
sudo useradd -m -s /bin/bash authorai

# Set password (optional)
sudo passwd authorai

# Add to sudo group (if needed)
sudo usermod -aG sudo authorai

# Switch to the user
sudo su - authorai
```

- [ ] Deployment user created
- [ ] Switched to deployment user

---

### Step 3: Clone Repository

```bash
# Navigate to home directory
cd ~

# Clone the repository
git clone https://github.com/yourusername/author-ai-ide.git

# Or upload files via SCP/SFTP if not using Git
# scp -r /local/path user@server:/home/authorai/

# Navigate to project
cd author-ai-ide
```

- [ ] Repository cloned to VPS
- [ ] Project directory accessible

---

### Step 4: Setup Database (Choose One)

#### Option A: SQLite (Lightweight, Recommended for Small VPS)
```bash
# No installation needed - SQLite will be created automatically
# Database file will be: backend/diksiai.db
```
- [ ] Using SQLite (default)

#### Option B: PostgreSQL (Production)
```bash
# Start PostgreSQL service
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create database and user
sudo -u postgres psql <<EOF
CREATE DATABASE authoraidb;
CREATE USER authorai WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE authoraidb TO authorai;
\q
EOF
```
- [ ] PostgreSQL installed and running
- [ ] Database `authoraidb` created
- [ ] User `authorai` created with permissions

---

### Step 5: Configure Environment Variables

```bash
# Navigate to backend directory
cd ~/author-ai-ide/backend

# Create .env file
cp .env.example .env

# Edit .env file
nano .env
```

**Required configuration**:
```env
# Groq API (Get from https://console.groq.com)
GROQ_API_KEY=your_groq_api_key_here
GROQ_MODEL=llama-3.3-70b-versatile

# Database - Choose one:
# For SQLite (default):
DATABASE_URL=sqlite:///./diksiai.db

# For PostgreSQL:
# DATABASE_URL=postgresql://authorai:your_secure_password@localhost:5432/authoraidb

# Security - CHANGE THIS IN PRODUCTION!
SECRET_KEY=your_super_secret_jwt_key_change_this_in_production

# Application
DEBUG=False
HOST=0.0.0.0
PORT=8000
```

- [ ] `.env` file created
- [ ] Groq API key configured
- [ ] Database URL configured
- [ ] SECRET_KEY changed from default
- [ ] DEBUG set to `False`

---

### Step 6: Setup Python Backend

```bash
# Navigate to backend directory
cd ~/author-ai-ide/backend

# Create virtual environment
python3.11 -m venv venv

# Activate virtual environment
source venv/bin/activate

# Upgrade pip
pip install --upgrade pip

# Install Python dependencies
pip install -r requirements.txt

# Run database migrations
alembic upgrade head
```

- [ ] Python virtual environment created
- [ ] Python dependencies installed
- [ ] Database migrations applied successfully

---

### Step 7: Build Frontend

```bash
# Navigate to frontend directory
cd ~/author-ai-ide/frontend

# Install Node dependencies
npm install

# Build production frontend
npm run build
```

**Verify build output**:
```bash
# Check that static files were created
ls -la ../backend/static/
# Should see: index.html, assets/, etc.
```

- [ ] Node dependencies installed
- [ ] Frontend built successfully
- [ ] Static files generated in `backend/static/`

---

### Step 8: Test Application

```bash
# Navigate to backend
cd ~/author-ai-ide/backend

# Activate virtual environment (if not already)
source venv/bin/activate

# Test run the application
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000

# In another terminal, test the API
curl http://localhost:8000/api/health
```

- [ ] Application starts without errors
- [ ] API responds to health check
- [ ] Frontend accessible at http://your-server-ip:8000

**Stop the test server** (Ctrl+C) before continuing.

---

### Step 9: Setup Systemd Service (Process Manager)

```bash
# Create systemd service file
sudo nano /etc/systemd/system/authorai.service
```

**Service configuration**:
```ini
[Unit]
Description=Author AI IDE - FastAPI Application
After=network.target

[Service]
Type=simple
User=authorai
WorkingDirectory=/home/authorai/author-ai-ide/backend
Environment="PATH=/home/authorai/author-ai-ide/backend/venv/bin"
ExecStart=/home/authorai/author-ai-ide/backend/venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 2

Restart=always
RestartSec=10
StandardOutput=append:/home/authorai/author-ai-ide/backend/app.log
StandardError=append:/home/authorai/author-ai-ide/backend/error.log

[Install]
WantedBy=multi-user.target
```

**Enable and start the service**:
```bash
# Reload systemd
sudo systemctl daemon-reload

# Enable service to start on boot
sudo systemctl enable authorai

# Start the service
sudo systemctl start authorai

# Check status
sudo systemctl status authorai
```

**Useful service commands**:
```bash
sudo systemctl start authorai    # Start service
sudo systemctl stop authorai     # Stop service
sudo systemctl restart authorai  # Restart service
sudo systemctl status authorai   # Check status
sudo journalctl -u authorai -f   # View live logs
```

- [ ] Systemd service file created
- [ ] Service enabled to start on boot
- [ ] Service started successfully
- [ ] Service status shows "active (running)"

---

### Step 10: Setup Nginx Reverse Proxy (Recommended)

```bash
# Create Nginx configuration
sudo nano /etc/nginx/sites-available/authorai
```

**Basic configuration (HTTP only)**:
```nginx
server {
    listen 80;
    server_name your-domain.com;  # Or use server IP

    client_max_body_size 10M;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Optional: Serve static files directly through Nginx (better performance)
    location /static/ {
        alias /home/authorai/author-ai-ide/backend/static/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
```

**Enable the site**:
```bash
# Create symbolic link
sudo ln -s /etc/nginx/sites-available/authorai /etc/nginx/sites-enabled/

# Remove default site (optional)
sudo rm /etc/nginx/sites-enabled/default

# Test Nginx configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx

# Enable Nginx to start on boot
sudo systemctl enable nginx
```

- [ ] Nginx configuration created
- [ ] Site enabled in Nginx
- [ ] Nginx configuration test passed
- [ ] Nginx restarted successfully
- [ ] Application accessible via domain/IP on port 80

---

### Step 11: Setup Firewall

```bash
# Using UFW (Ubuntu/Debian)
sudo ufw allow 22/tcp     # SSH
sudo ufw allow 80/tcp     # HTTP
sudo ufw allow 443/tcp    # HTTPS (for SSL later)
sudo ufw enable
sudo ufw status

# Or using firewalld (CentOS/RHEL)
sudo firewall-cmd --permanent --add-service=ssh
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload
```

- [ ] Firewall configured
- [ ] Port 22 (SSH) open
- [ ] Port 80 (HTTP) open
- [ ] Port 443 (HTTPS) open

---

### Step 12: Setup SSL Certificate (Optional but Recommended)

**Using Let's Encrypt (Free SSL)**:
```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y  # Ubuntu/Debian
# OR
sudo yum install certbot python3-certbot-nginx -y  # CentOS/RHEL

# Obtain and install certificate
sudo certbot --nginx -d your-domain.com

# Test auto-renewal
sudo certbot renew --dry-run
```

**Certbot will automatically**:
- Obtain SSL certificate
- Update Nginx configuration
- Setup auto-renewal

- [ ] Certbot installed
- [ ] SSL certificate obtained
- [ ] Nginx configured for HTTPS
- [ ] Auto-renewal tested
- [ ] Application accessible via HTTPS

---

## Post-Deployment Verification

### 1. Application Health Checks
```bash
# Check if service is running
sudo systemctl status authorai

# Check application logs
sudo journalctl -u authorai -n 50

# Check Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# Test API endpoints
curl http://localhost:8000/api/health
curl https://your-domain.com/api/health
```

- [ ] Service running without errors
- [ ] No errors in application logs
- [ ] No errors in Nginx logs
- [ ] API health check returns 200 OK

### 2. Functionality Tests
- [ ] Frontend loads correctly
- [ ] User registration works
- [ ] User login works
- [ ] Can create new project
- [ ] Can create new chapter
- [ ] AI text generation works (Groq API)
- [ ] Can save and load content

### 3. Performance Tests
```bash
# Check memory usage
free -h

# Check disk usage
df -h

# Check CPU usage
top
```

- [ ] Memory usage acceptable (< 80%)
- [ ] Disk usage acceptable (< 80%)
- [ ] CPU usage normal

---

## Ongoing Maintenance

### Monitoring
```bash
# View live application logs
sudo journalctl -u authorai -f

# Check application status
sudo systemctl status authorai

# Check Nginx status
sudo systemctl status nginx

# Monitor system resources
htop  # Install: sudo apt install htop
```

### Backup Strategy
```bash
# Backup database (SQLite)
cp ~/author-ai-ide/backend/diksiai.db ~/backups/diksiai_$(date +%Y%m%d).db

# Backup database (PostgreSQL)
pg_dump -U authorai authoraidb > ~/backups/authoraidb_$(date +%Y%m%d).sql

# Backup .env file
cp ~/author-ai-ide/backend/.env ~/backups/.env_$(date +%Y%m%d)
```

**Setup automated backup cron job**:
```bash
# Edit crontab
crontab -e

# Add daily backup at 2 AM
0 2 * * * cp /home/authorai/author-ai-ide/backend/diksiai.db /home/authorai/backups/diksiai_$(date +\%Y\%m\%d).db
```

- [ ] Monitoring commands tested
- [ ] Backup strategy implemented
- [ ] Automated backups configured

### Updating the Application
```bash
# Navigate to project
cd ~/author-ai-ide

# Pull latest changes
git pull origin main

# Activate virtual environment
source backend/venv/bin/activate

# Update Python dependencies (if changed)
pip install -r backend/requirements.txt

# Run new migrations (if any)
cd backend
alembic upgrade head

# Rebuild frontend
cd ../frontend
npm install  # If package.json changed
npm run build

# Restart the service
sudo systemctl restart authorai

# Check status
sudo systemctl status authorai
```

- [ ] Update procedure documented and tested

---

## Troubleshooting

### Service won't start
```bash
# Check detailed logs
sudo journalctl -u authorai -n 100 --no-pager

# Check if port 8000 is already in use
sudo netstat -tlnp | grep 8000

# Check file permissions
ls -la /home/authorai/author-ai-ide/backend/

# Test manually
cd ~/author-ai-ide/backend
source venv/bin/activate
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```

### Database connection errors
```bash
# Check database file (SQLite)
ls -la ~/author-ai-ide/backend/diksiai.db

# Check PostgreSQL is running
sudo systemctl status postgresql

# Test PostgreSQL connection
psql -U authorai -d authoraidb -h localhost
```

### Frontend not loading
```bash
# Check if static files exist
ls -la ~/author-ai-ide/backend/static/

# Rebuild frontend
cd ~/author-ai-ide/frontend
npm run build

# Check Nginx configuration
sudo nginx -t
sudo systemctl restart nginx
```

### High memory usage
```bash
# Reduce Uvicorn workers in service file
# Change: --workers 2
# To: --workers 1

# Restart service
sudo systemctl restart authorai
```

---

## Security Checklist

- [ ] Changed default SECRET_KEY in .env
- [ ] DEBUG set to False in production
- [ ] Firewall configured (only ports 22, 80, 443 open)
- [ ] SSH key-based authentication enabled (disable password auth)
- [ ] Regular security updates: `sudo apt update && sudo apt upgrade`
- [ ] Database backups configured
- [ ] Strong database password (if using PostgreSQL)
- [ ] Consider rate limiting for API endpoints
- [ ] Monitor application logs for suspicious activity

---

## Cost Optimization Tips for Small VPS

1. **Use SQLite instead of PostgreSQL** - Saves ~100-200MB RAM
2. **Run 1 Uvicorn worker** instead of 2-4 - Saves ~50-100MB RAM per worker
3. **Use Groq API** (already configured) - No need for local LLM (saves GB of storage/RAM)
4. **Enable Nginx gzip compression** - Reduces bandwidth usage
5. **Set appropriate log rotation** - Prevents disk filling up
6. **Use swap file** if RAM is limited (but slower):
   ```bash
   sudo fallocate -l 1G /swapfile
   sudo chmod 600 /swapfile
   sudo mkswap /swapfile
   sudo swapon /swapfile
   echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
   ```

---

## Quick Reference Commands

```bash
# Application control
sudo systemctl start authorai
sudo systemctl stop authorai
sudo systemctl restart authorai
sudo systemctl status authorai

# View logs
sudo journalctl -u authorai -f
tail -f ~/author-ai-ide/backend/app.log

# Nginx control
sudo systemctl restart nginx
sudo nginx -t

# Update application
cd ~/author-ai-ide && git pull
sudo systemctl restart authorai

# Backup database
cp ~/author-ai-ide/backend/diksiai.db ~/backups/backup_$(date +%Y%m%d).db
```

---

## Estimated Resource Usage

**Minimal Configuration**:
- **RAM**: ~300-500MB
- **CPU**: 5-15% average
- **Disk**: ~500MB (application) + database size
- **Bandwidth**: Minimal (Groq API calls are small)

**With PostgreSQL**:
- **RAM**: ~400-700MB
- **CPU**: 10-20% average
- **Disk**: ~700MB + database size

---

## Support & Documentation

- **Architecture**: See [ARCHITECTURE.md](ARCHITECTURE.md)
- **Installation**: See [INSTALLATION.md](INSTALLATION.md)
- **Troubleshooting**: See [TROUBLESHOOTING.md](TROUBLESHOOTING.md)
- **Features**: See [FEATURES.md](FEATURES.md)

---

## Deployment Complete! ✓

Access your application at:
- **HTTP**: http://your-domain.com or http://your-server-ip
- **HTTPS**: https://your-domain.com (if SSL configured)

**Default Admin Account**: Create via registration at first launch

---

**Last Updated**: 2025-11-14
**Deployment Type**: VPS (No Docker)
**Target OS**: Ubuntu/Debian/CentOS
