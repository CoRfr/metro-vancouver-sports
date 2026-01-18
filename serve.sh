#!/bin/bash
# Local development server for Metro Vancouver Drop-In

PORT=${1:-8080}

echo "Starting local server at http://localhost:$PORT"
echo "Press Ctrl+C to stop"
echo ""

# Use Python's built-in HTTP server
if command -v python3 &> /dev/null; then
    python3 -m http.server $PORT
elif command -v python &> /dev/null; then
    python -m SimpleHTTPServer $PORT
else
    echo "Error: Python not found. Install Python or use another HTTP server."
    exit 1
fi
