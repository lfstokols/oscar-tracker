#! /bin/bash
#set -eux # exit on error or undefined variable, print commands before execution
set -eu

# Always run in project root
REPO_ROOT=$(dirname "$0")/..
cd "$REPO_ROOT"

#* 0. Get configuration
CONFIG_FILE="$HOME/deploy.config.sh"
if [ -f "$CONFIG_FILE" ]; then
    . "$CONFIG_FILE"
else
    echo "Can't find config.local.sh. I need an SSH profile to run."
    exit 1
fi
mode=stage
if [ "${1:-}" = "--full" ]; then
    mode=full
fi
# MY_SSH
# REMOTE_ROOT
# REMOTE_CURRENT
# REMOTE_BETA
# REMOTE_RELEASES
# MY_USER
# DAEMON_GROUP
# SERVICE_NAME
TIMESTAMP=$(TZ=America/New_York date +%Y-%m-%d_%H-%M-%S)
REMOTE_VERSION_DIR="$REMOTE_RELEASES/$TIMESTAMP"


#* 1. Build the project, if user request it or times out
# Use read with timeout
read -t 4 -p "Do we need to rebuild dist? (Y/n) " -n 1 -r BUILD_PROJECT || BUILD_PROJECT="Y"
echo # Add newline after prompt
if [ "$BUILD_PROJECT" = "N" ] || [ "$BUILD_PROJECT" = "n" ]; then
    echo "Skipping build..."
else
    echo "Building project..."
    cmd.exe /c npm run build:prod
fi

#* 2. Create new timespamped dir in $REMOTE_RELEASES
ssh "$MY_SSH" "mkdir -p $REMOTE_VERSION_DIR"

#* 3. Copy dist/, backend/, and requirements.txt to new dir

scp -q -r "$REPO_ROOT"/dist/ "$REPO_ROOT"/backend/ "$REPO_ROOT"/requirements.txt "$MY_SSH:$REMOTE_VERSION_DIR"

#* 4. If requirements changed, add them to venv
# ssh "$MY_SSH" "test -f $REMOTE_CURRENT/requirements.txt && test -f $REMOTE_VERSION_DIR/requirements.txt \
# && diff $REMOTE_CURRENT/requirements.txt $REMOTE_VERSION_DIR/requirements.txt \
# || source $REMOTE_ROOT/venv/bin/activate \
# && pip install -r $REMOTE_VERSION_DIR/requirements.txt"

#* 5. Set permissions
ssh "$MY_SSH" "chown -R $MY_USER:$DAEMON_GROUP $REMOTE_VERSION_DIR"
# Set directory permissions to 750 (rwx|r-x|---)
ssh "$MY_SSH" "find $REMOTE_VERSION_DIR -type d -exec chmod 750 {} +"
# Set file permissions to 640 (rw-|r--|---), but only for regular files
ssh "$MY_SSH" "find $REMOTE_VERSION_DIR/dist/ -type f -not -type l -exec chmod 640 {} +"
# Set all files in backend directory to be executable
ssh "$MY_SSH" "chmod -R 750 $REMOTE_VERSION_DIR/backend/"

#* 6. Update symlinks, pointing current/ to new release
echo "Are you ready to update symlinks?"
read -p "Yes to continue, No to exit (y/N): " -n 1 -r UPDATE_SYMLINKS
if [ "$UPDATE_SYMLINKS" != "Y" ] && [ "$UPDATE_SYMLINKS" != "y" ]; then
    echo "Exiting without updating symlinks..."
    exit 0
fi
[ "$mode" = "full" ] && target=REMOTE_CURRENT || target=REMOTE_BETA
ssh "$MY_SSH" "rm $target \
&& ln -s $REMOTE_VERSION_DIR $target \
&& ln -s $REMOTE_ROOT/var $target/var \
&& ln -s $REMOTE_ROOT/.env $target/.env"

#* 7. Restart service
echo "Restarting gunicorn..."
ssh -S "$MY_SSH" "sudo systemctl restart $SERVICE_NAME"
echo "gunicorn restarted."
