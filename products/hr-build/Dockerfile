FROM node:14-alpine

WORKDIR /app
COPY dist .
COPY launcher.sh .

# Public server host, will be used for auth and websocket access to server.
ENV WEB_HOST=localhost
# Port web host is acessible.
ENV WEB_PORT=8080
# Port for websocket connections.
ENV SERVER_PORT=18080

# Server secret key be used to generate tokens.
ENV SERVER_SECRET=secret

# An address of mongodb server to hold data inside.
ENV MONGODB_URI=mongodb://localhost:27017

# Workspace with following name will be automatically created if not pressent already.
ENV WORKSPACE=workspace

EXPOSE 18080
EXPOSE 8080

CMD [ "sh", "launcher.sh" ]