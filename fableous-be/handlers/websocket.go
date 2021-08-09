package handlers

import (
	"log"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"

	"github.com/deco-finter/fableous/fableous-be/constants"
	"github.com/deco-finter/fableous/fableous-be/datatransfers"
	"github.com/deco-finter/fableous/fableous-be/utils"
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

func (m *module) ConnectControllerWS(ctx *gin.Context, classroomToken, role string) (err error) {
	m.sessions.mutex.RLock()
	if session, ok := m.sessions.keys[classroomToken]; ok {
		switch role {
		case constants.WSControllerRoleBackground:
			if session.backgroundConnected {
				log.Printf("background role already connected")
				m.sessions.mutex.RUnlock()
				return
			}
			session.backgroundConnected = true
		case constants.WSControllerRoleCharacter:
			if session.characterConnected {
				log.Printf("character role already connected")
				m.sessions.mutex.RUnlock()
				return
			}
			session.characterConnected = true
		case constants.WSControllerRoleStory:
			if session.storyConnected {
				log.Printf("story role already connected")
				m.sessions.mutex.RUnlock()
				return
			}
			session.storyConnected = true
		}
	} else {
		log.Printf("session not initialised")
		m.sessions.mutex.RUnlock()
		return
	}
	m.sessions.mutex.RUnlock()
	ctx.Request.Header.Del("Sec-Websocket-Extensions")
	upgrader := websocket.Upgrader{}
	var conn *websocket.Conn
	if conn, err = upgrader.Upgrade(ctx.Writer, ctx.Request, ctx.Request.Header); err != nil {
		log.Printf("failed connecting hub websocket. %s\n", err)
		return
	}
	defer conn.Close()
	return m.ControllerCommandWorker(conn, classroomToken, role)
}

func (m *module) HubCommandWorker(conn *websocket.Conn, classroomID string) (err error) {
	classroomToken := utils.GenerateRandomString(constants.ClassroomTokenLength)
	m.sessions.mutex.Lock()
	m.sessions.keys[classroomToken] = &session{
		classroomID:         classroomID,
		characterConnected:  false,
		backgroundConnected: false,
		storyConnected:      false,
	}
	m.sessions.mutex.Unlock()
	_ = conn.WriteJSON(datatransfers.WSMessage{
		Type: constants.WSMessageTypeControl,
		Data: datatransfers.WSMessageData{
			Text: classroomToken,
		},
	})
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

func (m *module) ControllerCommandWorker(conn *websocket.Conn, classroomToken, role string) (err error) {
	for {
		var message datatransfers.WSMessage
		if err = conn.ReadJSON(&message); err != nil {
			if !websocket.IsCloseError(err, websocket.CloseGoingAway, websocket.CloseNormalClosure) {
				log.Printf("[ControllerCommandWorker] failed reading message. %s\n", err)
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
