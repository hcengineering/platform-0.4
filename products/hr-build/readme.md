# Running on Premise installation

## Install NodeJS

Install based on host OS used.

## Run mongo db

docker volume create mongodbdata
docker run -d -p 27017:27017 -v mongodbdata:/data/db mongo

## When download and unzip hr-build artifacts

### Configure security keys and options

Server is looking for ./config/config.env file for following parameters.

- WEB_HOST - Public host name, will be used for auth and web hosting.
- WEB_PORT - Public port, will be used for auth and web hosting.
- SERVER_PORT - Port for websocket connections. web_host will be used to connect to.
- SERVER_SECRET - Server secret key be used to generate auth tokens. Please update to some secret value.
- MONGODB_URI - An address of mongodb server to hold data inside.
- WORKSPACE - Workspace with following name will be automatically created if not pressent already.
- WORKSPACE_ORGANIZATION - Workspace ${WORKSPACE} organization description.

### Security certificates

- SECURITY_CERT_FILE - Certificate file in PEM format.
- SECURITY_KEY_FILE - Private key file in PEM format.
- SECURITY_CA_FILE - Certificate Chain in PEM format.

## Starting server

Running server as background process could be achived with.

```bash
node ./server.js
```
