class MemoryStorage implements Storage {
  private store = new Map<string, string>();

  /** Returns the number of keys currently stored. */
  get length(): number {
    return this.store.size;
  }

  /** Removes all key/value pairs from storage. */
  clear(): void {
    this.store.clear();
  }

  /** Reads a value by key, returning null when absent. */
  getItem(key: string): string | null {
    return this.store.has(key) ? this.store.get(key) ?? null : null;
  }

  /** Returns the key at the provided index, or null if out of range. */
  key(index: number): string | null {
    return Array.from(this.store.keys())[index] ?? null;
  }

  /** Deletes a value by key. */
  removeItem(key: string): void {
    this.store.delete(key);
  }

  /** Stores or replaces a value for a key. */
  setItem(key: string, value: string): void {
    this.store.set(key, value);
  }
}

Object.defineProperty(globalThis, "localStorage", {
  value: new MemoryStorage(),
  writable: true,
  configurable: true
});
