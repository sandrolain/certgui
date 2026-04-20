package analyzer

import (
	"crypto/ecdsa"
	"crypto/ed25519"
	"crypto/rsa"
	"crypto/x509"
	"encoding/pem"
	"fmt"

	"github.com/sandrolain/certgui/internal/model"
)

// ParsePrivateKey extracts metadata from a PEM-encoded private key.
// The key material itself is NEVER included in the returned model.
func ParsePrivateKey(data []byte) (*model.PrivateKeyInfo, error) {
	block, _ := pem.Decode(data)
	if block == nil {
		return nil, fmt.Errorf("no PEM block found in private key data")
	}

	info := &model.PrivateKeyInfo{}

	switch block.Type {
	case "RSA PRIVATE KEY":
		key, err := x509.ParsePKCS1PrivateKey(block.Bytes)
		if err != nil {
			return nil, fmt.Errorf("failed to parse RSA private key: %w", err)
		}
		info.Algorithm = "RSA"
		info.BitSize = key.N.BitLen()
		info.Issues = append(info.Issues, CheckKeyStrength(&key.PublicKey)...)

	case "EC PRIVATE KEY":
		key, err := x509.ParseECPrivateKey(block.Bytes)
		if err != nil {
			return nil, fmt.Errorf("failed to parse EC private key: %w", err)
		}
		info.Algorithm = "EC"
		info.Curve = key.Curve.Params().Name
		info.BitSize = key.Curve.Params().BitSize
		info.Issues = append(info.Issues, CheckKeyStrength(&key.PublicKey)...)

	case "PRIVATE KEY":
		key, err := x509.ParsePKCS8PrivateKey(block.Bytes)
		if err != nil {
			return nil, fmt.Errorf("failed to parse PKCS#8 private key: %w", err)
		}
		switch k := key.(type) {
		case *rsa.PrivateKey:
			info.Algorithm = "RSA"
			info.BitSize = k.N.BitLen()
			info.Issues = append(info.Issues, CheckKeyStrength(&k.PublicKey)...)
		case *ecdsa.PrivateKey:
			info.Algorithm = "EC"
			info.Curve = k.Curve.Params().Name
			info.BitSize = k.Curve.Params().BitSize
			info.Issues = append(info.Issues, CheckKeyStrength(&k.PublicKey)...)
		case ed25519.PrivateKey:
			info.Algorithm = "Ed25519"
			info.BitSize = 256
		default:
			info.Algorithm = "Unknown"
		}

	case "ENCRYPTED PRIVATE KEY":
		// Cannot inspect without passphrase — just report the type
		info.Algorithm = "Encrypted"
		info.Issues = append(info.Issues, model.Issue{
			Severity: model.SeverityInfo,
			Code:     "KEY_ENCRYPTED",
			Message:  "Private key is encrypted; passphrase required to inspect key details",
		})

	default:
		return nil, fmt.Errorf("unsupported private key PEM type: %s", block.Type)
	}

	return info, nil
}
