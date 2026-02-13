# Notifications Service

> A multi-port notification service built with **NestJS**, **Clean Architecture**, and **CQRS**. Send emails and push notifications through **4 interfaces**: HTTP API, gRPC, CLI, and MCP (Model Context Protocol).

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
- **Swagger** — Auto-generated API docs at `/api/docs`
- **Health Check** — `GET /health` via `@nestjs/terminus`
- **Validation** — DTOs enforced with `class-validator`, domain models with self-validation

---

## Quick Start

### Prerequisites

- Node.js 18+
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
| `PUSH_NOTIFICATION_PROVIDER` | `sdk` (Admin SDK) or `http` (FCM HTTP v1) | No (default: `sdk`) |

YAML config files live in `configuration/config.{NODE_ENV}.yaml` for ports and non-sensitive settings.

### Run

```bash
yarn start:dev     # HTTP + gRPC (watch mode)
yarn start:mcp     # MCP server (stdio)
```

| Service | URL |
|---------|-----|
| HTTP API | `http://localhost:3030` |
| gRPC | `localhost:5000` |
| Swagger Docs | `http://localhost:3030/api/docs` |
| Health Check | `http://localhost:3030/health` |

---

## API Usage

### Send Email — HTTP

```bash
curl -X POST http://localhost:3030/email/send \
  -H "Content-Type: application/json" \
  -d '{
    "templateName": "Template Test",
    "parameters": { "FIRST_NAME": "Fernando" },
    "receivers": [{ "email": "user@example.com", "name": "Fernando" }]
  }'
```

### Send Push Notification — HTTP

```bash
curl -X POST http://localhost:3030/push-notification/send \
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
    "notifications": {
      "command": "npx",
      "args": ["ts-node", "--transpile-only", "src/mcp-bootstrap.ts"],
      "cwd": "/path/to/notifications-service",
      "env": {
        "NODE_ENV": "dev",
        "EMAIL_API_KEY": "your-brevo-api-key",
        "GOOGLE_APPLICATION_CREDENTIALS": "/path/to/firebase-adminsdk.json"
      }
    }
  }
}
```

### Production Setup (Streamable HTTP)

```bash
yarn start:mcp:http   # Starts on http://localhost:3001/mcp
```

| Variable | Description | Default |
|----------|-------------|---------|
| `MCP_TRANSPORT` | `stdio` or `http` | `stdio` |
| `MCP_PORT` | HTTP port (only for http transport) | `3001` |

The HTTP endpoint (`POST /mcp`) implements the MCP Streamable HTTP spec in stateless JSON mode — no sessions, easy to scale horizontally. Put a reverse proxy (nginx, Caddy, ALB) in front for HTTPS.

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
│   └── mcp/               #   MCP server (stdio)
├── application/           # CQRS commands + handlers
│   └── features/
│       ├── sendTransactionalEmail/
│       └── sendPushNotification/
├── domain/                # Models, interfaces (framework-free)
│   ├── email/
│   └── push-notifications/
└── infrastructure/        # External service implementations
    ├── services/          #   Brevo, Firebase
    └── configuration/     #   YAML config, options classes
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
| Language | TypeScript 4.7 |
| CQRS | @nestjs/cqrs |
| Email Provider | Brevo (SendInBlue) |
| Push Notifications | Firebase Admin SDK |
| gRPC | @grpc/grpc-js + protobuf |
| CLI | nest-commander |
| MCP | @modelcontextprotocol/sdk |
| Validation | class-validator + Zod (MCP) |
| Config | @nestjs/config + YAML |
| API Docs | @nestjs/swagger |
| Health | @nestjs/terminus |

---

## Scripts

| Command | Description |
|---------|-------------|
| `yarn start:dev` | Dev mode with watch (HTTP + gRPC) |
| `yarn start:mcp` | MCP server via stdio |
| `yarn start:mcp:http` | MCP server via HTTP (production) |
| `yarn build` | Compile TypeScript |
| `yarn test` | Run unit tests |
| `yarn test:cov` | Tests with coverage |
| `yarn lint` | ESLint with auto-fix |

