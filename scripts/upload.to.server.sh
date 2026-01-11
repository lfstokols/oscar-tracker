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
    echo "Can't find config.local.sh. I need an SSH profile to run." >&2
    exit 1
fi

# By default, we do nothing. If requested, we can upload and/or deploy.
# If asked to deploy, and no release name is provided, then implicitly we upload a new release.
# Use --upload with --name to fix an existing release.
# Use --deploy-* with --name to deploy an existing release, or without --name to upload a new release and deploy it.
function print_help {
    echo "Usage: $0 [--upload] [--name <release_name>] [--deploy-live] [--deploy-beta]"
    echo "  --upload | -u: Upload the current repository to the server"
    echo "  --name | -n <release_name>: Specify a release name (full directory name)"
    echo "  --deploy-live | --live: Deploy the current release to the live environment"
    echo "  --deploy-beta | --beta: Deploy the current release to the beta environment"
    echo "  --help | -h: Print this help message"
    echo "Note: No action is taken by default."
    echo "  Use --upload to upload a new release without deploying it."
    echo "  Use --upload with --name to fix an existing release."
    echo "  Use --deploy-* with --name to deploy an existing release."
    echo "  Use --deploy-* without --name to upload a new release and deploy it."
}

do_upload=false
do_install=false
release_name=
mode=beta
skip_confirmation=false

while [[ $# -gt 0 ]]; do
    arg=$1
    case $arg in
        --upload|-u)
            do_upload=true
            shift 1
            ;;
        --name|-n)
            release_name=$2
            shift 2
            ;;
        --deploy-live|--live)
            mode=live
            do_install=true
            shift 1
            ;;
        --deploy-beta|--beta)
            mode=beta
            do_install=true
            shift 1
            ;;
        -y)
            skip_confirmation=true
            shift 1
            ;;
        --help|-h)
            print_help
            exit 0
            ;;
        *)
            echo "Unknown argument: $arg" >&2
            exit 1
    esac
done

declare -r MY_SSH="$MY_SSH"
declare -r REMOTE_ROOT="$REMOTE_ROOT"
declare -r REMOTE_CURRENT="$REMOTE_CURRENT"
declare -r REMOTE_BETA="$REMOTE_BETA"
declare -r REMOTE_RELEASES="$REMOTE_RELEASES"
declare -r MY_USER="$MY_USER"
declare -r DAEMON_GROUP="$DAEMON_GROUP"
declare -r SERVICE_NAME="$SERVICE_NAME"
declare -r BETA_SERVICE_NAME="$BETA_SERVICE_NAME"
declare -r POETRY="$POETRY"

if "$do_install" && [[ -z "$release_name" ]]; then
    # Told to install but no release name provided, so implicitly upload a new release.
    do_upload=true
fi
if "$do_upload" && [[ -z "$release_name" ]]; then
    # Use a new release name
    timestamp=$(TZ=America/New_York date +%Y-%m-%d_%H-%M-%S)
    release_name="$timestamp"
fi

case $mode in
    live)
        service_name="$SERVICE_NAME"
        ;;
    beta)
        service_name="$BETA_SERVICE_NAME"
        ;;
esac
remote_version_dir="$REMOTE_RELEASES/$release_name"

function upload_release {
    echo "Beginning upload process..." >&2
    #* 1. Build the project, if user request it or times out
    read -t 4 -p "Do we need to rebuild dist? (Y/n) " -n 1 -r BUILD_PROJECT || BUILD_PROJECT="Y"
    echo # Add newline after prompt
    if [ "$BUILD_PROJECT" = "N" ] || [ "$BUILD_PROJECT" = "n" ]; then
        echo "Skipping build..." >&2
    else
        echo "Building project..." >&2
        npm run build:prod
    fi

    #* 2. Create new timespamped dir in $REMOTE_RELEASES
    ssh "$MY_SSH" "mkdir -p $remote_version_dir"

    #* 3. Copy dist/, backend/, and Poetry files to new dir
    echo "Copying files to remote..." >&2
    rsync -az --delete --exclude='__pycache__' --exclude='*.pyc' \
        "$REPO_ROOT"/{dist,backend,pyproject.toml,poetry.lock} \
        "$MY_SSH:$remote_version_dir/"
    
    #* 4. Set permissions
    echo "Setting file permissions..." >&2
    ssh "$MY_SSH" "
        set -e
        chown -R $MY_USER:$DAEMON_GROUP $remote_version_dir
        find $remote_version_dir -type d -exec chmod 750 {} +
        find $remote_version_dir/dist/ -type f -not -type l -exec chmod 640 {} +
        chmod -R 750 $remote_version_dir/backend/
        ln -sfn $REMOTE_ROOT/.env $remote_version_dir/.env
        ln -sfn $REMOTE_ROOT/var $remote_version_dir/var
    "
}

