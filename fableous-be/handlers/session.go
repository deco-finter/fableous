package handlers

import (
	"log"
	"os"

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

func (m *module) SessionGetOneByIDByClassroomID(id, classroomID string) (sessionInfo datatransfers.SessionInfo, err error) {
	var session models.Session
	if session, err = m.db.sessionOrmer.GetOneByIDByClassroomID(id, classroomID); err != nil {
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

func (m *module) SessionInsert(sessionInfo datatransfers.SessionInfo) (id string, err error) {
	if id, err = m.db.sessionOrmer.Insert(models.Session{
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

func (m *module) SessionDeleteByIDByClassroomID(id, classroomID string) (err error) {
	if err = m.db.sessionOrmer.DeleteByIDByClassroomID(id, classroomID); err != nil {
		return err
	}
	m.sessions.mutex.Lock()
	sess := &activeSession{
		classroomID: classroomID,
		sessionID:   id,
	}
	log.Println(m.sessions.keys)
	for classroomToken, selected := range m.sessions.keys {
		if selected.sessionID == id && selected.classroomID == classroomID {
			sess = selected
			delete(m.sessions.keys, classroomToken)
			break
		}
	}
	m.sessions.mutex.Unlock()
	go m.SessionCleanUp(sess)
	return
}

func (m *module) SessionCleanUp(sess *activeSession) {
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
		_ = conn.Close()
	}
	if conn := m.GetActiveSessionController(sess, constants.ControllerRoleCharacter); conn != nil {
		_ = conn.Close()
	}
	if conn := m.GetActiveSessionController(sess, constants.ControllerRoleBackground); conn != nil {
		_ = conn.Close()
	}
	if conn := sess.hubConn; conn != nil {
		_ = conn.Close()
	}
	go m.sessionClearStaticByIDByClassroomID(sess.sessionID, sess.classroomID)
}

func (m *module) sessionClearStaticByIDByClassroomID(id, classroomID string) {
	_ = os.RemoveAll(utils.GetSessionStaticDir(id, classroomID))
}
