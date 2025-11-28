#!/bin/sh

# Run migrations
# We need to ensure the prisma CLI is available.
# If it's not in node_modules (because of standalone build), we might fail here.
# Assuming we fix Dockerfile to include it or install it.
echo "Running database migrations..."
# Use the direct path to the prisma CLI script since we didn't copy .bin folder
node node_modules/prisma/build/index.js migrate deploy

# Check if migration failed
if [ $? -ne 0 ]; then
  echo "Migration failed. Exiting..."
  exit 1
fi

echo "Starting Next.js application..."
node server.js
