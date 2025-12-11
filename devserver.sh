#!/bin/sh

export PATH="$HOME/.local/bin:$PATH"

if ! grep -q "$PATH" /home/user/.bashrc; then
  echo 'export PATH="$HOME/.local/bin:$PATH"' >> /home/user/.bashrc
fi

echo "Start the firebase studio server"

echo "WebHost is $WEB_HOST"

export VITE_API_URL="https://8000-$WEB_HOST/api"
export VITE_WS_URL="ws://8000-$WEB_HOST/ws"

curl $VITE_API_URL

docker compose up --build --force-recreate