---
layout: default
title: Repositories
parent: Navigating
permalink: /navigating/repositories
nav_order: 1
---

## Repository Explorer

<p></p>

The repository explorer displays the available *repositories* on your filesystem (directories with
a `WORKSPACE` file).  Click on the repository to switch to that folder:

![repository-switch](https://user-images.githubusercontent.com/50580/95291803-81d98980-082d-11eb-9769-ece3d3dc57bb.gif)

Repositories are discovered by inspecting the processes on the machine so if you
don't see any populated in the view, try starting up a bazel server manually
(e.g., run `bazel info` in a repository).