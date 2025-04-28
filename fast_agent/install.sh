#!/bin/bash
# Fast-Agent installation script using uv

# Check if uv is installed
if ! command -v uv &> /dev/null; then
    echo "uv not found. Installing uv..."
    
    # Check if pip is available
    if command -v pip &> /dev/null; then
        # Install uv using pip
        pip install uv
    else
        # Use curl to install if pip is not available
        curl -sSf https://astral.sh/uv/install.sh | sh
    fi
    
    # Add uv to PATH for this session if it was installed via curl
    if [ -f "$HOME/.cargo/bin/uv" ]; then
        export PATH="$HOME/.cargo/bin:$PATH"
    fi
    
    echo "uv installed successfully!"
fi

# Create a virtual environment using uv
echo "Creating a virtual environment..."
uv venv

# Activate the virtual environment
echo "Activating virtual environment..."
if [ -f "venv/bin/activate" ]; then
    source venv/bin/activate
elif [ -f ".venv/bin/activate" ]; then
    source .venv/bin/activate
else
    echo "Error: Virtual environment activation script not found."
    exit 1
fi

# Install dependencies using uv
echo "Installing dependencies..."
uv pip install -e .

echo "Installation complete! Run the server with: python server.py"