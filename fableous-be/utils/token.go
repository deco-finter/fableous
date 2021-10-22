package utils

import (
	"crypto/rand"
)

// letterBytes is the alphabet used to generate the random strings.
const letterBytes = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"

// GenerateRandomString generates a random string of the given length.
func GenerateRandomString(length int) string {
	byteString := make([]byte, length)
	_, _ = rand.Read(byteString)
	for i, b := range byteString {
		byteString[i] = letterBytes[b%byte(len(letterBytes))]
	}
	return string(byteString)
}
