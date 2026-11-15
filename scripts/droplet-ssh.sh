#!/usr/bin/env bash
# ==============================================================================
# VocNix DigitalOcean Droplet SSH & Server Explorer
# ==============================================================================
# Connects to the VocNix DigitalOcean Droplet, monitors status, and provides
# automated diagnostics and exploration utilities.
# ==============================================================================

set -e

# Resolve paths
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
DO_KEY_FILE="$PROJECT_ROOT/infra/.digitalocean-key"

# Defaults
DEFAULT_IP="144.126.252.117"
ALT_IP="165.22.216.149"
DROPLET_NAME="vocnix-livekit"
DROPLET_ID="605554871"
SSH_USER="${SSH_USER:-root}"
SSH_KEY="${SSH_KEY:-$HOME/.ssh/id_rsa}"
TARGET_IP="${TARGET_IP:-$DEFAULT_IP}"

# Colors
C_RESET="\033[0m"
C_BOLD="\033[1m"
C_CYAN="\033[36m"
C_GREEN="\033[32m"
C_YELLOW="\033[33m"
C_RED="\033[31m"
C_BLUE="\033[34m"
C_DIM="\033[2m"

# Helper print functions
print_header() {
  echo -e "\n${C_BOLD}${C_CYAN}=== $1 ===${C_RESET}"
}

print_success() {
  echo -e "${C_GREEN}✔ $1${C_RESET}"
}

print_warning() {
  echo -e "${C_YELLOW}⚠ $1${C_RESET}"
}

print_error() {
  echo -e "${C_RED}✖ $1${C_RESET}"
}

print_info() {
  echo -e "${C_BLUE}ℹ $1${C_RESET}"
}

# Read DigitalOcean API Token if available
get_do_token() {
  if [[ -f "$DO_KEY_FILE" ]]; then
    tr -d '[:space:]' < "$DO_KEY_FILE"
  elif [[ -n "$DIGITALOCEAN_TOKEN" ]]; then
    echo "$DIGITALOCEAN_TOKEN"
  fi
}

# Query DigitalOcean API for droplet status and IP
refresh_droplet_info() {
  local token
  token="$(get_do_token)"
  if [[ -z "$token" ]]; then
    return 0
  fi

  local res
  res="$(curl -s -X GET -H "Authorization: Bearer $token" "https://api.digitalocean.com/v2/droplets/$DROPLET_ID" 2>/dev/null || true)"
  if echo "$res" | grep -q '"droplet"'; then
    DO_STATUS=$(echo "$res" | jq -r '.droplet.status // "unknown"')
    DROPLET_NAME=$(echo "$res" | jq -r '.droplet.name // "vocnix-livekit"')
    local api_ip
    api_ip=$(echo "$res" | jq -r '.droplet.networks.v4[] | select(.type=="public") | .ip_address' 2>/dev/null | head -1)
    if [[ -n "$api_ip" && "$api_ip" != "null" ]]; then
      TARGET_IP="$api_ip"
    fi
  else
    DO_STATUS="unknown"
  fi
}

# Power on the droplet using DigitalOcean API
power_on_droplet() {
  local token
  token="$(get_do_token)"
  if [[ -z "$token" ]]; then
    print_error "DigitalOcean API token not found in infra/.digitalocean-key."
    return 1
  fi

  print_info "Sending power-on request to DigitalOcean for Droplet $DROPLET_NAME ($DROPLET_ID)..."
  local res
  res="$(curl -s -X POST \
    -H "Authorization: Bearer $token" \
    -H "Content-Type: application/json" \
    -d '{"type":"power_on"}' \
    "https://api.digitalocean.com/v2/droplets/$DROPLET_ID/actions")"

  if echo "$res" | grep -q '"action"'; then
    print_success "Power-on action initiated successfully."
    print_info "Waiting for droplet to become active and reachable..."
    local attempts=0
    while [[ $attempts -lt 30 ]]; do
      sleep 3
      refresh_droplet_info
      if [[ "$DO_STATUS" == "active" ]]; then
        print_success "Droplet is active!"
        break
      fi
      echo -ne "."
      attempts=$((attempts + 1))
    done
    echo ""
    wait_for_ssh
  else
    print_error "Failed to power on droplet: $res"
    return 1
  fi
}

# Wait until SSH port (22) is open and accepting connections
wait_for_ssh() {
  print_info "Checking SSH connectivity on $TARGET_IP:22..."
  local attempts=0
  while [[ $attempts -lt 20 ]]; do
    if nc -z -G 2 "$TARGET_IP" 22 2>/dev/null || nc -z -w 2 "$TARGET_IP" 22 2>/dev/null; then
      print_success "SSH port 22 is open on $TARGET_IP!"
      return 0
    fi
    echo -ne "."
    sleep 2
    attempts=$((attempts + 1))
  done
  echo ""
  print_warning "SSH port not yet reachable. It may take another few moments to initialize."
}

