#!/bin/sh
# Runs e2e on a Node it supports (22.22.3+ or 24.8+): the nvm Node 24 when the current one is older.
#   ./run-e2e.sh                       everything
#   ./run-e2e.sh --tag phase0          one phase
. "$HOME/.nvm/nvm.sh" >/dev/null 2>&1
case "$(node -v)" in v24.*) ;; *) PATH="$(dirname "$(nvm which 24)"):$PATH" ;; esac
cd "$(dirname "$0")" && exec pnpm exec e2e run "$@"
