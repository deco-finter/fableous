package utils

import (
	"encoding/base64"
	"strings"

	"github.com/deco-finter/fableous/fableous-be/constants"
	"github.com/deco-finter/fableous/fableous-be/datatransfers"
)

func ExtractPayload(message datatransfers.WSMessage) (payload []byte, err error) {
	stringPayload := message.Data.(map[string]interface{})[constants.WSMessageDataPayloadKey].(string)
	b64String := strings.Split(stringPayload, ",")[1]
	if payload, err = base64.StdEncoding.DecodeString(b64String); err != nil {
		return
	}
	return
}
