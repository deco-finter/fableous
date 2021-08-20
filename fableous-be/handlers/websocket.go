package handlers

import (
	"fmt"
	"log"
	"os"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"

	"github.com/deco-finter/fableous/fableous-be/constants"
	"github.com/deco-finter/fableous/fableous-be/datatransfers"
	"github.com/deco-finter/fableous/fableous-be/models"
	"github.com/deco-finter/fableous/fableous-be/utils"
)

type activeSession struct {
	classroomToken string
	classroomID    string
	sessionID      string
	currentPage    int
	hubConn        *websocket.Conn
	controllerConn map[string]*websocket.Conn // key: role, value: ws.Conn
	mutex          sync.RWMutex
}

func (sess *activeSession) BroadcastJSON(message datatransfers.WSMessage) (err error) {
	for _, conn := range sess.controllerConn {
		err = conn.WriteJSON(message)
	}
	return
}

func (m *module) ConnectHubWS(ctx *gin.Context, classroomID string) (err error) {
	ctx.Request.Header.Del("Sec-Websocket-Extensions")
	var session models.Session
	if session, err = m.db.sessionOrmer.GetOneOngoingByClassroomID(classroomID); err != nil {
		log.Printf("no active session. %s\n", err)
		return
	}
	var conn *websocket.Conn
	if conn, err = m.upgrader.Upgrade(ctx.Writer, ctx.Request, nil); err != nil {
		log.Printf("failed connecting hub websocket. %s\n", err)
		return
	}
	defer conn.Close()
	classroomToken := utils.GenerateRandomString(constants.ClassroomTokenLength)
	sess := &activeSession{
		classroomToken: classroomToken,
		classroomID:    classroomID,
		sessionID:      session.ID,
		currentPage:    0,
		hubConn:        conn,
		controllerConn: make(map[string]*websocket.Conn),
	}
	m.sessions.mutex.Lock()
	m.sessions.keys[classroomToken] = sess
	m.sessions.mutex.Unlock()
	return m.HubCommandWorker(conn, sess)
}

func (m *module) ConnectControllerWS(ctx *gin.Context, classroomToken, role, name string) (err error) {
	ctx.Request.Header.Del("Sec-Websocket-Extensions")
	var sess *activeSession
	if sess = m.GetClassroomActiveSession(classroomToken); sess == nil {
		log.Println("session not activated")
		return
	}
	if conn := m.GetActiveSessionController(sess, role); conn != nil {
		log.Println("role already connected")
		return
	}
	var conn *websocket.Conn
	if conn, err = m.upgrader.Upgrade(ctx.Writer, ctx.Request, nil); err != nil {
		log.Printf("failed connecting controller websocket. %s\n", err)
		return
	}
	defer conn.Close()
	sess.mutex.Lock()
	sess.controllerConn[role] = conn
	sess.mutex.Unlock()
	return m.ControllerCommandWorker(conn, sess, role, name)
}

func (m *module) HubCommandWorker(conn *websocket.Conn, sess *activeSession) (err error) {
	_ = conn.WriteJSON(datatransfers.WSMessage{
		Type: constants.WSMessageTypeControl,
		Data: datatransfers.WSMessageData{
			WSControlMessageData: datatransfers.WSControlMessageData{
				ClassroomToken: sess.classroomToken,
				ClassroomID:    sess.classroomID,
				SessionID:      sess.sessionID,
				CurrentPage:    &sess.currentPage,
				NextPage:       utils.BoolAddr(false),
			},
		},
	})
	for {
		var message datatransfers.WSMessage
		if err = conn.ReadJSON(&message); err != nil {
			if !websocket.IsCloseError(err, websocket.CloseGoingAway, websocket.CloseNormalClosure) {
				log.Printf("[HubCommandWorker] failed reading message. %s\n", err)
			}
			go m.SessionCleanUp(sess)
			var session models.Session
			if session, err = m.db.sessionOrmer.GetOneByIDByClassroomID(sess.sessionID, sess.classroomID); !session.Completed {
				_ = m.db.sessionOrmer.DeleteByIDByClassroomID(sess.sessionID, sess.classroomID)
			}
			break
		}
		switch message.Type {
		case constants.WSMessageTypeControl:
			if message.Data.WSControlMessageData.NextPage != nil && *message.Data.WSControlMessageData.NextPage {
				sess.currentPage++
				_ = sess.BroadcastJSON(datatransfers.WSMessage{
					Type: constants.WSMessageTypeControl,
					Data: datatransfers.WSMessageData{
						WSControlMessageData: datatransfers.WSControlMessageData{
							NextPage: utils.BoolAddr(true),
						},
					},
				})
				var session models.Session
				if session, err = m.db.sessionOrmer.GetOneByIDByClassroomID(sess.sessionID, sess.classroomID); err == nil && sess.currentPage > session.Pages {
					session.Completed = true
					if err = m.db.sessionOrmer.Update(session); err != nil {
						log.Printf("[HubCommandWorker] failed completing session. %s\n", err)
					}
				}
			}
		case constants.WSMessageTypePing:
			_ = conn.WriteJSON(datatransfers.WSMessage{
				Type: constants.WSMessageTypePing,
			})
		default:
			_ = conn.WriteJSON(datatransfers.WSMessage{
				Type: constants.WSMessageTypeError,
				Data: datatransfers.WSMessageData{
					WSErrorMessageData: datatransfers.WSErrorMessageData{
						Error: "unsupported message type",
					},
				},
			})
		}
	}
	return
}

