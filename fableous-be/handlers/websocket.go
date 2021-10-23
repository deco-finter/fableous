package handlers

import (
	"fmt"
	"log"
	"os"
	"strings"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"

	"github.com/deco-finter/fableous/fableous-be/constants"
	"github.com/deco-finter/fableous/fableous-be/models"
	pb "github.com/deco-finter/fableous/fableous-be/protos"
	"github.com/deco-finter/fableous/fableous-be/utils"
)

// activeSession contains all the active session data and reference to all the websocket connections.
type activeSession struct {
	// Session metadata
	classroomToken string
	classroomID    string
	sessionID      string
	currentPage    int

	// WebSocket connections
	hubConn        *websocket.Conn
	controllerConn map[pb.ControllerRole]*websocket.Conn // key: role, value: ws.Conn
	controllerName map[pb.ControllerRole]string          // key: role, value: user name

	// Mutex for controllerConn and controllerName
	mutex sync.RWMutex
}

//  BroadcastMessage sends a message to all the connected controllers.
func (sess *activeSession) BroadcastMessage(message *pb.WSMessage) (err error) {
	sess.mutex.RLock()
	defer sess.mutex.RUnlock()
	for _, conn := range sess.controllerConn {
		if conn != nil {
			err = utils.SendMessage(conn, message)
		}
	}
	return
}

//  KickController disconnects a controller from the session.
func (sess *activeSession) KickController(role pb.ControllerRole, announceHub bool) (err error) {
	sess.mutex.Lock()
	if targetConn, ok := sess.controllerConn[role]; ok {
		err = utils.SendMessage(targetConn, &pb.WSMessage{
			Type: pb.WSMessageType_JOIN,
			Data: &pb.WSMessage_Join{
				Join: &pb.WSJoinMessageData{
					Role:    pb.ControllerRole_HUB,
					Joining: false,
				},
			},
		})
		_ = targetConn.Close()
	}
	delete(sess.controllerConn, role)
	delete(sess.controllerName, role)
	sess.mutex.Unlock()
	if announceHub {
		err = utils.SendMessage(sess.hubConn, &pb.WSMessage{
			Type: pb.WSMessageType_JOIN,
			Data: &pb.WSMessage_Join{
				Join: &pb.WSJoinMessageData{
					Role:    role,
					Joining: false,
				},
			},
		})
	}
	return
}

// ConnectHubWS handles the hub's initial WebSocket connnection.
func (m *module) ConnectHubWS(ctx *gin.Context, classroomID string) (err error) {
	ctx.Request.Header.Del("Sec-Websocket-Extensions")
	var conn *websocket.Conn
	if conn, err = m.upgrader.Upgrade(ctx.Writer, ctx.Request, nil); err != nil {
		log.Printf("failed connecting hub websocket. %s\n", err)
		return
	}
	defer conn.Close()
	var session models.Session
	if session, err = m.db.sessionOrmer.GetOneOngoingByClassroomID(classroomID); err != nil {
		log.Printf("no active session. %s\n", err)
		_ = utils.SendMessage(conn, &pb.WSMessage{
			Type: pb.WSMessageType_ERROR,
			Data: &pb.WSMessage_Error{
				Error: &pb.WSErrorMessageData{
					Error: "Classroom has no active session!",
				},
			},
		})
		return
	}
	classroomToken := utils.GenerateRandomString(constants.ClassroomTokenLength)
	sess := &activeSession{
		classroomToken: classroomToken,
		classroomID:    classroomID,
		sessionID:      session.ID,
		currentPage:    0,
		hubConn:        conn,
		controllerConn: make(map[pb.ControllerRole]*websocket.Conn),
		controllerName: make(map[pb.ControllerRole]string),
	}
	m.sessions.mutex.Lock()
	m.sessions.keys[classroomToken] = sess
	m.sessions.mutex.Unlock()
	return m.HubCommandWorker(conn, sess)
}

// ConnectHubWS handles the controllers's initial WebSocket connnection.
func (m *module) ConnectControllerWS(ctx *gin.Context, classroomToken string, role pb.ControllerRole, name string) (err error) {
	ctx.Request.Header.Del("Sec-Websocket-Extensions")
	var conn *websocket.Conn
	if conn, err = m.upgrader.Upgrade(ctx.Writer, ctx.Request, nil); err != nil {
		log.Printf("failed connecting controller websocket. %s\n", err)
		return
	}
	defer conn.Close()
	var sess *activeSession
	if sess = m.GetClassroomActiveSession(classroomToken); sess == nil {
		log.Println("invalid token")
		_ = utils.SendMessage(conn, &pb.WSMessage{
			Type: pb.WSMessageType_ERROR,
			Data: &pb.WSMessage_Error{
				Error: &pb.WSErrorMessageData{
					Error: "Invalid token!",
				},
			},
		})
		return
	}
	if existingConn := m.GetActiveSessionController(sess, role); existingConn != nil {
		log.Println("role already connected")
		_ = utils.SendMessage(conn, &pb.WSMessage{
			Type: pb.WSMessageType_ERROR,
			Data: &pb.WSMessage_Error{
				Error: &pb.WSErrorMessageData{
					Error: fmt.Sprintf("%s role already joined! Try choosing another role!", strings.Title(strings.ToLower(role.String()))),
				},
			},
		})
		return
	}
	sess.mutex.Lock()
	sess.controllerConn[role] = conn
	sess.controllerName[role] = name
	sess.mutex.Unlock()
	return m.ControllerCommandWorker(conn, sess, role, name)
}

