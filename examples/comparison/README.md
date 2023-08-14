First test with the original Directus image:

```sh
docker-compose --file docker-compose.original.yaml up
```

Stop the original, then test with the custom image:

```sh
docker-compose --file docker-compose.custom.yaml up
```

It should work exactly the same, but the custom image will be noticeably slower on the first run, but `directus-extension-computed-interface` will be available.
