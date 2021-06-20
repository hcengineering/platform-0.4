# Anticrm Platform

[![Maintainability](https://api.codeclimate.com/v1/badges/5cb6d2d426619568816b/maintainability)](https://codeclimate.com/github/hardcoreeng/platform/maintainability) [![Test Coverage](https://api.codeclimate.com/v1/badges/5cb6d2d426619568816b/test_coverage)](https://codeclimate.com/github/hardcoreeng/platform/test_coverage)

## Server

Hosting of platform as server is described in this section.

### Workspace Initialization

Before using workspace please initialize a workspace, it could be done with

```bash
cd ./server/tools
rushx create-workspace {workspaceName}
```

It will import all transactions from `model/all` and put them into Workspace.

### Generate Server Access token

Access token could be generated using server-cli generage-token command.

```bash
cd ./server/tools
rushx generate-token {accountId} {workspaceName}
```

### Running server

```bash
cd ./server/server
rushx dev
```

After server is started, it will accept any incoming request for existing workspaces.

### Running ElasticSearch in docker

```bash

docker run -p 9200:9200 -p 9300:9300 -e "discovery.type=single-node" docker.elastic.co/
elasticsearch/elasticsearch:7.13.1
```
