import { LitElement, html, css } from "lit";
import { customElement, state } from "lit/decorators.js";
import type { AnalyzeResponse } from "./api.js";
import { analyzeFile } from "./api.js";
import "./components/cg-header.js";
import "./components/cg-file-list.js";
import "./components/cg-detail-panel.js";
import "./components/cg-password-dialog.js";
import "./components/cg-diff-view.js";

export interface FileEntry {
  id: string;
  file: File;
  status: "pending" | "loading" | "done" | "error";
  result?: AnalyzeResponse;
  error?: string;
  password?: string;
}

@customElement("cg-app")
export class CgApp extends LitElement {
  // Use global Tailwind/DaisyUI styles, not shadow-DOM scoped styles.
  static override styles = css`
    :host {
      display: flex;
      flex-direction: column;
      height: 100dvh;
    }
  `;

  @state() private files: FileEntry[] = [];
  @state() private selectedId: string | null = null;
  @state() private passwordPromptId: string | null = null;

  private get selected(): FileEntry | undefined {
    return this.files.find((f) => f.id === this.selectedId);
  }

  override render() {
    return html`
      <cg-header
        @files-dropped=${this._onFilesDropped}
      ></cg-header>

      <div class="flex flex-1 overflow-hidden">
        <cg-file-list
          .files=${this.files}
          .selectedId=${this.selectedId}
          @file-selected=${this._onFileSelected}
          @file-removed=${this._onFileRemoved}
          class="w-72 shrink-0 border-r border-base-300 overflow-y-auto"
        ></cg-file-list>

        <cg-detail-panel
          .entry=${this.selected}
          class="flex-1 overflow-y-auto"
        ></cg-detail-panel>
      </div>

      ${this.passwordPromptId
        ? html`
            <cg-password-dialog
              @password-submit=${this._onPasswordSubmit}
              @password-cancel=${this._onPasswordCancel}
            ></cg-password-dialog>
          `
        : ""}
    `;
  }

  private _onFilesDropped(e: CustomEvent<FileList>) {
    const incoming: FileEntry[] = Array.from(e.detail).map((file) => ({
      id: crypto.randomUUID(),
      file,
      status: "pending",
    }));
    this.files = [...this.files, ...incoming];
    for (const entry of incoming) {
      this._analyze(entry.id);
    }
  }

  private _onFileSelected(e: CustomEvent<string>) {
    this.selectedId = e.detail;
  }

  private _onFileRemoved(e: CustomEvent<string>) {
    this.files = this.files.filter((f) => f.id !== e.detail);
    if (this.selectedId === e.detail) {
      this.selectedId = this.files[0]?.id ?? null;
    }
  }

  private _onPasswordSubmit(e: CustomEvent<string>) {
    const id = this.passwordPromptId;
    this.passwordPromptId = null;
    if (id) {
      this._updateEntry(id, { password: e.detail });
      this._analyze(id, e.detail);
    }
  }

  private _onPasswordCancel() {
    const id = this.passwordPromptId;
    this.passwordPromptId = null;
    if (id) {
      this._updateEntry(id, {
        status: "error",
        error: "Password required but not provided.",
      });
    }
  }

  private async _analyze(id: string, password?: string) {
    const entry = this.files.find((f) => f.id === id);
    if (!entry) return;

    this._updateEntry(id, { status: "loading" });

    try {
      const result = await analyzeFile(entry.file, password);
      this._updateEntry(id, { status: "done", result });
      if (this.selectedId === null) {
        this.selectedId = id;
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      // Heuristic: ask for password if the error suggests decryption failure.
      if (msg.toLowerCase().includes("decryption") || msg.toLowerCase().includes("password")) {
        this.passwordPromptId = id;
        this._updateEntry(id, { status: "pending" });
      } else {
        this._updateEntry(id, { status: "error", error: msg });
      }
    }
  }

  private _updateEntry(id: string, patch: Partial<FileEntry>) {
    this.files = this.files.map((f) =>
      f.id === id ? { ...f, ...patch } : f
    );
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "cg-app": CgApp;
  }
}
