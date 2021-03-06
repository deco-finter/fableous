package datatransfers

import (
	"errors"
	"time"
)

// JWTClaims is the JWT claims struct.
type JWTClaims struct {
	ID        string `json:"sub,omitempty"`
	ExpiresAt int64  `json:"exp,omitempty"`
	IssuedAt  int64  `json:"iat,omitempty"`
}

func (c JWTClaims) Valid() (err error) {
	now := time.Now()
	if now.After(time.Unix(c.ExpiresAt, 0)) {
		err = errors.New("token has expired")
	}
	if now.Before(time.Unix(c.IssuedAt, 0)) {
		err = errors.New("token used before issued")
	}
	return err
}
