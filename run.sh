#!/bin/bash

# with cron
#tsc && tsnd --respawn ./src/index.ts >> test.log 2>&1

tsc && tsnd ./src/index.ts >> test.log 2>&1 &
