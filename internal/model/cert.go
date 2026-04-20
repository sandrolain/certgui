// Package model defines the shared data structures used by the analyzer
// and serialised as JSON in API responses.
package model

import "time"

// CertType identifies the kind of cryptographic artefact that was analysed.
type CertType string

const (
	TypeX509       CertType = "x509"
	TypeCSR        CertType = "csr"
	TypeCRL        CertType = "crl"
	TypePKCS7      CertType = "pkcs7"
	TypePrivateKey CertType = "private_key"
	TypeJWK        CertType = "jwk"
	TypeBundle     CertType = "bundle"
	TypeUnknown    CertType = "unknown"
)

// Severity represents the importance of a validation issue.
type Severity string

const (
	SeverityError   Severity = "error"
	SeverityWarning Severity = "warning"
	SeverityInfo    Severity = "info"
)

// Issue describes a single validation finding (error, warning or info).
type Issue struct {
	Severity Severity `json:"severity"`
	Code     string   `json:"code"`
	Message  string   `json:"message"`
	Field    string   `json:"field,omitempty"`
}

// AnalyzeRequest is the JSON body accepted by POST /api/v1/analyze.
type AnalyzeRequest struct {
	Filename string `json:"filename"`
	// Content is the base64-encoded raw bytes of the file.
	Content  string `json:"content"`
	// Password is only required for PKCS#12 files protected by a passphrase.
	Password string `json:"password,omitempty"`
}

// AnalyzeResponse is the JSON body returned by POST /api/v1/analyze.
type AnalyzeResponse struct {
	Type    CertType      `json:"type"`
	Entries []interface{} `json:"entries"`
	Issues  []Issue       `json:"issues"`
}

// NameInfo holds the distinguished name fields of a certificate subject or issuer.
type NameInfo struct {
	CommonName         string   `json:"commonName,omitempty"`
	Organization       []string `json:"organization,omitempty"`
	OrganizationalUnit []string `json:"organizationalUnit,omitempty"`
	Country            []string `json:"country,omitempty"`
	Province           []string `json:"province,omitempty"`
	Locality           []string `json:"locality,omitempty"`
	StreetAddress      []string `json:"streetAddress,omitempty"`
	PostalCode         []string `json:"postalCode,omitempty"`
	SerialNumber       string   `json:"serialNumber,omitempty"`
	EmailAddresses     []string `json:"emailAddresses,omitempty"`
}

// PublicKeyInfo describes the public key embedded in a certificate or CSR.
type PublicKeyInfo struct {
	Algorithm  string `json:"algorithm"`
	BitSize    int    `json:"bitSize,omitempty"`
	Curve      string `json:"curve,omitempty"`
	Fingerprint string `json:"fingerprint"`
}

// SignatureInfo contains the signature algorithm and certificate fingerprints.
type SignatureInfo struct {
	Algorithm string `json:"algorithm"`
}

// FingerprintInfo holds the most common fingerprint formats of a certificate.
type FingerprintInfo struct {
	SHA256 string `json:"sha256"`
	SHA1   string `json:"sha1"`
	MD5    string `json:"md5"`
}

// SANInfo holds the Subject Alternative Names of a certificate.
type SANInfo struct {
	DNSNames       []string `json:"dnsNames,omitempty"`
	IPAddresses    []string `json:"ipAddresses,omitempty"`
	EmailAddresses []string `json:"emailAddresses,omitempty"`
	URIs           []string `json:"uris,omitempty"`
}

// BasicConstraintsInfo holds the Basic Constraints extension fields.
type BasicConstraintsInfo struct {
	IsCA                bool `json:"isCA"`
	PathLenConstraint   int  `json:"pathLenConstraint"`
	PathLenPresent      bool `json:"pathLenPresent"`
}

