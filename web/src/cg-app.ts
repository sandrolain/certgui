import { LitElement, html } from "lit";
import { customElement, state } from "lit/decorators.js";
import type { AnalyzeResponse, VerifyChainResponse } from "./api.js";
import { analyzeFile, PasswordRequiredError, verifyChain } from "./api.js";
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
  verifyResult?: VerifyChainResponse | null;
}

@customElement("cg-app")
export class CgApp extends LitElement {
  override createRenderRoot() {
    return this;
  }

  @state() private files: FileEntry[] = [];
  @state() private selectedId: string | null = null;
  @state() private passwordPromptId: string | null = null;
  @state() private _isDragging = false;
  private _dragCounter = 0;

  private get selected(): FileEntry | undefined {
    return this.files.find((f) => f.id === this.selectedId);
  }

  override connectedCallback() {
    super.connectedCallback();
    document.addEventListener("dragenter", this._onGlobalDragEnter);
    document.addEventListener("dragleave", this._onGlobalDragLeave);
    document.addEventListener("dragover", this._onGlobalDragOver);
    document.addEventListener("drop", this._onGlobalDrop);
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    document.removeEventListener("dragenter", this._onGlobalDragEnter);
    document.removeEventListener("dragleave", this._onGlobalDragLeave);
    document.removeEventListener("dragover", this._onGlobalDragOver);
    document.removeEventListener("drop", this._onGlobalDrop);
  }

  private _onGlobalDragEnter = (e: DragEvent) => {
    if (e.dataTransfer?.types.includes("Files")) {
      this._dragCounter++;
      this._isDragging = true;
    }
  };

  private _onGlobalDragLeave = (_e: DragEvent) => {
    this._dragCounter = Math.max(0, this._dragCounter - 1);
    if (this._dragCounter === 0) this._isDragging = false;
  };

  private _onGlobalDragOver = (e: DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer) e.dataTransfer.dropEffect = "copy";
  };

  private _onGlobalDrop = (e: DragEvent) => {
    e.preventDefault();
    this._dragCounter = 0;
    this._isDragging = false;
    const files = e.dataTransfer?.files;
    if (files?.length) this._processFiles(files);
  };

  override render() {
    const otherFiles = this.files
      .filter(
        (f) =>
          f.id !== this.selectedId &&
          f.status === "done" &&
          f.result &&
          (f.result.type === "x509" ||
            f.result.type === "bundle" ||
            f.result.type === "pkcs7"),
      )
      .map((f) => f.file);

    return html`
      <cg-header @files-dropped=${this._onFilesDropped}></cg-header>

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
          .otherFiles=${otherFiles}
          @verify-chain=${this._onVerifyChain}
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
      ${this._isDragging
        ? html`
            <div
              class="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
              style="background: oklch(var(--p) / 0.15); border: 3px dashed oklch(var(--p));"
            >
              <div
                class="bg-base-100/90 rounded-2xl px-10 py-8 text-center shadow-xl"
              >
                <div class="text-4xl mb-3">📂</div>
                <p class="text-lg font-bold text-primary">
                  Drop files to analyse
                </p>
                <p class="text-sm text-base-content/50 mt-1">
                  PEM, DER, PKCS#12, PKCS#7, CSR, CRL, JWK…
                </p>
              </div>
            </div>
          `
        : ""}
    `;
  }

  private _onFilesDropped(e: CustomEvent<FileList>) {
    this._processFiles(e.detail);
  }

  private _processFiles(files: FileList) {
    const incoming: FileEntry[] = Array.from(files).map((file) => ({
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
      // Explicit 422 password-required signal from the backend.
      if (err instanceof PasswordRequiredError) {
        this.passwordPromptId = id;
        this._updateEntry(id, { status: "pending" });
        return;
      }
      const msg = err instanceof Error ? err.message : String(err);
      // Fallback heuristic for older-style error messages.
      if (
        msg.toLowerCase().includes("decryption") ||
        msg.toLowerCase().includes("password")
      ) {
        this.passwordPromptId = id;
        this._updateEntry(id, { status: "pending" });
      } else {
        this._updateEntry(id, { status: "error", error: msg });
      }
    }
  }

  private _updateEntry(id: string, patch: Partial<FileEntry>) {
    this.files = this.files.map((f) => (f.id === id ? { ...f, ...patch } : f));
  }

  private async _onVerifyChain() {
    const id = this.selectedId;
    if (!id) return;
    const entry = this.files.find((f) => f.id === id);
    if (!entry || entry.status !== "done") return;

    // Clear previous result while verifying.
    this._updateEntry(id, { verifyResult: null });

    const otherFiles = this.files
      .filter(
        (f) =>
          f.id !== id &&
          f.status === "done" &&
          f.result &&
          (f.result.type === "x509" ||
            f.result.type === "bundle" ||
            f.result.type === "pkcs7"),
      )
      .map((f) => f.file);

    try {
      const result = await verifyChain(entry.file, otherFiles);
      this._updateEntry(id, { verifyResult: result });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      this._updateEntry(id, {
        verifyResult: { valid: false, error: msg },
      });
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "cg-app": CgApp;
  }
}
