FROM oven/bun:1

WORKDIR /app

COPY package.json bun.lockb ./
COPY index.ts ./index.ts

RUN bun install --production

EXPOSE 5000

ENV NODE_ENV=production

CMD ["bun", "run", "index.ts"]