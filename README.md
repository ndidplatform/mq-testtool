# mq-testtool
Performance test tool for mq

## Run in Docker

Required

- Docker CE 17.06+ [Install docker](https://docs.docker.com/install/)
- docker-compose 1.14.0+ [Install docker-compose](https://docs.docker.com/compose/install/)


### Run

The docker-compose will start with 1 host and 2 node for testing.
```
cd docker 
docker-compose up
```
You can add more node by edit example.bat script to generate more node.

### Build

```
cd docker
docker-compose -f docker-compose.build.yml build
```
