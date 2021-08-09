package handlers

import (
	"log"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"

	"github.com/deco-finter/fableous/fableous-be/constants"
	"github.com/deco-finter/fableous/fableous-be/datatransfers"
)

func (m *module) ConnectHubWS(ctx *gin.Context, classroomID string) (err error) {
	ctx.Request.Header.Del("Sec-Websocket-Extensions")
	upgrader := websocket.Upgrader{}
	var conn *websocket.Conn
	if conn, err = upgrader.Upgrade(ctx.Writer, ctx.Request, ctx.Request.Header); err != nil {
		log.Printf("failed connecting hub websocket. %s\n", err)
		return
	}
	defer conn.Close()
	return m.HubCommandWorker(conn, classroomID)
}

func (m *module) HubCommandWorker(conn *websocket.Conn, classroomID string) (err error) {
	for {
		var message datatransfers.WSMessage
		if err = conn.ReadJSON(&message); err != nil {
			if !websocket.IsCloseError(err, websocket.CloseGoingAway, websocket.CloseNormalClosure) {
				log.Printf("[HubCommandWorker] failed reading message. %s\n", err)
			}
			_ = conn.WriteJSON(datatransfers.WSMessage{
				Type: constants.WSMessageTypeError,
				Data: datatransfers.WSMessageData{
					Text: "failed reading message",
				},
			})
			break
		}
		switch message.Type {
		case constants.WSMessageTypePing:
			_ = conn.WriteJSON(datatransfers.WSMessage{
				Type: constants.WSMessageTypePing,
			})
		default:
			_ = conn.WriteJSON(datatransfers.WSMessage{
				Type: constants.WSMessageTypeError,
				Data: datatransfers.WSMessageData{
					Text: "unsupported message type",
				},
			})
		}
	}
	return
}
