# Yandex Cloud Compute auto wakeup VMs

Auto-restart for stopped VMs in Yandex Cloud Compute.
The script polls the Yandex Cloud Compute API for the instance status. If the status shows the VM needs a restart, it sends a start command automatically. Useful for preemptible (cheap) VMs.

## Installation

```bash
bun install
cp .env.example .env
# edit .env
```

## What the script does

1. Every `PROBE_INTERVAL_SECONDS` (60s by default), asks the Yandex Cloud Compute API for the instance status.
2. If the status matches one of the restart-required states — sends a start command and waits longer before checking again.
3. If the status matches one of the transient states — also waits longer before checking again.
4. For any other status — just logs the status and waits for the next cycle.

## Authentication

1. Open: https://oauth.yandex.com/authorize?response_type=token&client_id=1a6990aa636648e9b2ef855fa7bec2fb
2. Log in and copy the token.
3. Paste it into `.env` as `YC_OAUTH_TOKEN=...` (or set it in `.zshrc`/`.bashrc` and others — this may be handy later).

> [!WARNING]
> If there are any problems with the OAuth token — you can [revoke the old one](https://id.yandex.ru/personal/data-access) and create a new one.

The script exchanges IAM tokens via the OAuth token every 11 hours on its own (in advance, because an IAM token lives for 12 hours).

## Run

```bash
bun run start
```
