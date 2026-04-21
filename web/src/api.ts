/** API types mirroring internal/model/cert.go (camelCase JSON tags) */

export type CertType =
  | "x509"
  | "csr"
  | "crl"
  | "pkcs7"
  | "private_key"
  | "jwk"
  | "bundle"
  | "srl"
  | "unknown";

export type Severity = "error" | "warning" | "info";

export interface Issue {
  severity: Severity;
  code: string;
  message: string;
  field?: string;
}

export interface NameInfo {
  commonName?: string;
  organization?: string[];
  organizationalUnit?: string[];
  country?: string[];
  province?: string[];
  locality?: string[];
  serialNumber?: string;
}

export interface PublicKeyInfo {
  algorithm: string;
  bitSize?: number;
  curve?: string;
}

export interface FingerprintInfo {
  sha256: string;
  sha1: string;
  md5: string;
}

export interface SANInfo {
  dnsNames?: string[];
  ipAddresses?: string[];
  emailAddresses?: string[];
  uris?: string[];
}

export interface BasicConstraintsInfo {
  isCA: boolean;
  pathLenConstraint?: number;
}

export interface ExtensionInfo {
  oid: string;
  name?: string;
  critical: boolean;
  value: string;
}

export interface RevocationInfo {
  ocspServers?: string[];
  crlDistributionPoints?: string[];
}

export interface SignatureInfo {
  algorithm: string;
}

export interface X509Info {
  subject: NameInfo;
  issuer: NameInfo;
  serialNumber: string;
  notBefore: string;
  notAfter: string;
  daysRemaining: number;
  isExpired: boolean;
  isSelfSigned: boolean;
  publicKey: PublicKeyInfo;
  fingerprints: FingerprintInfo;
  keyUsage?: string[];
  extKeyUsage?: string[];
  sans?: SANInfo;
  basicConstraints: BasicConstraintsInfo;
  revocation?: RevocationInfo;
  extensions?: ExtensionInfo[];
  signature: SignatureInfo;
  issues: Issue[];
}

export interface CSRInfo {
  subject: NameInfo;
  publicKey: PublicKeyInfo;
  sans?: SANInfo;
  signature: SignatureInfo;
  extensions?: ExtensionInfo[];
  issues: Issue[];
}

export interface CRLInfo {
  issuer: NameInfo;
  thisUpdate: string;
  nextUpdate?: string;
  revokedCount: number;
  signature: SignatureInfo;
  issues: Issue[];
}

export interface PKCS7Info {
  certificates: X509Info[];
  issues: Issue[];
}

export interface PrivateKeyInfo {
  algorithm: string;
  bitSize?: number;
  curve?: string;
  issues: Issue[];
}

export interface JWKInfo {
  kty: string;
  kid?: string;
  alg?: string;
  use?: string;
  curve?: string;
  bitSize?: number;
  issues: Issue[];
}

export interface SRLInfo {
  /** Hex serial number as stored in the file (upper-cased). */
  serialHex: string;
  /** Same value in decimal notation. */
  serialDecimal: string;
  issues: Issue[];
}

export type CertEntry =
  | X509Info
  | CSRInfo
  | CRLInfo
  | PKCS7Info
  | PrivateKeyInfo
  | JWKInfo
  | SRLInfo;

export interface AnalyzeResponse {
  sessionId?: string;
  type: CertType;
  entries: CertEntry[];
  issues: Issue[];
}

export interface AnalyzeRequest {
  filename?: string;
  content: string; // base64
  password?: string;
}

export interface SessionFile {
  id: string;
  filename: string;
  result: AnalyzeResponse;
}

export interface VerifyChainEntry {
  commonName: string;
  organization?: string;
  isSelfSigned: boolean;
}

export interface VerifyChainResponse {
  valid: boolean;
  chain?: VerifyChainEntry[];
  error?: string;
}

export type RelationshipType = "signed-by" | "ca-for" | "revoked-by";

export interface Relationship {
  type: RelationshipType;
  /** ID of the FileEntry that is the subject (e.g. the leaf cert) */
  sourceId: string;
  /** ID of the FileEntry that is the object (e.g. the CA or CRL) */
  targetId: string;
  /** Human-readable description */
  label: string;
}

// ── HTTP client ──────────────────────────────────────────────────────────────

/** Thrown when the server indicates a password is required (HTTP 422). */
export class PasswordRequiredError extends Error {
  constructor() {
    super("password required");
  }
}

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

  if (resp.status === 422) {
    throw new PasswordRequiredError();
  }

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`API error ${resp.status}: ${text}`);
  }

  return resp.json() as Promise<AnalyzeResponse>;
}

/** Fetch the list of analysed files stored in the server session. */
export async function listSessionFiles(): Promise<SessionFile[]> {
  const resp = await fetch("/api/v1/session/files");
  if (!resp.ok) return [];
  return resp.json() as Promise<SessionFile[]>;
}

/** Remove a file from the server session. */
export async function deleteSessionFile(id: string): Promise<void> {
  await fetch(`/api/v1/session/files/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

async function fileToBase64(file: File): Promise<string> {
  const ab = await file.arrayBuffer();
  return btoa(String.fromCharCode(...new Uint8Array(ab)));
}

/** Verify that leafFile can be validated by the certificates in chainFiles. */
export async function verifyChain(
  leaf: File,
  chainFiles: File[],
): Promise<VerifyChainResponse> {
  const leafContent = await fileToBase64(leaf);
  const chainContent = await Promise.all(chainFiles.map(fileToBase64));

  const resp = await fetch("/api/v1/verify-chain", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ leafContent, chainContent }),
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`API error ${resp.status}: ${text}`);
  }

  return resp.json() as Promise<VerifyChainResponse>;
}
