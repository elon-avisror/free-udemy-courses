#!/bin/bash

tsc && tsnd ./src/index.ts >> console.log 2>&1 &