// ExtensionInfo represents a decoded X.509 certificate extension.
type ExtensionInfo struct {
	OID      string `json:"oid"`
	Name     string `json:"name,omitempty"`
	Critical bool   `json:"critical"`
	Value    string `json:"value"`
}

// RevocationInfo holds CRL distribution points and OCSP URLs from a certificate.
type RevocationInfo struct {
	CRLDistributionPoints []string `json:"crlDistributionPoints,omitempty"`
	OCSPServers           []string `json:"ocspServers,omitempty"`
}

// X509Info holds all extracted information from a single X.509 certificate.
type X509Info struct {
	Subject          NameInfo             `json:"subject"`
	Issuer           NameInfo             `json:"issuer"`
	SerialNumber     string               `json:"serialNumber"`
	NotBefore        time.Time            `json:"notBefore"`
	NotAfter         time.Time            `json:"notAfter"`
	DaysRemaining    int                  `json:"daysRemaining"`
	IsExpired        bool                 `json:"isExpired"`
	IsSelfSigned     bool                 `json:"isSelfSigned"`
	PublicKey        PublicKeyInfo        `json:"publicKey"`
	Signature        SignatureInfo        `json:"signature"`
	SANs             SANInfo              `json:"sans"`
	KeyUsage         []string             `json:"keyUsage,omitempty"`
	ExtKeyUsage      []string             `json:"extKeyUsage,omitempty"`
	BasicConstraints BasicConstraintsInfo `json:"basicConstraints"`
	Extensions       []ExtensionInfo      `json:"extensions,omitempty"`
	Revocation       RevocationInfo       `json:"revocation"`
	Fingerprints     FingerprintInfo      `json:"fingerprints"`
	SubjectKeyID     string               `json:"subjectKeyId,omitempty"`
	AuthorityKeyID   string               `json:"authorityKeyId,omitempty"`
	PEM              string               `json:"pem"`
	Issues           []Issue              `json:"issues,omitempty"`
}

// CSRInfo holds all extracted information from a Certificate Signing Request.
type CSRInfo struct {
	Subject   NameInfo      `json:"subject"`
	PublicKey PublicKeyInfo `json:"publicKey"`
	Signature SignatureInfo `json:"signature"`
	SANs      SANInfo       `json:"sans,omitempty"`
	PEM       string        `json:"pem"`
	Issues    []Issue       `json:"issues,omitempty"`
}

// CRLInfo holds all extracted information from a Certificate Revocation List.
type CRLInfo struct {
	Issuer      NameInfo  `json:"issuer"`
	ThisUpdate  time.Time `json:"thisUpdate"`
	NextUpdate  time.Time `json:"nextUpdate"`
	RevokedCount int      `json:"revokedCount"`
	Signature   SignatureInfo `json:"signature"`
	PEM         string    `json:"pem"`
	Issues      []Issue   `json:"issues,omitempty"`
}

// PKCS7Info holds certificate entries extracted from a PKCS#7 / CMS structure.
type PKCS7Info struct {
	Certificates []X509Info `json:"certificates,omitempty"`
	Issues       []Issue    `json:"issues,omitempty"`
}

// PrivateKeyInfo holds metadata extracted from a private key (no key material is returned).
type PrivateKeyInfo struct {
	Algorithm string `json:"algorithm"`
	BitSize   int    `json:"bitSize,omitempty"`
	Curve     string `json:"curve,omitempty"`
	Issues    []Issue `json:"issues,omitempty"`
}

// JWKInfo holds information extracted from a JSON Web Key or JWKS.
type JWKInfo struct {
	KeyType   string  `json:"kty"`
	Use       string  `json:"use,omitempty"`
	Algorithm string  `json:"alg,omitempty"`
	KeyID     string  `json:"kid,omitempty"`
	BitSize   int     `json:"bitSize,omitempty"`
	Curve     string  `json:"curve,omitempty"`
	Keys      []JWKInfo `json:"keys,omitempty"`
	Issues    []Issue `json:"issues,omitempty"`
}
