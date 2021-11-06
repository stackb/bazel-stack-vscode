'use strict';

import vscode = require('vscode');
import { VSCodeWindowInputAPI } from '../../multiStepInput';

export class FakeVSCodeWindowInputAPI implements VSCodeWindowInputAPI {
    private _onDidCreateQuickPick = new vscode.EventEmitter<FakeQuickPick<any>>();
    private _onDidCreateInputBox = new vscode.EventEmitter<FakeInputBox>();

    /**
     * An event signaling when a quick pick was created.
     */
    readonly onDidCreateQuickPick: vscode.Event<FakeQuickPick<any>> = this._onDidCreateQuickPick.event;

    /**
     * An event signaling when an input box was created.
     */
    readonly onDidCreateInputBox: vscode.Event<FakeInputBox> = this._onDidCreateInputBox.event = this._onDidCreateInputBox.event;

    createQuickPick<T extends vscode.QuickPickItem>(): vscode.QuickPick<T> {
        const pick = new FakeQuickPick<T>();
        this._onDidCreateQuickPick.fire(pick);
        return pick;
    }

    createInputBox(): vscode.InputBox {
        const box = new FakeInputBox();
        this._onDidCreateInputBox.fire(box);
        return box;
    }
}

class FakeQuickInput implements vscode.QuickInput {
    private _onDidHide = new vscode.EventEmitter<void>();

    /**
     * An optional title.
     */
    title: string | undefined;

    /**
     * An optional current step count.
     */
    step: number | undefined;

    /**
     * An optional total step count.
     */
    totalSteps: number | undefined;

    /**
     * If the UI should allow for user input. Defaults to true.
     *
     * Change this to false, e.g., while validating user input or
     * loading data for the next step in user input.
     */
    enabled: boolean = true;

    /**
     * If the UI should show a progress indicator. Defaults to false.
     *
     * Change this to true, e.g., while loading more data or validating user
     * input.
     */
    busy: boolean = false;

    /**
     * If the UI should stay open even when loosing UI focus. Defaults to false.
     */
    ignoreFocusOut: boolean = false;

    /**
     * Makes the input UI visible in its current configuration. Any other input
     * UI will first fire an [QuickInput.onDidHide](#QuickInput.onDidHide)
     * event.
     */
    show(): void {
        // fire an event here?
    }

    /**
     * Hides this input UI. This will also fire an
     * [QuickInput.onDidHide](#QuickInput.onDidHide) event.
     */
    hide(): void {
        this._onDidHide.fire();
    }

    /**
     * An event signaling when this input UI is hidden.
     *
     * There are several reasons why this UI might have to be hidden and the
     * extension will be notified through
     * [QuickInput.onDidHide](#QuickInput.onDidHide). (Examples include: an
     * explicit call to [QuickInput.hide](#QuickInput.hide), the user pressing
     * Esc, some other input UI opening, etc.)
     */
    onDidHide: vscode.Event<void> = this._onDidHide.event;

    /**
     * Dispose of this input UI and any associated resources. If it is still
     * visible, it is first hidden. After this call the input UI is no longer
     * functional and no additional methods or properties on it should be
     * accessed. Instead a new input UI should be created.
     */
    dispose(): void {
    }
}

/**
 * A concrete [QuickInput](#QuickInput) to let the user pick an item from a list
 * of items of type T. The items can be filtered through a filter text field and
 * there is an option [canSelectMany](#QuickPick.canSelectMany) to allow for
 * selecting multiple items.
 *
 * Note that in many cases the more convenient
 * [window.showQuickPick](#window.showQuickPick) is easier to use.
 * [window.createQuickPick](#window.createQuickPick) should be used when
 * [window.showQuickPick](#window.showQuickPick) does not offer the required
 * flexibility.
 */
