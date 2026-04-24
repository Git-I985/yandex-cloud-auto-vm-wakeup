# Yandex Cloud Compute auto wakeup VMs

Auto-restart for stopped VMs in Yandex Cloud Compute.
The script pings a given URL. If the ping fails and the instance is in a status that needs a restart, it restarts the instance automatically. Useful for preemptible (cheap) VMs.

## Installation

```bash
bun install
cp .env.example .env
# edit .env
```

## What the script does

1. Pings `PROBE_IP` up to `PROBE_RETRIES` times in a row (with a 200ms pause).
2. If every attempt fails — asks for the instance status via the Yandex Cloud Compute API.
3. If `status` is one of those that need a restart — sends a restart request to the API.
4. After the start, it checks again in 1 minute.
5. For other statuses, it does nothing and waits for the next cycle.

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
