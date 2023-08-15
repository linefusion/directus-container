# Runtime Environment

- Uses Directus 10.5.3
- `node:20-alpine` as the base image
- Installing packages at runtime
  - `directus-extension-computed-interface`

```sh
docker run \
  --rm -it \
  -p 8055:8055 \
  -e NODE_PACKAGES=directus-extension-computed-interface \
  linefusion/directus:10.5.3-node20-alpine-runtime
```

```yaml
# docker-compose.yml
version: "3"
services:
  directus:
    image: linefusion/directus:10.5.3-node20-alpine-runtime
      NODE_PACKAGES: |
        directus-extension-computed-interface
    ports:
      - "8055:8055"
```

```sh
docker compose up
```
