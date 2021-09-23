package utils

import (
	"encoding/base64"
	"strings"

	"github.com/deco-finter/fableous/fableous-be/datatransfers"
)

func ExtractPayload(message datatransfers.WSMessage, isBase64 bool) (payload []byte, page int, err error) {
	stringPayload := message.Data.WSPaintMessageData.Text
	page = message.Data.WSPaintMessageData.ID
	if isBase64 {
		b64String := strings.Split(stringPayload, ",")[1]
		if payload, err = base64.StdEncoding.DecodeString(b64String); err != nil {
			return
		}
	} else {
		payload = []byte(stringPayload)
	}
	return
}
