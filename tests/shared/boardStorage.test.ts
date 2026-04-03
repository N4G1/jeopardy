import { beforeEach, describe, expect, test } from "vitest";

import type { BoardDefinition } from "src/features/setup/boardSchema";
import {
  clearDraftBoard,
  deleteSavedBoard,
  listSavedBoards,
  loadDraftBoard,
  loadSavedBoard,
  resetDatabaseConnection,
  saveDraftBoard,
  saveNamedBoard,
} from "src/features/setup/boardStorage";

function createBoardDefinition(): BoardDefinition {
  return {
    title: "Quiz Night",
    rowCount: 2,
    columnCount: 2,
    columnTitles: ["History", "Science"],
    clues: [
      {
        id: "c1",
        rowIndex: 0,
        columnIndex: 0,
        value: 100,
        prompt: "Question one",
        response: "Answer one",
      },
      {
        id: "c2",
        rowIndex: 0,
        columnIndex: 1,
        value: 100,
        prompt: "Question two",
        response: "Answer two",
      },
      {
        id: "c3",
        rowIndex: 1,
        columnIndex: 0,
        value: 200,
        prompt: "Question three",
        response: "Answer three",
      },
      {
        id: "c4",
        rowIndex: 1,
        columnIndex: 1,
        value: 200,
        prompt: "Question four",
        response: "Answer four",
      },
    ],
  };
}

type StoredValue = Record<string, unknown>;

class FakeIdbRequest<TValue> {
  result!: TValue;
  error: Error | null = null;
  onsuccess: ((event: Event) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  onupgradeneeded: ((event: Event) => void) | null = null;
  #listeners = new Map<string, Array<(event: Event) => void>>();

  addEventListener(type: string, listener: (event: Event) => void): void {
    const listeners = this.#listeners.get(type) ?? [];
    listeners.push(listener);
    this.#listeners.set(type, listeners);
  }

  succeed(result: TValue): void {
    this.result = result;
    queueMicrotask(() => {
      this.emit("success");
    });
  }

  emit(type: "success" | "error" | "upgradeneeded"): void {
    const event = new Event(type);

    if (type === "success") {
      this.onsuccess?.(event);
    }

    if (type === "error") {
      this.onerror?.(event);
    }

    if (type === "upgradeneeded") {
      this.onupgradeneeded?.(event);
    }

    for (const listener of this.#listeners.get(type) ?? []) {
      listener(event);
    }
  }
}

class FakeObjectStore {
  constructor(
    private readonly store: Map<string, StoredValue>,
    private readonly keyPath: string | null,
  ) {}

  put(value: StoredValue, key?: string): FakeIdbRequest<undefined> {
    const request = new FakeIdbRequest<undefined>();
    const resolvedKey =
      key ?? (this.keyPath === null ? undefined : String(value[this.keyPath] ?? ""));

    if (resolvedKey === undefined || resolvedKey.length === 0) {
      throw new Error("Missing key.");
    }

    this.store.set(resolvedKey, structuredClone(value));
    request.succeed(undefined);
    return request;
  }

  get(key: string): FakeIdbRequest<StoredValue | undefined> {
    const request = new FakeIdbRequest<StoredValue | undefined>();
    request.succeed(structuredClone(this.store.get(key)));
    return request;
  }

  getAll(): FakeIdbRequest<StoredValue[]> {
    const request = new FakeIdbRequest<StoredValue[]>();
    request.succeed(Array.from(this.store.values(), (value) => structuredClone(value)));
    return request;
  }

  delete(key: string): FakeIdbRequest<undefined> {
    const request = new FakeIdbRequest<undefined>();
    this.store.delete(key);
    request.succeed(undefined);
    return request;
  }
}

class FakeTransaction {
  constructor(private readonly stores: Map<string, Map<string, StoredValue>>) {}

  objectStore(name: string): FakeObjectStore {
    const store = this.stores.get(name);

    if (store === undefined) {
      throw new Error(`Unknown object store: ${name}`);
    }

    return new FakeObjectStore(store, name === "savedBoards" ? "id" : null);
  }
}

class FakeDatabase {
  readonly objectStoreNames = {
    contains: (name: string): boolean => this.stores.has(name),
  };

  constructor(private readonly stores: Map<string, Map<string, StoredValue>>) {}

  createObjectStore(name: string): FakeObjectStore {
    const store = new Map<string, StoredValue>();
    this.stores.set(name, store);
    return new FakeObjectStore(store, name === "savedBoards" ? "id" : null);
  }

  transaction(name: string, _mode: "readonly" | "readwrite"): FakeTransaction {
    return new FakeTransaction(this.stores);
  }
}

class FakeIndexedDbFactory {
  private readonly stores = new Map<string, Map<string, StoredValue>>();

  open(): FakeIdbRequest<FakeDatabase> {
    const request = new FakeIdbRequest<FakeDatabase>();
    const database = new FakeDatabase(this.stores);

    queueMicrotask(() => {
      request.result = database;
      request.emit("upgradeneeded");
      request.emit("success");
    });

    return request;
  }
}

beforeEach(async () => {
  resetDatabaseConnection();

  Object.defineProperty(globalThis, "indexedDB", {
    configurable: true,
    writable: true,
    value: new FakeIndexedDbFactory(),
  });

  await clearDraftBoard();
});

describe("boardStorage", () => {
  test("saves and loads the draft board", async () => {
    const boardDefinition = createBoardDefinition();

    await saveDraftBoard(boardDefinition);

    await expect(loadDraftBoard()).resolves.toEqual(boardDefinition);
  });

  test("saves a draft board passed as a proxy object", async () => {
    const boardDefinition = createBoardDefinition();
    const proxied = new Proxy(boardDefinition, {});

    await saveDraftBoard(proxied);

    await expect(loadDraftBoard()).resolves.toEqual(boardDefinition);
  });

  test("saves a named board passed as a proxy object", async () => {
    const boardDefinition = createBoardDefinition();
    const proxied = new Proxy(boardDefinition, {});

    const id = await saveNamedBoard("Proxy Quiz", proxied);
    const loaded = await loadSavedBoard(id);

    expect(loaded?.boardDefinition).toEqual(boardDefinition);
  });

  test("clears the draft board", async () => {
    await saveDraftBoard(createBoardDefinition());

    await clearDraftBoard();

    await expect(loadDraftBoard()).resolves.toBeUndefined();
  });

  test("saves, lists, loads, and deletes named boards", async () => {
    const boardDefinition = createBoardDefinition();

    const firstId = await saveNamedBoard("Friday Quiz", boardDefinition);
    const secondId = await saveNamedBoard("Saturday Quiz", {
      ...boardDefinition,
      title: "Saturday Quiz",
    });

    await expect(listSavedBoards()).resolves.toEqual([
      expect.objectContaining({ id: firstId, name: "Friday Quiz", title: "Quiz Night" }),
      expect.objectContaining({ id: secondId, name: "Saturday Quiz", title: "Saturday Quiz" }),
    ]);

    await expect(loadSavedBoard(firstId)).resolves.toEqual(
      expect.objectContaining({
        id: firstId,
        name: "Friday Quiz",
        boardDefinition,
      }),
    );

    await deleteSavedBoard(firstId);

    await expect(listSavedBoards()).resolves.toEqual([
      expect.objectContaining({ id: secondId, name: "Saturday Quiz" }),
    ]);
  });
});
