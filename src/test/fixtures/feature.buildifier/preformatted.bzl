"""
A preformatted bzl file that should produce no edits on formatting.
"""

load("@bazel_tools//tools/build_defs/repo:http.bzl", "http_archive")

def foo():
    http_archive(
        name = "foo",
    )
