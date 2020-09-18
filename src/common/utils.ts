import * as vscode from 'vscode';

export interface PromiseAdapter<T, U> {
	(
		value: T,
		resolve:
			(value?: U | PromiseLike<U>) => void,
		reject:
			(reason: any) => void
	): any;
}

const passthrough = (value: any, resolve: (value?: any) => void) => resolve(value);

/**
 * Return a promise that resolves with the next emitted event, or with some future
 * event as decided by an adapter.
 *
 * If specified, the adapter is a function that will be called with
 * `(event, resolve, reject)`. It will be called once per event until it resolves or
 * rejects.
 *
 * The default adapter is the passthrough function `(value, resolve) => resolve(value)`.
 *
 * @param event the event
 * @param adapter controls resolution of the returned promise
 * @returns a promise that resolves or rejects as specified by the adapter
 */
export async function promiseFromEvent<T, U>(
	event: vscode.Event<T>,
	adapter: PromiseAdapter<T, U> = passthrough): Promise<U> {
	let subscription: vscode.Disposable;
	return new Promise<U>((resolve, reject) =>
		subscription = event((value: T) => {
			try {
				Promise.resolve(adapter(value, resolve, reject))
					.catch(reject);
			} catch (error) {
				reject(error);
			}
		})
	).then(
		(result: U) => {
			subscription.dispose();
			return result;
		},
		error => {
			subscription.dispose();
			throw error;
		}
	);
}

export function getFileUriForLocation(location: string): vscode.Uri {
    const parts = location.split(':');
    let lineNo = '0';
    let colNo = '0';
    const len = parts.length;
    if (len > 2) {
        colNo = parts.pop() || '0';
    }
    if (len > 1) {
        lineNo = parts.pop() || '0';
    }
    const filename = parts.join(':');

    return vscode.Uri.file(filename).with({
        fragment: `${lineNo},${colNo}`,
    });
}