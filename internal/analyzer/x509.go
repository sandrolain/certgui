package analyzer

import (
	"crypto/x509"
	"crypto/x509/pkix"
	"encoding/hex"
	"encoding/pem"
	"fmt"
	"net"
	"strings"
	"time"

	"github.com/sandrolain/certgui/internal/model"
)

// ParseX509PEM decodes one or more PEM-encoded X.509 certificates.
// Multiple CERTIFICATE blocks are each returned as a separate X509Info entry.
func ParseX509PEM(data []byte, warnDays int) ([]model.X509Info, error) {
	var infos []model.X509Info
	rest := data
	for {
		block, remainder := pem.Decode(rest)
		if block == nil {
			break
		}
		rest = remainder
		if block.Type != "CERTIFICATE" {
			continue
		}
		cert, err := x509.ParseCertificate(block.Bytes)
		if err != nil {
			return nil, fmt.Errorf("failed to parse certificate: %w", err)
		}
		info := buildX509Info(cert, block.Bytes, warnDays)
		info.PEM = string(pem.EncodeToMemory(block))
		infos = append(infos, info)
	}
	if len(infos) == 0 {
		return nil, fmt.Errorf("no CERTIFICATE blocks found in PEM data")
	}
	return infos, nil
}

// ParseX509DER decodes a single DER-encoded X.509 certificate.
func ParseX509DER(data []byte, warnDays int) (*model.X509Info, error) {
	cert, err := x509.ParseCertificate(data)
	if err != nil {
		return nil, fmt.Errorf("failed to parse DER certificate: %w", err)
	}
	info := buildX509Info(cert, data, warnDays)
	info.PEM = string(pem.EncodeToMemory(&pem.Block{Type: "CERTIFICATE", Bytes: data}))
	return &info, nil
}

// buildX509Info extracts all fields from a parsed *x509.Certificate.
func buildX509Info(cert *x509.Certificate, raw []byte, warnDays int) model.X509Info {
	now := time.Now()
	daysRemaining := int(time.Until(cert.NotAfter).Hours() / 24)

	info := model.X509Info{
		Subject:       pkixNameToModel(cert.Subject),
		Issuer:        pkixNameToModel(cert.Issuer),
		SerialNumber:  cert.SerialNumber.Text(16),
		NotBefore:     cert.NotBefore,
		NotAfter:      cert.NotAfter,
		DaysRemaining: daysRemaining,
		IsExpired:     now.After(cert.NotAfter),
		IsSelfSigned:  cert.Subject.String() == cert.Issuer.String(),
		PublicKey:     PublicKeyInfo(cert.PublicKey),
		Signature:     model.SignatureInfo{Algorithm: cert.SignatureAlgorithm.String()},
		SANs:          buildSANInfo(cert),
		KeyUsage:      FormatKeyUsage(cert.KeyUsage),
		ExtKeyUsage:   FormatExtKeyUsage(cert.ExtKeyUsage),
		BasicConstraints: model.BasicConstraintsInfo{
			IsCA:              cert.IsCA,
			PathLenConstraint: cert.MaxPathLen,
			PathLenPresent:    cert.MaxPathLenZero || cert.MaxPathLen > 0,
		},
		Extensions:   buildExtensionInfo(cert),
		Revocation:   buildRevocationInfo(cert),
		Fingerprints: ComputeFingerprints(raw),
	}

	if len(cert.SubjectKeyId) > 0 {
		info.SubjectKeyID = hex.EncodeToString(cert.SubjectKeyId)
	}
	if len(cert.AuthorityKeyId) > 0 {
		info.AuthorityKeyID = hex.EncodeToString(cert.AuthorityKeyId)
	}

	// Public key fingerprint
	if pubDER, err := x509.MarshalPKIXPublicKey(cert.PublicKey); err == nil {
		info.PublicKey.Fingerprint = ComputeFingerprints(pubDER).SHA256
	}

	// Validation checks
	info.Issues = append(info.Issues, CheckExpiry(cert, warnDays)...)
	info.Issues = append(info.Issues, CheckSignatureAlgorithm(cert)...)
	info.Issues = append(info.Issues, CheckKeyStrength(cert.PublicKey)...)
	info.Issues = append(info.Issues, CheckSANs(cert)...)
	info.Issues = append(info.Issues, CheckKeyUsage(cert)...)

	if info.IsSelfSigned {
		info.Issues = append(info.Issues, model.Issue{
			Severity: model.SeverityWarning,
			Code:     "SELF_SIGNED",
			Message:  "Certificate is self-signed",
		})
	}

	if len(cert.OCSPServer) > 0 || len(cert.CRLDistributionPoints) > 0 {
		info.Issues = append(info.Issues, model.Issue{
			Severity: model.SeverityInfo,
			Code:     "REVOCATION_NOT_CHECKED",
			Message:  "OCSP/CRL distribution points are present but revocation has not been checked online",
			Field:    "revocation",
		})
	}

	return info
}

// pkixNameToModel converts a pkix.Name to model.NameInfo.
func pkixNameToModel(n pkix.Name) model.NameInfo {
	return model.NameInfo{
		CommonName:         n.CommonName,
		Organization:       n.Organization,
		OrganizationalUnit: n.OrganizationalUnit,
		Country:            n.Country,
		Province:           n.Province,
		Locality:           n.Locality,
		StreetAddress:      n.StreetAddress,
		PostalCode:         n.PostalCode,
		SerialNumber:       n.SerialNumber,
	}
}

// buildSANInfo extracts Subject Alternative Names from a certificate.
func buildSANInfo(cert *x509.Certificate) model.SANInfo {
	san := model.SANInfo{
		DNSNames:       cert.DNSNames,
		EmailAddresses: cert.EmailAddresses,
	}
	for _, ip := range cert.IPAddresses {
		san.IPAddresses = append(san.IPAddresses, net.IP.String(ip))
	}
	for _, uri := range cert.URIs {
		san.URIs = append(san.URIs, uri.String())
	}
	return san
}

// buildRevocationInfo extracts CRL and OCSP URLs from a certificate.
func buildRevocationInfo(cert *x509.Certificate) model.RevocationInfo {
	return model.RevocationInfo{
		CRLDistributionPoints: cert.CRLDistributionPoints,
		OCSPServers:           cert.OCSPServer,
	}
}

// buildExtensionInfo converts raw certificate extensions to human-readable form.
func buildExtensionInfo(cert *x509.Certificate) []model.ExtensionInfo {
	oidNames := map[string]string{
		"2.5.29.17":          "SubjectAltName",
		"2.5.29.19":          "BasicConstraints",
		"2.5.29.15":          "KeyUsage",
		"2.5.29.37":          "ExtendedKeyUsage",
		"2.5.29.14":          "SubjectKeyIdentifier",
		"2.5.29.35":          "AuthorityKeyIdentifier",
		"1.3.6.1.5.5.7.1.1": "AuthorityInfoAccess",
		"2.5.29.31":          "CRLDistributionPoints",
		"2.5.29.32":          "CertificatePolicies",
		"2.5.29.18":          "IssuerAltName",
		"2.5.29.30":          "NameConstraints",
		"2.5.29.36":          "PolicyConstraints",
		"2.5.29.54":          "InhibitAnyPolicy",
	}

	var exts []model.ExtensionInfo
	for _, ext := range cert.Extensions {
		oidStr := ext.Id.String()
		info := model.ExtensionInfo{
			OID:      oidStr,
			Name:     oidNames[oidStr],
			Critical: ext.Critical,
			Value:    strings.ToUpper(hex.EncodeToString(ext.Value)),
		}
		exts = append(exts, info)
	}
	return exts
}
