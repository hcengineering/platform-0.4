# Anticrm Platform [![Maintainability](https://api.codeclimate.com/v1/badges/5cb6d2d426619568816b/maintainability)](https://codeclimate.com/github/hardcoreeng/platform/maintainability) [![Test Coverage](https://api.codeclimate.com/v1/badges/5cb6d2d426619568816b/test_coverage)](https://codeclimate.com/github/hardcoreeng/platform/test_coverage)

Business Applications Reimagined. Real time. Web first. Open source.


**Description:** The PLATFORM is an attempt to reimagine a concept of web platforms for business needs like WordPress, Bitrix, etc.
We propose a new way to make web business applications in fast, flexible and efficient way.

**Technology stack:** 
- Node.js 14.17+
- TypeScript
- Svelte.js 3
- MongoDB 4.x
- ElasticSearch

**Status**: Alpha

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**Table of Contents**  

- [Dependencies](#dependencies)
  - [Node.js 14.17 or later](#nodejs-1417-or-later)
  - [Rush.js](#rushjs)
  - [MongoDB 4.x](#mongodb-4x)
  - [ElasticSearch 7.x](#elasticsearch-7x)
- [Installation](#installation)
- [Usage](#usage)
  - [Server](#server)
  - [Workspace Initialization](#workspace-initialization)
  - [Generate Server Access token](#generate-server-access-token)
  - [Running server](#running-server)
- [Development](#development)
  - [Running Dev server with auth/workspace](#running-dev-server-with-authworkspace)
  - [Dev tasks](#dev-tasks)
    - [Format all changed files](#format-all-changed-files)
    - [Lint all changed files](#lint-all-changed-files)
    - [Execute tests on modified projects](#execute-tests-on-modified-projects)
- [Getting involved and contributing](#getting-involved-and-contributing)
- [License](#license)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->


## Dependencies

### Node.js 14.17 or later
We propose to use [Node Version Manager](https://github.com/nvm-sh/nvm) for installation Node.js version 14.17+.

### Rush.js
We use [rush.js - a scalable monorepo manager](https://rushjs.io/) in the project 
```bash
npm install -g @microsoft/rush
```

### MongoDB 4.x
You can install [MongoDB 4.x](https://www.mongodb.com/try/download/community) locally or run it as a docker container

```bash
docker run -d -p 127.0.0.1:27017:27017 mongo
```

### ElasticSearch 7.x
You can install [ElasticSearch 7.x](https://www.elastic.co/downloads/elasticsearch) locally or run it as a docker container

```bash
docker run -p 9200:9200 -p 9300:9300 -e "discovery.type=single-node" elasticsearch:7.13.4
```


## Installation
Please run in the project root folder:

```bash
rush update
```

and we are ready.

## Usage

### Server

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

After server is started, it accepts any incoming request for existing workspaces.

## Development
 
### Running Dev server with auth/workspace

It will create workspace 'workspace' users 'john.appleseed@gmail.com' and 'brian.appleseed@gmail.com' with passwords '123'. 
So login functionality could be used to test with different accounts.

```bash
cd ./dev/server
rushx dev
```


### Dev tasks

All dev required tasks could be execured from root of project using rushx tool.

#### Format all changed files

`rushx format-diff`

#### Lint all changed files

`rushx lint-diff`

#### Execute tests on modified projects

`rushx test-diff`


## Getting involved and contributing
We are looking for contributors into the project. Please read our [CONTRIBUTING.md](CONTRIBUTING.md) document.

## License
Eclipse Public License - v 2.0

See [LICENSE](LICENSE)
