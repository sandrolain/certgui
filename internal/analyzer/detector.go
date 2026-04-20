// Package analyzer implements certificate parsing and validation.
// It has no HTTP dependencies and can be tested standalone.
package analyzer

import (
	"bytes"
	"encoding/json"
	"encoding/pem"
	"strings"

	"github.com/sandrolain/certgui/internal/model"
)

// Detect examines raw bytes and returns the most likely CertType.
// Detection order:
//  1. JSON with "kty" field → JWK/JWKS
//  2. PEM blocks → header determines type; multiple blocks → Bundle
//  3. Binary fallback → DER X.509, then PKCS#12
func Detect(data []byte) model.CertType {
	trimmed := bytes.TrimSpace(data)

	// 1. JSON check
	if len(trimmed) > 0 && trimmed[0] == '{' || (len(trimmed) > 0 && trimmed[0] == '[') {
		var raw map[string]interface{}
		if json.Unmarshal(trimmed, &raw) == nil {
			if _, ok := raw["kty"]; ok {
				return model.TypeJWK
			}
		}
		// Array → might be JWKS "keys" array, or a JWKS object with "keys"
		var rawArr []interface{}
		if json.Unmarshal(trimmed, &rawArr) == nil {
			return model.TypeJWK
		}
		// Could be a JWKS {"keys":[...]}
		if _, ok := raw["keys"]; ok {
			return model.TypeJWK
		}
	}

	// 2. PEM check
	if bytes.Contains(trimmed, []byte("-----BEGIN ")) {
		return detectPEM(trimmed)
	}

	// 3. Binary DER / PKCS#12
	return detectBinary(trimmed)
}

// detectPEM returns the CertType for PEM-encoded data.
func detectPEM(data []byte) model.CertType {
	var types []string
	rest := data
	for {
		block, remainder := pem.Decode(rest)
		if block == nil {
			break
		}
		types = append(types, block.Type)
		rest = remainder
	}

	if len(types) == 0 {
		return model.TypeUnknown
	}
	if len(types) > 1 {
		// Multiple blocks → treat as bundle unless all are the same type
		allSame := true
		for _, t := range types[1:] {
			if t != types[0] {
				allSame = false
				break
			}
		}
		if !allSame || types[0] == "CERTIFICATE" {
			if len(types) > 1 {
				return model.TypeBundle
			}
		}
	}

	return pemHeaderToType(types[0])
}

// pemHeaderToType maps a PEM block type string to a CertType.
func pemHeaderToType(header string) model.CertType {
	switch strings.ToUpper(header) {
	case "CERTIFICATE":
		return model.TypeX509
	case "CERTIFICATE REQUEST", "NEW CERTIFICATE REQUEST":
		return model.TypeCSR
	case "X509 CRL":
		return model.TypeCRL
	case "PKCS7", "CMS":
		return model.TypePKCS7
	case "RSA PRIVATE KEY", "EC PRIVATE KEY", "PRIVATE KEY",
		"ENCRYPTED PRIVATE KEY", "DSA PRIVATE KEY":
		return model.TypePrivateKey
	case "PUBLIC KEY", "RSA PUBLIC KEY":
		return model.TypePrivateKey // treated as key material
	default:
		return model.TypeUnknown
	}
}

// detectBinary attempts to detect the type of binary (DER) encoded data.
func detectBinary(data []byte) model.CertType {
	// PKCS#12 check must come before the generic X.509 SEQUENCE check because
	// both formats start with the 0x30 ASN.1 SEQUENCE tag.
	if isBinaryPKCS12(data) {
		return model.TypePKCS7 // PKCS#12 is dispatched via the TypePKCS7 branch
	}
	if isBinaryX509(data) {
		return model.TypeX509
	}
	return model.TypeUnknown
}

// isBinaryX509 does a minimal ASN.1 SEQUENCE sanity check.
func isBinaryX509(data []byte) bool {
	return len(data) > 4 && data[0] == 0x30
}

// isBinaryPKCS12 checks for the PKCS#12 PFX ASN.1 preamble.
func isBinaryPKCS12(data []byte) bool {
	// PFX starts with SEQUENCE containing an INTEGER (version 3)
	return len(data) > 6 && data[0] == 0x30 && data[4] == 0x02
}
