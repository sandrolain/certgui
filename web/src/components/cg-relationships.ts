import { LitElement, html } from "lit";
import { customElement, property } from "lit/decorators.js";
import type { FileEntry } from "../cg-app.js";
import type { CRLInfo, Relationship, X509Info } from "../api.js";

/**
 * Computes and displays cross-file relationships such as:
 * - certificate A is signed by certificate B (CA relationship)
 * - certificate A is listed as revoked in CRL B
 */
@customElement("cg-relationships")
export class CgRelationships extends LitElement {
  override createRenderRoot() {
    return this;
  }

  @property({ type: Array }) files: FileEntry[] = [];
  @property({ type: String }) selectedId: string | null = null;

  private _navigate(id: string) {
    this.dispatchEvent(
      new CustomEvent("navigate-to-file", {
        detail: id,
        bubbles: true,
        composed: true,
      }),
    );
  }

  private _computeRelationships(): Relationship[] {
    const rels: Relationship[] = [];
    const doneFiles = this.files.filter((f) => f.status === "done" && f.result);

    // Collect all X.509 certs (including from bundles and pkcs7)
    const allCerts: { entryId: string; info: X509Info }[] = [];
    for (const f of doneFiles) {
      const { type, entries } = f.result!;
      if (type === "x509" || type === "bundle" || type === "pkcs7") {
        for (const e of entries) {
          allCerts.push({ entryId: f.id, info: e as X509Info });
        }
      }
    }

    // CA / signed-by relationships: cert A's issuer DN matches cert B's subject DN
    for (const a of allCerts) {
      if (a.info.isSelfSigned) continue;
      const issuerCN = a.info.issuer?.commonName ?? "";
      const issuerOrg = (a.info.issuer?.organization ?? []).join(",");

      for (const b of allCerts) {
        if (b.entryId === a.entryId) continue;
        const subjectCN = b.info.subject?.commonName ?? "";
        const subjectOrg = (b.info.subject?.organization ?? []).join(",");

        if (
          issuerCN &&
          issuerCN === subjectCN &&
          issuerOrg === subjectOrg &&
          b.info.basicConstraints?.isCA
        ) {
          // Avoid duplicates
          if (
            !rels.some(
              (r) =>
                r.type === "signed-by" &&
                r.sourceId === a.entryId &&
                r.targetId === b.entryId,
            )
          ) {
            const leafName =
              a.info.subject?.commonName ||
              this.files.find((f) => f.id === a.entryId)?.file.name ||
              a.entryId;
            const caName =
              b.info.subject?.commonName ||
              this.files.find((f) => f.id === b.entryId)?.file.name ||
              b.entryId;
            rels.push({
              type: "signed-by",
              sourceId: a.entryId,
              targetId: b.entryId,
              label: `"${leafName}" is signed by "${caName}"`,
            });
          }
        }
      }
    }

    // CRL revocation: check if any loaded cert's serial appears in a CRL
    for (const f of doneFiles) {
      if (f.result!.type !== "crl") continue;
      const crlInfo = f.result!.entries[0] as CRLInfo & {
        revokedEntries?: { serialNumber: string }[];
      };
      if (!crlInfo?.revokedEntries?.length) continue;
      const revokedSerials = new Set(
        crlInfo.revokedEntries.map((e) => e.serialNumber.toLowerCase()),
      );
      for (const c of allCerts) {
        const serial = (c.info.serialNumber ?? "").toLowerCase();
        if (serial && revokedSerials.has(serial)) {
          const certName =
            c.info.subject?.commonName ||
            this.files.find((fi) => fi.id === c.entryId)?.file.name ||
            c.entryId;
          const crlName =
            this.files.find((fi) => fi.id === f.id)?.file.name ?? f.id;
          rels.push({
            type: "revoked-by",
            sourceId: c.entryId,
            targetId: f.id,
            label: `"${certName}" is revoked by "${crlName}"`,
          });
        }
      }
    }

    return rels;
  }

  override render() {
    const rels = this._computeRelationships();
    if (rels.length === 0) return html``;

    return html`
      <div class="p-3 space-y-3">
        <h3
          class="text-xs font-semibold uppercase tracking-wider text-base-content/50"
        >
          Relationships
        </h3>
        <ul class="space-y-2">
          ${rels.map(
            (r) => html`
              <li class="space-y-1 text-sm">
                <div class="flex items-center gap-1.5">
                  ${r.type === "signed-by"
                    ? html`<span class="badge badge-info badge-xs">CA</span>`
                    : r.type === "revoked-by"
                      ? html`<span class="badge badge-error badge-xs"
                          >Revoked</span
                        >`
                      : html`<span class="badge badge-secondary badge-xs"
                          >${r.type}</span
                        >`}
                </div>
                <p class="text-xs text-base-content/70 leading-snug">
                  ${r.label}
                </p>
                <div class="flex gap-1 flex-wrap">
                  <button
                    class="btn btn-xs btn-ghost ${this.selectedId === r.sourceId
                      ? "btn-active"
                      : ""}"
                    @click=${() => this._navigate(r.sourceId)}
                  >
                    Source
                  </button>
                  <button
                    class="btn btn-xs btn-ghost ${this.selectedId === r.targetId
                      ? "btn-active"
                      : ""}"
                    @click=${() => this._navigate(r.targetId)}
                  >
                    Target
                  </button>
                </div>
              </li>
            `,
          )}
        </ul>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "cg-relationships": CgRelationships;
  }
}
