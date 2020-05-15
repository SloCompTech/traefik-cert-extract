#!/usr/bin/with-contenv bash

set -e
source $CONTAINER_VARS_FILE

if [ ! -d "/config/certs" ]; then
  $RUNCMD mkdir -p /config/certs
fi
