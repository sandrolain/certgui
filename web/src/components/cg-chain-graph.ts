import { LitElement, html } from "lit";
import { customElement, property } from "lit/decorators.js";
import type { X509Info } from "../api.js";

/**
 * Visual chain-of-trust graph for a certificate chain.
 * Accepts an ordered array of X509Info (leaf → root).
 */
@customElement("cg-chain-graph")
export class CgChainGraph extends LitElement {
  override createRenderRoot() {
    return this;
  }

  @property({ type: Array }) certs: X509Info[] = [];

  override render() {
    if (!this.certs.length) return html``;

    return html`
      <div class="space-y-0">
        ${this.certs.map((cert, i) => this._renderNode(cert, i))}
      </div>
    `;
  }

  private _renderNode(cert: X509Info, index: number) {
    const isLeaf = index === 0;
    const isRoot = index === this.certs.length - 1;
    const now = new Date();
    const expired = new Date(cert.not_after) < now;

    const icon = isRoot ? "🔑" : isLeaf ? "📄" : "🔗";
    const role = isRoot ? "Root CA" : isLeaf ? "End-entity" : "Intermediate CA";

    return html`
      <div class="chain-node">
        <div
          class="flex items-center gap-3 p-3 rounded-lg bg-base-100 border border-base-300"
        >
          <span class="text-xl">${icon}</span>
          <div class="flex-1 min-w-0">
            <div class="font-medium text-sm truncate">
              ${cert.subject.common_name ?? "—"}
            </div>
            <div class="text-xs text-base-content/50">${role}</div>
          </div>
          ${expired
            ? html`<span class="badge badge-error badge-xs">expired</span>`
            : ""}
          ${cert.self_signed
            ? html`<span class="badge badge-neutral badge-xs"
                >self-signed</span
              >`
            : ""}
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "cg-chain-graph": CgChainGraph;
  }
}
