import * as vscode from 'vscode';
import { BazelDocFeature } from "./bazeldoc/feature";
import { BazelrcFeature } from "./bazelrc/feature";
import { BuildifierFeature } from "./buildifier/feature";
import { IExtensionFeature } from "./common";
import { StarlarkLSPFeature } from "./starlark/feature";

const features: IExtensionFeature[] = [
	new BuildifierFeature(),
	new BazelDocFeature(),
	new BazelrcFeature(),
	new StarlarkLSPFeature(),
];

export function activate(ctx: vscode.ExtensionContext) {
	features.forEach(feature => setup(ctx, feature));
}

export function deactivate() {
	features.forEach(feature => feature.deactivate());
}

function setup(ctx: vscode.ExtensionContext, feature: IExtensionFeature) {

	ctx.subscriptions.push(vscode.workspace.onDidChangeConfiguration(async e => {
		if (e.affectsConfiguration(feature.name)) {
			reactivate(ctx, feature);
		}
	}));

	reactivate(ctx, feature);
}

function reactivate(ctx: vscode.ExtensionContext, feature: IExtensionFeature) {

	feature.deactivate();

	const config = vscode.workspace.getConfiguration(feature.name);
	if (!config.get<boolean>("enabled")) {
		console.log(`skipping feature ${feature.name} (not enabled)`);
		return;
	}

	feature.activate(ctx, config).then(() => {
		console.info(`feature "${feature.name}" activated`);
	}).catch(err => {
		vscode.window.showErrorMessage(
			`could not activate feature "${feature.name}": ${err}`,
		);
	});
}