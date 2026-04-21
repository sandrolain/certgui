import { LitElement, html } from "lit";
import { customElement, property, state } from "lit/decorators.js";
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
  @property({ type: Array }) otherFiles: File[] = [];
  @property({ type: Array }) allFiles: FileEntry[] = [];
  @state() private _password = "";

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

    const { status, error, result, needsPassword } = this.entry;

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

    if (status === "pending" && needsPassword) {
      return html`
        <div class="p-6 flex items-start justify-center h-full">
          <div class="card bg-base-100 border border-base-300 w-full max-w-sm">
            <div class="card-body gap-4">
              <h3 class="card-title text-base">Password required</h3>
              <p class="text-sm text-base-content/60">
                <span class="font-medium">${this.entry.file.name}</span>
                is password-protected. Enter the password to inspect it.
              </p>
              <label
                class="input input-bordered flex items-center gap-2 w-full"
              >
                <input
                  type="password"
                  class="grow"
                  placeholder="Password"
                  .value=${this._password}
                  @input=${(e: InputEvent) => {
                    this._password = (e.target as HTMLInputElement).value;
                  }}
                  @keydown=${(e: KeyboardEvent) => {
                    if (e.key === "Enter") this._submitPassword();
                  }}
                  autofocus
                />
              </label>
              <div class="flex gap-2 justify-end">
                <button
                  class="btn btn-ghost btn-sm"
                  @click=${this._cancelPassword}
                >
                  Cancel
                </button>
                <button
                  class="btn btn-primary btn-sm"
                  @click=${this._submitPassword}
                >
                  Unlock
                </button>
              </div>
            </div>
          </div>
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
          .otherFiles=${this.otherFiles}
          .allFiles=${this.allFiles}
          .entryId=${this.entry.id}
          .verifyResult=${this.entry.verifyResult ?? undefined}
        ></cg-cert-detail>
      </div>
    `;
  }

  private _submitPassword() {
    const pw = this._password;
    this._password = "";
    this.dispatchEvent(
      new CustomEvent("password-submit", {
        detail: pw,
        bubbles: true,
        composed: true,
      }),
    );
  }

  private _cancelPassword() {
    this._password = "";
    this.dispatchEvent(
      new CustomEvent("password-cancel", { bubbles: true, composed: true }),
    );
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "cg-detail-panel": CgDetailPanel;
  }
}
