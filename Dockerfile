#
# Base image
# @see https://github.com/SloCompTech/docker-baseimage
#
FROM slocomptech/bi-node:12

# Install packages
RUN apk add --no-cache \
      inotify-tools

COPY package.json /app/
RUN cd /app && \
    sudo -u ${CONTAINER_USER} -g ${CONTAINER_USER} npm install

# Build arguments
ARG BUILD_DATE
ARG VCS_REF
ARG VCS_SRC
ARG VERSION

# 
# Image labels
# @see https://github.com/opencontainers/image-spec/blob/master/annotations.md
# @see https://semver.org/
#
LABEL org.opencontainers.image.title="Traefik certificate extractor" \
      org.opencontainers.image.description="Extracts cerificates from acme.json from Traefik config" \
      org.opencontainers.image.url="https://github.com/SloCompTech/traefik-cert-extract" \
      org.opencontainers.image.authors="Martin Dagarin <martin.dagarin@gmail.com>" \
      org.opencontainers.image.version=$VERSION \
      org.opencontainers.image.revision=$VCS_REF \
      org.opencontainers.image.source=$VCS_SRC \
      org.opencontainers.image.created=$BUILD_DATE

#
# Environment variables
#
ENV FILE=acme.json

# Add repo files to image
COPY root/ /

# Add application files
COPY LICENSE main.js /app/
