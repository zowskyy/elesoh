# Redis MCP (developer tool)

Pinned version: **redis-mcp-server==0.5.1** (PyPI, 2026-08-05).

Do not use `@latest`. Tomorrow's package can change behavior.

## Cursor config

Project file: [`.cursor/mcp.json`](../../.cursor/mcp.json)

On this Windows machine `uvx` may not be on PATH. The project MCP config uses:

```text
py -3 -m uv tool run --from redis-mcp-server==0.5.1 redis-mcp-server --url redis://localhost:6379/0
```

Requires Python 3 with the `uv` package (`py -3 -m pip install --user uv`). Prefer adding Astral's `uv`/`uvx` to PATH when available.

Redis MCP is a **developer** interface to localhost Redis. It is not part of `apps/mcp`.

## Upgrade process

1. Read the [redis-mcp-server changelog](https://pypi.org/project/redis-mcp-server/).
2. Update the pin in `.cursor/mcp.json` and this document.
3. Restart Cursor MCP and confirm it can `GET` `lso:health:started_at` against local compose.
4. Note the bump in `PROJECT_STATE.md`.

## Namespaces to inspect

```text
lso:health:*
lso:cache:*
lso:lock:*
lso:crawl:*
lso:progress:*
lso:rate:*
lso:bull:*
```
