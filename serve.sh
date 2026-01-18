#!/bin/bash
# Local development server for Metro Vancouver Drop-In

cd "$(dirname "$0")"

# Check if npm dependencies are installed
if [ ! -d "frontend/node_modules" ]; then
    echo "Installing dependencies..."
    cd frontend && npm install && cd ..
fi

echo "Starting Vite dev server..."
echo "Access the app at http://localhost:3000"
echo "Press Ctrl+C to stop"
echo ""

cd frontend && npm run dev
