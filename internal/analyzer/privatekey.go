package analyzer

import (
	"crypto/ecdsa"
	"crypto/ed25519"
	"crypto/rsa"
	"crypto/x509"
	"encoding/pem"
	"errors"
	"fmt"

	"github.com/youmark/pkcs8"

	"github.com/sandrolain/certgui/internal/model"
)

// ErrKeyEncrypted is returned when a private key is encrypted and no password
// was supplied. The server converts it to HTTP 422 so the frontend knows to
// prompt for a passphrase.
var ErrKeyEncrypted = errors.New("password required to decrypt private key")

// ParsePrivateKey extracts metadata from a PEM-encoded private key.
// If password is non-empty it is used to decrypt an encrypted key.
// The key material itself is NEVER included in the returned model.
func ParsePrivateKey(data []byte, password string) (*model.PrivateKeyInfo, error) {
	block, _ := pem.Decode(data)
	if block == nil {
		return nil, fmt.Errorf("no PEM block found in private key data")
	}

	info := &model.PrivateKeyInfo{}

	switch block.Type {
	case "RSA PRIVATE KEY":
		// Legacy OpenSSL format may be encrypted with a DEK-Info header.
		if x509.IsEncryptedPEMBlock(block) { //nolint:staticcheck // intentional legacy support
			if password == "" {
				return nil, ErrKeyEncrypted
			}
			der, err := x509.DecryptPEMBlock(block, []byte(password)) //nolint:staticcheck
			if err != nil {
				return nil, fmt.Errorf("failed to decrypt RSA private key: %w", err)
			}
			key, err := x509.ParsePKCS1PrivateKey(der)
			if err != nil {
				return nil, fmt.Errorf("failed to parse RSA private key: %w", err)
			}
			info.Algorithm = "RSA"
			info.BitSize = key.N.BitLen()
			info.Issues = append(info.Issues, CheckKeyStrength(&key.PublicKey)...)
			return info, nil
		}
		key, err := x509.ParsePKCS1PrivateKey(block.Bytes)
		if err != nil {
			return nil, fmt.Errorf("failed to parse RSA private key: %w", err)
		}
		info.Algorithm = "RSA"
		info.BitSize = key.N.BitLen()
		info.Issues = append(info.Issues, CheckKeyStrength(&key.PublicKey)...)

	case "EC PRIVATE KEY":
		if x509.IsEncryptedPEMBlock(block) { //nolint:staticcheck
			if password == "" {
				return nil, ErrKeyEncrypted
			}
			der, err := x509.DecryptPEMBlock(block, []byte(password)) //nolint:staticcheck
			if err != nil {
				return nil, fmt.Errorf("failed to decrypt EC private key: %w", err)
			}
			key, err := x509.ParseECPrivateKey(der)
			if err != nil {
				return nil, fmt.Errorf("failed to parse EC private key: %w", err)
			}
			info.Algorithm = "EC"
			info.Curve = key.Curve.Params().Name
			info.BitSize = key.Curve.Params().BitSize
			info.Issues = append(info.Issues, CheckKeyStrength(&key.PublicKey)...)
			return info, nil
		}
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
		// PKCS#8 encrypted key — requires a passphrase to decrypt.
		if password == "" {
			return nil, ErrKeyEncrypted
		}
		key, err := pkcs8.ParsePKCS8PrivateKey(block.Bytes, []byte(password))
		if err != nil {
			return nil, fmt.Errorf("failed to decrypt private key (wrong password?): %w", err)
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

	default:
		return nil, fmt.Errorf("unsupported private key PEM type: %s", block.Type)
	}

	return info, nil
}
