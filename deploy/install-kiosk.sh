#!/bin/bash
set -Eeuo pipefail

trap 'printf "Clock installation failed at line %s. Review the terminal output.\n" "$LINENO" >&2' ERR

if (( EUID != 0 )); then
    exec sudo /bin/bash "$0"
fi

source_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
if [[ ! -f /home/spark/RPiClock/app/dist/index.html ]]; then
    printf 'Run npm ci and npm run build in the application folder before installing.\n' >&2
    exit 1
fi

apt-get install --yes --no-install-recommends scrot x11-utils fonts-noto-color-emoji

install -m 644 "$source_dir/rpiclock-web.service" /etc/systemd/system/rpiclock-web.service
install -m 644 "$source_dir/rpiclock-cpu.service" /etc/systemd/system/rpiclock-cpu.service

install -d -m 755 -o spark -g spark \
    /home/spark/.config /home/spark/.config/systemd /home/spark/.config/systemd/user
install -m 644 -o spark -g spark "$source_dir/rpiclock-kiosk.service" \
    /home/spark/.config/systemd/user/rpiclock-kiosk.service

install -m 755 "$source_dir/rpiclock-session.sh" /usr/local/bin/rpiclock-session
install -m 644 "$source_dir/rpiclock.desktop" /usr/share/xsessions/rpiclock.desktop
install -d -m 755 /etc/lightdm/lightdm.conf.d
install -m 644 "$source_dir/90-rpiclock.conf" /etc/lightdm/lightdm.conf.d/90-rpiclock.conf

systemctl daemon-reload
systemctl enable rpiclock-web.service rpiclock-cpu.service
systemctl restart rpiclock-web.service rpiclock-cpu.service
systemctl enable lightdm.service
systemctl set-default graphical.target
systemctl start lightdm.service

runtime="/run/user/$(id -u spark)"
runuser -u spark -- env XDG_RUNTIME_DIR="$runtime" \
    DBUS_SESSION_BUS_ADDRESS="unix:path=$runtime/bus" \
    systemctl --user daemon-reload

printf '\nClock services installed and display session started. No reboot requested.\n'
