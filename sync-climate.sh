#!/bin/bash
# Sync ac-mvp → /var/www/climate for climate.roborumba.com
sudo rsync -a --delete /home/openclaw/.openclaw/workspace-demo-client/ac-mvp/ /var/www/climate/ \
  --exclude='node_modules' --exclude='.git' --exclude='leads' --exclude='*.log'
sudo chown -R www-data:www-data /var/www/climate/
echo "✅ /var/www/climate synced"
