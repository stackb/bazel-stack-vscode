---
id: cache
title: subcommand 'cache'
---

The `cache` subcommand starts the Bzl remote cache.

## Flags

```sh
start the remote cache

Usage:
  bzl cache [flags]

Flags:
      --address strings                  bind URIs for the remote cache. (default [grpc://localhost:2020,http://localhost:2021])
      --dir string                       base directory for the disk cache.
  -h, --help                             help for cache
      --max_size_gb int                  size in GB for the disk cache. (default 10)
      --progress                         flag to enable progress on uploads
      --progress_threshold_size_kb int   only show progress bar for blobs later than given size (default 512)
```

By default the remote cache will bind to separate addresses and serve both HTTP and gRPC traffic.

### gRPC

To start only the gRPC cache (with progress bars):

```
bzl cache --address=grpc://localhost:2020 --progress
```

### HTTP

To start only the HTTP cache (with progress bars):

```
bzl cache --address=http://localhost:2021 --progress
```

