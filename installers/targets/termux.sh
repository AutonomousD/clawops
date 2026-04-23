#!/bin/bash
# Termux installer for ZeroClaw wrappers

echo "Starting ZeroClaw Setup via Termux..."

if [ -z "$1" ]; then
  echo "Error: TOKEN argument is required."
  echo "Usage: $0 <JWT_TOKEN>"
  exit 1
fi

TOKEN="$1"

# Install dependencies if missing
if ! command -v jq &> /dev/null || ! command -v curl &> /dev/null; then
  echo "Installing required packages (jq, curl)..."
  pkg install jq curl -y
fi

# Decode JWT Payload (second part of the token)
PAYLOAD_B64=$(echo -n "$TOKEN" | cut -d '.' -f2)

# Add base64 padding if necessary
MOD=$((${#PAYLOAD_B64} % 4))
if [ $MOD -eq 2 ]; then
  PAYLOAD_B64="${PAYLOAD_B64}=="
elif [ $MOD -eq 3 ]; then
  PAYLOAD_B64="${PAYLOAD_B64}="
fi

# Convert url-safe base64 to standard base64 and decode
PAYLOAD_JSON=$(echo -n "$PAYLOAD_B64" | tr '_-' '/+' | base64 -d 2>/dev/null)

if [ -z "$PAYLOAD_JSON" ]; then
  echo "Error: Failed to decode JWT payload."
  exit 1
fi

# Extract config_toml
CONFIG_TOML=$(echo -n "$PAYLOAD_JSON" | jq -r '.config_toml')

if [ "$CONFIG_TOML" == "null" ] || [ -z "$CONFIG_TOML" ]; then
  echo "Error: Could not extract config_toml from JWT."
  exit 1
fi

# Create directory and write config
mkdir -p ~/.zeroclaw
echo "$CONFIG_TOML" > ~/.zeroclaw/config.toml
echo "Wrote configuration to ~/.zeroclaw/config.toml"

# Extract and run install hooks
HOOKS_COUNT=$(echo -n "$PAYLOAD_JSON" | jq '.install_hooks | length')

if [ "$HOOKS_COUNT" != "null" ] && [ "$HOOKS_COUNT" -gt 0 ]; then
  echo "Running $HOOKS_COUNT install hook(s)..."
  for (( i=0; i<$HOOKS_COUNT; i++ )); do
    HOOK=$(echo -n "$PAYLOAD_JSON" | jq -r ".install_hooks[$i]")
    echo "Executing hook: $HOOK"
    eval "$HOOK"
  done
else
  echo "No install hooks found."
fi

# Start ZeroClaw daemon
if [ -f ~/.zeroclaw/service-manager.sh ]; then
  echo "Starting ZeroClaw daemon..."
  bash ~/.zeroclaw/service-manager.sh start
elif command -v claw &> /dev/null; then
  echo "Starting ZeroClaw via alias..."
  claw start
fi

# Wait for daemon to initialize
sleep 3

# First Run Trigger
PACKAGE_SLUG=$(echo -n "$PAYLOAD_JSON" | jq -r '.package_slug // "your automated workflow"')

echo "Sending First Run notification to your channel..."
if command -v zeroclaw &> /dev/null; then
  zeroclaw agent -m "System Online. I have created your Google Drive folders and I am now monitoring $PACKAGE_SLUG. Check your Google Sheet here: your Google Drive Recent Tab."
else
  echo "zeroclaw command not found in PATH, skipping notification."
fi

echo "ZeroClaw Termux setup complete."
