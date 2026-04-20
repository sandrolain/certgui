import { LitElement, html, css } from "lit";
import { customElement, property, state } from "lit/decorators.js";

/**
 * Raw PEM / DER / base64 decoder panel.
 * Accepts a File from drag-and-drop and displays the decoded hex / text view.
 */
@customElement("cg-raw-decoder")
export class CgRawDecoder extends LitElement {
  static override styles = css`
    :host {
      display: block;
    }
    pre {
      font-family: ui-monospace, "Cascadia Code", "Source Code Pro", Menlo, monospace;
      font-size: 0.75rem;
      white-space: pre-wrap;
      word-break: break-all;
    }
  `;

  @property({ type: Object }) file: File | undefined = undefined;
  @state() private _mode: "hex" | "text" | "base64" = "text";
  @state() private _content = "";
  @state() private _loading = false;

  override async updated(changed: Map<string, unknown>) {
    if (changed.has("file") && this.file) {
      await this._loadFile(this.file);
    }
  }

  override render() {
    if (!this.file) {
      return html`
        <div class="text-base-content/40 text-sm p-4">
          No file selected.
        </div>
      `;
    }

    return html`
      <div class="space-y-2">
        <div class="flex gap-1">
          ${(["text", "hex", "base64"] as const).map(
            (m) => html`
              <button
                class="btn btn-xs ${this._mode === m ? "btn-primary" : "btn-ghost"}"
                @click=${() => { this._mode = m; this._loadFile(this.file!); }}
              >${m}</button>
            `
          )}
          <span class="ml-auto text-xs text-base-content/40">${this.file.name} (${this.file.size} bytes)</span>
        </div>
        ${this._loading
          ? html`<span class="loading loading-spinner loading-sm"></span>`
          : html`<pre class="bg-base-200 rounded p-3 max-h-96 overflow-auto">${this._content}</pre>`}
      </div>
    `;
  }

  private async _loadFile(file: File) {
    this._loading = true;
    this._content = "";
    try {
      const buf = await file.arrayBuffer();
      const bytes = new Uint8Array(buf);
      switch (this._mode) {
        case "text":
          this._content = new TextDecoder().decode(bytes);
          break;
        case "hex":
          this._content = Array.from(bytes)
            .map((b, i) => (i % 16 === 0 ? `\n${i.toString(16).padStart(6, "0")}  ` : i % 8 === 0 ? "  " : " ") + b.toString(16).padStart(2, "0"))
            .join("")
            .trim();
          break;
        case "base64":
          this._content = btoa(String.fromCharCode(...bytes));
          break;
      }
    } finally {
      this._loading = false;
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "cg-raw-decoder": CgRawDecoder;
  }
}
