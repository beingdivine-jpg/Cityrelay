import type { AppState } from "./model";
import { loadState, saveState, STORAGE_KEY } from "./storage";

export const saveConflict =
  "Another tab changed this workspace. Download your current work, then reload the saved version from Account & backup.";

type StoragePort = Pick<Storage, "getItem" | "setItem">;

/** Coordinates local edits with queued updates from other browser tabs. */
export class WorkspacePersistence {
  private text: string | null;
  private saved: string;
  private current: AppState;
  private received = new WeakSet<AppState>();

  constructor(
    initial: AppState,
    private storage: StoragePort,
  ) {
    this.text = this.read();
    this.saved = JSON.stringify(initial);
    this.current = initial;
  }

  private read() {
    try {
      return this.storage.getItem(STORAGE_KEY);
    } catch {
      return null;
    }
  }

  observe(state: AppState) {
    this.current = state;
  }

  receive(raw: string | null): { state?: AppState; error?: string } {
    // An event may be older than the value already saved by its sender.
    if (!raw || raw !== this.read()) return {};
    const incoming = loadState({ getItem: () => raw });
    if (incoming.error) return {};
    // A previous incoming render is still clean, even if newer events arrived
    // before React finished rendering it. Real local edits remain protected.
    if (
      !this.received.has(this.current) &&
      JSON.stringify(this.current) !== this.saved
    )
      return { error: saveConflict };
    this.text = raw;
    this.saved = JSON.stringify(incoming.state);
    this.received.add(incoming.state);
    this.current = incoming.state;
    return { state: incoming.state };
  }

  save(state: AppState): string {
    // Never echo received snapshots back to storage, including delayed effects
    // from an older render. They could overwrite a newer agent checkpoint.
    if (this.received.has(state)) return "";
    if (this.read() !== this.text) return saveConflict;
    const error = saveState(state, this.storage);
    if (!error) {
      this.text = this.read();
      this.saved = JSON.stringify(state);
    }
    return error;
  }

  restore(state: AppState) {
    // Explicit recovery adopts the current disk version as its write baseline.
    // Unlike an incoming event, a restored backup must be written to storage.
    this.text = this.read();
    this.saved = JSON.stringify(state);
    this.current = state;
    this.received.delete(state);
  }
}
