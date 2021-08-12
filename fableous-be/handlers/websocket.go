package handlers

import (
	"fmt"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"

	"github.com/deco-finter/fableous/fableous-be/config"
	"github.com/deco-finter/fableous/fableous-be/constants"
	"github.com/deco-finter/fableous/fableous-be/datatransfers"
	"github.com/deco-finter/fableous/fableous-be/utils"
)

func (m *module) ConnectHubWS(ctx *gin.Context, classroomID string) (err error) {
	ctx.Request.Header.Del("Sec-Websocket-Extensions")
	upgrader := websocket.Upgrader{
		CheckOrigin: func(r *http.Request) bool {
			return true
		},
	}
	var conn *websocket.Conn
	if conn, err = upgrader.Upgrade(ctx.Writer, ctx.Request, nil); err != nil {
		log.Printf("failed connecting hub websocket. %s\n", err)
		return
	}
	defer conn.Close()
	classroomToken := utils.GenerateRandomString(constants.ClassroomTokenLength)
	sess := &session{
		classroomToken: classroomToken,
		classroomID:    classroomID,
		sessionID:      "SESSION_ID", // TODO: session management
		currentPage:    1,            // TOD0: session management
		hubConn:        conn,
		controllerConn: make(map[string]*websocket.Conn),
	}
	m.sessions.mutex.Lock()
	m.sessions.keys[classroomToken] = sess
	m.sessions.mutex.Unlock()
	return m.HubCommandWorker(conn, sess)
}

func (m *module) ConnectControllerWS(ctx *gin.Context, classroomToken, role string) (err error) {
	var sess *session
	if sess = m.GetClassroomSession(classroomToken); sess == nil {
		log.Printf("session not initialised")
		return
	}
	if conn := m.GetSessionController(sess, role); conn != nil {
		log.Printf("role already connected")
		return
	}
	ctx.Request.Header.Del("Sec-Websocket-Extensions")
	upgrader := websocket.Upgrader{
		CheckOrigin: func(r *http.Request) bool {
			return true
		},
	}
	var conn *websocket.Conn
	if conn, err = upgrader.Upgrade(ctx.Writer, ctx.Request, nil); err != nil {
		log.Printf("failed connecting controller websocket. %s\n", err)
		return
	}
	defer conn.Close()
	sess.mutex.Lock()
	sess.controllerConn[role] = conn
	sess.mutex.Unlock()
	return m.ControllerCommandWorker(conn, sess, role)
}

func (m *module) HubCommandWorker(conn *websocket.Conn, sess *session) (err error) {
	_ = conn.WriteJSON(datatransfers.WSMessage{
		Type: constants.WSMessageTypeControl,
		Data: sess.classroomToken,
	})
	for {
		var message datatransfers.WSMessage
		if err = conn.ReadJSON(&message); err != nil {
			if !websocket.IsCloseError(err, websocket.CloseGoingAway, websocket.CloseNormalClosure) {
				log.Printf("[HubCommandWorker] failed reading message. %s\n", err)
			}
			_ = conn.WriteJSON(datatransfers.WSMessage{
				Type: constants.WSMessageTypeError,
				Data: "failed reading message",
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
				Data: "unsupported message type",
			})
		}
	}
	return
}

func (m *module) ControllerCommandWorker(conn *websocket.Conn, sess *session, role string) (err error) {
	for {
		var message datatransfers.WSMessage
		if err = conn.ReadJSON(&message); err != nil {
			if !websocket.IsCloseError(err, websocket.CloseGoingAway, websocket.CloseNormalClosure) {
				log.Printf("[ControllerCommandWorker] failed reading message. %s\n", err)
			}
			_ = conn.WriteJSON(datatransfers.WSMessage{
				Type: constants.WSMessageTypeError,
				Data: "failed reading message",
			})
			break
		}
		switch message.Type {
		case constants.WSMessageTypePaint, constants.WSMessageTypeFill, constants.WSMessageTypeText, constants.WSMessageTypeAudio:
			_ = sess.hubConn.WriteJSON(message)
		case constants.WSMessageTypePing:
			_ = conn.WriteJSON(datatransfers.WSMessage{
				Type: constants.WSMessageTypePing,
			})
		default:
			_ = conn.WriteJSON(datatransfers.WSMessage{
				Type: constants.WSMessageTypeError,
				Data: "unsupported message type",
			})
		}
	}
	return
}

func (m *module) SavePayload(sess *session, message datatransfers.WSMessage) {
	var err error
	var data []byte
	if data, err = utils.ExtractPayload(message); err != nil {
		log.Println(err)
		return
	}
	directory := fmt.Sprintf("%s/%s/%s/%d", config.AppConfig.StaticDir, sess.classroomID, sess.sessionID, sess.currentPage)
	if _, err = os.Stat(directory); os.IsNotExist(err) {
		if err = os.MkdirAll(directory, 0700); err != nil {
			log.Println(err)
			return
		}
	}
	var fileName string
	switch message.Type {
	case constants.WSMessageTypeAudio:
		fileName = fmt.Sprintf("%d.ogg", time.Now().Unix())
	default:
		return
	}
	var file *os.File
	if file, err = os.OpenFile(fmt.Sprintf("%s/%s", directory, fileName), os.O_WRONLY|os.O_CREATE, 0700); err != nil {
		log.Println(err)
		return
	}
	defer file.Close()
	file.Write(data)
}

func (m *module) GetClassroomSession(classroomToken string) (sess *session) {
	m.sessions.mutex.RLock()
	defer m.sessions.mutex.RUnlock()
	if selected, ok := m.sessions.keys[classroomToken]; ok {
		sess = selected
	}
	return
}

func (m *module) GetSessionController(sess *session, role string) (conn *websocket.Conn) {
	sess.mutex.RLock()
	defer sess.mutex.RUnlock()
	if selected, ok := sess.controllerConn[role]; ok {
		conn = selected
	}
	return
}