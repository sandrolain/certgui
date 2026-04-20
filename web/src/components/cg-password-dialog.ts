import { LitElement, html } from "lit";
import { customElement, state } from "lit/decorators.js";

/**
 * Modal dialog that prompts the user for a PKCS#12/PEM password.
 * Emits `password-submit` (detail: string) or `password-cancel`.
 */
@customElement("cg-password-dialog")
export class CgPasswordDialog extends LitElement {
  override createRenderRoot() {
    return this;
  }

  @state() private _value = "";

  override render() {
    return html`
      <dialog class="modal modal-open">
        <div class="modal-box">
          <h3 class="font-bold text-lg">Password required</h3>
          <p class="py-2 text-sm text-base-content/70">
            This file appears to be encrypted. Enter the password to decrypt it.
          </p>
          <input
            type="password"
            class="input input-bordered w-full"
            placeholder="Password"
            .value=${this._value}
            @input=${(e: InputEvent) => {
              this._value = (e.target as HTMLInputElement).value;
            }}
            @keydown=${this._onKeyDown}
            autofocus
          />
          <div class="modal-action">
            <button class="btn btn-ghost" @click=${this._cancel}>Cancel</button>
            <button class="btn btn-primary" @click=${this._submit}>
              Unlock
            </button>
          </div>
        </div>
        <div class="modal-backdrop bg-base-300/50" @click=${this._cancel}></div>
      </dialog>
    `;
  }

  private _onKeyDown(e: KeyboardEvent) {
    if (e.key === "Enter") this._submit();
    if (e.key === "Escape") this._cancel();
  }

  private _submit() {
    this.dispatchEvent(
      new CustomEvent("password-submit", {
        detail: this._value,
        bubbles: true,
        composed: true,
      }),
    );
    this._value = "";
  }

  private _cancel() {
    this.dispatchEvent(
      new CustomEvent("password-cancel", { bubbles: true, composed: true }),
    );
    this._value = "";
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "cg-password-dialog": CgPasswordDialog;
  }
}
