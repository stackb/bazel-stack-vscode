import * as vscode from 'vscode';
import { BazelDocFeature } from "./bazeldoc/feature";
import { BazelrcFeature } from "./bazelrc/feature";
import { BuildifierFeature } from "./buildifier/feature";
import { BzlFeature } from "./bzl/feature";
import { IExtensionFeature } from "./common";
import { StarlarkLSPFeature } from "./starlark/feature";

const features: IExtensionFeature[] = [
	new BuildifierFeature(),
	new BazelDocFeature(),
	new BazelrcFeature(),
	new StarlarkLSPFeature(),
	new BzlFeature(),
];

export function activate(ctx: vscode.ExtensionContext) {
	ctx.subscriptions.push(vscode.commands.registerCommand("bsv.openExtensionSetting", openExtensionSetting));

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

	feature.activate(ctx, config).catch(err => {
		vscode.window.showErrorMessage(
			`could not activate feature "${feature.name}": ${err}`,
		);
	});
}

/**
 * Options for the OpenSetting command
 */
type OpenSettingCommandOptions = {
	// The query string
	q: string,
};

async function openExtensionSetting(options: OpenSettingCommandOptions): Promise<any> {
	return vscode.commands.executeCommand("workbench.action.openSettings", options?.q);
}

function makeCommandURI(command: string, ...args: any[]) {
    const encoded = encodeURIComponent(JSON.stringify(args));
    return "command:" + command + "?" + encoded;
}
