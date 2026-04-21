package analyzer

import (
	"fmt"
	"math/big"
	"strings"

	"github.com/sandrolain/certgui/internal/model"
)

// ParseSRL parses the contents of an OpenSSL serial-number file (.srl).
// The file contains a single hex string (the next serial number the CA will
// assign). Returns a SRLInfo with both the hex and decimal representations.
func ParseSRL(data []byte) (*model.SRLInfo, error) {
	hex := strings.TrimSpace(string(data))
	if hex == "" {
		return nil, fmt.Errorf("srl file is empty")
	}

	// Validate: must be a pure hex string (may include a leading newline or CR).
	for _, c := range hex {
		if !((c >= '0' && c <= '9') || (c >= 'a' && c <= 'f') || (c >= 'A' && c <= 'F')) {
			return nil, fmt.Errorf("srl file contains non-hex characters: %q", string(c))
		}
	}

	n := new(big.Int)
	if _, ok := n.SetString(hex, 16); !ok {
		return nil, fmt.Errorf("srl file contains invalid hex value: %q", hex)
	}

	info := &model.SRLInfo{
		SerialHex:     strings.ToUpper(hex),
		SerialDecimal: n.String(),
	}
	return info, nil
}
