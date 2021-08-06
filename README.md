# :art: Fableous

[![GitHub Actions Status](https://github.com/deco-finter/fableous/actions/workflows/build.yml/badge.svg)](https://github.com/deco-finter/fableous/actions/workflows/build.yml)

## Service

The application is divided into two parts:

|   Name    |  Code Name  | Stack                             |
| :-------: | :---------: | --------------------------------- |
| Back-end  | fableous-be | Go, Gin + Gorm, PostgreSQL, Redis |
| Front-end | fableous-fe | TypeScript, React                 |

## Develop

### fableous-be

`fableous-be` uses [Go Modules](https://blog.golang.org/using-go-modules) module/dependency manager, hence at least Go 1.11 is required. To ease development, [comstrek/air](https://github.com/cosmtrek/air) is used to live-reload the application. Install the tool as documented.

To begin developing, simply enter the sub-directory and run the development server:

```shell
$ cd fableous-be
$ go mod tidy
$ air
```

### fableous-fe

To begin developing, simply enter the sub-directory and run the development server:

```shell
$ cd fableous-fe
$ yarn
$ yarn start
```

## Deploy

Both `fableous-be` and `fableous-fe` are containerized and pushed to [Docker Hub](https://hub.docker.com/r/daystram/fableous). They are tagged based on their application name and version, e.g. `daystram/fableous:be` or `daystram/fableous:be-v1.1.0`.

To run `fableous-be`, run the following:

```shell
$ docker run --name fableous-be --env-file /path_to_env_file/.env -p 8080:8080 -d daystram/fableous:be
```

And `fableous-fe` as follows:

```shell
$ docker run --name fableous-fe -p 80:80 -d daystram/fableous:fe
```

### Dependencies

The following are required for `fableous-be` to function properly:

- PostgreSQL
- Redis

Their credentials must be provided in the environment variable.

### Docker Compose

For ease of deployment, the following docker-compose.yml file can be used to orchestrate the stack deployment:

```yml
version: "3"
services:
  fableous-be:
    image: daystram/fableous:be
    ports:
      - "8080:8080"
    env_file:
      - /path_to_env_file/.env
    depends_on:
      - "postgres"
      - "redis"
    restart: unless-stopped
  fableous-fe:
    image: daystram/fableous:fe
    ports:
      - "80:80"
    restart: unless-stopped
  postgres:
    image: postgres:13.3-alpine
    expose:
      - 5432
    volumes:
      - /path_to_postgres_data:/var/lib/postgresql/data
    restart: unless-stopped
  redis:
    image: redis:6.2-alpine
    expose:
      - 6379
    volumes:
      - /path_to_redis_data:/data
    restart: unless-stopped
```

### PostgreSQL UUID Extension

UUID support is also required in PostgreSQL. For modern PostgreSQL versions (9.1 and newer), the contrib module `uuid-ossp` can be enabled as follows:

```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```
