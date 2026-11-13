#!/bin/bash
set -Eeuo pipefail

trap 'printf "Pi update failed at line %s. Review the terminal output before retrying.\n" "$LINENO" >&2' ERR

if (( EUID != 0 )); then
    exec sudo /bin/bash "$0"
fi

apt-get update
apt-get --yes --with-new-pkgs upgrade
apt-get install --yes --no-install-recommends \
    git nodejs npm chromium lightdm openbox xserver-xorg \
    x11-xserver-utils dbus-x11 xfonts-base unclutter

dpkg --audit
printf '\nPackage upgrade and clock prerequisites installed. No reboot was requested.\n'
if [[ -f /run/reboot-required ]]; then
    printf 'The operating system reports that a reboot is required.\n'
fi
