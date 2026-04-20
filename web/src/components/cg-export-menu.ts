import { LitElement, html, css } from "lit";
import { customElement, property } from "lit/decorators.js";
import type { AnalyzeResponse } from "../api.js";

/**
 * Export menu that offers JSON and YAML download of the current analysis result.
 *
 * YAML serialisation is done client-side without an external library by
 * converting the JSON payload to a human-readable YAML-like string. A full
 * js-yaml integration can replace _toYAML() if desired.
 */
@customElement("cg-export-menu")
export class CgExportMenu extends LitElement {
  static override styles = css`
    :host {
      display: inline-block;
    }
  `;

  @property({ type: Object }) response: AnalyzeResponse | undefined = undefined;
  @property({ type: String }) filename = "export";

  override render() {
    return html`
      <div class="dropdown dropdown-end">
        <label tabindex="0" class="btn btn-sm btn-outline gap-1">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Export
        </label>
        <ul tabindex="0" class="dropdown-content z-10 menu p-2 shadow bg-base-100 rounded-box w-40 border border-base-300">
          <li><a @click=${() => this._download("json")}>JSON</a></li>
          <li><a @click=${() => this._download("yaml")}>YAML</a></li>
        </ul>
      </div>
    `;
  }

  private _download(format: "json" | "yaml") {
    if (!this.response) return;

    const content =
      format === "json"
        ? JSON.stringify(this.response, null, 2)
        : this._toYAML(this.response);

    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${this.filename}.${format}`;
    a.click();
    URL.revokeObjectURL(url);
  }

  /** Minimal JSON-to-YAML converter for plain objects/arrays. */
  private _toYAML(obj: unknown, indent = 0): string {
    const pad = "  ".repeat(indent);
    if (obj === null || obj === undefined) return "null";
    if (typeof obj === "boolean") return String(obj);
    if (typeof obj === "number") return String(obj);
    if (typeof obj === "string") {
      // Quote strings containing special chars.
      if (/[:#\[\]{},|>&*!'"@`%]/.test(obj) || obj.includes("\n")) {
        return JSON.stringify(obj);
      }
      return obj;
    }
    if (Array.isArray(obj)) {
      if (obj.length === 0) return "[]";
      return obj
        .map((item) => `\n${pad}- ${this._toYAML(item, indent + 1).trimStart()}`)
        .join("");
    }
    if (typeof obj === "object") {
      const entries = Object.entries(obj as Record<string, unknown>);
      if (entries.length === 0) return "{}";
      return entries
        .map(([k, v]) => {
          const val = this._toYAML(v, indent + 1);
          const isComplex = typeof v === "object" && v !== null && !Array.isArray(v);
          return `\n${pad}${k}:${isComplex ? val : " " + val}`;
        })
        .join("");
    }
    return String(obj);
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "cg-export-menu": CgExportMenu;
  }
}
