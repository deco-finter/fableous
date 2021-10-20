package utils

import (
	"encoding/base64"
	"strings"

	"github.com/gorilla/websocket"
	"google.golang.org/protobuf/proto"

	pb "github.com/deco-finter/fableous/fableous-be/protos"
)

func SendMessage(conn *websocket.Conn, message *pb.WSMessage) (err error) {
	var bytes []byte
	if bytes, err = proto.Marshal(message); err != nil {
		return
	}
	err = conn.WriteMessage(websocket.BinaryMessage, bytes)
	return
}

func RecieveMessage(conn *websocket.Conn) (message *pb.WSMessage, err error) {
	var bytes []byte
	if _, bytes, err = conn.ReadMessage(); err != nil {
		return
	}
	message = &pb.WSMessage{}
	err = proto.Unmarshal(bytes, message)
	return
}

func ExtractPayload(message *pb.WSMessage, isBase64 bool) (payload []byte, page int, err error) {
	data := message.Data.(*pb.WSMessage_Paint).Paint
	stringPayload := data.Text
	page = int(data.Id)
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
