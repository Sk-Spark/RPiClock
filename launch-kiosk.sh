#!/bin/bash
set -Eeuo pipefail

trap 'printf "Clock kiosk failed at line %s.\n" "$LINENO" >&2' ERR

: "${DISPLAY:?A graphical session is required to launch the kiosk}"

deadline=$((SECONDS + 60))
for url in http://127.0.0.1:5173/ http://127.0.0.1:3001/; do
    printf 'Waiting for %s\n' "$url"
    until curl --fail --silent --show-error --connect-timeout 1 --max-time 2 "$url" >/dev/null; do
        if (( SECONDS >= deadline )); then
            printf 'Timed out waiting for %s. Check the rpiclock services.\n' "$url" >&2
            exit 1
        fi
        sleep 1
    done
done

xset s off
xset s noblank
if ! xset -dpms; then
    printf 'Warning: the X server does not support disabling DPMS.\n' >&2
fi

# systemd owns the cursor helper and browser in the same service cgroup.
unclutter -idle 0.1 -root &
exec /usr/bin/chromium \
    --ozone-platform=x11 \
    --user-data-dir="$HOME/.local/share/rpiclock/chromium" \
    --kiosk \
    --no-first-run \
    --no-default-browser-check \
    --disable-session-crashed-bubble \
    --force-device-scale-factor=1 \
    --window-size=800,480 \
    --window-position=0,0 \
    http://127.0.0.1:5173/