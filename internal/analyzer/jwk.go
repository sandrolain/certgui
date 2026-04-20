package analyzer

import (
	"encoding/json"
	"fmt"

	"github.com/sandrolain/certgui/internal/model"
)

// ParseJWK parses a JSON Web Key (JWK) or JSON Web Key Set (JWKS).
func ParseJWK(data []byte) (*model.JWKInfo, error) {
	// First attempt: single JWK object
	var singleKey jwkRaw
	if err := json.Unmarshal(data, &singleKey); err == nil && singleKey.Kty != "" {
		return jwkRawToModel(singleKey), nil
	}

	// Second attempt: JWKS {"keys": [...]}
	var jwks struct {
		Keys []jwkRaw `json:"keys"`
	}
	if err := json.Unmarshal(data, &jwks); err == nil && len(jwks.Keys) > 0 {
		info := &model.JWKInfo{KeyType: "JWKS"}
		for _, k := range jwks.Keys {
			info.Keys = append(info.Keys, *jwkRawToModel(k))
		}
		return info, nil
	}

	return nil, fmt.Errorf("data does not appear to be a valid JWK or JWKS")
}

// jwkRaw is a minimal JWK structure for JSON unmarshalling.
type jwkRaw struct {
	Kty string `json:"kty"`
	Use string `json:"use,omitempty"`
	Alg string `json:"alg,omitempty"`
	Kid string `json:"kid,omitempty"`
	Crv string `json:"crv,omitempty"`
	// RSA key parameters
	N string `json:"n,omitempty"`
	// EC / OKP key parameters
	X string `json:"x,omitempty"`
}

func jwkRawToModel(k jwkRaw) *model.JWKInfo {
	info := &model.JWKInfo{
		KeyType:   k.Kty,
		Use:       k.Use,
		Algorithm: k.Alg,
		KeyID:     k.Kid,
		Curve:     k.Crv,
	}

	switch k.Kty {
	case "RSA":
		// Base64url-encoded modulus — length in bytes * 8 = bit size
		info.BitSize = estimateRSABitSize(k.N)
		if info.BitSize > 0 && info.BitSize < 2048 {
			info.Issues = append(info.Issues, model.Issue{
				Severity: model.SeverityError,
				Code:     "WEAK_KEY_RSA",
				Message:  fmt.Sprintf("RSA key is only ~%d bits; minimum recommended size is 2048", info.BitSize),
				Field:    "n",
			})
		}
	case "EC":
		info.BitSize = curveBitSize(k.Crv)
		if info.BitSize > 0 && info.BitSize < 256 {
			info.Issues = append(info.Issues, model.Issue{
				Severity: model.SeverityError,
				Code:     "WEAK_KEY_EC",
				Message:  fmt.Sprintf("EC key curve %s is only %d bits; minimum recommended is P-256", k.Crv, info.BitSize),
				Field:    "crv",
			})
		}
	}
	return info
}

// estimateRSABitSize estimates the RSA modulus bit length from its base64url representation.
func estimateRSABitSize(n string) int {
	if n == "" {
		return 0
	}
	// Each base64 char encodes 6 bits; 4 chars = 3 bytes.
	// Approximate: len(n) * 6 / 8 * 8
	return len(n) * 6 / 8 * 8
}

// curveBitSize returns the bit size for known named curves.
func curveBitSize(crv string) int {
	switch crv {
	case "P-256":
		return 256
	case "P-384":
		return 384
	case "P-521":
		return 521
	case "Ed25519":
		return 256
	case "X25519":
		return 256
	}
	return 0
}
