import { LitElement, html } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import type {
  AnalyzeResponse,
  X509Info,
  CSRInfo,
  CRLInfo,
  PKCS7Info,
  PrivateKeyInfo,
  JWKInfo,
  Issue,
  VerifyChainResponse,
} from "../api.js";
import "./cg-issue-badge.js";
import "./cg-copy-button.js";
import "./cg-export-menu.js";
import "./cg-chain-graph.js";
import "./cg-raw-decoder.js";

/**
 * Full detail view for an analysed certificate / key file.
 * Handles all supported cert types returned by the API.
 */
@customElement("cg-cert-detail")
export class CgCertDetail extends LitElement {
  override createRenderRoot() {
    return this;
  }

  @property({ type: Object }) response: AnalyzeResponse | undefined = undefined;
  @property({ type: String }) filename = "";
  @property({ type: Object }) file: File | undefined = undefined;
  @property({ type: Array }) otherFiles: File[] = [];
  @property({ type: Object }) verifyResult: VerifyChainResponse | undefined =
    undefined;
  @state() private _tab: "detail" | "raw" = "detail";

  override render() {
    if (!this.response) return html``;
    const { type, entries, issues } = this.response;

    return html`
      <div class="space-y-4">
        <div class="flex items-center gap-3 flex-wrap">
          <h2 class="text-lg font-semibold truncate">${this.filename}</h2>
          <span class="badge badge-outline">${type}</span>
          <div class="ml-auto flex gap-2">
            ${(type === "x509" || type === "bundle") &&
            this.otherFiles.length > 0
              ? html`
                  <button
                    class="btn btn-sm btn-outline"
                    @click=${this._onVerifyChain}
                    title="Verify against ${this.otherFiles
                      .length} other loaded file(s)"
                  >
                    Verify chain
                  </button>
                `
              : ""}
            <cg-export-menu
              .response=${this.response}
              .filename=${this.filename.replace(/\.[^.]+$/, "")}
            ></cg-export-menu>
          </div>
        </div>

        ${this._renderVerifyResult()}

        <div class="tabs tabs-border">
          <button
            class="tab ${this._tab === "detail" ? "tab-active" : ""}"
            @click=${() => {
              this._tab = "detail";
            }}
          >
            Detail
          </button>
          <button
            class="tab ${this._tab === "raw" ? "tab-active" : ""}"
            @click=${() => {
              this._tab = "raw";
            }}
          >
            Raw
          </button>
        </div>

        ${this._tab === "raw"
          ? html`<cg-raw-decoder .file=${this.file}></cg-raw-decoder>`
          : html`
              ${issues.length > 0
                ? this._renderIssues("Top-level issues", issues)
                : ""}
              ${entries.map((entry, i) =>
                this._renderEntry(type, entry, i, entries.length),
              )}
            `}
      </div>
    `;
  }

  private _onVerifyChain() {
    this.dispatchEvent(
      new CustomEvent("verify-chain", { bubbles: true, composed: true }),
    );
  }

  private _renderVerifyResult() {
    const r = this.verifyResult;
    if (r === undefined) return "";
    // null means in-progress
    if (r === null) {
      return html`
        <div class="alert alert-info py-2 px-3 text-sm flex gap-2 items-center">
          <span class="loading loading-spinner loading-xs"></span>
          Verifying chain…
        </div>
      `;
    }
    if (!r.valid) {
      return html`
        <div class="alert alert-error py-2 px-3 text-sm">
          <span class="font-semibold">Chain invalid:</span>
          ${r.error ?? "Verification failed"}
        </div>
      `;
    }
    return html`
      <div class="alert alert-success py-2 px-3 text-sm space-y-1">
        <p class="font-semibold">Chain valid</p>
        ${r.chain && r.chain.length > 0
          ? html`
              <ol class="list-decimal list-inside text-xs space-y-0.5 ml-2">
                ${r.chain.map(
                  (entry) => html`
                    <li>
                      <span class="font-mono">${entry.commonName || "?"}</span>
                      ${entry.organization
                        ? html`<span class="text-base-content/60">
                            (${entry.organization})</span
                          >`
                        : ""}
                      ${entry.isSelfSigned
                        ? html`<span class="badge badge-xs badge-outline ml-1"
                            >root</span
                          >`
                        : ""}
                    </li>
                  `,
                )}
              </ol>
            `
          : ""}
      </div>
    `;
  }

  private _renderEntry(
    type: string,
    entry: unknown,
    idx: number,
    total: number,
  ) {
    const label = total > 1 ? `Entry ${idx + 1} of ${total}` : undefined;

    switch (type) {
      case "x509":
      case "bundle":
        return this._renderX509(entry as X509Info, label);
      case "csr":
        return this._renderCSR(entry as CSRInfo, label);
      case "crl":
        return this._renderCRL(entry as CRLInfo, label);
      case "pkcs7":
        return this._renderPKCS7(entry as PKCS7Info, label);
      case "private_key":
        return this._renderPrivateKey(entry as PrivateKeyInfo, label);
      case "jwk":
        return this._renderJWK(entry as JWKInfo, label);
      default:
        return html`<pre class="text-xs overflow-auto">
${JSON.stringify(entry, null, 2)}</pre
        >`;
    }
  }

  // ── X.509 ─────────────────────────────────────────────────────────────────

  private _renderX509(info: X509Info, label?: string) {
    const expiry = new Date(info.notAfter);
    const now = new Date();
    const expired = expiry < now;
    const daysLeft = Math.ceil((expiry.getTime() - now.getTime()) / 86_400_000);

    return html`
      <div class="card bg-base-100 border border-base-300">
        <div class="card-body p-4 space-y-3">
          ${label
            ? html`<p
                class="text-xs text-base-content/50 uppercase tracking-wider"
              >
                ${label}
              </p>`
            : ""}
          ${info.isSelfSigned
            ? html`<div class="badge badge-neutral badge-sm">Self-signed</div>`
            : ""}
          ${info.basicConstraints?.isCA
            ? html`<div class="badge badge-secondary badge-sm ml-1">CA</div>`
            : ""}
          ${this._section("Subject", this._renderName(info.subject))}
          ${this._section("Issuer", this._renderName(info.issuer))}
          ${this._section(
            "Validity",
            html`
              <div
                class="grid gap-x-6 gap-y-1 text-sm"
                style="grid-template-columns: max-content 1fr"
              >
                <span class="text-base-content/50">Not before</span>
                <span>${new Date(info.notBefore).toLocaleString()}</span>
                <span class="text-base-content/50">Not after</span>
                <span
                  class="${expired
                    ? "text-error font-semibold"
                    : daysLeft <= 30
                      ? "text-warning font-semibold"
                      : ""}"
                >
                  ${new Date(info.notAfter).toLocaleString()}
                  ${expired ? "(expired)" : `(${daysLeft}d left)`}
                </span>
              </div>
            `,
          )}
          ${this._section(
            "Public key",
            html`
              <span class="text-sm"
                >${info.publicKey.algorithm ?? "—"}
                ${info.publicKey.bitSize
                  ? ` — ${info.publicKey.bitSize} bits`
                  : ""}
                ${info.publicKey.curve ? ` (${info.publicKey.curve})` : ""}
              </span>
            `,
          )}
          ${info.sans
            ? this._section(
                "SANs",
                html`
                  <div class="flex flex-wrap gap-1">
                    ${[
                      ...(info.sans.dnsNames ?? []),
                      ...(info.sans.ipAddresses ?? []),
                      ...(info.sans.emailAddresses ?? []),
                    ].map(
                      (s) =>
                        html`<span class="badge badge-ghost badge-sm font-mono"
                          >${s}</span
                        >`,
                    )}
                  </div>
                  ${(info.sans.dnsNames?.length ?? 0) +
                    (info.sans.ipAddresses?.length ?? 0) +
                    (info.sans.emailAddresses?.length ?? 0) ===
                  0
                    ? html`<span class="text-base-content/30 italic text-sm"
                        >—</span
                      >`
                    : ""}
                `,
              )
            : ""}
          ${this._section(
            "Fingerprints",
            html`
              <div class="space-y-1 text-xs font-mono">
                <div class="flex gap-2 items-center">
                  <span class="text-base-content/50 w-14 shrink-0"
                    >SHA-256</span
                  >
                  <span class="truncate">${info.fingerprints.sha256}</span>
                  <cg-copy-button
                    .text=${info.fingerprints.sha256}
                  ></cg-copy-button>
                </div>
                <div class="flex gap-2 items-center">
                  <span class="text-base-content/50 w-14 shrink-0">SHA-1</span>
                  <span class="truncate">${info.fingerprints.sha1}</span>
                  <cg-copy-button
                    .text=${info.fingerprints.sha1}
                  ></cg-copy-button>
                </div>
              </div>
            `,
          )}
          ${info.keyUsage?.length
            ? this._section(
                "Key usage",
                html`
                  <div class="flex flex-wrap gap-1">
                    ${info.keyUsage.map(
                      (u) =>
                        html`<span class="badge badge-outline badge-sm"
                          >${u}</span
                        >`,
                    )}
                  </div>
                `,
              )
            : ""}
          ${info.extKeyUsage?.length
            ? this._section(
                "Extended key usage",
                html`
                  <div class="flex flex-wrap gap-1">
                    ${info.extKeyUsage.map(
                      (u) =>
                        html`<span class="badge badge-outline badge-sm"
                          >${u}</span
                        >`,
                    )}
                  </div>
                `,
              )
            : ""}
          ${info.revocation
            ? this._section(
                "Revocation",
                html`
                  <div class="text-xs space-y-1">
                    ${info.revocation.ocspServers?.map(
                      (s) =>
                        html`<div>
                          <span class="text-base-content/50">OCSP </span>${s}
                        </div>`,
                    ) ?? ""}
                    ${info.revocation.crlDistributionPoints?.map(
                      (s) =>
                        html`<div>
                          <span class="text-base-content/50">CRL DP </span>${s}
                        </div>`,
                    ) ?? ""}
                  </div>
                `,
              )
            : ""}
          ${(info.issues ?? []).length > 0
            ? this._renderIssues("Issues", info.issues)
            : ""}
        </div>
      </div>
    `;
  }

  // ── CSR ───────────────────────────────────────────────────────────────────

  private _renderCSR(info: CSRInfo, label?: string) {
    return html`
      <div class="card bg-base-100 border border-base-300">
        <div class="card-body p-4 space-y-3">
          ${label
            ? html`<p
                class="text-xs text-base-content/50 uppercase tracking-wider"
              >
                ${label}
              </p>`
            : ""}
          <div
            class="badge ${!info.issues.some(
              (i) => i.code === "INVALID_CSR_SIGNATURE",
            )
              ? "badge-success"
              : "badge-error"} badge-sm"
          >
            Signature
            ${!info.issues.some((i) => i.code === "INVALID_CSR_SIGNATURE")
              ? "valid"
              : "invalid"}
          </div>
          ${this._section("Subject", this._renderName(info.subject))}
          ${this._section(
            "Public key",
            html`<span class="text-sm"
              >${info.publicKey.algorithm}${info.publicKey.bitSize
                ? ` — ${info.publicKey.bitSize} bits`
                : ""}</span
            >`,
          )}
          ${info.sans
            ? this._section(
                "SANs",
                html`
                  <div class="flex flex-wrap gap-1">
                    ${[
                      ...(info.sans.dnsNames ?? []),
                      ...(info.sans.ipAddresses ?? []),
                    ].map(
                      (s) =>
                        html`<span class="badge badge-ghost badge-sm font-mono"
                          >${s}</span
                        >`,
                    )}
                  </div>
                `,
              )
            : ""}
          ${(info.issues ?? []).length > 0
            ? this._renderIssues("Issues", info.issues)
            : ""}
        </div>
      </div>
    `;
  }

  // ── CRL ───────────────────────────────────────────────────────────────────

  private _renderCRL(info: CRLInfo, label?: string) {
    return html`
      <div class="card bg-base-100 border border-base-300">
        <div class="card-body p-4 space-y-3">
          ${label
            ? html`<p
                class="text-xs text-base-content/50 uppercase tracking-wider"
              >
                ${label}
              </p>`
            : ""}
          ${this._section("Issuer", this._renderName(info.issuer))}
          ${this._section(
            "Validity",
            html`
              <div class="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                <span class="text-base-content/50">This update</span
                <span>${new Date(info.thisUpdate).toLocaleString()}</span>
                ${
                  info.nextUpdate
                    ? html`<span class="text-base-content/50">Next update</span
                        ><span
                          >${new Date(info.nextUpdate).toLocaleString()}</span
                        >`
                    : ""
                }
              </div>
            `,
          )}
          ${this._section(
            "Revoked",
            html`<span class="text-sm"
              >${info.revokedCount ?? "—"} certificate(s)</span
            >`,
          )}
          ${(info.issues ?? []).length > 0
            ? this._renderIssues("Issues", info.issues)
            : ""}
        </div>
      </div>
    `;
  }

  // ── PKCS#7 / PKCS#12 ──────────────────────────────────────────────────────

  private _renderPKCS7(info: PKCS7Info, label?: string) {
    return html`
      <div class="card bg-base-100 border border-base-300">
        <div class="card-body p-4 space-y-3">
          ${label
            ? html`<p
                class="text-xs text-base-content/50 uppercase tracking-wider"
              >
                ${label}
              </p>`
            : ""}
          ${info.certificates.length > 1
            ? html`
                <details>
                  <summary class="cursor-pointer text-sm font-medium">
                    Chain of trust (${info.certificates.length} certs)
                  </summary>
                  <div class="mt-2 pl-2">
                    <cg-chain-graph
                      .certs=${info.certificates}
                    ></cg-chain-graph>
                  </div>
                </details>
              `
            : ""}
          ${info.certificates.map((cert, i) =>
            this._renderX509(cert, `Certificate ${i + 1}`),
          )}
          ${(info.issues ?? []).length > 0
            ? this._renderIssues("Issues", info.issues)
            : ""}
        </div>
      </div>
    `;
  }

  // ── Private key ───────────────────────────────────────────────────────────

  private _renderPrivateKey(info: PrivateKeyInfo, label?: string) {
    return html`
      <div class="card bg-base-100 border border-base-300">
        <div class="card-body p-4 space-y-3">
          ${label
            ? html`<p
                class="text-xs text-base-content/50 uppercase tracking-wider"
              >
                ${label}
              </p>`
            : ""}
          ${this._section(
            "Algorithm",
            html`
              <span class="text-sm"
                >${info.algorithm ?? "—"}
                ${info.bitSize ? ` — ${info.bitSize} bits` : ""}
                ${info.curve ? ` (${info.curve})` : ""}
              </span>
            `,
          )}
          ${this._section(
            "Encrypted",
            html`
              <span
                class="badge ${info.algorithm === "Encrypted"
                  ? "badge-warning"
                  : "badge-ghost"} badge-sm"
              >
                ${info.algorithm === "Encrypted" ? "Yes" : "No"}
              </span>
            `,
          )}
          ${(info.issues ?? []).length > 0
            ? this._renderIssues("Issues", info.issues)
            : ""}
        </div>
      </div>
    `;
  }

  // ── JWK ───────────────────────────────────────────────────────────────────

  private _renderJWK(info: JWKInfo, label?: string) {
    return html`
      <div class="card bg-base-100 border border-base-300">
        <div class="card-body p-4 space-y-3">
          ${label
            ? html`<p
                class="text-xs text-base-content/50 uppercase tracking-wider"
              >
                ${label}
              </p>`
            : ""}
          ${this._section(
            "Key type",
            html`<span class="text-sm font-mono">${info.kty}</span>`,
          )}
          ${info.alg
            ? this._section(
                "Algorithm",
                html`<span class="text-sm">${info.alg}</span>`,
              )
            : ""}
          ${info.kid
            ? this._section(
                "Key ID",
                html`<span class="text-sm font-mono">${info.kid}</span>`,
              )
            : ""}
          ${info.bitSize
            ? this._section(
                "Key size",
                html`<span class="text-sm">${info.bitSize} bits</span>`,
              )
            : ""}
          ${info.curve
            ? this._section(
                "Curve",
                html`<span class="text-sm">${info.curve}</span>`,
              )
            : ""}
          ${(info.issues ?? []).length > 0
            ? this._renderIssues("Issues", info.issues)
            : ""}
        </div>
      </div>
    `;
  }

  // ── Shared helpers ────────────────────────────────────────────────────────

  private _section(title: string, content: unknown) {
    return html`
      <div>
        <dt class="text-xs text-base-content/50 uppercase tracking-wider mb-1">
          ${title}
        </dt>
        <dd>
          ${content ??
          html`<span class="text-base-content/30 italic text-sm">—</span>`}
        </dd>
      </div>
    `;
  }

  private _renderName(name: import("../api.js").NameInfo) {
    const parts = [
      name.commonName,
      name.organization?.join(", "),
      name.organizationalUnit?.join(", "),
      name.country?.join(", "),
    ].filter(Boolean);

    return html`<span class="text-sm">${parts.join(" / ") || "—"}</span>`;
  }

  private _renderIssues(title: string, issues: Issue[]) {
    return html`
      <div>
        <dt class="text-xs text-base-content/50 uppercase tracking-wider mb-1">
          ${title}
        </dt>
        <dd class="space-y-1">
          ${issues.map(
            (issue) => html`
              <div
                class="alert alert-${issue.severity === "error"
                  ? "error"
                  : issue.severity === "warning"
                    ? "warning"
                    : "info"} py-2 px-3 text-sm"
              >
                <span class="font-mono font-semibold">[${issue.code}]</span>
                ${issue.message}
              </div>
            `,
          )}
        </dd>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "cg-cert-detail": CgCertDetail;
  }
}
