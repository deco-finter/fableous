# :art: Fableous

[![GitHub Actions Status](https://github.com/deco-finter/fableous/actions/workflows/build-backend.yml/badge.svg)](https://github.com/deco-finter/fableous/actions/workflows/build-backend.yml)
[![GitHub Actions Status](https://github.com/deco-finter/fableous/actions/workflows/build-frontend.yml/badge.svg)](https://github.com/deco-finter/fableous/actions/workflows/build-frontend.yml)
[![Docker Pulls](https://img.shields.io/docker/pulls/daystram/fableous)](https://hub.docker.com/r/daystram/fableous)

## Service

The application is divided into two parts:

|   Name    |  Code Name  | Stack                      |
| :-------: | :---------: | -------------------------- |
| Back-end  | fableous-be | Go, Gin + Gorm, PostgreSQL |
| Front-end | fableous-fe | TypeScript, React          |

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

Their credentials must be provided in the environment variable.

### Helm Chart

To deploy to a Kubernetes cluster, Helm charts could be used. Add the [repository](https://charts.daystram.com):

```shell
$ helm repo add daystram https://charts.daystram.com
$ helm repo update
```

Ensure you have the secrets created for `fableous-be` by providing the secret name in `values.yaml`, or creating the secret from a populated `.env` file (make sure it is on the same namespace as `fableous` installation):

```shell
$ kubectl create secret generic secret-fableous-be --from-env-file=.env
```

And install `fableous`:

```shell
$ helm install fableous daystram/fableous
```

You can override the chart values by providing a `values.yaml` file via the `--values` flag.

Pre-release and development charts are accessible using the `--devel` flag. To isntall the development chart, provide the `--set image.tag=dev` flag, as development images are deployed with the suffix `dev`.

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
```

### PostgreSQL UUID Extension

UUID support is also required in PostgreSQL. For modern PostgreSQL versions (9.1 and newer), the contrib module `uuid-ossp` can be enabled as follows:

```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```
