FROM --platform=$BUILDPLATFORM oven/bun:1.3.14@sha256:e10577f0db68676a7024391c6e5cb4b879ebd17188ab750cf10024a6d700e5c4

ENV DATABASE_URL=http://turso:8080

COPY package.json bun.lock bunfig.toml drizzle.config.ts env.ts ./
COPY ./src/db/schema ./

RUN bun --version
# RUN bun drizzle-kit migrate
