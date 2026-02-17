# Notifications Service

[![Build](https://img.shields.io/github/actions/workflow/status/Mahiler1909/notifications-service/ci.yml?branch=main&logo=github)](https://github.com/Mahiler1909/notifications-service/actions/workflows/ci.yml)
[![Coverage](https://img.shields.io/codecov/c/github/Mahiler1909/notifications-service?logo=codecov)](https://codecov.io/gh/Mahiler1909/notifications-service)
[![Release](https://img.shields.io/github/v/release/Mahiler1909/notifications-service?logo=github)](https://github.com/Mahiler1909/notifications-service/releases)
[![Node](https://img.shields.io/badge/node-20-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![License](https://img.shields.io/github/license/Mahiler1909/notifications-service)](LICENSE)

> A multi-port notification service built with **NestJS**, **Clean Architecture**, and **CQRS**. Send emails and push notifications through **4 interfaces**: HTTP API, gRPC, CLI, and MCP (Model Context Protocol).

**[Live Demo (Swagger)](https://notifications-service-lxur.onrender.com/api/docs)**

```
         HTTP API ──┐
           gRPC ────┤
            CLI ────┼── CommandBus ── Handlers ── Domain ── Infrastructure
            MCP ────┘                                          │       │
                                                          Brevo    Firebase
                                                         (Email)    (FCM)
```

---

## Features

- **4 Presentation Ports** — HTTP REST, gRPC, CLI, and MCP (for AI agents)
- **Clean Architecture** — Domain layer free of framework dependencies
- **CQRS** — All ports dispatch the same commands through `@nestjs/cqrs`
- **Dependency Inversion** — Domain interfaces decoupled via injection tokens (Symbols)
- **Email** — Transactional emails via Brevo (SendInBlue) with dynamic templates
- **Push Notifications** — Multicast via Firebase Cloud Messaging (Admin SDK or HTTP v1)
- **MCP Server** — LLMs like Claude can send notifications as tools via stdio or Streamable HTTP
- **Docker** — Multi-stage Dockerfile + docker-compose for local development
- **Render Deployment** — Ready to deploy with `render.yaml` blueprint
- **Swagger** — Auto-generated API docs at `/api/docs`
- **Health Check** — `GET /health` via `@nestjs/terminus`
- **Validation** — DTOs enforced with `class-validator`, domain models with self-validation

---

## Quick Start

### Prerequisites

- Node.js 20+
- Yarn

### Installation

```bash
yarn install
```

### Configuration

```bash
cp .env.example .env
```

| Variable | Description | Required |
|----------|-------------|----------|
| `EMAIL_API_KEY` | Brevo (SendInBlue) API key | Yes |
| `GOOGLE_APPLICATION_CREDENTIALS` | Path to Firebase service account JSON | Yes |
| `FIREBASE_PROJECT_ID` | Firebase project ID | Yes |
| `PUSH_NOTIFICATION_PROVIDER` | `sdk` (Admin SDK) or `http` (FCM HTTP v1) | No (default: `sdk`) |
| `PORT` | HTTP server port | No (default: `3000`) |
| `GRPC_HOST` | gRPC bind host | No (default: `0.0.0.0`) |
| `GRPC_PORT` | gRPC server port | No (default: `5000`) |
| `MCP_TRANSPORT` | `stdio` or `http` | No (default: `stdio`) |

### Run

```bash
yarn start:dev     # HTTP + gRPC (watch mode)
yarn start:mcp     # MCP server (stdio)
```

| Service | URL |
|---------|-----|
| HTTP API | `http://localhost:3000` |
| gRPC | `localhost:5000` |
| Swagger Docs | `http://localhost:3000/api/docs` |
| Health Check | `http://localhost:3000/health` |

---

## API Usage

### Send Email — HTTP

```bash
curl -X POST http://localhost:3000/email/send \
  -H "Content-Type: application/json" \
  -d '{
    "templateName": "Template Test",
    "parameters": { "FIRST_NAME": "Fernando" },
    "receivers": [{ "email": "user@example.com", "name": "Fernando" }]
  }'
```

### Send Push Notification — HTTP

```bash
curl -X POST http://localhost:3000/push-notification/send \
  -H "Content-Type: application/json" \
  -d '{
    "deviceTokens": ["fcm-token-abc123"],
    "notification": {
      "title": "New promotion!",
      "body": "50% off on all products",
      "imageUrl": "https://example.com/image.png",
      "payload": { "screen": "promo" }
    }
  }'
```

### Send Email — CLI

```bash
yarn start:cli send-email \
  -t "Template Test" \
  -e user@example.com \
  -n Fernando \
  -p '{"FIRST_NAME": "Fernando"}'
```

### Send Email — MCP (AI Agents)

When configured as an MCP server, AI agents like Claude can use these tools directly:

- `notifications_send_email` — Send transactional emails with dynamic templates
- `notifications_send_push_notification` — Send push notifications to devices

---

## MCP Server

The MCP server exposes notification capabilities as tools for AI agents. It supports two transports:

| Transport | Use case | Command |
|-----------|----------|---------|
| **stdio** | Local (Claude Code, MCP Inspector) | `yarn start:mcp` |
| **Streamable HTTP** | Remote / Production | `yarn start:mcp:http` |

### Local Setup (stdio)

Add to your project's `.mcp.json`:

```json
{
  "mcpServers": {
    "notifications-stdio": {
      "command": "npx",
      "args": ["ts-node", "--transpile-only", "src/mcp-bootstrap.ts"],
      "cwd": "/path/to/notifications-service"
    }
  }
}
```

### Remote / Production (Streamable HTTP)

When deployed (or running locally with `yarn start:mcp:http`), connect via HTTP:

```json
{
  "mcpServers": {
    "notifications-http": {
      "type": "http",
      "url": "https://your-deployment-url.com/mcp"
    }
  }
}
```

When `MCP_TRANSPORT=http` is set, the MCP endpoint is also mounted on the main NestJS app at `POST /mcp` (same port as the HTTP API). The endpoint implements the MCP Streamable HTTP spec in stateless JSON mode — no sessions, easy to scale.

### Available Tools

| Tool | Description |
|------|-------------|
| `notifications_send_email` | Send transactional email using a named Brevo template |
| `notifications_send_push_notification` | Send push notification via FCM to one or more devices |

---

## Architecture

```
src/
├── presentation/          # 4 Ports
│   ├── api/               #   HTTP REST controllers + DTOs
│   ├── grpc/              #   gRPC controller
│   ├── cli/               #   CLI command runner (nest-commander)
│   └── mcp/               #   MCP tools + service
├── application/           # CQRS commands + handlers
│   └── features/
│       ├── sendTransactionalEmail/
│       └── sendPushNotification/
├── domain/                # Models, interfaces (framework-free)
│   ├── email/
│   └── push-notifications/
└── infrastructure/        # External service implementations
    ├── services/          #   Brevo, Firebase
    └── configuration/     #   Env var config, options classes
```

### Data Flow

```
Port (HTTP/gRPC/CLI/MCP)
  └─> CommandBus.execute(Command)
        └─> Handler
              ├─> Domain Service (via interface token)
              │     └─> Domain Model (self-validates)
              └─> Infrastructure Implementation
                    └─> External API (Brevo / Firebase)
```

### Dependency Inversion

| Token (Symbol) | Interface | Implementation |
|----------------|-----------|----------------|
| `EmailServiceToken` | `IEmailService` | `SendInBlueEmailService` |
| `PushNotificationServiceToken` | `IPushNotificationService` | `FcmSdkPushNotificationService` |

---

## Docker

### Build & Run

```bash
docker build -t notifications-service .
docker run -p 3000:3000 \
  -e EMAIL_API_KEY=... \
  -e FIREBASE_PROJECT_ID=... \
  -e GOOGLE_APPLICATION_CREDENTIALS=/path/to/credentials.json \
  notifications-service
```

### Docker Compose

```bash
docker-compose up
```

Runs two services:
- **app** — HTTP API (3000) + gRPC (5000) + MCP at `/mcp`
- **mcp** — Standalone MCP HTTP server (3001)

---

## Deployment (Render)

The project includes a `render.yaml` blueprint for one-click deployment:

1. Push the repo to GitHub
2. In Render: **New > Blueprint** > select the repo
3. Configure environment variables: `EMAIL_API_KEY`, `FIREBASE_PROJECT_ID`
4. Upload Firebase credentials via **Secret Files** as `firebase-adminsdk.json`
5. The env var `GOOGLE_APPLICATION_CREDENTIALS=/etc/secrets/firebase-adminsdk.json` is pre-configured

Render exposes the HTTP API + MCP on a single port. gRPC is available only in Docker (local).

---

## Testing

```bash
yarn test              # Unit tests
yarn test:cov          # Coverage report
yarn test:e2e          # End-to-end tests
```

Tests live in `test/` with mocks in `test/mocks/`.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | NestJS 9 |
| Language | TypeScript 5.3 |
| CQRS | @nestjs/cqrs |
| Email Provider | Brevo (SendInBlue) |
| Push Notifications | Firebase Admin SDK |
| gRPC | @grpc/grpc-js + protobuf |
| CLI | nest-commander |
| MCP | @modelcontextprotocol/sdk |
| Validation | class-validator + Zod (MCP) |
| Config | @nestjs/config + env vars |
| API Docs | @nestjs/swagger |
| Health | @nestjs/terminus |
| Container | Docker + docker-compose |
| Hosting | Render |

---

## Scripts

| Command | Description |
|---------|-------------|
| `yarn start:dev` | Dev mode with watch (HTTP + gRPC) |
| `yarn start:prod` | Production (HTTP + gRPC) |
| `yarn start:prod:mcp` | Production (HTTP + gRPC + MCP) |
| `yarn start:mcp` | MCP server via stdio (standalone) |
| `yarn start:mcp:http` | MCP server via HTTP (standalone) |
| `yarn build` | Compile TypeScript |
| `yarn test` | Run unit tests |
| `yarn test:cov` | Tests with coverage |
| `yarn lint` | ESLint with auto-fix |

---

## License

[MIT](LICENSE)
