#!/bin/bash
# ClawOps Doctor - System Health Check & Self-Healing

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}==========================================${NC}"
echo -e "${CYAN}        ClawOps Doctor - Health Check    ${NC}"
echo -e "${CYAN}==========================================${NC}\n"

ERRORS=0
REPAIRS_AVAILABLE=()

SEND_TELEMETRY=0
if [ "$1" == "--telemetry" ]; then
  SEND_TELEMETRY=1
fi
TELEMETRY_URL=${TELEMETRY_URL:-"http://localhost:3000/api/telemetry"}

ENVIRONMENT="Linux VPS"
if [ -d "/data/data/com.termux" ]; then
  ENVIRONMENT="Termux"
fi
ZEROCLAW_STATUS="Stopped"
GOOGLE_AUTH="Unknown"
OPENROUTER_STATUS="Unknown"
BATTERY_PERCENTAGE="N/A"

# 1. ClawOps Pulse
echo -e "${YELLOW}Checking ClawOps Pulse...${NC}"
if pgrep -x "clawops" > /dev/null; then
  ZEROCLAW_STATUS="Running"
  echo -e "${GREEN}✓ ClawOps process is running.${NC}"
  if command -v clawops &> /dev/null; then
    HEARTBEAT=$(clawops agent -m "status" 2>/dev/null)
    echo -e "${GREEN}✓ Heartbeat: ${HEARTBEAT:-"OK"}${NC}"
  fi
else
  echo -e "${RED}✗ ClawOps daemon is NOT running.${NC}"
  ERRORS=$((ERRORS+1))
  REPAIRS_AVAILABLE+=("start_clawops")
fi

# 2. Alias Check
echo -e "\n${YELLOW}Checking CLI Aliases...${NC}"
ALIAS_MISSING=0
if [ -f ~/.bashrc ] && ! grep -q "alias claw=" ~/.bashrc; then
  ALIAS_MISSING=1
fi
if [ -f ~/.zshrc ] && ! grep -q "alias claw=" ~/.zshrc; then
  ALIAS_MISSING=1
fi

if [ $ALIAS_MISSING -eq 1 ]; then
  echo -e "${RED}✗ 'claw' alias is missing from shell profile(s).${NC}"
  ERRORS=$((ERRORS+1))
  REPAIRS_AVAILABLE+=("add_alias")
else
  echo -e "${GREEN}✓ 'claw' alias is present.${NC}"
fi

# 3. Google Sync Check
echo -e "\n${YELLOW}Checking Google Workspace Connectivity...${NC}"
if command -v gws &> /dev/null; then
  if gws auth list 2>&1 | grep -q "@"; then
    if gws drive ls --limit 1 &> /dev/null; then
      GOOGLE_AUTH="Authenticated"
      echo -e "${GREEN}✓ Google Workspace is authenticated and accessible.${NC}"
    else
      GOOGLE_AUTH="Expired"
      echo -e "${RED}✗ Google Workspace token may be expired (gws drive ls failed).${NC}"
      ERRORS=$((ERRORS+1))
    fi
  else
    GOOGLE_AUTH="Not Authenticated"
    echo -e "${RED}✗ Not authenticated with Google Workspace.${NC}"
    ERRORS=$((ERRORS+1))
  fi
else
  GOOGLE_AUTH="Not Installed"
  echo -e "${RED}✗ Google Workspace CLI (gws) is not installed.${NC}"
  ERRORS=$((ERRORS+1))
fi

# 4. Provider Ping (OpenRouter)
echo -e "\n${YELLOW}Checking AI Provider (OpenRouter) API...${NC}"
API_KEY=""
if [ -f ~/.clawops/config.toml ]; then
  API_KEY=$(grep "openrouter_key" ~/.clawops/config.toml | cut -d '=' -f2 | tr -d ' "')
fi
if [ -z "$API_KEY" ]; then
  API_KEY=$OPENROUTER_KEY
fi

if [ -n "$API_KEY" ]; then
  HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://openrouter.ai/api/v1/auth/key -H "Authorization: Bearer $API_KEY")
  if [ "$HTTP_STATUS" -eq 200 ]; then
    OPENROUTER_STATUS="Valid"
    echo -e "${GREEN}✓ OpenRouter API key is valid.${NC}"
  else
    OPENROUTER_STATUS="Invalid ($HTTP_STATUS)"
    echo -e "${RED}✗ OpenRouter API key check failed (HTTP Status: $HTTP_STATUS).${NC}"
    ERRORS=$((ERRORS+1))
  fi
