# Traefik certificate extractor

Traefik certificate extractor extracts certificates (Let's encrypt) from *acme.json* and saves them into couple of *.pem* files so they can be used with other services.

## Install

``` bash
cd traefik-cert-extract
npm install
```

## Usage

``` text
$ ./main.js
Options:
  --help                  Show help                                    [boolean]
  --version               Show version number                          [boolean]
  -d, --directory         Output directory                   [string] [required]
  -e, --exclude           Exclude domain                   [array] [default: []]
  -f, --file              File that contains Traefik certificates
                                                             [string] [required]
  -i, --include           Include domain                   [array] [default: []]
  -r, --docker-restart    Restart docker containers with label tce.restart=true
                                                      [boolean] [default: false]
  -x, --exclude-provider  Exclude listed providers         [array] [default: []]
  -y, --include-provider  Only process listed providers    [array] [default: []]

Missing required arguments: d, f
```

## Docker

``` bash
docker run --name traefik-extractor \
  -v cert_vol:/config \
  -v traefik_vol:/data \
  -v /var/run/docker.socket:/var/run/docker.sock \
IMAGETAG
```

``` yaml
services:
  certs:
     image: slocomptech/traefik-cert-extractor
     volumes:
      - cert_vol:/config
      - traefik_vol:/data:ro
      - /var/run/docker.sock:/var/run/docker.sock
     restart: always
```

## Parameters

|**Parameter**|**Function**|
|:-----------:|:----------:|
|`-e ARGS="..."`|Add additional arguments for `main.js` script|
|`-e DOCKER_RESTART=true`|Enable docker restart on `acme.json` update (label: `tce.restart=true`)|
|`-e FILE=acme.json`|`acme.json` file path inside `/data` container volume|
|`-v $(pwd)/certs:/config`|Config volume (inside `certs` folder are certificates)|
|`-v $(pwd)/data:/data`|Traefik volume (folder inside which is acme.json|
|`-v /var/run/docker.sock:/var/run/docker.sock`|Enable access to docker (for container restart)|

See [upstream image](https://github.com/SloCompTech/docker-baseimage) for additional parameters.

## Config volume structure

``` text
certs
  example.org
    cert.pem
    chain.pem
    fullchain.pem
    privkey.pem
  sub.example.org
    cert.pem
    chain.pem
    fullchain.pem
    privkey.pem
```
