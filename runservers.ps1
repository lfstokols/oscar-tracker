# dev-servers.ps1

param(
    [Parameter()]
    [switch]$stop
)

# Load .env values
Get-Content .env | ForEach-Object {
    if ($_ -match "(.+)=(.+)") {
        $key = $Matches[1]
        $value = $Matches[2]
        Set-Item -Path "env:$key" -Value $value
    }
}

# Global flag to track if we should shut down
$script:shouldExit = $false

function Stop-DevServers {
    Write-Host "Stopping development servers..."
    
    # Stop any running Vite dev servers
    Get-NetTCPConnection -LocalPort $env:VITE_PORT -ErrorAction SilentlyContinue | 
        ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }

    # Find and stop Python processes running devserver.py
    Get-Process -Name python -ErrorAction SilentlyContinue | 
        Where-Object { $_.CommandLine -like '*devserver.py*' } | 
        Stop-Process -Force
}

function Start-DevServers {
    try {
        # Register SIGINT (Ctrl+C) handler
        $null = Register-ObjectEvent -InputObject ([Console]) -EventName CancelKeyPress -Action {
            $script:shouldExit = $true
            $event.MessageData
            $event.Cancel = $true  # Prevent immediate termination
        }
		echo "Registered SIGINT listener."

        # Start both processes
		echo "Defining vite var"
        $vite = Start-Process cmd.exe -ArgumentList {/c npm run dev} -NoNewWindow -PassThru
		echo "Defining python var"
        $python = Start-Process python -ArgumentList "backend/devserver.py" -NoNewWindow -PassThru
		#Write-Host "Should be starting servers now..."
		#Start-Sleep -Seconds 10
		#Write-Host "Did they start?"

        Write-Host "Development servers started. Press Ctrl+C to stop."

        # Wait until SIGINT or explicit stop
        while (-not $script:shouldExit) {
            Start-Sleep -Seconds 1
            
            # Check if either process died unexpectedly
            if ($vite.HasExited -or $python.HasExited) {
                Write-Host "One of the servers crashed. Stopping all servers..."
                break
            }
        }
    }
    finally {
        # Clean up
        if (-not $vite.HasExited) { $vite.Kill() }
        if (-not $python.HasExited) { $python.Kill() }
        Get-EventSubscriber -SourceIdentifier Console.CancelKeyPress -ErrorAction SilentlyContinue | 
            Unregister-Event
        Stop-DevServers
    }
}

if ($stop) {
    Stop-DevServers
}
else {
    Start-DevServers
}
