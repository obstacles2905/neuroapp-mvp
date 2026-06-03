# syntax=docker/dockerfile:1

FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY backend/package.json ./backend/package.json
COPY admin/package.json ./admin/package.json
COPY mobile/package.json ./mobile/package.json
RUN npm ci --workspace=backend --include-workspace-root

FROM deps AS build
COPY backend ./backend
RUN npm run build -w backend

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json ./
COPY backend/package.json ./backend/package.json
COPY admin/package.json ./admin/package.json
COPY mobile/package.json ./mobile/package.json
RUN npm ci --workspace=backend --include-workspace-root --omit=dev
COPY --from=build /app/backend/dist ./backend/dist
EXPOSE 3000
CMD ["node", "backend/dist/main.js"]
