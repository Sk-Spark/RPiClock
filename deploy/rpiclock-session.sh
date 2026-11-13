#!/bin/bash
set -Eeuo pipefail

trap 'printf "Clock graphical session failed at line %s.\n" "$LINENO" >&2' ERR

systemctl --user daemon-reload
systemctl --user import-environment DISPLAY XAUTHORITY
systemctl --user start rpiclock-kiosk.service
trap 'systemctl --user stop rpiclock-kiosk.service' EXIT

/usr/bin/openbox-session