// HubCommandWorker handles all messages from the hub.
// It keeps the WebSocket connection alive by blocking the goroutine.
func (m *module) HubCommandWorker(conn *websocket.Conn, sess *activeSession) (err error) {
	// cleanup session when hub disconnects
	defer func() {
		m.sessions.mutex.Lock()
		delete(m.sessions.keys, sess.classroomToken)
		m.sessions.mutex.Unlock()
	}()
	// send session metadata
	_ = utils.SendMessage(conn, &pb.WSMessage{
		Type: pb.WSMessageType_CONTROL,
		Data: &pb.WSMessage_Control{
			Control: &pb.WSControlMessageData{
				ClassroomToken: sess.classroomToken,
				ClassroomId:    sess.classroomID,
				SessionId:      sess.sessionID,
				CurrentPage:    int32(sess.currentPage),
				NextPage:       false,
			},
		},
	})
	// listen for messages
	for {
		var message *pb.WSMessage
		if message, err = utils.RecieveMessage(conn); err != nil {
			if !websocket.IsCloseError(err, websocket.CloseGoingAway, websocket.CloseNormalClosure) {
				log.Printf("[HubCommandWorker] failed reading message. %s\n", err)
			}
			var session models.Session
			if session, err = m.db.sessionOrmer.GetOneByIDByClassroomID(sess.sessionID, sess.classroomID); !session.Completed {
				_ = m.db.sessionOrmer.DeleteByIDByClassroomID(sess.sessionID, sess.classroomID)
				go m.SessionCleanUp(sess)
			}
			break
		}
		switch message.Type {
		case pb.WSMessageType_ACHIEVEMENT:
			// relay ACHIEVEMENT message to all controllers
			_ = sess.BroadcastMessage(message)
		case pb.WSMessageType_CONTROL:
			// check if CONTROL message pushes next page
			if message.Data.(*pb.WSMessage_Control).Control.NextPage {
				sess.currentPage++
				_ = sess.BroadcastMessage(&pb.WSMessage{
					Type: pb.WSMessageType_CONTROL,
					Data: &pb.WSMessage_Control{
						Control: &pb.WSControlMessageData{
							NextPage: true,
						},
					},
				})
				// check if story has finished
				var session models.Session
				if session, err = m.db.sessionOrmer.GetOneByIDByClassroomID(sess.sessionID, sess.classroomID); err == nil && sess.currentPage > session.Pages {
					session.Completed = true
					if name, ok := sess.controllerName[pb.ControllerRole_STORY]; ok {
						session.NameStory = name
					}
					if name, ok := sess.controllerName[pb.ControllerRole_CHARACTER]; ok {
						session.NameCharacter = name
					}
					if name, ok := sess.controllerName[pb.ControllerRole_BACKGROUND]; ok {
						session.NameBackground = name
					}
					if err = m.db.sessionOrmer.Update(session); err != nil {
						log.Printf("[HubCommandWorker] failed completing session. %s\n", err)
					}
				}
			}
			// check if CONTROL message clears a controller's canvas
			if clearedController := message.Data.(*pb.WSMessage_Control).Control.Clear; clearedController != pb.ControllerRole_NONE {
				_ = utils.SendMessage(sess.hubConn, message)
				_ = utils.SendMessage(sess.controllerConn[clearedController], message)
			}
			// check if CONTROL message kicks a controller
			if kickedController := message.Data.(*pb.WSMessage_Control).Control.Kick; kickedController != pb.ControllerRole_NONE {
				_ = sess.KickController(kickedController, false)
			}
		case pb.WSMessageType_IMAGE:
			go m.SavePayload(sess, message, true)
		case pb.WSMessageType_MANIFEST:
			go m.SavePayload(sess, message, false)
		case pb.WSMessageType_PING:
			_ = utils.SendMessage(conn, &pb.WSMessage{
				Type: pb.WSMessageType_PING,
			})
		default:
			_ = utils.SendMessage(conn, &pb.WSMessage{
				Type: pb.WSMessageType_ERROR,
				Data: &pb.WSMessage_Error{
					Error: &pb.WSErrorMessageData{
						Error: "unsupported message type",
					},
				},
			})
		}
	}
	return
}

