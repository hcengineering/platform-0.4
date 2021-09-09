# Anticrm Platform [![Maintainability](https://api.codeclimate.com/v1/badges/5cb6d2d426619568816b/maintainability)](https://codeclimate.com/github/hardcoreeng/platform/maintainability) [![Test Coverage](https://api.codeclimate.com/v1/badges/5cb6d2d426619568816b/test_coverage)](https://codeclimate.com/github/hardcoreeng/platform/test_coverage)

Business Applications Reimagined. Real time. Web first. Open source.


**Description:** 

The PLATFORM is an attempt to reimagine a concept of web platforms for business needs like WordPress, Bitrix, etc.
We propose a new way to make web business applications in fast, flexible and efficient way.

The project consists of multiple packages; all of them are located in this mono-repository. [Rush.js](https://rushjs.io/) 
is used for fast build all parts of the project. 


**Technology stack:** 
- Node.js 14.17+
- TypeScript
- Svelte.js 3
- MongoDB 4.x
- ElasticSearch
- Rush.js
- Jest
- PNPM

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
  - [Project Directory structure](#project-directory-structure)
  - [How to run dev server](#how-to-run-dev-server)
    - [Running server](#running-server-1)
    - [Running site](#running-site)
  - [Dev tasks](#dev-tasks)
    - [Format all changed files](#format-all-changed-files)
    - [Lint all changed files](#lint-all-changed-files)
    - [Execute tests on modified projects](#execute-tests-on-modified-projects)
- [Know issues](#know-issues)
  - [MacOS on M1](#macos-on-m1)
- [Getting help](#getting-help)
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
Please check that it works
```bash
rush -h
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
# Incremental install
rush update

# Build all parts of the project
rush build
```

and we are ready for use.



## Usage

> The project is at early stage. If you want to test it, we recommend running a local development version (see [How to run dev server](#how-to-run-dev-server) below).

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

### Project Directory structure
This project is setup to have multiple packages and services in the same repository (mono-repository) as such the 
directory structure is quite important. Below, we briefly described, maybe not all, but the most important 
directories of the project.

```
PLATFORM
├─ LICENSE
├─ README.md
├─ CONTRIBUTING.md
├─ package.json
├─ rush.json
├─ common - contains general configurtations for the project
│  ├─ changes
│  ├─ config
│  ├─ git-hooks
│  └─ scripts
├─ dev - contains local development server
│  ├─ platform-rig
│  ├─ prod - frontend part of the project
│  ├─ server - backend part of the project
│  └─ ui-build
├─ models - contains definitions for domain modals
│  ├─ all
│  ├─ calendar
│  ├─ chunter
│  ├─ core
│  ├─ dev
│  ├─ fsm
│  ├─ meeting
│  ├─ recruting
│  ├─ task
│  └─ workbench
├─ packages - contains code shared among client and server, except packages/platform which defines plugin architecture and client-side only. 
│  ├─ core
│  ├─ model
│  ├─ platform
│  ├─ query
│  ├─ richeditor
│  ├─ router
│  ├─ rpc
│  ├─ status
│  ├─ text
│  ├─ theme
│  ├─ ui
│  └─ webrtco
├─ plugins - contains client-side code packaged in form of Platform Plugins.
│  └─ ...
├─ products - contains examples of business aplications
│  └─ hr-build
├─ server - contains server-side code of the Platform
│  ├─ accounts
│  ├─ client
│  ├─ elastic
│  ├─ mongo
│  ├─ server
│  ├─ services
│  ├─ tools
│  ├─ workspace
│  └─ workspaces
└─ tests - contains automated tests for the Platform code
   └─ server
```

 
### How to run dev server

> Before, please make sure that MongoDB & ElasticSearch are started and available.
 
It needs to run 2 parts in parallel - server & site.

#### Running server

```bash
cd ./dev/server
rushx dev
```

FYI: It will create the `workspace` workspace and users `john.appleseed@gmail.com` and `brian.appleseed@gmail.com` with passwords `123`. 
So, login functionality could be used to test with different accounts.


#### Running site

```bash
cd ./dev/prod
rushx dev-server
```

That's it! Your application is available at http://localhost:8080
(site) and http://localhost:18080 (server)



### Dev tasks

All dev required tasks could be executed from root of project using `rushx` tool.

#### Force all parts of the projects to be rebuilt
```bash
rush rebuild
```

#### Format all changed files

```bash
rushx format-diff
```

#### Lint all changed files

```bash
rushx lint-diff
```

#### Execute tests on modified projects

```bash
rushx test-diff
```

## Know issues

### MacOS on M1

If you have MacOS on M1 it needs to use Node.js 16.x for the project.

## Getting help

If you have questions, concerns, bug reports, etc, please file an issue in this repository's Issue Tracker.

## Getting involved and contributing
We are looking for contributors into the project. Please read our [CONTRIBUTING.md](CONTRIBUTING.md) document.

## License
Eclipse Public License - v 2.0

See [LICENSE](LICENSE)
