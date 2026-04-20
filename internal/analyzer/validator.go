package analyzer

import (
	"crypto/ecdsa"
	"crypto/ed25519"
	"crypto/md5"  //nolint:gosec // MD5 used for fingerprint display only
	"crypto/rsa"
	"crypto/sha1" //nolint:gosec // SHA1 used for fingerprint display only
	"crypto/sha256"
	"crypto/x509"
	"encoding/hex"
	"fmt"
	"strings"
	"time"

	"github.com/sandrolain/certgui/internal/model"
)

// CheckExpiry returns issues related to certificate validity period.
func CheckExpiry(cert *x509.Certificate, warnDays int) []model.Issue {
	now := time.Now()
	if now.After(cert.NotAfter) {
		return []model.Issue{{
			Severity: model.SeverityError,
			Code:     "CERT_EXPIRED",
			Message:  fmt.Sprintf("Certificate expired on %s", cert.NotAfter.Format(time.RFC3339)),
			Field:    "notAfter",
		}}
	}
	deadline := now.AddDate(0, 0, warnDays)
	if cert.NotAfter.Before(deadline) {
		days := int(time.Until(cert.NotAfter).Hours() / 24)
		return []model.Issue{{
			Severity: model.SeverityWarning,
			Code:     "CERT_EXPIRING_SOON",
			Message:  fmt.Sprintf("Certificate expires in %d day(s) on %s", days, cert.NotAfter.Format(time.RFC3339)),
			Field:    "notAfter",
		}}
	}
	return nil
}

// CheckSignatureAlgorithm returns issues for weak signature algorithms.
func CheckSignatureAlgorithm(cert *x509.Certificate) []model.Issue {
	alg := cert.SignatureAlgorithm
	switch alg {
	case x509.MD5WithRSA:
		return []model.Issue{{
			Severity: model.SeverityError,
			Code:     "WEAK_SIGNATURE_MD5",
			Message:  "Certificate uses MD5 signature algorithm which is cryptographically broken",
			Field:    "signatureAlgorithm",
		}}
	case x509.SHA1WithRSA, x509.ECDSAWithSHA1, x509.DSAWithSHA1:
		return []model.Issue{{
			Severity: model.SeverityError,
			Code:     "WEAK_SIGNATURE_SHA1",
			Message:  "Certificate uses SHA-1 signature algorithm which is no longer considered secure",
			Field:    "signatureAlgorithm",
		}}
	}
	return nil
}

// CheckKeyStrength returns issues when the public key is too short.
func CheckKeyStrength(pub interface{}) []model.Issue {
	switch k := pub.(type) {
	case *rsa.PublicKey:
		if k.N.BitLen() < 2048 {
			return []model.Issue{{
				Severity: model.SeverityError,
				Code:     "WEAK_KEY_RSA",
				Message:  fmt.Sprintf("RSA key is only %d bits; minimum recommended size is 2048", k.N.BitLen()),
				Field:    "publicKey",
			}}
		}
	case *ecdsa.PublicKey:
		if k.Curve.Params().BitSize < 256 {
			return []model.Issue{{
				Severity: model.SeverityError,
				Code:     "WEAK_KEY_EC",
				Message:  fmt.Sprintf("EC key is only %d bits; minimum recommended size is 256", k.Curve.Params().BitSize),
				Field:    "publicKey",
			}}
		}
	}
	return nil
}

// CheckSANs returns a warning when a certificate has no SAN extension.
func CheckSANs(cert *x509.Certificate) []model.Issue {
	hasSAN := len(cert.DNSNames) > 0 ||
		len(cert.IPAddresses) > 0 ||
		len(cert.EmailAddresses) > 0 ||
		len(cert.URIs) > 0
	if !hasSAN && cert.Subject.CommonName != "" {
		return []model.Issue{{
			Severity: model.SeverityWarning,
			Code:     "MISSING_SAN",
			Message:  "Certificate has no Subject Alternative Name extension; modern clients require SAN",
			Field:    "extensions",
		}}
	}
	return nil
}

// CheckKeyUsage returns an error when KeyUsage and ExtKeyUsage are contradictory.
func CheckKeyUsage(cert *x509.Certificate) []model.Issue {
	// If the cert has ExtKeyUsage ServerAuth but KeyEncipherment / KeyAgreement
	// is not set (for RSA / ECDH respectively), flag it.
	var issues []model.Issue
	if hasExtKeyUsage(cert, x509.ExtKeyUsageServerAuth) {
		switch cert.PublicKeyAlgorithm {
		case x509.RSA:
			if cert.KeyUsage&x509.KeyUsageKeyEncipherment == 0 &&
				cert.KeyUsage&x509.KeyUsageDigitalSignature == 0 {
				issues = append(issues, model.Issue{
					Severity: model.SeverityError,
					Code:     "INVALID_KEY_USAGE",
					Message:  "Certificate is intended for TLS server auth but KeyUsage does not include KeyEncipherment or DigitalSignature",
					Field:    "keyUsage",
				})
			}
		case x509.ECDSA:
			if cert.KeyUsage&x509.KeyUsageDigitalSignature == 0 {
				issues = append(issues, model.Issue{
					Severity: model.SeverityError,
					Code:     "INVALID_KEY_USAGE",
					Message:  "Certificate is intended for TLS server auth but KeyUsage does not include DigitalSignature",
					Field:    "keyUsage",
				})
			}
		}
	}
	return issues
}

