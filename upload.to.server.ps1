# Check for config file
if (Test-Path ".\config.local.ps1") {
    . .\config.local.ps1 
}
else {
    Write-Error "Can't find config.local.ps1. I need an SSH profile to run."
    exit 1
}

# Check if the directory is a git repository
if (-not (Test-Path ".\.git")) {
    Write-Error "This directory does not appear to be a Git repository."
    exit 1
}

$ArchiveName = "production_repo_$(Get-Date -Format 'yyyyMMdd_HHmmss').tar"

# Build the project
Write-Host "Building project..."
try {
    npm run build
} catch {
    Write-Error "Error during Vite build: $_"
    exit 1
}
Write-Host "Project build completed.

# Archive the git repository
Write-Host "Archiving the repo as $ArchiveName.gz..."
try {
    git archive --format=tar --output="$ArchiveName" HEAD
    tar --append --file=$ArchiveName -C . build/
    gzip $ArchiveName
} catch {
    Write-Error "Error during archive creation: $_"
    exit 1
}
if (-not (Test-Path "$ArchiveName.gz")) {
    Write-Error "Archive was not created successfully."
    exit 1
}
Write-Host "Archive created: $ArchiveName.gz"

# Upload to SSH server
Write-Host "Uploading $ArchiveName.gz to $env:MY_SSH..."
try {
    & scp $ArchiveName.gz $env:MY_SSH:$env:REMOTE_PATH
} catch {
    Write-Error "Error during upload to the server: $_"
    exit 1
}
Write-Host "Upload complete."

# Cleanup local archive
Write-Host "Cleaning up local archive..."
Remove-Item $ArchiveName.gz
Write-Host "Done!"