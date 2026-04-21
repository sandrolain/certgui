import { LitElement, html } from "lit";
import { customElement, property } from "lit/decorators.js";
import type { FileEntry } from "../cg-app.js";
import "./cg-issue-badge.js";

/**
 * Sidebar list of loaded files.
 * Emits `file-selected` (detail: id) and `file-removed` (detail: id).
 */
@customElement("cg-file-list")
export class CgFileList extends LitElement {
  override createRenderRoot() {
    return this;
  }

  @property({ type: Array }) files: FileEntry[] = [];
  @property({ type: String }) selectedId: string | null = null;

  override render() {
    if (this.files.length === 0) {
      return html`
        <div
          class="flex flex-col items-center justify-center h-full text-base-content/40 p-6 text-center text-sm"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="w-12 h-12 mb-3 opacity-30"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="1.5"
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          Drop or open certificate files to inspect them.
        </div>
      `;
    }

    return html`
      <ul class="menu menu-sm p-2 w-full">
        ${this.files.map((f) => this._renderItem(f))}
      </ul>
    `;
  }

  private _renderItem(f: FileEntry) {
    const active = f.id === this.selectedId;
    const errorCount =
      f.result?.issues.filter((i) => i.severity === "error").length ?? 0;
    const warnCount =
      f.result?.issues.filter((i) => i.severity === "warning").length ?? 0;

    return html`
      <li>
        <a
          class="w-full flex items-center gap-2 ${active
            ? "bg-base-300 text-base-content font-medium"
            : ""}"
          @click=${() => this._select(f.id)}
        >
          ${this._statusIcon(f)}
          <span class="truncate flex-1 min-w-0">${f.file.name}</span>
          ${f.status === "done"
            ? html`
                ${errorCount > 0
                  ? html`<cg-issue-badge
                      severity="error"
                      count=${errorCount}
                    ></cg-issue-badge>`
                  : ""}
                ${warnCount > 0
                  ? html`<cg-issue-badge
                      severity="warning"
                      count=${warnCount}
                    ></cg-issue-badge>`
                  : ""}
              `
            : ""}
          <button
            class="btn btn-ghost btn-xs ml-auto"
            title="Remove"
            @click=${(e: Event) => {
              e.stopPropagation();
              this._remove(f.id);
            }}
          >
            ✕
          </button>
        </a>
      </li>
    `;
  }

  private _statusIcon(f: FileEntry) {
    switch (f.status) {
      case "loading":
        return html`<span class="loading loading-spinner loading-xs"></span>`;
      case "error":
        return html`<span class="text-error" title=${f.error ?? ""}>⚠</span>`;
      case "done":
        return html`<span class="text-success">✓</span>`;
      default:
        return html`<span class="opacity-30">○</span>`;
    }
  }

  private _select(id: string) {
    this.dispatchEvent(
      new CustomEvent("file-selected", {
        detail: id,
        bubbles: true,
        composed: true,
      }),
    );
  }

  private _remove(id: string) {
    this.dispatchEvent(
      new CustomEvent("file-removed", {
        detail: id,
        bubbles: true,
        composed: true,
      }),
    );
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "cg-file-list": CgFileList;
  }
}
