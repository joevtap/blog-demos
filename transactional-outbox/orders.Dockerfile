FROM node:22.17-alpine AS build

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

RUN npm run build

FROM node:22.17-alpine

ENV NODE_ENV=production

WORKDIR /app

COPY --from=build /app/dist ./dist

COPY package*.json ./

RUN npm ci --omit=dev

CMD ["node", "dist/index.js"]
