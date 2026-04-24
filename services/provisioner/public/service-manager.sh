#!/bin/bash
# ClawOps Service Manager

COMMAND=$1

if [ -z "$COMMAND" ]; then
  echo "Usage: claw {start|stop|restart|logs}"
  exit 1
fi

# Detect service manager
SVC_MANAGER=""
if [ -d "/data/data/com.termux" ]; then
  SVC_MANAGER="termux"
elif command -v systemctl &> /dev/null && systemctl list-units --type=service &> /dev/null; then
  SVC_MANAGER="systemd"
else
  echo "Error: Neither termux-services nor systemd detected."
  exit 1
fi

# Set Termux prefix if not set
if [ -z "$PREFIX" ] && [ "$SVC_MANAGER" == "termux" ]; then
  PREFIX="/data/data/com.termux/files/usr"
fi

case "$COMMAND" in
  start)
    if [ "$SVC_MANAGER" == "termux" ]; then
      if command -v termux-wake-lock &> /dev/null; then
        termux-wake-lock
        echo "Termux wake-lock acquired."
      fi
      sv up clawops
      echo "ClawOps service started."
    elif [ "$SVC_MANAGER" == "systemd" ]; then
      sudo systemctl start clawops
      echo "ClawOps service started."
    fi
    ;;
  stop)
    if [ "$SVC_MANAGER" == "termux" ]; then
      sv down clawops
      echo "ClawOps service stopped."
      if command -v termux-wake-unlock &> /dev/null; then
        termux-wake-unlock
        echo "Termux wake-lock released."
      fi
    elif [ "$SVC_MANAGER" == "systemd" ]; then
      sudo systemctl stop clawops
      echo "ClawOps service stopped."
    fi
    ;;
  restart)
    if [ "$SVC_MANAGER" == "termux" ]; then
      sv restart clawops
      echo "ClawOps service restarted."
    elif [ "$SVC_MANAGER" == "systemd" ]; then
      sudo systemctl restart clawops
      echo "ClawOps service restarted."
    fi
    ;;
  logs)
    if [ "$SVC_MANAGER" == "termux" ]; then
      LOG_FILE="$PREFIX/var/log/sv/clawops/current"
      if [ -f "$LOG_FILE" ]; then
        tail -f "$LOG_FILE"
      else
        echo "Log file not found at $LOG_FILE"
      fi
    elif [ "$SVC_MANAGER" == "systemd" ]; then
      journalctl -u clawops -f
    fi
    ;;
  *)
    echo "Usage: claw {start|stop|restart|logs}"
    exit 1
    ;;
esac
