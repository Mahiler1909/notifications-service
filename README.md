# Notifications Service - Clean Architecture

## Description

Notification service for sending emails (via SendInBlue/Brevo) and push notifications (via Firebase Cloud Messaging) using CQRS pattern, Clean Architecture (DDD), and clean code principles. Exposes HTTP API, gRPC, and CLI interfaces.

## Prerequisites

- Node.js 18+
- Yarn

## Installation

```bash
yarn install
```

## Configuration

Copy the example environment file and fill in your values:

```bash
cp .env.example .env
```

| Variable | Description | Default |
|----------|-------------|---------|
| `EMAIL_API_KEY` | SendInBlue/Brevo API key | - |
| `GOOGLE_APPLICATION_CREDENTIALS` | Path to Firebase service account JSON | - |
| `PUSH_NOTIFICATION_PROVIDER` | `sdk` (Firebase Admin SDK) or `http` (FCM HTTP v1 via JWT) | `sdk` |

YAML config files in `configuration/` control ports and non-sensitive settings (`config.{NODE_ENV}.yaml`).

## Running the app

```bash
# development (watch mode)
yarn start:dev

# development
yarn start

# production
yarn start:prod
```

- HTTP server: `http://localhost:3000`
- gRPC server: `localhost:5000`
- Swagger docs: `http://localhost:3000/api/docs`
- Health check: `http://localhost:3000/health`

## Test

```bash
# unit tests
yarn test

# single test file
yarn test -- --testPathPattern=<pattern>

# test coverage
yarn test:cov

# e2e tests
yarn test:e2e
```

## Lint

```bash
yarn lint
```

## Architecture

```
src/
├── presentation/     # Controllers - HTTP (api/), gRPC (grpc/), CLI (cli/)
├── application/      # CQRS command handlers + shared exceptions
├── domain/           # Models, interfaces, enums (no framework dependencies)
└── infrastructure/   # External service implementations + configuration
```

**Data flow:** Controller → CommandBus → Handler → Domain Service (via interface token)

## Author

- [Fernando Mahiler Chullo Mamani](https://pe.linkedin.com/in/fernando-mahiler-chullo-mamani/en)
