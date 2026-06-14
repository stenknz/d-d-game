# Deployment

## Bare-metal

Requirements:

- Node 20+
- Ollama installed and running on `http://localhost:11434` (default)
- At least one model pulled: `ollama pull llama3.1:8b`

Steps:

```bash
npm install
npm run db:push
npm run db:seed
npm run build
npm run start
```

## Docker Compose

The bundled `docker-compose.yml` runs the Next.js app and an Ollama service side by side.

```bash
docker compose up --build
docker compose exec ollama ollama pull llama3.1:8b
# open http://localhost:3000
```

Persistent data:

- `ollama_data` — model weights
- `app_data` — SQLite database file

To change the default model, edit the `DEFAULT_MODEL` env var in `docker-compose.yml` and pull the new model.

## Environment variables

| Var | Default | Purpose |
|---|---|---|
| `OLLAMA_BASE_URL` | `http://localhost:11434` | Ollama endpoint |
| `DEFAULT_MODEL` | `llama3.1:8b` | Default chat model |
| `EMBEDDING_MODEL` | `nomic-embed-text` | Embedding model for RAG |
| `RAG_TOP_K` | `8` | Top-k memory/lore chunks per turn |
| `DATABASE_URL` | `file:./dev.db` | SQLite path |
| `IMAGE_PROVIDER_URL` | _(empty)_ | Stable Diffusion / ComfyUI endpoint (M6) |
| `STT_PROVIDER_URL` | _(empty)_ | Speech-to-text endpoint (M6) |
| `TTS_PROVIDER_URL` | _(empty)_ | Text-to-speech endpoint (M6) |

## Production checklist

- Switch `DATABASE_URL` to a hosted Postgres (change `provider` in `prisma/schema.prisma` and re-run migrations).
- Put Ollama behind a reverse proxy with auth if exposed.
- Run the app behind a TLS terminator (Caddy, nginx, Traefik).
- Set `NODE_ENV=production` (compose does this automatically).
