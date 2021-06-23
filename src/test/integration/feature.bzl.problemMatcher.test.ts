'use strict';

import {
  ProblemMatcherTest,
  ProblemMatcherTestRunner,
} from 'bazel-stack-vscode-api/out/test/problemMatcherTestRunner';
import { describe, it } from 'mocha';
import * as path from 'path';
import * as vscode from 'vscode';
import { markers } from 'vscode-common';
import { BzlFeatureName } from '../../bzl/feature';

describe(BzlFeatureName + ' Problems', function () {
  this.timeout(60 * 1000);

  let runner: ProblemMatcherTestRunner;

  this.beforeAll(() => {
    runner = ProblemMatcherTestRunner.fromPackageJson(
      path.join(__dirname, '..', '..', '..', 'package.json')
    );
  });

  const cases: ProblemMatcherTest[] = [
    {
      name: 'bazel',
      example:
        'ERROR: C:/users/develop/_bazel_develop/jwzepo2u/external/com_github_gflags_gflags/BUILD:16:30: Executing genrule @com_github_gflags_gflags//:gflags_completions_h failed (Exit -1). Note: Remote connection/protocol failed with: execution failed',
      uri: 'file:///c%3A/users/develop/_bazel_develop/jwzepo2u/external/com_github_gflags_gflags/BUILD',
      markers: [
        {
          message:
            'Executing genrule @com_github_gflags_gflags//:gflags_completions_h failed (Exit -1). Note: Remote connection/protocol failed with: execution failed',
          owner: 'bazel',
          resource: vscode.Uri.file(
            'C:/users/develop/_bazel_develop/jwzepo2u/external/com_github_gflags_gflags/BUILD'
          ),
          severity: markers.MarkerSeverity.Error,
          startLineNumber: 16,
          startColumn: 30,
          endLineNumber: 16,
          endColumn: 30,
        },
      ],
    },
    {
      d: 'should not match (not actionable - no line number)',
      name: 'bazel',
      example: "WARNING: failed to create one or more convenience symlinks for prefix 'bazel-':",
      markers: [],
    },
  ];

  cases.forEach(tc => {
    it(tc.d || tc.name, async () => runner.test(tc));
  });
});

// 	const cases: ProblemMatcherTest[] = [
// 		{
// 			d: 'should be empty with empty line',
// 			type: 'ProtoCompile',
// 			input: '',
// 			markers: [],
// 		},
// 		{
// 			d: 'ProtoCompile should match error',
// 			type: 'ProtoCompile',
// 			input: 'proto/example.proto:111:17: Field number 5 has already been used in "foo.Message" by field "finished"',
// 			uri: 'file:///%24%7BworkspaceRoot%7D/proto/example.proto',
// 			markers: [{
// 				message: 'Field number 5 has already been used in "foo.Message" by field "finished"',
// 				owner: '',
// 				resource: vscode.Uri.file('proto/example.proto'),
// 				severity: markers.MarkerSeverity.Error,
// 				startLineNumber: 111,
// 				startColumn: 17,
// 				endColumn: 17,
// 				endLineNumber: 111,
// 			}],
// 		},
// 		{
// 			d: 'GoCompilePkg should match error',
// 			type: 'GoCompilePkg',
// 			input: 'proto/example.proto:111:17: Field number 5 has already been used in "foo.Message" by field "finished"',
// 			uri: 'file:///%24%7BworkspaceRoot%7D/proto/example.proto',
// 			markers: [{
// 				message: 'Field number 5 has already been used in "foo.Message" by field "finished"',
// 				owner: '',
// 				resource: vscode.Uri.file('example.go'),
// 				severity: markers.MarkerSeverity.Error,
// 				startLineNumber: 111,
// 				startColumn: 17,
// 				endColumn: 17,
// 				endLineNumber: 111,
// 			}],
// 		},
// 		{
// 			d: 'GoCompilePkg should match error',
// 			type: 'Action (for java_library the mnemonic is "Action"?',
// 			input: 'ERROR: C:/users/develop/_bazel_develop/nn5khlmn/external/bazel_tools/tools/jdk/BUILD:350:14: Action external/bazel_tools/tools/jdk/platformclasspath.jar failed (Exit 1)',
// 			markers: [{
// 				message: 'Action external/bazel_tools/tools/jdk/platformclasspath.jar failed (Exit 1)',
// 				owner: '',
// 				resource: vscode.Uri.file('example.go'),
// 				severity: markers.MarkerSeverity.Error,
// 				startLineNumber: 111,
// 				startColumn: 17,
// 				endColumn: 17,
// 				endLineNumber: 111,
// 			}],
// 		}
// 	];

// 	cases.forEach((tc) => {
// 		it(tc.d, async () => {
// 			const data = Buffer.from(tc.input);
// 			const matcher = api.get(tc.type);
// 			if (!matcher) {
// 				fail(`matcher ${tc.type} not found`);
// 			}
// 			const mrkrs = new markerService.MarkerService();
// 			const problems = new Map<vscode.Uri,markers.IMarker[]>();
// 			await collectProblems(tc.type, matcher, data, mrkrs, problems);
// 			if (tc.uri) {
// 				expect(problems.size).to.eql(1);
// 				problems.forEach((markers, uri) => {
// 					expect(uri.toString()).to.eql(tc.uri);
// 					expect(markers).to.have.length(1);
// 					expect(markers).to.have.length(tc.markers.length);
// 					const expected = tc.markers[0];
// 					const actual = markers[0];
// 					// expect(actual.owner, 'owner').to.eql(expected.owner);
// 					// expect(actual.resource, 'resource').to.eq(expected.resource);
// 					expect(actual.severity, 'severity').to.eql(expected.severity);
// 					expect(actual.code, 'code').to.eql(expected.code);
// 					expect(actual.message, 'message').to.eql(expected.message);
// 					expect(actual.source, 'source').to.eql(expected.source);
// 					expect(actual.startLineNumber, 'startlineNumber').to.eql(expected.startLineNumber);
// 					expect(actual.startColumn, 'startcolumn').to.eql(expected.startColumn);
// 					expect(actual.endLineNumber, 'endlinenumber').to.eql(expected.endLineNumber);
// 					expect(actual.endColumn, 'endcolumn').to.eql(expected.endColumn);
// 				});
// 			} else {
// 				expect(problems.size).to.eql(0);
// 			}
// 			// markerService.dispose();
// 		});
// 	});
// });