// ControllerCommandWorker handles all messages from the controller.
// It keeps the WebSocket connection alive by blocking the goroutine.
func (m *module) ControllerCommandWorker(conn *websocket.Conn, sess *activeSession, role pb.ControllerRole, name string) (err error) {
	// send session metadata
	_ = utils.SendMessage(conn, &pb.WSMessage{
		Type: pb.WSMessageType_CONTROL,
		Data: &pb.WSMessage_Control{
			Control: &pb.WSControlMessageData{
				ClassroomToken: sess.classroomToken,
				ClassroomId:    sess.classroomID,
				SessionId:      sess.sessionID,
				CurrentPage:    int32(sess.currentPage),
				NextPage:       false,
			},
		},
	})
	// notify hub of controller connection
	_ = utils.SendMessage(sess.hubConn, &pb.WSMessage{
		Type: pb.WSMessageType_JOIN,
		Data: &pb.WSMessage_Join{
			Join: &pb.WSJoinMessageData{
				Role:    role,
				Name:    name,
				Joining: true,
			},
		},
	})
	// listen for messages
	for {
		var message *pb.WSMessage
		if message, err = utils.RecieveMessage(conn); err != nil {
			if !websocket.IsCloseError(err, websocket.CloseGoingAway, websocket.CloseNormalClosure) {
				log.Printf("[ControllerCommandWorker] failed reading message. %s\n", err)
			}
			_ = sess.KickController(role, true)
			break
		}
		switch message.Type {
		case pb.WSMessageType_PAINT, pb.WSMessageType_FILL, pb.WSMessageType_TEXT, pb.WSMessageType_CHECKPOINT,
			pb.WSMessageType_UNDO, pb.WSMessageType_CURSOR, pb.WSMessageType_CONTROL:
			// relay message to hub
			_ = utils.SendMessage(sess.hubConn, message)
		case pb.WSMessageType_AUDIO:
			// concurrently save payload then send filename to hub
			go func() {
				message.Data.(*pb.WSMessage_Paint).Paint.Id = int32(sess.currentPage) // override page numbber
				if filename, page := m.SavePayload(sess, message, true); filename != "" {
					_ = utils.SendMessage(sess.hubConn, &pb.WSMessage{
						Type: pb.WSMessageType_AUDIO,
						Role: role,
						Data: &pb.WSMessage_Paint{
							Paint: &pb.WSPaintMessageData{
								Text: fmt.Sprintf("%s/%s/%d/%s", sess.classroomID, sess.sessionID, page, filename),
							},
						},
					})
				}
			}()
		case pb.WSMessageType_PING:
			_ = utils.SendMessage(conn, &pb.WSMessage{
				Type: pb.WSMessageType_PING,
			})
		default:
			_ = utils.SendMessage(conn, &pb.WSMessage{
				Type: pb.WSMessageType_ERROR,
				Data: &pb.WSMessage_Error{
					Error: &pb.WSErrorMessageData{
						Error: "unsupported message type",
					},
				},
			})
		}
	}
	return
}

// SavePayload saves the payload to disk and returns the filename.
func (m *module) SavePayload(sess *activeSession, message *pb.WSMessage, isBase64 bool) (filename string, page int) {
	var err error
	var data []byte
	if data, page, err = utils.ExtractPayload(message, isBase64); err != nil {
		log.Println(err)
		return
	}
	directory := fmt.Sprintf("%s/%d", utils.GetSessionStaticDir(sess.sessionID, sess.classroomID), page)
	if _, err = os.Stat(directory); os.IsNotExist(err) {
		if err = os.MkdirAll(directory, 0700); err != nil {
			log.Println(err)
			return
		}
	}
	log.Println(message.Type, page)
	switch message.Type {
	case pb.WSMessageType_AUDIO:
		filename = fmt.Sprintf("%d.ogg", time.Now().Unix())
	case pb.WSMessageType_IMAGE:
		filename = "image.png"
	case pb.WSMessageType_MANIFEST:
		filename = "manifest.json"
	default:
		return
	}
	var file *os.File
	if file, err = os.OpenFile(fmt.Sprintf("%s/%s", directory, filename), os.O_WRONLY|os.O_CREATE|os.O_TRUNC, 0700); err != nil {
		log.Println(err)
		return
	}
	defer file.Close()
	if _, err = file.Write(data); err != nil {
		log.Println(err)
		return
	}
	return
}

// GetClassroomActiveSession returns the active session bound to a classroomToken.
func (m *module) GetClassroomActiveSession(classroomToken string) (sess *activeSession) {
	m.sessions.mutex.RLock()
	defer m.sessions.mutex.RUnlock()
	if selected, ok := m.sessions.keys[classroomToken]; ok {
		sess = selected
	}
	return
}

// GetActiveSessionController returns the WebSocket connetion of the controller with the given role of a session.
func (m *module) GetActiveSessionController(sess *activeSession, role pb.ControllerRole) (conn *websocket.Conn) {
	sess.mutex.RLock()
	defer sess.mutex.RUnlock()
	if selected, ok := sess.controllerConn[role]; ok {
		conn = selected
	}
	return
}
