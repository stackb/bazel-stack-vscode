import { BazelStackVSCodeAPI } from 'bazel-stack-vscode-api';
import * as vscode from 'vscode';
import { API } from './api';
import { BazelDocFeature } from './bazeldoc/feature';
import { BazelrcFeature } from './bazelrc/feature';
import { BezelFeature } from './bezel/feature';
import { BuildifierFeature } from './buildifier/feature';
import { CommandName } from './bzl/constants';
import { BzlFeature } from './bzl/feature';
import { IExtensionFeature } from './common';
import { BuiltInCommands, Telemetry } from './constants';
import { Container } from './container';
import { StarlarkLSPFeature } from './starlark/feature';

const api = new API();

const features: IExtensionFeature[] = [
	new BuildifierFeature(),
	// new BazelDocFeature(),
	// new BazelrcFeature(api),
	// new StarlarkLSPFeature(),
	// new BzlFeature(api),
	new BezelFeature(api),
];

export function activate(ctx: vscode.ExtensionContext): BazelStackVSCodeAPI {
	Container.initialize(ctx);

	ctx.subscriptions.push(
		vscode.commands.registerCommand(CommandName.OpenSetting, openExtensionSetting));

	Container.telemetry.sendTelemetryEvent(Telemetry.ExtensionActivate);

	features.forEach(feature => setup(ctx, feature));

	return api;
}

export function deactivate() {
	features.forEach(feature => feature.deactivate());
	Container.telemetry.sendTelemetryEvent(Telemetry.ExtensionDeactivate);
	Container.dispose();
}

function setup(context: vscode.ExtensionContext, feature: IExtensionFeature) {

	context.subscriptions.push(vscode.workspace.onDidChangeConfiguration(async e => {
		if (e.affectsConfiguration(feature.name)) {
			reactivate(context, feature);
		}
	}));

	reactivate(context, feature);
}

function reactivate(context: vscode.ExtensionContext, feature: IExtensionFeature) {

	feature.deactivate();

	const config = vscode.workspace.getConfiguration(feature.name);
	if (!config.get<boolean>('enabled')) {
		console.log(`skipping feature ${feature.name} (not enabled)`);
		return;
	}

	feature.activate(context, config).catch(err => {
		vscode.window.showErrorMessage(
			`could not activate feature "${feature.name}": ${err}`,
		);
	});

	Container.telemetry.sendTelemetryEvent(Telemetry.FeatureActivate, {
		'feature': feature.name,
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
	return vscode.commands.executeCommand(BuiltInCommands.OpenSettings, options?.q);
}

