package analyzer

import (
	"crypto/x509"
	"crypto/x509/pkix"
	"encoding/asn1"
	"encoding/pem"
	"fmt"
	"strings"
	"time"

	"github.com/sandrolain/certgui/internal/model"
)

// ParseCRL decodes and parses a PEM or DER encoded Certificate Revocation List.
func ParseCRL(data []byte, warnDays int) (*model.CRLInfo, error) {
	raw := data
	var pemBlock *pem.Block

	// Try PEM first
	block, _ := pem.Decode(data)
	if block != nil && block.Type == "X509 CRL" {
		raw = block.Bytes
		pemBlock = block
	}

	pemStr := ""
	if pemBlock != nil {
		pemStr = string(pem.EncodeToMemory(pemBlock))
	} else {
		pemStr = string(pem.EncodeToMemory(&pem.Block{Type: "X509 CRL", Bytes: raw}))
	}

	crl, err := x509.ParseRevocationList(raw)
	if err != nil {
		if strings.Contains(err.Error(), "unsupported crl version") {
			return parseCRLv1Fallback(raw, pemStr)
		}
		return nil, fmt.Errorf("failed to parse CRL: %w", err)
	}

	info := &model.CRLInfo{
		Issuer:       pkixNameToModel(crl.Issuer),
		ThisUpdate:   crl.ThisUpdate,
		NextUpdate:   crl.NextUpdate,
		RevokedCount: len(crl.RevokedCertificateEntries),
		Signature:    model.SignatureInfo{Algorithm: crl.SignatureAlgorithm.String()},
		PEM:          pemStr,
	}

	// Check if the CRL has expired
	if time.Now().After(crl.NextUpdate) {
		info.Issues = append(info.Issues, model.Issue{
			Severity: model.SeverityError,
			Code:     "CRL_EXPIRED",
			Message:  fmt.Sprintf("CRL NextUpdate %s is in the past", crl.NextUpdate.Format(time.RFC3339)),
			Field:    "nextUpdate",
		})
	}

	return info, nil
}

// parseCRLv1Fallback parses older v1 CRLs that x509.ParseRevocationList
// rejects. It uses raw ASN.1 decoding via the pkix.CertificateList struct
// which has no version restriction.
func parseCRLv1Fallback(der []byte, pemStr string) (*model.CRLInfo, error) {
	var cl pkix.CertificateList
	if rest, err := asn1.Unmarshal(der, &cl); err != nil {
		return nil, fmt.Errorf("failed to parse CRL: %w", err)
	} else if len(rest) != 0 {
		return nil, fmt.Errorf("failed to parse CRL: trailing data")
	}

	tbs := cl.TBSCertList

	var issuerName pkix.Name
	issuerName.FillFromRDNSequence(&tbs.Issuer)

	info := &model.CRLInfo{
		Issuer:       pkixNameToModel(issuerName),
		ThisUpdate:   tbs.ThisUpdate,
		NextUpdate:   tbs.NextUpdate,
		RevokedCount: len(tbs.RevokedCertificates),
		Signature:    model.SignatureInfo{Algorithm: tbs.Signature.Algorithm.String()},
		PEM:          pemStr,
		Issues: []model.Issue{{
			Severity: model.SeverityInfo,
			Code:     "CRL_V1",
			Message:  "This is a version 1 CRL (legacy format); extended fields are unavailable",
		}},
	}

	if !tbs.NextUpdate.IsZero() && time.Now().After(tbs.NextUpdate) {
		info.Issues = append(info.Issues, model.Issue{
			Severity: model.SeverityError,
			Code:     "CRL_EXPIRED",
			Message:  fmt.Sprintf("CRL NextUpdate %s is in the past", tbs.NextUpdate.Format(time.RFC3339)),
			Field:    "nextUpdate",
		})
	}

	return info, nil
}