else
  OPENROUTER_STATUS="Missing"
  echo -e "${YELLOW}⚠ No OpenRouter API key found in ~/.clawops/config.toml or OPENROUTER_KEY env var.${NC}"
fi

# 5. Nothing Phone Health (Termux Battery/Power)
echo -e "\n${YELLOW}Checking Device Health (Battery & Power)...${NC}"
if command -v termux-battery-status &> /dev/null; then
  BATTERY_INFO=$(termux-battery-status 2>/dev/null)
  PERCENTAGE=$(echo "$BATTERY_INFO" | grep -o '"percentage": [0-9]*' | awk '{print $2}')
  STATUS=$(echo "$BATTERY_INFO" | grep -o '"status": "[^"]*"' | awk -F'"' '{print $4}')
  
  if [ -n "$PERCENTAGE" ]; then
    BATTERY_PERCENTAGE="$PERCENTAGE"
    if [ "$PERCENTAGE" -le 15 ] && [ "$STATUS" != "CHARGING" ]; then
      echo -e "${RED}✗ Battery critically low (${PERCENTAGE}%). Power saving may kill background tasks!${NC}"
      ERRORS=$((ERRORS+1))
    else
      echo -e "${GREEN}✓ Battery healthy (${PERCENTAGE}%, $STATUS).${NC}"
    fi
  else
    echo -e "${YELLOW}⚠ Could not parse battery info.${NC}"
  fi
else
  echo -e "${YELLOW}⚠ termux-battery-status not found. Install termux-api to enable battery checks.${NC}"
fi

# Summary & Self-Healing
echo -e "\n${CYAN}==========================================${NC}"

if [ "$SEND_TELEMETRY" -eq 1 ]; then
  echo -e "${YELLOW}[INFO] Sending telemetry to $TELEMETRY_URL...${NC}"
  curl -s -X POST "$TELEMETRY_URL" \
    -H "Content-Type: application/json" \
    -d "{\"environment\": \"$ENVIRONMENT\", \"clawops_status\": \"$ZEROCLAW_STATUS\", \"google_auth\": \"$GOOGLE_AUTH\", \"openrouter_status\": \"$OPENROUTER_STATUS\", \"battery_percentage\": \"$BATTERY_PERCENTAGE\", \"error_count\": $ERRORS}" > /dev/null
fi

if [ $ERRORS -eq 0 ]; then
  echo -e "${GREEN}       [ Clean Bill of Health ]           ${NC}"
  echo -e "${CYAN}==========================================${NC}"
  echo -e "All systems operational!"
  exit 0
else
  echo -e "${RED}           [ Repair Needed ]              ${NC}"
  echo -e "${CYAN}==========================================${NC}"
  echo -e "${RED}Detected $ERRORS issue(s) that need attention.${NC}"
  
  if [ ${#REPAIRS_AVAILABLE[@]} -gt 0 ]; then
    echo -e "\n${YELLOW}Self-healing repairs are available for some issues.${NC}"
    read -p "Should I attempt a repair? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
      for repair in "${REPAIRS_AVAILABLE[@]}"; then
        if [ "$repair" == "start_clawops" ]; then
          echo -e "${CYAN}[Repair] Starting ClawOps daemon...${NC}"
          if command -v claw &> /dev/null; then
            claw start
          elif [ -f ~/.clawops/service-manager.sh ]; then
            bash ~/.clawops/service-manager.sh start
          else
            echo -e "${RED}Failed: 'claw' command or service-manager.sh not found.${NC}"
          fi
        elif [ "$repair" == "add_alias" ]; then
          echo -e "${CYAN}[Repair] Adding 'claw' alias to shell profiles...${NC}"
          ALIAS_CMD="alias claw='bash ~/.clawops/service-manager.sh'"
          if [ -f ~/.bashrc ] && ! grep -q "alias claw=" ~/.bashrc; then
            echo "$ALIAS_CMD" >> ~/.bashrc
            echo -e "${GREEN}Added to .bashrc${NC}"
          fi
          if [ -f ~/.zshrc ] && ! grep -q "alias claw=" ~/.zshrc; then
            echo "$ALIAS_CMD" >> ~/.zshrc
            echo -e "${GREEN}Added to .zshrc${NC}"
          fi
        fi
      done
      echo -e "${GREEN}Repairs completed. Please run doctor again to verify.${NC}"
    else
      echo -e "Skipping repairs."
    fi
  fi
  exit 1
fi
