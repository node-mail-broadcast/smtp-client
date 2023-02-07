FROM node:16-alpine3.16 AS builder

WORKDIR /build

ARG NODE_AUTH_TOKEN
ENV NODE_AUTH_TOKEN=${NODE_AUTH_TOKEN}

COPY . .
RUN npm ci
RUN npm run build
RUN npm ci --only=production


FROM node:16-alpine3.16
# set working directory
WORKDIR /usr/src/app

MAINTAINER Nico W. <info@ni-wa.de>

COPY --from=builder /build/dist ./dist
COPY --from=builder /build/node_modules ./node_modules
COPY --from=builder /build/package*.json .


ENTRYPOINT ["node", "."]
