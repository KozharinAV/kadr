FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm pkg delete scripts.prepare && npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runtime
# apk's own TLS fails inside BuildKit on this machine; the same index is reachable over HTTP.
RUN sed -i 's|https://|http://|g' /etc/apk/repositories && apk add --no-cache ffmpeg
WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json ./
RUN npm pkg delete scripts.prepare && npm ci --omit=dev
COPY --from=build /app/dist ./dist
EXPOSE 3000
CMD ["node", "dist/main.js"]
