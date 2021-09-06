# Anticrm Platform

[![Maintainability](https://api.codeclimate.com/v1/badges/5cb6d2d426619568816b/maintainability)](https://codeclimate.com/github/hardcoreeng/platform/maintainability) [![Test Coverage](https://api.codeclimate.com/v1/badges/5cb6d2d426619568816b/test_coverage)](https://codeclimate.com/github/hardcoreeng/platform/test_coverage)

## Building project

Use NVM tool to install required nodejs version.

```bash
nvm install
nvm use
```

Install rush.js

```bash
npm install -g @microsoft/rush
```

Now we could do:

```bash
rush update
```

and we are ready.

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

### Running Dev server with auth/workspace

It will create workspace 'workspace' users 'john.appleseed@gmail.com' and 'brian.appleseed@gmail.com' with passwords '123'. 
So login functionality could be used to test with different accounts.

```bash
cd ./dev/server
rushx dev
```

### Running ElasticSearch in docker

```bash

docker run -p 9200:9200 -p 9300:9300 -e "discovery.type=single-node" elasticsearch:7.13.4
```

## Dev tasks

All dev required tasks could be execured from root of project using rushx tool.

### Format all changed files

`rushx format-diff`

### Lint all changed files

`rushx lint-diff`

### Execute tests on modified projects

`rushx test-diff`
