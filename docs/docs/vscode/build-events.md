---
id: build-events
title: Build Events
---

The Build Events component configures the Build Event Protocol support.

The main purpose here is the **Usage** item that copies the build event flags
that you can use to stream build events from your terminal to the Build Results
UI.

By default, this is `--bes_backend=grpc://localhost:8085
--bes_results_url=http://localhost:8085/pipeline`.  Therefore, if you'd like to
examine the build events for any given build locally, run the following command:

```bash
bazel build //:gazelle-protobuf --bes_backend=grpc://localhost:8085 --bes_results_url=http://localhost:8085/pipeline
```

Preferably, this can go in your `.bazelrc`:

```bazelrc
build:bezel --bes_backend=grpc://localhost:8085 
build:bezel --bes_results_url=grpc://localhost:8085/pipeline
build:bezel --bes_timeout=5s
build:bezel --build_event_publish_all_actions
```

```bash
bazel build //:gazelle-protobuf --config=bezel
```

```sh
~/go/src/github.com/stackb/rules_proto $ bazel build //:gazelle-protobuf --bes_backend=grpc://localhost:8085 --bes_results_url=http://localhost:8085/pipeline
INFO: Invocation ID: 99633295-2f89-4e95-9241-4726b9a515a9
INFO: Streaming build results to: http://localhost:8085/pipeline/99633295-2f89-4e95-9241-4726b9a515a9
INFO: Analyzed target //:gazelle-protobuf (15 packages loaded, 7652 targets configured).
INFO: Found 1 target...
Target //:gazelle-protobuf up-to-date:
  bazel-bin/gazelle-protobuf_/gazelle-protobuf
INFO: Elapsed time: 16.046s, Critical Path: 12.94s
INFO: 51 processes: 6 internal, 45 darwin-sandbox.
INFO: Streaming build results to: http://localhost:8085/pipeline/99633295-2f89-4e95-9241-4726b9a515a9
INFO: Build completed successfully, 51 total actions
```

Then open the link (printed via bazel stderr):

![image](https://user-images.githubusercontent.com/50580/144539336-abcad8d8-e3ad-4087-ae36-34c1123509c0.png)

