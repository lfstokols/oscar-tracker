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
    npm run build:prod
}
catch {
    Write-Error "Error during Vite build: $_"
    exit 1
}
if ($?) {
    Write-Host "Project build completed."
}
else { throw $_ }

# Archive the git repository
Write-Host "Archiving the repo as $ArchiveName.gz..."
try {
    git archive --format=tar --output="$ArchiveName" HEAD
    if ($?) {
        Write-Host "Git archive done..."
        Write-Host "Adding dist/ folder..."
    }
    else { throw $_ }	
    tar --append --file=".\$ArchiveName" dist
    if ($?) {
        Write-Host "dist/ folder added..."
    }
    else { throw $_ }
    gzip "$ArchiveName"
    if ($?) {
        Write-Host "Result gzipped..."
    }
    else { throw $_ }
}
catch {
    Write-Error "Error during archive creation: $_"
    exit 1
}
if (-not (Test-Path "${ArchiveName}.gz")) {
    Write-Error "Archive was not created successfully."
    exit 1
}
if ((Test-Path "${ArchiveName}.gz")) {
    Write-Host "Archive was created successfully."
}
Write-Host "Archive created: $ArchiveName.gz"

# Upload to SSH server
Write-Host "Uploading $ArchiveName.gz to $env:MY_SSH..."
try {
    scp ".\${ArchiveName}.gz" "${env:MY_SSH}:${env:REMOTE_PATH}"
    if ($?) {
        Write-Host "Upload complete."
    }
    else { throw $_ }
}
catch {
    Write-Error "Error during upload to the server: $_"
    exit 1
}


# Cleanup local archive
Write-Host "Would you like to clean up? (Y/n) " -NoNewline
$resp = [System.Console]::ReadKey()
Write-Host ""
if ($resp -ne "n") {
    Write-Host "Cleaning up local archive..."
    Remove-Item "${ArchiveName}.gz"
    Write-Host "Cleaned up!"
}
Write-Host "Done!"

Write-Host "Would you like to continue to the server? (Y/n) " -NoNewline
$resp = [System.Console]::ReadKey()
Write-Host ""
if ($resp -ne "n") {
    Write-Host "Transferring control to server..."
    ssh $env:MY_SSH -tt "cd $env:REMOTE_PATH && bash instantiate.sh"
}
else {
    Write-Host "Done!"
}
