# Anticrm Platform

[![Maintainability](https://api.codeclimate.com/v1/badges/5cb6d2d426619568816b/maintainability)](https://codeclimate.com/github/hardcoreeng/platform/maintainability) [![Test Coverage](https://api.codeclimate.com/v1/badges/5cb6d2d426619568816b/test_coverage)](https://codeclimate.com/github/hardcoreeng/platform/test_coverage)


## Running server

```bash
cd ./server/server
rushx dev
```

## Running ElasticSearch in docker:

```bash

docker run -p 9200:9200 -p 9300:9300 -e "discovery.type=single-node" docker.elastic.co/
elasticsearch/elasticsearch:7.13.1
