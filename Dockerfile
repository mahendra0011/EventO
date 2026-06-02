# syntax=docker/dockerfile:1

FROM node:22-alpine AS frontend-deps
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci

FROM frontend-deps AS frontend-build
ARG REACT_APP_API_URL=/api
ARG REACT_APP_GOOGLE_CLIENT_ID
ENV REACT_APP_API_URL=${REACT_APP_API_URL}
ENV REACT_APP_GOOGLE_CLIENT_ID=${REACT_APP_GOOGLE_CLIENT_ID}
COPY frontend/ ./
RUN npm run build

FROM node:22-alpine AS backend-deps
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm ci --omit=dev

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=5000
ENV CLOUDINARY_ROOT_FOLDER=evento

COPY --from=backend-deps /app/backend/node_modules ./backend/node_modules
COPY backend ./backend
COPY --from=frontend-build /app/frontend/build ./frontend/build

WORKDIR /app/backend
EXPOSE 5000
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 CMD node -e "const port = process.env.PORT || 5000; fetch(`http://127.0.0.1:${port}/api/health`).then((res) => process.exit(res.ok ? 0 : 1)).catch(() => process.exit(1));"
CMD ["node", "server.js"]
