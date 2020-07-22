import * as vscode from 'vscode';
import { IExtensionFeature } from "./common";
import { BuildifierFeature } from "./buildifier/feature";
import { BazelDocFeature } from "./bazeldoc/feature";

const features: IExtensionFeature[] = [
	new BuildifierFeature(),
	new BazelDocFeature(),
];

export function activate(context: vscode.ExtensionContext): Promise<any> {
	return Promise.all(features.map(feature => setup(context, feature)));
}

export function deactivate() {
	features.forEach(feature => feature.deactivate());
}

function setup(context: vscode.ExtensionContext, feature: IExtensionFeature): Promise<any> {

	context.subscriptions.push(vscode.workspace.onDidChangeConfiguration(async e => {
		if (e.affectsConfiguration(feature.name)) {
			try {
				await reactivate();
			} catch (err) {
				vscode.window.showWarningMessage(
					`could not reactivate ${feature.name}: ${JSON.stringify(err)}`
				);
			}
		}
	}));

	return reactivate();

	function reactivate(): Promise<any> {
		feature.deactivate();
		const config = vscode.workspace.getConfiguration(feature.name);
		if (config.get<boolean>("enabled")) {
			console.log(`activating feature ${feature.name}`);
			return feature.activate(context, config);
		}
		console.log(`skipping feature ${feature.name} (not enabled)`);
		return Promise.resolve(`${feature.name} is disabled`);
	}
}
