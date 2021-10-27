package utils

import (
	"encoding/base64"
	"strings"
	"sync"

	"github.com/gorilla/websocket"
	"google.golang.org/protobuf/proto"

	pb "github.com/deco-finter/fableous/fableous-be/protos"
)

var sendMutex sync.Mutex

// SendMessage sends a message to the WebSocket client.
func SendMessage(conn *websocket.Conn, message *pb.WSMessage) (err error) {
	var bytes []byte
	if bytes, err = proto.Marshal(message); err != nil {
		return
	}
	sendMutex.Lock()
	defer sendMutex.Unlock()
	err = conn.WriteMessage(websocket.BinaryMessage, bytes)
	return
}

// RecieveMessage recieves a message from the WebSocket client.
// This is a blocking call.
func RecieveMessage(conn *websocket.Conn) (message *pb.WSMessage, err error) {
	var bytes []byte
	if _, bytes, err = conn.ReadMessage(); err != nil {
		return
	}
	message = &pb.WSMessage{}
	err = proto.Unmarshal(bytes, message)
	return
}

// ExtractPayload extracts the payload from a WebSocket message.
// The payload could be in plaintext or encoded in base64.
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
