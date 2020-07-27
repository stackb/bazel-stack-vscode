import * as vscode from 'vscode';
import { IExtensionFeature } from "./common";
import { BuildifierFeature } from "./buildifier/feature";
import { BazelDocFeature } from "./bazeldoc/feature";
import { StardocFeature } from "./stardoc/feature";
import { BezelFeature } from "./bezel/feature";

const features: IExtensionFeature[] = [
	new BuildifierFeature(),
	new BazelDocFeature(),
	new StardocFeature(),
	new BezelFeature(),
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