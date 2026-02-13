# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
yarn install             # Install dependencies
yarn build               # Compile TypeScript (cleans dist/ first via prebuild)
yarn start:dev           # Run in watch mode (HTTP + gRPC)
yarn start:prod          # Production (HTTP + gRPC)
yarn start:prod:mcp      # Production (HTTP + gRPC + MCP)
yarn start:mcp           # MCP server via stdio (standalone)
yarn start:mcp:http      # MCP server via HTTP (standalone, port 3001)
yarn lint                # ESLint with auto-fix
yarn test                # Run all unit tests (Jest)
yarn test -- --testPathPattern=<pattern>  # Run a single test file
yarn test:e2e            # Run e2e tests (config: test/jest-e2e.json)
yarn test:cov            # Tests with coverage report
```

## Architecture

This is a **NestJS notification service** using Clean Architecture and CQRS. It sends emails (via SendInBlue) and push notifications (via Firebase Admin SDK) through four interfaces: HTTP API, gRPC, CLI, and MCP.

### Layer Structure

```
src/
├── presentation/     # Controllers - HTTP (api/), gRPC (grpc/), CLI (cli/), MCP (mcp/)
├── application/      # CQRS command handlers (features/) + shared exceptions
├── domain/           # Models with validation, interfaces, enums - no framework dependencies
└── infrastructure/   # External service implementations + configuration
```

**Data flow:** Controller → CommandBus → Handler → Domain Service (via interface token)

### Dependency Inversion

Domain interfaces are decoupled from implementations using NestJS injection tokens (Symbols):

- `EmailServiceToken` → `SendInBlueEmailService` (implements `IEmailService`)
- `PushNotificationServiceToken` → `FcmSdkPushNotificationService` (implements `IPushNotificationService`)
- `GoogleMessagingToken` → Firebase `admin.messaging()` instance

Tokens are defined in `src/domain/*/interfaces/` and wired in `src/infrastructure/infrastructure.module.ts`.

### CQRS

Commands and handlers live in `src/application/features/`:
- `sendTransactionalEmail/` — email sending via CommandBus
- `sendPushNotification/` — push notification via CommandBus

### Configuration

- Environment variable-based config via `@nestjs/config` (see `.env.example`)
- `src/infrastructure/configuration/configuration.ts` maps env vars to config keys
- Firebase uses `GOOGLE_APPLICATION_CREDENTIALS` env var for service account
- Typed options classes in `src/infrastructure/configuration/options/`
- Default ports: HTTP 3000, gRPC 5000

### MCP

- MCP server exposes `notifications_send_email` and `notifications_send_push_notification` tools
- Entry point: `src/mcp-bootstrap.ts` (excluded from `nest build` via `tsconfig.build.json`)
- When `MCP_TRANSPORT=http`, MCP routes are also mounted on the main NestJS app at `POST /mcp`
- MCP SDK is ESM-only — uses dynamic `import()` at runtime in CJS context
- Tool definitions in `src/presentation/mcp/tools/`, service in `src/presentation/mcp/mcp.service.ts`

### API

- Swagger docs available at `/api/docs` when running
- Health check at `GET /health`
- Global `ValidationPipe` enforces DTO validation (class-validator decorators)

### gRPC

Proto file at `email/email.proto`. The `nest-cli.json` assets config copies proto files to `dist/` on build.

### Docker & Deployment

- `Dockerfile` — multi-stage build with `node:20-alpine`
- `docker-compose.yml` — runs app (HTTP+gRPC+MCP) and standalone MCP services
- `tsconfig.docker.json` — includes `mcp-bootstrap.ts` (excluded from normal build)
- `render.yaml` — Render blueprint for cloud deployment
- Firebase credentials on Render: upload JSON via Secret Files at `/etc/secrets/firebase-adminsdk.json`

## Testing

Tests live in `test/` (not co-located with source). Mocks are in `test/mocks/`. Tests use `@nestjs/testing` TestingModule with mock providers substituted for external services.

## TypeScript

Strict mode is enabled (`strictNullChecks`, `noImplicitAny`, `strictBindCallApply`). ESLint warns on `any` usage and missing return types. TypeScript 5.3 with `@typescript-eslint` v5.62.
