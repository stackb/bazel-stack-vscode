import * as vscode from 'vscode';

/**
 * A memento represents a storage utility. It can store and retrieve
 * values.
 */
export class FakeMemento implements vscode.Memento {
    private store: Map<string, any> = new Map();

    /**
     * Return a value.
     *
     * @param key A string.
     * @param defaultValue A value that should be returned when there is no
     * value (`undefined`) with the given key.
     * @return The stored value or the defaultValue.
     */
    get<T>(key: string, defaultValue?: T): T {
        if (this.store.get(key) !== undefined) {
            return this.store.get(key);
        }
        return defaultValue!;
    }

    /**
     * Store a value. The value must be JSON-stringifyable.
     *
     * @param key A string.
     * @param value A value. MUST not contain cyclic references.
     */
    async update(key: string, value: any): Promise<void> {
        this.store.set(key, value);
    }
}
