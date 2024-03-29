FROM node:20-alpine3.19 AS builder

WORKDIR /build

ARG NODE_AUTH_TOKEN
COPY . .

RUN echo "//npm.pkg.github.com/:_authToken=${NODE_AUTH_TOKEN}" >> .npmrc

RUN npm ci
RUN npm run build
RUN npm ci --omit=dev


FROM node:20-alpine3.19
# set working directory
WORKDIR /usr/src/app

MAINTAINER Nico W. <info@ni-wa.de>

HEALTHCHECK --start-period=25s CMD npm run healthcheck

COPY --from=builder /build/dist ./dist
COPY --from=builder /build/node_modules ./node_modules
COPY --from=builder /build/package*.json .


ENTRYPOINT ["node", "."]