func (m *module) ControllerCommandWorker(conn *websocket.Conn, sess *activeSession, role, name string) (err error) {
	_ = conn.WriteJSON(datatransfers.WSMessage{
		Type: constants.WSMessageTypeControl,
		Data: datatransfers.WSMessageData{
			WSControlMessageData: datatransfers.WSControlMessageData{
				ClassroomToken: sess.classroomToken,
				ClassroomID:    sess.classroomID,
				SessionID:      sess.sessionID,
				CurrentPage:    &sess.currentPage,
				NextPage:       utils.BoolAddr(false),
			},
		},
	})
	_ = sess.hubConn.WriteJSON(datatransfers.WSMessage{
		Type: constants.WSMessageTypeJoin,
		Data: datatransfers.WSMessageData{
			WSJoinMessageData: datatransfers.WSJoinMessageData{
				Role:    role,
				Name:    name,
				Joining: utils.BoolAddr(true),
			},
		},
	})
	for {
		var message datatransfers.WSMessage
		if err = conn.ReadJSON(&message); err != nil {
			if !websocket.IsCloseError(err, websocket.CloseGoingAway, websocket.CloseNormalClosure) {
				log.Printf("[ControllerCommandWorker] failed reading message. %s\n", err)
			}
			sess.mutex.Lock()
			delete(sess.controllerConn, role)
			sess.mutex.Unlock()
			_ = sess.hubConn.WriteJSON(datatransfers.WSMessage{
				Type: constants.WSMessageTypeJoin,
				Data: datatransfers.WSMessageData{
					WSJoinMessageData: datatransfers.WSJoinMessageData{
						Role:    role,
						Joining: utils.BoolAddr(false),
					},
				},
			})
			break
		}
		switch message.Type {
		case constants.WSMessageTypePaint, constants.WSMessageTypeFill, constants.WSMessageTypeText, constants.WSMessageTypeCursor:
			_ = sess.hubConn.WriteJSON(message)
		case constants.WSMessageTypeAudio:
			go m.SavePayload(sess, message)
			_ = sess.hubConn.WriteJSON(message)
		case constants.WSMessageTypePing:
			_ = conn.WriteJSON(datatransfers.WSMessage{
				Type: constants.WSMessageTypePing,
			})
		default:
			_ = conn.WriteJSON(datatransfers.WSMessage{
				Type: constants.WSMessageTypeError,
				Data: datatransfers.WSMessageData{
					WSErrorMessageData: datatransfers.WSErrorMessageData{
						Error: "unsupported message type",
					},
				},
			})
		}
	}
	return
}

func (m *module) SavePayload(sess *activeSession, message datatransfers.WSMessage) {
	var err error
	var data []byte
	if data, err = utils.ExtractPayload(message); err != nil {
		log.Println(err)
		return
	}
	directory := fmt.Sprintf("%s/%d", utils.GetSessionStaticDir(sess.sessionID, sess.classroomID), sess.currentPage)
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
	if _, err = file.Write(data); err != nil {
		log.Println(err)
	}
}

func (m *module) GetClassroomActiveSession(classroomToken string) (sess *activeSession) {
	m.sessions.mutex.RLock()
	defer m.sessions.mutex.RUnlock()
	if selected, ok := m.sessions.keys[classroomToken]; ok {
		sess = selected
	}
	return
}

func (m *module) GetActiveSessionController(sess *activeSession, role string) (conn *websocket.Conn) {
	sess.mutex.RLock()
	defer sess.mutex.RUnlock()
	if selected, ok := sess.controllerConn[role]; ok {
		conn = selected
	}
	return
}
