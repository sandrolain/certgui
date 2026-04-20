import { LitElement, html } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import type { Severity } from "../api.js";

/**
 * Small badge showing an issue count for a given severity level.
 */
@customElement("cg-issue-badge")
export class CgIssueBadge extends LitElement {
  override createRenderRoot() {
    return this;
  }

  @property({ type: String }) severity: Severity = "info";
  @property({ type: Number }) count = 0;

  override render() {
    const cls =
      this.severity === "error"
        ? "badge-error"
        : this.severity === "warning"
          ? "badge-warning"
          : "badge-info";

    return html`<span class="badge ${cls} badge-xs">${this.count}</span>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "cg-issue-badge": CgIssueBadge;
  }
}

// ── cg-copy-button ────────────────────────────────────────────────────────────

/**
 * A small icon button that copies `text` to the clipboard.
 */
@customElement("cg-copy-button")
export class CgCopyButton extends LitElement {
  override createRenderRoot() {
    return this;
  }

  @property({ type: String }) text = "";
  @state() private _copied = false;

  override render() {
    return html`
      <button class="btn btn-ghost btn-xs" title="Copy" @click=${this._copy}>
        ${this._copied ? "✓" : "⎘"}
      </button>
    `;
  }

  private async _copy() {
    if (!this.text) return;
    await navigator.clipboard.writeText(this.text);
    this._copied = true;
    setTimeout(() => {
      this._copied = false;
    }, 1500);
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "cg-copy-button": CgCopyButton;
  }
}
