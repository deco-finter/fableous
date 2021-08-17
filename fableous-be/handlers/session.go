package handlers

import (
	"log"

	"gorm.io/gorm"

	"github.com/deco-finter/fableous/fableous-be/constants"
	"github.com/deco-finter/fableous/fableous-be/datatransfers"
	"github.com/deco-finter/fableous/fableous-be/models"
	"github.com/deco-finter/fableous/fableous-be/utils"
)

func (m *module) SessionGetAllByClassroomID(classroomID string) (sessionInfos []datatransfers.SessionInfo, err error) {
	var sessions []models.Session
	sessionInfos = make([]datatransfers.SessionInfo, 0)
	if sessions, err = m.db.sessionOrmer.GetAllByClassroomID(classroomID); err == gorm.ErrRecordNotFound {
		return sessionInfos, nil
	} else if err != nil {
		return sessionInfos, err
	}
	for _, session := range sessions {
		sessionInfos = append(sessionInfos, datatransfers.SessionInfo{
			ID:          session.ID,
			Title:       session.Title,
			Description: session.Description,
			Pages:       session.Pages,
			Completed:   session.Completed,
			CreatedAt:   session.CreatedAt,
		})
	}
	return
}

func (m *module) SessionGetOneOngoingByClassroomID(classroomID string) (sessionInfo datatransfers.SessionInfo, err error) {
	var session models.Session
	if session, err = m.db.sessionOrmer.GetOneOngoingByClassroomID(classroomID); err != nil {
		return
	}
	sessionInfo = datatransfers.SessionInfo{
		ID:          session.ID,
		Title:       session.Title,
		Description: session.Description,
		Pages:       session.Pages,
		Completed:   session.Completed,
		CreatedAt:   session.CreatedAt,
	}
	return
}

func (m *module) SessionInsert(sessionInfo datatransfers.SessionInfo) (sessionID string, err error) {
	if sessionID, err = m.db.sessionOrmer.Insert(models.Session{
		ClassroomID: sessionInfo.ClassroomID,
		Title:       sessionInfo.Title,
		Description: sessionInfo.Description,
		Pages:       sessionInfo.Pages,
		Completed:   false,
	}); err != nil {
		return "", err
	}
	return
}

func (m *module) SessionUpdate(sessionUpdate datatransfers.SessionUpdate) (err error) {
	if err = m.db.sessionOrmer.Update(models.Session{
		ID:          sessionUpdate.ID,
		ClassroomID: sessionUpdate.ClassroomID,
		Title:       sessionUpdate.Title,
		Description: sessionUpdate.Description,
	}); err != nil {
		return err
	}
	return
}

func (m *module) SessionDelete(classroomID, sessionID string) (err error) {
	if err = m.db.sessionOrmer.Delete(classroomID, sessionID); err != nil {
		return err
	}
	log.Println(m.sessions.keys)
	m.sessions.mutex.Lock()
	var sess *activeSession
	for classroomToken, selected := range m.sessions.keys {
		if selected.sessionID == sessionID {
			sess = selected
			delete(m.sessions.keys, classroomToken)
			break
		}
	}
	m.sessions.mutex.Unlock()
	if sess == nil {
		log.Println("no active sess to remove")
		return
	}
	_ = sess.BroadcastJSON(datatransfers.WSMessage{
		Type: constants.WSMessageTypeJoin,
		Data: datatransfers.WSMessageData{
			WSJoinMessageData: datatransfers.WSJoinMessageData{
				Role:    constants.ControllerRoleHub,
				Joining: utils.BoolAddr(false),
			},
		},
	})
	if conn := m.GetActiveSessionController(sess, constants.ControllerRoleStory); conn != nil {
		log.Println("kicking story")
		_ = conn.Close()
	}
	if conn := m.GetActiveSessionController(sess, constants.ControllerRoleCharacter); conn != nil {
		log.Println("kicking char")
		_ = conn.Close()
	}
	if conn := m.GetActiveSessionController(sess, constants.ControllerRoleBackground); conn != nil {
		log.Println("kicking bg")
		_ = conn.Close()
	}
	if conn := sess.hubConn; conn != nil {
		log.Println("kicking hub")
		_ = conn.Close()
	}
	return
}
