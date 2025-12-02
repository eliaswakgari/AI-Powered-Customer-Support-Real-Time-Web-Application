# Backend Dockerfile
FROM node:20-alpine AS build

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json* yarn.lock* pnpm-lock.yaml* ./
RUN if [ -f package-lock.json ]; then npm ci; \
    elif [ -f yarn.lock ]; then yarn install --frozen-lockfile; \
    elif [ -f pnpm-lock.yaml ]; then corepack enable && pnpm install --frozen-lockfile; \
    else npm install; fi

# Copy source and build
COPY . .
RUN npm run build

# Runtime image
FROM node:20-alpine
WORKDIR /app

ENV NODE_ENV=production

# Install production deps only
COPY package.json package-lock.json* yarn.lock* pnpm-lock.yaml* ./
RUN if [ -f package-lock.json ]; then npm ci --omit=dev; \
    elif [ -f yarn.lock ]; then yarn install --frozen-lockfile --production=true; \
    elif [ -f pnpm-lock.yaml ]; then corepack enable && pnpm install --frozen-lockfile --prod; \
    else npm install --omit=dev; fi

# Copy built files
COPY --from=build /app/dist ./dist
COPY .env ./.env

EXPOSE 5000

CMD ["node", "dist/index.js"]