# Check SSH connectivity
ensure_droplet_ready() {
  refresh_droplet_info
  if [[ "$DO_STATUS" == "off" ]]; then
    print_warning "Droplet '$DROPLET_NAME' is currently POWERED OFF."
    read -p "Would you like to power it on now via DigitalOcean API? (y/N): " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
      power_on_droplet
    else
      print_error "Cannot connect while droplet is off. Exiting."
      exit 1
    fi
  fi
}

# Interactive SSH Shell
connect_ssh() {
  ensure_droplet_ready
  print_header "Connecting to $DROPLET_NAME ($TARGET_IP)"
  echo -e "${C_DIM}User: $SSH_USER | Key: $SSH_KEY${C_RESET}"
  echo -e "${C_DIM}Type 'exit' to return to your local machine.${C_RESET}\n"
  
  exec ssh -i "$SSH_KEY" \
    -o StrictHostKeyChecking=accept-new \
    -o ConnectTimeout=10 \
    "$SSH_USER@$TARGET_IP"
}

# Server Exploration & Automated Diagnostics
explore_server() {
  ensure_droplet_ready
  print_header "Exploring Server: $DROPLET_NAME ($TARGET_IP)"
  echo -e "${C_DIM}Running automated exploration and diagnostic audit over SSH...${C_RESET}\n"

  ssh -i "$SSH_KEY" \
    -o StrictHostKeyChecking=accept-new \
    -o ConnectTimeout=10 \
    "$SSH_USER@$TARGET_IP" "bash -s" << 'EOF'
    set -e
    BOLD='\033[1m'
    CYAN='\033[36m'
    GREEN='\033[32m'
    YELLOW='\033[33m'
    RESET='\033[0m'

    echo -e "${BOLD}${CYAN}1. SYSTEM & KERNEL${RESET}"
    echo "Hostname: $(hostname)"
    echo "OS:       $(lsb_release -ds 2>/dev/null || cat /etc/os-release | grep PRETTY_NAME | cut -d= -f2 | tr -d '\"')"
    echo "Kernel:   $(uname -r)"
    echo "Uptime:  $(uptime -p 2>/dev/null || uptime)"
    echo ""

    echo -e "${BOLD}${CYAN}2. HARDWARE & RESOURCE USAGE${RESET}"
    echo "CPU Core count: $(nproc)"
    echo "Memory Usage:"
    free -h 2>/dev/null || free -m
    echo ""
    echo "Disk Usage:"
    df -h -x tmpfs -x devtmpfs -x squashfs
    echo ""

    echo -e "${BOLD}${CYAN}3. NETWORK & LISTENING PORTS${RESET}"
    if command -v ss >/dev/null 2>&1; then
      ss -tuln | grep -E '(:22|:80|:443|:7880|:7881|:7882|LISTEN|UNCONN)' | head -20
    elif command -v netstat >/dev/null 2>&1; then
      netstat -tuln | grep -E '(:22|:80|:443|:7880|:7881|:7882|LISTEN)' | head -20
    else
      echo "No ss/netstat command found."
    fi
    echo ""

    echo -e "${BOLD}${CYAN}4. LIVEKIT AUDIO ENGINE SERVICE${RESET}"
    if systemctl is-active --quiet livekit 2>/dev/null; then
      echo -e "${GREEN}● livekit.service is ACTIVE${RESET}"
      systemctl status livekit --no-pager -l | head -15
    elif systemctl is-enabled livekit >/dev/null 2>&1; then
      echo -e "${YELLOW}● livekit.service is INSTALLED but not active${RESET}"
      systemctl status livekit --no-pager -l | head -10
    else
      echo "livekit.service not registered in systemd. Checking docker containers..."
    fi
    echo ""

    echo -e "${BOLD}${CYAN}5. DOCKER CONTAINERS${RESET}"
    if command -v docker >/dev/null 2>&1; then
      docker ps -a --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}\t{{.Image}}"
    else
      echo "Docker is not installed."
    fi
    echo ""

    echo -e "${BOLD}${CYAN}6. TOP PROCESSES BY MEMORY${RESET}"
    ps aux --sort=-%mem | head -8 | awk '{print $1, $2, $3"%", $4"%", $11}'
    echo ""

    echo -e "${BOLD}${CYAN}7. RECENT LIVEKIT LOGS${RESET}"
    if systemctl is-active --quiet livekit 2>/dev/null; then
      journalctl -u livekit -n 15 --no-pager
    elif command -v docker >/dev/null 2>&1 && docker ps | grep -q livekit; then
      docker logs --tail 15 $(docker ps -q -f name=livekit | head -1)
    else
      echo "No active LiveKit service or container logs found."
    fi
EOF

  print_success "Exploration report completed."
}

