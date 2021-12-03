---
id: serve
title: subcommand 'serve'
---

The `serve` subcommand starts the "Bezel UI".

## Flags

```sh
Serve the UI

Usage:
  bzl serve [flags]

Aliases:
  serve, open

Flags:
      --address string                        bind address for HTTP and gRPC servers (overrides --{http,grpc}_{host,port}
      --base_dir string                       base directory where bzl caches data (defaults to {USER_CACHE_DIR}/bzl)
      --base_url string                       base URL where the HTTP service is running (optional, used for link generation)
      --grpc_host string                      default host for gRPC server (default "127.0.0.1")
      --grpc_port int                         port for the gRPC server (default 1080)
      --http_host string                      default host for http server (default "127.0.0.1")
      --http_port int                         port for the grpc-web http server (default 8080)
      --license_file string                   path to license.key (overrides canonical location ~/.bzl/license.key)
      --license_token string                  license token (content of the license file
      --log_level string                      optional log-level (debug|info|warn|trace) (default "info")
      --open_command string                   command to be invoked when opening files in IDE (defaults to vscode) (default "code --goto {FILE}:{LINE}:{COLUMN}")
```

The most commonly used flag is to change the listen address:

```sh
bzl serve --address=localhost:8085
```

### Serve

The `serve` command starts the webserver:

```
bzl serve
INFO[0000] Bezel v1.3.3 listening on http://localhost:8080
```

### Open

The `open` command starts the webserver and opens a browser tab at the given label:

```
bzl open //:gazelle-protobuf
```

![image](https://user-images.githubusercontent.com/50580/144551566-ca52a36f-9a32-4f79-be3a-45d6d6a5d4df.png)
