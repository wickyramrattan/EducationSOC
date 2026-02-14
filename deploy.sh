#!/bin/bash

# SOC Training Platform Deployment Script for Proxmox LXC
# This script automates the deployment of the SOC Training Platform

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
CONTAINER_ID=${1:-100}
CONTAINER_HOSTNAME="soc-platform"
CONTAINER_MEMORY=${2:-4096}
CONTAINER_CORES=${3:-2}
CONTAINER_DISK=${4:-20}
APP_DIR="/opt/soc-platform"

echo -e "${GREEN}SOC Training Platform Deployment Script${NC}"
echo "========================================"
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}Please run as root${NC}"
    exit 1
fi

# Check if Proxmox
if ! command -v pct &> /dev/null; then
    echo -e "${YELLOW}Warning: pct command not found. This script is designed for Proxmox VE.${NC}"
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Function to print status
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Step 1: Download Ubuntu template
print_status "Step 1: Downloading Ubuntu 22.04 template..."
if ! pveam list local | grep -q "ubuntu-22.04"; then
    pveam download local ubuntu-22.04-standard_22.04-1_amd64.tar.zst
else
    print_status "Ubuntu template already exists, skipping download"
fi

# Step 2: Create LXC container
print_status "Step 2: Creating LXC container (ID: $CONTAINER_ID)..."
if pct status $CONTAINER_ID &> /dev/null; then
    print_warning "Container $CONTAINER_ID already exists"
    read -p "Destroy and recreate? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        pct stop $CONTAINER_ID 2>/dev/null || true
        pct destroy $CONTAINER_ID
    else
        print_error "Deployment cancelled"
        exit 1
    fi
fi

pct create $CONTAINER_ID local:vztmpl/ubuntu-22.04-standard_22.04-1_amd64.tar.zst \
    --hostname $CONTAINER_HOSTNAME \
    --storage local-lvm \
    --rootfs $CONTAINER_DISK \
    --cores $CONTAINER_CORES \
    --memory $CONTAINER_MEMORY \
    --swap 1024 \
    --net0 name=eth0,bridge=vmbr0,ip=dhcp \
    --features nesting=1 \
    --unprivileged 1

# Step 3: Start container
print_status "Step 3: Starting container..."
pct start $CONTAINER_ID

# Wait for container to be ready
print_status "Waiting for container to be ready..."
sleep 10

# Step 4: Install dependencies
print_status "Step 4: Installing dependencies..."
pct exec $CONTAINER_ID -- bash -c "
    export DEBIAN_FRONTEND=noninteractive
    apt-get update
    apt-get upgrade -y
    apt-get install -y curl wget git nginx sqlite3 build-essential
"

# Step 5: Install Node.js 20
print_status "Step 5: Installing Node.js 20..."
pct exec $CONTAINER_ID -- bash -c "
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
"

# Step 6: Install PM2
print_status "Step 6: Installing PM2..."
pct exec $CONTAINER_ID -- npm install -g pm2

# Step 7: Create application directory
print_status "Step 7: Setting up application directory..."
pct exec $CONTAINER_ID -- mkdir -p $APP_DIR

# Step 8: Copy application files
print_status "Step 8: Copying application files..."
if [ -d "app" ]; then
    tar -czf - -C app . | pct exec $CONTAINER_ID -- tar -xzf - -C $APP_DIR
elif [ -f "soc-platform.tar.gz" ]; then
    cat soc-platform.tar.gz | pct exec $CONTAINER_ID -- tar -xzf - -C $APP_DIR
else
    print_warning "Application files not found in expected locations"
    print_status "Please manually copy application files to $APP_DIR"
    read -p "Press enter to continue after copying files..."
fi

# Step 9: Install application dependencies
print_status "Step 9: Installing application dependencies..."
pct exec $CONTAINER_ID -- bash -c "cd $APP_DIR && npm install"

# Step 10: Build frontend
print_status "Step 10: Building frontend..."
pct exec $CONTAINER_ID -- bash -c "cd $APP_DIR && npm run build"

# Step 11: Create environment file
print_status "Step 11: Creating environment configuration..."
pct exec $CONTAINER_ID -- bash -c "cat > $APP_DIR/.env << 'EOF'
NODE_ENV=production
PORT=3001
JWT_SECRET=$(openssl rand -base64 32)
FRONTEND_URL=http://localhost
EOF"

# Step 12: Configure Nginx
print_status "Step 12: Configuring Nginx..."
pct exec $CONTAINER_ID -- bash -c "cat > /etc/nginx/sites-available/soc-platform << 'EOF'
server {
    listen 80;
    server_name _;
    
    location / {
        root /opt/soc-platform/dist;
        try_files \$uri \$uri/ /index.html;
    }
    
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF"

pct exec $CONTAINER_ID -- bash -c "
    ln -sf /etc/nginx/sites-available/soc-platform /etc/nginx/sites-enabled/
    rm -f /etc/nginx/sites-enabled/default
    nginx -t && systemctl restart nginx
"

# Step 13: Start application with PM2
print_status "Step 13: Starting application..."
pct exec $CONTAINER_ID -- bash -c "
    cd $APP_DIR && pm2 start server/index.js --name 'soc-platform'
    pm2 startup systemd -u root --hp /root
    pm2 save
"

# Step 14: Configure firewall
print_status "Step 14: Configuring firewall..."
pct exec $CONTAINER_ID -- bash -c "
    ufw allow 80/tcp
    ufw allow 443/tcp
    ufw --force enable
"

# Get container IP
CONTAINER_IP=$(pct exec $CONTAINER_ID -- hostname -I | awk '{print $1}')

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Deployment Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Container ID: $CONTAINER_ID"
echo "Container IP: $CONTAINER_IP"
echo ""
echo "Access the application at:"
echo "  http://$CONTAINER_IP"
echo ""
echo "Default admin credentials:"
echo "  Username: admin"
echo "  Password: admin123"
echo ""
echo -e "${YELLOW}IMPORTANT: Change the default admin password after first login!${NC}"
echo ""
echo "Useful commands:"
echo "  View logs:        pct exec $CONTAINER_ID -- pm2 logs soc-platform"
echo "  Restart app:      pct exec $CONTAINER_ID -- pm2 restart soc-platform"
echo "  Container shell:  pct exec $CONTAINER_ID -- bash"
echo ""
