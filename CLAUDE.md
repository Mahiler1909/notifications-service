# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
yarn install             # Install dependencies
yarn build               # Compile TypeScript (cleans dist/ first via prebuild)
yarn start:dev           # Run in watch mode (NODE_ENV=dev)
yarn lint                # ESLint with auto-fix
yarn test                # Run all unit tests (Jest)
yarn test -- --testPathPattern=<pattern>  # Run a single test file
yarn test:e2e            # Run e2e tests (config: test/jest-e2e.json)
yarn test:cov            # Tests with coverage report
```

## Architecture

This is a **NestJS notification service** using Clean Architecture and CQRS. It sends emails (via SendInBlue) and push notifications (via Firebase Admin SDK) through three interfaces: HTTP API, gRPC, and CLI.

### Layer Structure

```
src/
├── presentation/     # Controllers - HTTP (api/), gRPC (grpc/), CLI (cli/)
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

- YAML-based config loaded by `@nestjs/config` from `configuration/config.{NODE_ENV}.yaml` (defaults to `dev`)
- Sensitive values (API keys, Firebase credentials) use environment variables — see `.env.example`
- Firebase uses `GOOGLE_APPLICATION_CREDENTIALS` env var for service account
- Typed options classes in `src/infrastructure/configuration/options/`
- Default ports: HTTP 3000, gRPC 5000

### API

- Swagger docs available at `/api/docs` when running
- Health check at `GET /health`
- Global `ValidationPipe` enforces DTO validation (class-validator decorators)

### gRPC

Proto file at `email/email.proto`. The `nest-cli.json` assets config copies both YAML and proto files to `dist/` on build.

## Testing

Tests live in `test/` (not co-located with source). Mocks are in `test/mocks/`. Tests use `@nestjs/testing` TestingModule with mock providers substituted for external services.

## TypeScript

Strict mode is enabled (`strictNullChecks`, `noImplicitAny`, `strictBindCallApply`). ESLint warns on `any` usage and missing return types.