export class FakeQuickPick<T extends vscode.QuickPickItem> extends FakeQuickInput implements vscode.QuickPick<T> {
    private _onDidChangeValue = new vscode.EventEmitter<string>();
    private _onDidAccept = new vscode.EventEmitter<void>();
    private _onDidTriggerButton = new vscode.EventEmitter<vscode.QuickInputButton>();
    private _onDidChangeActive = new vscode.EventEmitter<T[]>();
    private _onDidChangeSelection = new vscode.EventEmitter<T[]>();

    /**
     * An event signaling when the value of the filter text has changed.
     */
    readonly onDidChangeValue: vscode.Event<string> = this._onDidChangeValue.event;
    /**
     * An event signaling when the user indicated acceptance of the selected
     * item(s).
     */
    readonly onDidAccept: vscode.Event<void> = this._onDidAccept.event;
    /**
     * An event signaling when a button was triggered.
     */
    readonly onDidTriggerButton: vscode.Event<vscode.QuickInputButton> = this._onDidTriggerButton.event;
    /**
     * An event signaling when the active items have changed.
     */
    readonly onDidChangeActive: vscode.Event<T[]> = this._onDidChangeActive.event;
    /**
     * An event signaling when the selected items have changed.
     */
    readonly onDidChangeSelection: vscode.Event<T[]> = this._onDidChangeSelection.event;

    /**
    * Current value of the filter text.
    */
    public value: string = '';

    /**
     * Optional placeholder in the filter text.
     */
    public placeholder: string | undefined;

    /**
     * If multiple items can be selected at the same time. Defaults to false.
     */
    public canSelectMany: boolean = false;

    /**
     * If the filter text should also be matched against the description of the
     * items. Defaults to false.
     */
    public matchOnDescription: boolean = false;

    /**
     * If the filter text should also be matched against the detail of the
     * items. Defaults to false.
     */
    public matchOnDetail: boolean = false;

    /**
     * Active items. This can be read and updated by the extension.
     */
    public activeItems: ReadonlyArray<T> = [];

    /**
     * Selected items. This can be read and updated by the extension.
     */
    public selectedItems: ReadonlyArray<T> = [];

    /**
     * Buttons for actions in the UI.
     */
    public buttons: ReadonlyArray<vscode.QuickInputButton> = [];

    /**
     * Items to pick from.
     */
    public items: ReadonlyArray<T> = [];
}

/**
 * A concrete [QuickInput](#QuickInput) to let the user input a text value.
 *
 * Note that in many cases the more convenient
 * [window.showInputBox](#window.showInputBox) is easier to use.
 * [window.createInputBox](#window.createInputBox) should be used when
 * [window.showInputBox](#window.showInputBox) does not offer the required
 * flexibility.
 */
class FakeInputBox extends FakeQuickInput implements vscode.InputBox {
    private _onDidChangeValue = new vscode.EventEmitter<string>();
    private _onDidAccept = new vscode.EventEmitter<void>();
    private _onDidTriggerButton = new vscode.EventEmitter<vscode.QuickInputButton>();

    /**
     * Current input value.
     */
    value: string = '';

    /**
     * Optional placeholder in the filter text.
     */
    placeholder: string | undefined;

    /**
     * If the input value should be hidden. Defaults to false.
     */
    password: boolean = false;

    /**
     * An event signaling when the value has changed.
     */
    readonly onDidChangeValue: vscode.Event<string> = this._onDidChangeValue.event;

    /**
     * An event signaling when the user indicated acceptance of the input value.
     */
    readonly onDidAccept: vscode.Event<void> = this._onDidAccept.event;

    /**
     * Buttons for actions in the UI.
     */
    buttons: ReadonlyArray<vscode.QuickInputButton> = [];

    /**
     * An event signaling when a button was triggered.
     */
    readonly onDidTriggerButton: vscode.Event<vscode.QuickInputButton> = this._onDidTriggerButton.event;

    /**
     * An optional prompt text providing some ask or explanation to the user.
     */
    prompt: string | undefined;

    /**
     * An optional validation message indicating a problem with the current
     * input value.
     */
    validationMessage: string | undefined;
}