function other_venv {
    if [[ "$1" = "venv-blue" ]]; then
        echo "venv-green"
    else
        echo "venv-blue"
    fi
}

function get_active_venv {
    # Determine which venv is currently active and target the other
    local venv
    venv=$(ssh "$MY_SSH" "readlink $REMOTE_ROOT/venv 2>/dev/null || echo 'venv-blue'")
    venv=$(basename "$venv")
    echo "$venv"
}

function set_venv_permissions {
    # pass full path to venv
    local venv=$1
    echo -e "chown -R $MY_USER:$DAEMON_GROUP $venv && chmod -R 750 $venv"
}
function install_green_venv {
    #* Install dependencies (production only - blue-green venv swap)
    echo "Setting up production dependencies (blue-green venv)..." >&2
    local active_venv target_venv
    active_venv=$(get_active_venv)
    target_venv=$(other_venv "$active_venv")
    echo "Active venv: $active_venv, installing to: $target_venv" >&2
    # Install deps to inactive venv (--sync removes old packages)
    ssh "$MY_SSH" "
        set -e
        VIRTUAL_ENV=$REMOTE_ROOT/$target_venv $POETRY install --sync --no-root --directory $remote_version_dir &&
        $(set_venv_permissions "$REMOTE_ROOT/$target_venv")
    "
    echo "Production dependencies installed." >&2
}


function update_production_symlinks {
    # Production: symlink current -> release, swap venv, create .env/var links
    target_venv=$(other_venv "$(get_active_venv)")
    echo "Updating production symlinks and swapping venv to $target_venv..." >&2
    ssh "$MY_SSH" "
        set -e
        ln -sfn $remote_version_dir $REMOTE_CURRENT
        ln -sfn $REMOTE_ROOT/$target_venv $REMOTE_ROOT/venv
    "
    echo "Production symlinks updated." >&2
}

function update_beta_symlinks {
    # Beta: update symlinks to point to release, then install deps
    echo "Updating beta symlinks and installing dependencies..." >&2
    ssh "$MY_SSH" "
        set -e
        ln -sfn $remote_version_dir/backend $REMOTE_BETA/backend
        ln -sfn $remote_version_dir/dist $REMOTE_BETA/dist
        ln -sfn $remote_version_dir/pyproject.toml $REMOTE_BETA/pyproject.toml
        ln -sfn $remote_version_dir/poetry.lock $REMOTE_BETA/poetry.lock
        cd $REMOTE_BETA && VIRTUAL_ENV=venv $POETRY sync --no-root
        $(set_venv_permissions "$REMOTE_BETA/venv")
    "
    echo "Beta symlinks updated." >&2
}

function restart_service {
    local name=$1
    echo "Restarting $name service..." >&2
    ssh "$MY_SSH" "sudo systemctl restart $service_name"
    echo "${name^} service restarted." >&2
}

#* Main script logic
if ! "$do_upload" && ! "$do_install"; then
    echo "No action requested. Exiting." >&2
    exit 0
fi
echo "Plan:"
"$do_upload" && echo "  - Upload current repo as $release_name"
"$do_install" && echo "  - Deploy $release_name as $mode version"
if ! "$skip_confirmation"; then
    read -p "Continue? (y/N): " -n 1 -r CONFIRM
    echo
    if ! [[ "$CONFIRM" =~ ^[Yy]$ ]]; then
        echo "Exiting without performing any actions." >&2
        exit 0
    fi
fi

if "$do_upload"; then
    upload_release
    echo "Upload complete." >&2
fi

if "$do_install"; then
    if [ "$mode" = "live" ]; then
        install_green_venv
        update_production_symlinks
    else
        update_beta_symlinks
    fi
    restart_service "$mode"
fi