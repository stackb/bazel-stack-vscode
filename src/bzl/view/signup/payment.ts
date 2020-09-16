import * as vscode from 'vscode';
import { MultiStepInput } from '../../../multiStepInput';
import { Plan } from '../../../proto/build/stack/nucleate/v1beta/Plan';
import { AbstractInput } from './abstractInput';
import valid = require('card-validator');


export class PaymentCardInput extends AbstractInput<string> {

    async runInternal(input: MultiStepInput): Promise<boolean> {
        this.value = '';
        this.value = await input.showInputBox({
            title: this.title,
            step: this.step,
            totalSteps: this.total,
            value: this.value,
            prompt: 'Enter your Credit Card Number',
            validate: value => this.validate(value),
            shouldResume: this.shouldResume,
        });
        
        return this.value !== '';
    }

    async validate(value: string): Promise<string | undefined> {
        const result = valid.number(value);
        if (result.isValid) {
            return '';
        }
        return (result.isPotentiallyValid ? 'Incomplete ' : 'Invalid ') + (result.card ? result.card.type : 'card') + ' number';
    }

}


export class PaymentZipInput extends AbstractInput<string> {

    async runInternal(input: MultiStepInput): Promise<boolean> {
        this.value = '';
        this.value = await input.showInputBox({
            title: this.title,
            step: this.step,
            totalSteps: this.total,
            value: this.value,
            prompt: 'Enter your Zip Code',
            validate: value => this.validate(value),
            shouldResume: this.shouldResume,
        });
        
        return this.value !== '';
    }

    async validate(value: string): Promise<string | undefined> {
        return /\d\d\d\d\d/.test(value) ? '' : 'Invalid zip code';
    }

}


export class PaymentCVVInput extends AbstractInput<string> {

    async runInternal(input: MultiStepInput): Promise<boolean> {
        this.value = '';
        this.value = await input.showInputBox({
            title: this.title,
            step: this.step,
            totalSteps: this.total,
            value: this.value,
            prompt: 'Enter your Payment Card CVV Code (on the back)',
            validate: value => this.validate(value),
            shouldResume: this.shouldResume,
        });
        
        return this.value !== '';
    }

    async validate(value: string): Promise<string | undefined> {
        const validation = valid.cvv(value);
        if (validation.isValid) {
            return '';
        }
        return 'Invalid or incomplete CVV number';
    }

}


export class AuthorizationMethodInput extends AbstractInput<vscode.QuickPickItem> {

    async runInternal(input: MultiStepInput): Promise<boolean> {
        const items: vscode.QuickPickItem[] = [
            createQuickPickItem('GitHub', 'Login via GitHub (OAuth)', 'You\'ll will be prompted by GitHub to permit access to your username and email address'),
            createQuickPickItem('Email', 'Login via Email Address', 'Use traditional login username/password flow'),
            createQuickPickItem('Manual', 'Directly configure the token', 'Copy the value from your ~/.bzl/license.key to the feature.bzl.license.token'),
        ];
        
        this.value = await input.showQuickPick({
            title: this.title,
            step: this.step,
            totalSteps: this.total,
            placeholder: 'Select an authorization method',
            items: items,
            activeItem: this.value ? this.value : items[0],
            shouldResume: this.shouldResume,
        });
    
        return this.value !== undefined;
    }

}


export class PaymentExpirationMonthInput extends AbstractInput<vscode.QuickPickItem> {
    private monthByName = new Map<string,string>();
    constructor() {
        super();
    }

    public getExpMonthByName(name: string): string | undefined {
        return this.monthByName.get(name);
    }
    
    async runInternal(input: MultiStepInput): Promise<boolean> {
        const items = [
            'January',
            'Februrary',
            'March',
            'April',
            'May',
            'June',
            'July',
            'August',
            'September',
            'October',
            'November',
            'December',
        ].map((mo, index) => {
            this.monthByName.set(mo, `${index + 1}`);
            return createQuickPickItem(mo, `(${index + 1})`, '');
        });
    
        this.value = await input.showQuickPick({
            title: this.title,
            step: this.step,
            totalSteps: this.total,
            placeholder: 'Payment Card Expiration Month',
            items: items,
            activeItem: this.value ? this.value : items[0],
            shouldResume: this.shouldResume,
        });
    
        return this.value !== undefined;
    }

}


