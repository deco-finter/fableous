package constants

import (
	"time"
)

const (
	// AuthenticationTimeout is the expiry duration for issued JWT tokens.
	AuthenticationTimeout = time.Hour * 24 * 2
)
