package utils

import (
	"crypto/rand"
)

const letterBytes = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"

func GenerateRandomString(length int) string {
	byteString := make([]byte, length)
	_, _ = rand.Read(byteString)
	for i, b := range byteString {
		byteString[i] = letterBytes[b%byte(len(letterBytes))]
	}
	return string(byteString)
}
