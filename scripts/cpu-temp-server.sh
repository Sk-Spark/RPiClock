#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
exec /usr/bin/node "$SCRIPT_DIR/cpu-temp-server.js" "${1:-3001}"