# LiveKit Logs Tail
tail_logs() {
  ensure_droplet_ready
  print_header "Tailing LiveKit Logs on $DROPLET_NAME ($TARGET_IP)"
  echo -e "${C_DIM}Press Ctrl+C to stop.${C_RESET}\n"

  ssh -i "$SSH_KEY" \
    -o StrictHostKeyChecking=accept-new \
    "$SSH_USER@$TARGET_IP" \
    "journalctl -u livekit -f --no-pager 2>/dev/null || (command -v docker >/dev/null && docker logs -f \$(docker ps -q -f name=livekit | head -1))"
}

# Show CLI Usage
show_help() {
  echo -e "${C_BOLD}Usage:${C_RESET} ./scripts/droplet-ssh.sh [OPTIONS]"
  echo ""
  echo "DigitalOcean Droplet SSH and Exploration Utility for VocNix."
  echo ""
  echo -e "${C_BOLD}Options:${C_RESET}"
  echo "  -c, --connect      Open an interactive SSH session directly"
  echo "  -e, --explore      Run automated server exploration audit"
  echo "  -l, --logs         Tail live LiveKit service logs"
  echo "  -s, --status       Check DigitalOcean Droplet status"
  echo "      --power-on     Boot the droplet via DigitalOcean API"
  echo "      --ip <address> Override the target IP (default: $TARGET_IP)"
  echo "  -h, --help         Show this help message"
  echo ""
  echo -e "${C_BOLD}Examples:${C_RESET}"
  echo "  ./scripts/droplet-ssh.sh              # Open interactive menu"
  echo "  ./scripts/droplet-ssh.sh --connect    # Connect directly to SSH"
  echo "  ./scripts/droplet-ssh.sh --explore    # Run diagnostic report"
}

# Interactive Menu
show_menu() {
  refresh_droplet_info

  while true; do
    echo -e "\n${C_BOLD}${C_CYAN}======================================================${C_RESET}"
    echo -e "${C_BOLD}   VocNix DigitalOcean Droplet Manager & Explorer     ${C_RESET}"
    echo -e "${C_BOLD}${C_CYAN}======================================================${C_RESET}"
    echo -e " Droplet Name : ${C_BOLD}$DROPLET_NAME${C_RESET}"
    echo -e " Droplet ID   : $DROPLET_ID"
    echo -e " Target IP    : ${C_GREEN}$TARGET_IP${C_RESET}"
    if [[ "$DO_STATUS" == "active" ]]; then
      echo -e " Power Status : ${C_GREEN}● ACTIVE${C_RESET}"
    elif [[ "$DO_STATUS" == "off" ]]; then
      echo -e " Power Status : ${C_RED}○ POWERED OFF${C_RESET}"
    else
      echo -e " Power Status : ${C_YELLOW}? $DO_STATUS${C_RESET}"
    fi
    echo -e " SSH Key      : $SSH_KEY"
    echo -e "${C_DIM}------------------------------------------------------${C_RESET}"
    echo -e "  ${C_BOLD}1)${C_RESET} Interactive SSH Shell (Login)"
    echo -e "  ${C_BOLD}2)${C_RESET} Explore & Audit Server (System, Ports, Docker, Resources)"
    echo -e "  ${C_BOLD}3)${C_RESET} LiveKit Logs (Real-time tail)"
    echo -e "  ${C_BOLD}4)${C_RESET} Power Management (Power ON droplet)"
    echo -e "  ${C_BOLD}5)${C_RESET} Refresh Droplet Status"
    echo -e "  ${C_BOLD}q)${C_RESET} Quit"
    echo -e "${C_DIM}------------------------------------------------------${C_RESET}"
    read -p "Select an option [1-5, q]: " choice

    case "$choice" in
      1)
        connect_ssh
        ;;
      2)
        explore_server
        ;;
      3)
        tail_logs
        ;;
      4)
        power_on_droplet
        ;;
      5)
        print_info "Refreshing status from DigitalOcean API..."
        refresh_droplet_info
        ;;
      q|Q)
        echo "Exiting."
        exit 0
        ;;
      *)
        print_error "Invalid selection. Please enter 1-5 or q."
        ;;
    esac
  done
}

# CLI Argument Parsing
while [[ $# -gt 0 ]]; do
  case "$1" in
    -c|--connect)
      connect_ssh
      exit 0
      ;;
    -e|--explore)
      explore_server
      exit 0
      ;;
    -l|--logs)
      tail_logs
      exit 0
      ;;
    -s|--status)
      refresh_droplet_info
      echo "Droplet: $DROPLET_NAME ($DROPLET_ID)"
      echo "Status:  $DO_STATUS"
      echo "IP:      $TARGET_IP"
      exit 0
      ;;
    --power-on)
      power_on_droplet
      exit 0
      ;;
    --ip)
      shift
      TARGET_IP="$1"
      shift
      ;;
    -h|--help)
      show_help
      exit 0
      ;;
    *)
      print_error "Unknown argument: $1"
      show_help
      exit 1
      ;;
  esac
done

# If no arguments provided, launch interactive menu
show_menu
