import type { BoardDefinition } from "./boardSchema";

type SavedBoardRecord = {
  id: string;
  name: string;
  title: string;
  updatedAt: string;
  boardDefinition: BoardDefinition;
};

type SavedBoardSummary = Pick<SavedBoardRecord, "id" | "name" | "title" | "updatedAt">;

const databaseName = "jeopardy-board-storage";
const databaseVersion = 1;
const draftStoreName = "draftBoards";
const savedBoardsStoreName = "savedBoards";
const currentDraftKey = "current";

let databasePromise: Promise<IDBDatabase> | undefined;

async function saveDraftBoard(boardDefinition: BoardDefinition): Promise<void> {
  await withStore(draftStoreName, "readwrite", (store) =>
    waitForRequest(store.put(structuredClone(boardDefinition), currentDraftKey)),
  );
}

function loadDraftBoard(): Promise<BoardDefinition | undefined> {
  return withStore(draftStoreName, "readonly", async (store) => {
    const boardDefinition = await waitForRequest<BoardDefinition | undefined>(
      store.get(currentDraftKey),
    );
    return boardDefinition === undefined ? undefined : structuredClone(boardDefinition);
  });
}

function clearDraftBoard(): Promise<void> {
  return withStore(draftStoreName, "readwrite", (store) =>
    waitForRequest(store.delete(currentDraftKey)),
  );
}

async function saveNamedBoard(name: string, boardDefinition: BoardDefinition): Promise<string> {
  const id = createBoardId();
  const record: SavedBoardRecord = {
    id,
    name: name.trim(),
    title: boardDefinition.title,
    updatedAt: new Date().toISOString(),
    boardDefinition: structuredClone(boardDefinition),
  };

  await withStore(savedBoardsStoreName, "readwrite", (store) => waitForRequest(store.put(record)));
  return id;
}

function loadSavedBoard(id: string): Promise<SavedBoardRecord | undefined> {
  return withStore(savedBoardsStoreName, "readonly", async (store) => {
    const record = await waitForRequest<SavedBoardRecord | undefined>(store.get(id));
    return record === undefined ? undefined : structuredClone(record);
  });
}

function listSavedBoards(): Promise<SavedBoardSummary[]> {
  return withStore(savedBoardsStoreName, "readonly", async (store) => {
    const records = await waitForRequest<SavedBoardRecord[]>(store.getAll());

    return records
      .toSorted((left, right) => left.name.localeCompare(right.name))
      .map(({ id, name, title, updatedAt }) => ({ id, name, title, updatedAt }));
  });
}

function deleteSavedBoard(id: string): Promise<void> {
  return withStore(savedBoardsStoreName, "readwrite", (store) => waitForRequest(store.delete(id)));
}

async function withStore<TValue>(
  storeName: string,
  mode: IDBTransactionMode,
  operation: (store: IDBObjectStore) => Promise<TValue>,
): Promise<TValue> {
  const database = await getDatabase();
  const transaction = database.transaction(storeName, mode);
  const store = transaction.objectStore(storeName);
  return operation(store);
}

function getDatabase(): Promise<IDBDatabase> {
  if (databasePromise !== undefined) {
    return databasePromise;
  }

  if (typeof indexedDB === "undefined") {
    throw new Error("IndexedDB is not available in this browser.");
  }

  databasePromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(databaseName, databaseVersion);

    request.onupgradeneeded = () => {
      const database = request.result;

      if (!database.objectStoreNames.contains(draftStoreName)) {
        database.createObjectStore(draftStoreName);
      }

      if (!database.objectStoreNames.contains(savedBoardsStoreName)) {
        database.createObjectStore(savedBoardsStoreName, { keyPath: "id" });
      }
    };

    request.addEventListener("success", () => {
      resolve(request.result);
    });

    request.addEventListener("error", () => {
      reject(request.error ?? new Error("Could not open IndexedDB."));
    });
  });

  return databasePromise;
}

function waitForRequest<TValue>(request: IDBRequest<TValue>): Promise<TValue> {
  return new Promise((resolve, reject) => {
    request.addEventListener("success", () => {
      resolve(request.result);
    });

    request.addEventListener("error", () => {
      reject(request.error ?? new Error("IndexedDB request failed."));
    });
  });
}

function createBoardId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `board-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export type { SavedBoardRecord, SavedBoardSummary };
export {
  clearDraftBoard,
  deleteSavedBoard,
  listSavedBoards,
  loadDraftBoard,
  loadSavedBoard,
  saveDraftBoard,
  saveNamedBoard,
};
