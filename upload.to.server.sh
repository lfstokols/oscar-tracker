#! /bin/bash
set -eux # exit on error or undefined variable, print commands before execution
#* 0. Get configuration
CONFIG_FILE="$HOME/deploy/config.sh"
if [ -f "$CONFIG_FILE" ]; then
    . "$CONFIG_FILE"
else
    echo "Can't find config.local.sh. I need an SSH profile to run."
    exit 1
fi
# MY_SSH
# REMOTE_ROOT
# REMOTE_CURRENT
# REMOTE_RELEASES
# MY_USER
# DAEMON_GROUP
# SERVICE_NAME
TIMESTAMP=$(date +%Y-%m-%d_%H-%M-%S)
REMOTE_VERSION_DIR="$REMOTE_RELEASES/$TIMESTAMP"

#* 1. Build the project
npm run build:prod

#* 2. Create new timespamped dir in $REMOTE_RELEASES

ssh "$MY_SSH" "mkdir -p \$REMOTE_VERSION_DIR"

#* 3. Copy dist/, backend/, and requirements.txt to new dir
scp -r dist/ backend/ requirements.txt "$MY_SSH:$REMOTE_VERSION_DIR"

#* 4. If requirements changed, add them to venv
diff -q "$REMOTE_CURRENT"/requirements.txt "$REMOTE_VERSION_DIR"/requirements.txt || {
    ssh "$MY_SSH" "source \$REMOTE_ROOT/shared/venv/bin/activate && pip install -r \$REMOTE_VERSION_DIR/requirements.txt"
}

#* 5. Set permissions
ssh "$MY_SSH" "chown -R \$MY_USER:\$DAEMON_GROUP \$REMOTE_VERSION_DIR"
# Set directory permissions to 750 (rwx|r-x|---)
ssh "$MY_SSH" "find \$REMOTE_VERSION_DIR -type d -exec chmod 750 {} \;"
# Set file permissions to 640 (rw-|r--|---)
ssh "$MY_SSH" "find \$REMOTE_VERSION_DIR/dist/ -type f -exec chmod 640 {} \;"
# Set all files in backend directory to be executable
ssh "$MY_SSH" "chmod -R 750 \$REMOTE_VERSION_DIR/backend/"

#* 6. Update symlinks, pointing current/ to new release
ssh "$MY_SSH" "ln -sf \$REMOTE_VERSION_DIR \$REMOTE_CURRENT \
&& ln -sf \$REMOTE_ROOT/var \$REMOTE_CURRENT/var \
&& ln -sf \$REMOTE_ROOT/.env \$REMOTE_CURRENT/.env"

#* 7. Restart service
read -p "Do you want to restart gunicorn? (Y/n) " -n 1 -r RESTART_SERVICE
if [ "$RESTART_SERVICE" != "Y" ] && [ "$RESTART_SERVICE" != "y" ]; then
    echo "Exiting without restarting gunicorn..."
    exit 0
fi
echo "Restarting gunicorn..."
ssh "$MY_SSH" "sudo systemctl restart \$SERVICE_NAME"
echo "gunicorn restarted."
