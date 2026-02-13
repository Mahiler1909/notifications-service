# Stage 1: Build
FROM node:20-alpine AS build

WORKDIR /app

COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

COPY . .

# Build all source including mcp-bootstrap.ts
RUN npx nest build -p tsconfig.docker.json

# Stage 2: Production
FROM node:20-alpine

WORKDIR /app

COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile --production && yarn cache clean

COPY --from=build /app/dist ./dist
COPY --from=build /app/email ./email

EXPOSE 3000 5000

CMD ["node", "dist/main"]
