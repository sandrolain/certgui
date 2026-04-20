/** API types mirroring internal/model/cert.go */

export type CertType =
  | "x509"
  | "csr"
  | "crl"
  | "pkcs7"
  | "private_key"
  | "jwk"
  | "bundle"
  | "unknown";

export type Severity = "error" | "warning" | "info";

export interface Issue {
  severity: Severity;
  code: string;
  message: string;
  field?: string;
}

export interface NameInfo {
  common_name?: string;
  organization?: string[];
  organizational_unit?: string[];
  country?: string[];
  state?: string[];
  locality?: string[];
  serial_number?: string;
}

export interface PublicKeyInfo {
  algorithm: string;
  key_size?: number;
  curve?: string;
}

export interface FingerprintInfo {
  sha256: string;
  sha1: string;
  md5: string;
}

export interface SANInfo {
  dns_names?: string[];
  ip_addresses?: string[];
  email_addresses?: string[];
  uris?: string[];
}

export interface BasicConstraintsInfo {
  is_ca: boolean;
  path_len_constraint?: number;
}

export interface ExtensionInfo {
  oid: string;
  name?: string;
  critical: boolean;
  value: string;
}

export interface RevocationInfo {
  ocsp_servers?: string[];
  crl_distribution_points?: string[];
}

export interface SignatureInfo {
  algorithm: string;
}

export interface X509Info {
  subject: NameInfo;
  issuer: NameInfo;
  serial_number: string;
  not_before: string;
  not_after: string;
  is_ca: boolean;
  self_signed: boolean;
  public_key: PublicKeyInfo;
  fingerprints: FingerprintInfo;
  key_usage?: string[];
  extended_key_usage?: string[];
  sans?: SANInfo;
  basic_constraints?: BasicConstraintsInfo;
  revocation?: RevocationInfo;
  extensions?: ExtensionInfo[];
  signature: SignatureInfo;
  issues: Issue[];
}

export interface CSRInfo {
  subject: NameInfo;
  public_key: PublicKeyInfo;
  sans?: SANInfo;
  signature_valid: boolean;
  signature: SignatureInfo;
  extensions?: ExtensionInfo[];
  issues: Issue[];
}

export interface CRLInfo {
  issuer: NameInfo;
  this_update: string;
  next_update?: string;
  revoked_count: number;
  signature: SignatureInfo;
  issues: Issue[];
}

export interface PKCS7Info {
  type: string;
  certificates: X509Info[];
  issues: Issue[];
}

export interface PrivateKeyInfo {
  algorithm: string;
  key_size?: number;
  curve?: string;
  encrypted: boolean;
  issues: Issue[];
}

export interface JWKInfo {
  key_type: string;
  key_id?: string;
  algorithm?: string;
  use?: string;
  curve?: string;
  key_size?: number;
  issues: Issue[];
}

export type CertEntry =
  | X509Info
  | CSRInfo
  | CRLInfo
  | PKCS7Info
  | PrivateKeyInfo
  | JWKInfo;

export interface AnalyzeResponse {
  type: CertType;
  entries: CertEntry[];
  issues: Issue[];
}

export interface AnalyzeRequest {
  filename?: string;
  content: string; // base64
  password?: string;
}

// ── HTTP client ──────────────────────────────────────────────────────────────

export async function analyzeFile(
  file: File,
  password?: string,
): Promise<AnalyzeResponse> {
  const arrayBuffer = await file.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  const b64 = btoa(String.fromCharCode(...bytes));

  const body: AnalyzeRequest = {
    filename: file.name,
    content: b64,
    password: password || undefined,
  };

  const resp = await fetch("/api/v1/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`API error ${resp.status}: ${text}`);
  }

  return resp.json() as Promise<AnalyzeResponse>;
}