func hasExtKeyUsage(cert *x509.Certificate, usage x509.ExtKeyUsage) bool {
	for _, u := range cert.ExtKeyUsage {
		if u == usage {
			return true
		}
	}
	return false
}

// ComputeFingerprints returns SHA-256, SHA-1 and MD5 fingerprints of raw DER bytes.
func ComputeFingerprints(raw []byte) model.FingerprintInfo {
	sha256sum := sha256.Sum256(raw) //nolint:gosec
	sha1sum := sha1.Sum(raw)        //nolint:gosec
	md5sum := md5.Sum(raw)          //nolint:gosec
	return model.FingerprintInfo{
		SHA256: formatFingerprint(sha256sum[:]),
		SHA1:   formatFingerprint(sha1sum[:]),
		MD5:    formatFingerprint(md5sum[:]),
	}
}

// formatFingerprint converts raw bytes to a colon-separated uppercase hex string.
func formatFingerprint(b []byte) string {
	h := hex.EncodeToString(b)
	var sb strings.Builder
	for i := 0; i < len(h); i += 2 {
		if sb.Len() > 0 {
			sb.WriteByte(':')
		}
		sb.WriteString(strings.ToUpper(h[i : i+2]))
	}
	return sb.String()
}

// PublicKeyInfo extracts algorithm and size metadata from a public key.
func PublicKeyInfo(pub interface{}) model.PublicKeyInfo {
	info := model.PublicKeyInfo{}
	switch k := pub.(type) {
	case *rsa.PublicKey:
		info.Algorithm = "RSA"
		info.BitSize = k.N.BitLen()
	case *ecdsa.PublicKey:
		info.Algorithm = "EC"
		info.Curve = k.Curve.Params().Name
		info.BitSize = k.Curve.Params().BitSize
	case ed25519.PublicKey:
		info.Algorithm = "Ed25519"
		info.BitSize = 256
	default:
		info.Algorithm = "Unknown"
	}
	return info
}

// FormatKeyUsage converts a x509.KeyUsage bitmask to a slice of human-readable strings.
func FormatKeyUsage(ku x509.KeyUsage) []string {
	var usages []string
	flags := []struct {
		bit  x509.KeyUsage
		name string
	}{
		{x509.KeyUsageDigitalSignature, "DigitalSignature"},
		{x509.KeyUsageContentCommitment, "ContentCommitment"},
		{x509.KeyUsageKeyEncipherment, "KeyEncipherment"},
		{x509.KeyUsageDataEncipherment, "DataEncipherment"},
		{x509.KeyUsageKeyAgreement, "KeyAgreement"},
		{x509.KeyUsageCertSign, "KeyCertSign"},
		{x509.KeyUsageCRLSign, "CRLSign"},
		{x509.KeyUsageEncipherOnly, "EncipherOnly"},
		{x509.KeyUsageDecipherOnly, "DecipherOnly"},
	}
	for _, f := range flags {
		if ku&f.bit != 0 {
			usages = append(usages, f.name)
		}
	}
	return usages
}

// FormatExtKeyUsage converts a slice of x509.ExtKeyUsage to human-readable strings.
func FormatExtKeyUsage(ekus []x509.ExtKeyUsage) []string {
	names := map[x509.ExtKeyUsage]string{
		x509.ExtKeyUsageAny:             "Any",
		x509.ExtKeyUsageServerAuth:      "ServerAuth",
		x509.ExtKeyUsageClientAuth:      "ClientAuth",
		x509.ExtKeyUsageCodeSigning:     "CodeSigning",
		x509.ExtKeyUsageEmailProtection: "EmailProtection",
		x509.ExtKeyUsageIPSECEndSystem:  "IPSECEndSystem",
		x509.ExtKeyUsageIPSECTunnel:     "IPSECTunnel",
		x509.ExtKeyUsageIPSECUser:       "IPSECUser",
		x509.ExtKeyUsageTimeStamping:    "TimeStamping",
		x509.ExtKeyUsageOCSPSigning:     "OCSPSigning",
		x509.ExtKeyUsageMicrosoftServerGatedCrypto: "MicrosoftServerGatedCrypto",
		x509.ExtKeyUsageNetscapeServerGatedCrypto:  "NetscapeServerGatedCrypto",
	}
	var result []string
	for _, eku := range ekus {
		if name, ok := names[eku]; ok {
			result = append(result, name)
		} else {
			result = append(result, fmt.Sprintf("Unknown(%d)", eku))
		}
	}
	return result
}
