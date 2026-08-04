# React 정적 파일과 Express 서버를 하나의 운영 이미지로 빌드한다.
FROM node:24-alpine AS build
WORKDIR /app
COPY package*.json ./
COPY client/package.json client/package.json
COPY server/package.json server/package.json
RUN npm ci
COPY client client
COPY server server
COPY shared shared
RUN cd server && npx prisma generate
RUN npm run build && npm run build:server

FROM node:24-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
COPY client/package.json client/package.json
COPY server/package.json server/package.json
RUN npm ci
COPY --from=build /app/client/dist client/dist
COPY --from=build /app/server/dist server/dist
COPY --from=build /app/server/src/generated server/src/generated
COPY --from=build /app/server/prisma server/prisma
# schema.prisma에는 datasource url이 없고 prisma.config.ts가 DATABASE_URL을 넘긴다.
# 이 파일이 없으면 migrate deploy가 "datasource.url property is required"로 죽는다.
COPY --from=build /app/server/prisma.config.ts server/prisma.config.ts
CMD ["sh", "-c", "cd server && npx prisma migrate deploy && cd .. && node server/dist/index.js"]
