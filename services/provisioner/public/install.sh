#!/bin/bash
# CLAW WRAPPER Master Installer

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${CYAN}"
cat << "EOF"
  ____ _                  __        __                                
 / ___| | __ ___      __  \ \      / / __ __ _ _ __  _ __   ___ _ __  
| |   | |/ _` \ \ /\ / /   \ \ /\ / / '__/ _` | '_ \| '_ \ / _ \ '__| 
| |___| | (_| |\ V  V /     \ V  V /| | | (_| | |_) | |_) |  __/ |    
 \____|_|\__,_| \_/\_/       \_/\_/ |_|  \__,_| .__/| .__/ \___|_|    
                                              |_|   |_|               
EOF
echo -e "                   v1.0 Master Installer${NC}\n"

if [ -z "$1" ]; then
  echo -e "${RED}[ERROR] JWT TOKEN argument is required.${NC}"
  echo "Usage: $0 <JWT_TOKEN>"
  exit 1
fi

TOKEN="$1"
# TARGETS_URL should be defined by the environment hosting the install scripts
API_URL=${API_URL:-"http://192.168.0.18:3000"}
TARGETS_URL=${TARGETS_URL:-"${API_URL}/setup/targets"}

echo -e "${YELLOW}[INFO] Detecting Environment...${NC}"
TARGET=""

if [ -d "/data/data/com.termux" ]; then
  echo -e "${GREEN}[SUCCESS] Termux environment detected.${NC}"
  TARGET="termux.sh"
elif [ -f "/.dockerenv" ] || grep -q "docker" /proc/1/cgroup 2>/dev/null; then
  echo -e "${GREEN}[SUCCESS] Docker environment detected.${NC}"
  TARGET="docker.sh"
else
  echo -e "${GREEN}[SUCCESS] Standard Linux VPS environment detected.${NC}"
  TARGET="linux.sh"
fi

echo -e "${YELLOW}[INFO] Checking Productivity Stack Requirements...${NC}"
# Extract JWT to check for Google hooks
PAYLOAD_B64=$(echo -n "$TOKEN" | cut -d '.' -f2)
MOD=$((${#PAYLOAD_B64} % 4))
if [ $MOD -eq 2 ]; then PAYLOAD_B64="${PAYLOAD_B64}=="; elif [ $MOD -eq 3 ]; then PAYLOAD_B64="${PAYLOAD_B64}="; fi
PAYLOAD_JSON=$(echo -n "$PAYLOAD_B64" | tr '_-' '/+' | base64 -d 2>/dev/null)

if echo "$PAYLOAD_JSON" | grep -q 'install_hooks.*gws'; then
  echo -e "${YELLOW}[INFO] Google Workspace (gws) hooks detected in payload.${NC}"
  if ! command -v node &> /dev/null || ! command -v npm &> /dev/null; then
    echo -e "${RED}[ERROR] 'node' and 'npm' are required for gws, but were not found in PATH.${NC}"
    echo -e "${YELLOW}[INFO] Please install Node.js and npm before proceeding.${NC}"
    exit 1
  else
    echo -e "${GREEN}[SUCCESS] Node.js and npm are present for Productivity Stack.${NC}"
  fi

  if ! command -v gws &> /dev/null; then
    echo -e "${YELLOW}[INFO] Installing Google Workspace CLI (gws)...${NC}"
    npm install -g @googleworkspace/cli
  fi

  if ! gws auth list 2>&1 | grep -q "@"; then
    echo -e "${CYAN}Step 2/3: Connecting to Google Workspace...${NC}"
    
    gws auth login 2>&1 | while IFS= read -r line; do
      echo "$line"
      if [[ "$line" == *"http"* ]]; then
        URL=$(echo "$line" | grep -Eo 'https?://[^ >"]+')
        if [ -n "$URL" ] && [ -d "/data/data/com.termux" ] && command -v termux-open &> /dev/null; then
          echo -e "${YELLOW}[INFO] Launching browser for authentication...${NC}"
          termux-open "$URL"
        fi
      fi
    done
  fi
else
  echo -e "${GREEN}[SUCCESS] No Google Productivity Stack dependencies required.${NC}"
fi

echo -e "${YELLOW}[INFO] Handing off to target script: ${TARGET}${NC}"
TMP_SCRIPT=$(mktemp)
curl -s -f -o "$TMP_SCRIPT" "${TARGETS_URL}/${TARGET}"

if [ $? -ne 0 ]; then
  echo -e "${RED}[ERROR] Failed to download target script from: ${TARGETS_URL}/${TARGET}${NC}"
  echo -e "${YELLOW}[INFO] Please ensure TARGETS_URL is set correctly.${NC}"
  rm -f "$TMP_SCRIPT"
  exit 1
fi

chmod +x "$TMP_SCRIPT"
echo -e "${GREEN}[SUCCESS] Executing target script...${NC}"
bash "$TMP_SCRIPT" "$TOKEN"
RES=$?

rm -f "$TMP_SCRIPT"
if [ $RES -eq 0 ]; then
  echo -e "${YELLOW}[INFO] Setting up 'claw' command alias...${NC}"
  mkdir -p ~/.clawops
  
  TMP_MANAGER=$(mktemp)
  curl -s -f -o "$TMP_MANAGER" "${TARGETS_URL}/../service-manager.sh"
  if [ $? -eq 0 ]; then
    mv "$TMP_MANAGER" ~/.clawops/service-manager.sh
    chmod +x ~/.clawops/service-manager.sh
    
    ALIAS_CMD="alias claw='bash ~/.clawops/service-manager.sh'"
    
    if [ -f ~/.bashrc ] && ! grep -q "alias claw=" ~/.bashrc; then
      echo "$ALIAS_CMD" >> ~/.bashrc
    fi
    
    if [ -f ~/.zshrc ] && ! grep -q "alias claw=" ~/.zshrc; then
      echo "$ALIAS_CMD" >> ~/.zshrc
    fi
    
    echo -e "${GREEN}[SUCCESS] Added 'claw' alias. Run 'source ~/.bashrc' or restart your terminal to use it.${NC}"
  else
    echo -e "${YELLOW}[WARN] Could not download service-manager.sh. Alias not set.${NC}"
    rm -f "$TMP_MANAGER"
  fi

  echo -e "\n${GREEN}[SUCCESS] CLAW WRAPPER Installation Complete!${NC}"
else
  echo -e "\n${RED}[ERROR] Installation failed during target execution.${NC}"
fi
exit $RES
