# Fast-Agent installation script for Windows using uv

# Check if uv is installed
$uvInstalled = $null
try {
    $uvInstalled = Get-Command uv -ErrorAction SilentlyContinue
} catch {
    # Command not found
}

if (-not $uvInstalled) {
    Write-Host "uv not found. Installing uv..."
    
    # Check if pip is available
    $pipInstalled = $null
    try {
        $pipInstalled = Get-Command pip -ErrorAction SilentlyContinue
    } catch {
        # Command not found
    }
    
    if ($pipInstalled) {
        # Install uv using pip
        pip install uv
    } else {
        # Use PowerShell to install if pip is not available
        Write-Host "Please install uv manually from https://github.com/astral-sh/uv"
        Write-Host "After installing uv, run this script again."
        exit 1
    }
    
    Write-Host "uv installed successfully!"
}

# Create a virtual environment using uv
Write-Host "Creating a virtual environment..."
uv venv

# Activate the virtual environment
Write-Host "Activating virtual environment..."
if (Test-Path "venv\Scripts\Activate.ps1") {
    & ".\venv\Scripts\Activate.ps1"
} elseif (Test-Path ".venv\Scripts\Activate.ps1") {
    & ".\.venv\Scripts\Activate.ps1"
} else {
    Write-Host "Error: Virtual environment activation script not found."
    exit 1
}

# Install dependencies using uv
Write-Host "Installing dependencies..."
uv pip install -e .

Write-Host "Installation complete! Run the server with: python server.py"