export class PaymentExpirationYearInput extends AbstractInput<vscode.QuickPickItem> {

    async runInternal(input: MultiStepInput): Promise<boolean> {
        const items = [
            '2020',
            '2021',
            '2022',
            '2023',
            '2024',
            '2025',
            '2026',
            '2027',
            '2028',
            '2029',
            '2030',
        ].map((year, index) => createQuickPickItem(year, `(${index + 1})`, ''));
    
        this.value = await input.showQuickPick({
            title: this.title,
            step: this.step,
            totalSteps: this.total,
            placeholder: 'Payment Card Expiration Year',
            items: items,
            activeItem: this.value ? this.value : items[0],
            shouldResume: this.shouldResume,
        });
    
        return this.value !== undefined;
    }

}


export class PaymentConfirmationInput extends AbstractInput<vscode.QuickPickItem> {

    constructor(
        protected plan: Plan,
        protected selectedCardProvider: () => string,
    ) {
        super();
    }

    async runInternal(input: MultiStepInput): Promise<boolean> {
        const card = this.selectedCardProvider();

        const items = [
            'Yes',
            'No',
        ].map((val) => createQuickPickItem(val, '', ''));
    
        this.value = await input.showQuickPick({
            title: this.title,
            step: this.step,
            totalSteps: this.total,
            placeholder: `Confirm '${this.plan.name}' (${this.plan.description}) with ${card}?`,
            items: items,
            activeItem: this.value ? this.value : items[0],
            shouldResume: this.shouldResume,
        });
    
        return this.value !== undefined;
    }

}


export class PaymentPlanInput extends AbstractInput<vscode.QuickPickItem> {
    private plansByName = new Map<string,Plan>();
    constructor(
        protected plans: Plan[],
    ) {
        super();
        const items = this.plans.forEach(plan => {
            this.plansByName.set(plan.name!, plan);
        });

    }

    public getPlanByName(name: string): Plan | undefined {
        return this.plansByName.get(name);
    }
    
    async runInternal(input: MultiStepInput): Promise<boolean> {
        const items = this.plans.map(plan => 
            createQuickPickItem(plan.name!, `${PaymentPlanInput.formatPlanAmount(plan.amount)}`, plan.description!));
        
        this.value = await input.showQuickPick({
            title: this.title,
            step: this.step,
            totalSteps: this.total,
            placeholder: 'Select a Subscription Plan',
            items: items,
            activeItem: this.value ? this.value : items[0],
            shouldResume: this.shouldResume,
        });
    
        return this.value !== undefined;
    }

    static formatPlanAmount(amount: Long | string | number | undefined): string {
        if (amount === undefined) {
            return '?';
        }
        if (typeof amount === 'string') {
            return amount;
        }
        if (typeof amount === 'number') {
            return `$${amount / 100}.00`;
        }
        return `$${amount.low / 100}.00`;
    }
    
}

function createQuickPickItem(label: string, description: string, detail: string): vscode.QuickPickItem {
    return {
        label: label,
        description: description,
        detail: detail,
    };
}

export class LoginUsernameInput extends AbstractInput<string> {

    async runInternal(input: MultiStepInput): Promise<boolean> {
        this.value = '';
        this.value = await input.showInputBox({
            title: this.title,
            step: this.step,
            totalSteps: this.total,
            value: this.value,
            prompt: 'Enter your login username',
            validate: value => this.validate(value),
            shouldResume: this.shouldResume,
        });
        
        return this.value !== '';
    }

    async validate(value: string): Promise<string | undefined> {
        return '';
    }

}


export class LoginPasswordInput extends AbstractInput<string> {

    async runInternal(input: MultiStepInput): Promise<boolean> {
        this.value = '';
        this.value = await input.showInputBox({
            title: this.title,
            step: this.step,
            totalSteps: this.total,
            value: this.value,
            prompt: 'Enter your login password',
            validate: value => this.validate(value),
            shouldResume: this.shouldResume,
        });
        
        return this.value !== '';
    }

    async validate(value: string): Promise<string | undefined> {
        return '';
    }

}
