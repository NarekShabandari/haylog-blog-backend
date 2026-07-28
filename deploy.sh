    #!/bin/bash
    set -e

    echo "🚀 Starting deployment..."

    cd /root/haylog/backend

    echo "📦 Pulling latest code..."
    git pull origin main

    echo "🐳 Rebuilding and restarting containers..."
    docker compose up --build -d

    echo "🧹 Cleaning up unused docker images..."
    docker image prune -f

    echo "✅ Deployment complete!"
    docker compose ps