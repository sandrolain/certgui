import { LitElement, html } from "lit";
import { customElement, property } from "lit/decorators.js";
import type { X509Info } from "../api.js";

/**
 * Side-by-side diff view that compares two X.509 certificates field by field.
 * Highlights fields that differ.
 */
@customElement("cg-diff-view")
export class CgDiffView extends LitElement {
  override createRenderRoot() {
    return this;
  }

  @property({ type: Object }) left: X509Info | undefined = undefined;
  @property({ type: Object }) right: X509Info | undefined = undefined;

  override render() {
    if (!this.left || !this.right) {
      return html`
        <div class="text-base-content/40 text-sm p-4">
          Select two certificates to compare.
        </div>
      `;
    }

    const rows = this._buildRows(this.left, this.right);

    return html`
      <div class="overflow-x-auto text-sm">
        <table class="table table-xs w-full">
          <thead>
            <tr>
              <th class="w-32">Field</th>
              <th>${this.left.subject.common_name ?? "Left"}</th>
              <th>${this.right.subject.common_name ?? "Right"}</th>
            </tr>
          </thead>
          <tbody>
            ${rows.map(({ label, l, r }) => {
              const same = l === r;
              return html`
                <tr class="${same ? "diff-same" : ""}">
                  <td class="font-medium text-base-content/60">${label}</td>
                  <td class="${same ? "" : "diff-removed"} font-mono break-all">
                    ${l}
                  </td>
                  <td class="${same ? "" : "diff-added"} font-mono break-all">
                    ${r}
                  </td>
                </tr>
              `;
            })}
          </tbody>
        </table>
      </div>
    `;
  }

  private _buildRows(l: X509Info, r: X509Info) {
    return [
      {
        label: "Subject CN",
        l: l.subject.common_name ?? "—",
        r: r.subject.common_name ?? "—",
      },
      {
        label: "Issuer CN",
        l: l.issuer.common_name ?? "—",
        r: r.issuer.common_name ?? "—",
      },
      { label: "Serial", l: l.serial_number, r: r.serial_number },
      {
        label: "Not before",
        l: new Date(l.not_before).toISOString(),
        r: new Date(r.not_before).toISOString(),
      },
      {
        label: "Not after",
        l: new Date(l.not_after).toISOString(),
        r: new Date(r.not_after).toISOString(),
      },
      {
        label: "Key algo",
        l: l.public_key.algorithm,
        r: r.public_key.algorithm,
      },
      {
        label: "Key size",
        l: String(l.public_key.key_size ?? "—"),
        r: String(r.public_key.key_size ?? "—"),
      },
      { label: "Sig algo", l: l.signature.algorithm, r: r.signature.algorithm },
      { label: "Is CA", l: String(l.is_ca), r: String(r.is_ca) },
      {
        label: "Self-signed",
        l: String(l.self_signed),
        r: String(r.self_signed),
      },
      { label: "SHA-256", l: l.fingerprints.sha256, r: r.fingerprints.sha256 },
      { label: "SHA-1", l: l.fingerprints.sha1, r: r.fingerprints.sha1 },
    ];
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "cg-diff-view": CgDiffView;
  }
}
