import { LitElement, html } from "lit";
import { customElement, property } from "lit/decorators.js";
import type { FileEntry } from "../cg-app.js";
import "./cg-cert-detail.js";

/**
 * Right-hand panel that displays the analysis result for the selected file.
 */
@customElement("cg-detail-panel")
export class CgDetailPanel extends LitElement {
  override createRenderRoot() {
    return this;
  }

  @property({ type: Object }) entry: FileEntry | undefined = undefined;

  override render() {
    if (!this.entry) {
      return html`
        <div
          class="flex items-center justify-center h-full text-base-content/30 text-sm"
        >
          Select a file from the list to see details.
        </div>
      `;
    }

    const { status, error, result } = this.entry;

    if (status === "loading") {
      return html`
        <div
          class="flex items-center justify-center h-full gap-2 text-base-content/50"
        >
          <span class="loading loading-spinner loading-md"></span>
          Analysing…
        </div>
      `;
    }

    if (status === "error" || !result) {
      return html`
        <div class="p-6">
          <div class="alert alert-error">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="stroke-current shrink-0 h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>${error ?? "Unknown error"}</span>
          </div>
        </div>
      `;
    }

    return html`
      <div class="p-4">
        <cg-cert-detail
          .response=${result}
          .filename=${this.entry.file.name}
          .file=${this.entry.file}
        ></cg-cert-detail>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "cg-detail-panel": CgDetailPanel;
  }
}
