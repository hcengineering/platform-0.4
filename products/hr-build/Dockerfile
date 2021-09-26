FROM node:lts-alpine

RUN apk add dumb-init

ENV NODE_ENV production
WORKDIR /app
COPY dist/web ./web
COPY dist/server.js .

EXPOSE 18080 8080
#USER node
CMD [ "dumb-init", "node", "./server.js" ]