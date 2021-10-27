package handlers

import (
	"log"
	"os"

	"gorm.io/gorm"

	"github.com/deco-finter/fableous/fableous-be/datatransfers"
	"github.com/deco-finter/fableous/fableous-be/models"
	pb "github.com/deco-finter/fableous/fableous-be/protos"
	"github.com/deco-finter/fableous/fableous-be/utils"
)

// SessionGetAllByClassroomID returns all sessions by its classroomID.
func (m *module) SessionGetAllByClassroomID(classroomID string) (sessionInfos []datatransfers.SessionInfo, err error) {
	var sessions []models.Session
	sessionInfos = make([]datatransfers.SessionInfo, 0)
	if sessions, err = m.db.sessionOrmer.GetAllCompletedByClassroomID(classroomID); err == gorm.ErrRecordNotFound {
		return sessionInfos, nil
	} else if err != nil {
		return sessionInfos, err
	}
	for _, session := range sessions {
		sessionInfos = append(sessionInfos, datatransfers.SessionInfo{
			ID:             session.ID,
			Title:          session.Title,
			Description:    session.Description,
			Pages:          session.Pages,
			NameStory:      session.NameStory,
			NameCharacter:  session.NameCharacter,
			NameBackground: session.NameBackground,
			Completed:      session.Completed,
			CreatedAt:      session.CreatedAt,
		})
	}
	return
}

// SessionGetOneByIDByClassroomID returns one session by its ID and ClassroomID.
func (m *module) SessionGetOneByIDByClassroomID(id, classroomID string) (sessionInfo datatransfers.SessionInfo, err error) {
	var session models.Session
	if session, err = m.db.sessionOrmer.GetOneByIDByClassroomID(id, classroomID); err != nil {
		return
	}
	sessionInfo = datatransfers.SessionInfo{
		ID:             session.ID,
		Title:          session.Title,
		Description:    session.Description,
		Pages:          session.Pages,
		NameStory:      session.NameStory,
		NameCharacter:  session.NameCharacter,
		NameBackground: session.NameBackground,
		Completed:      session.Completed,
		CreatedAt:      session.CreatedAt,
	}
	return
}

// SessionGetOneOngoingByClassroomID returns a classroom's ongoing session by its classroomID.
func (m *module) SessionGetOneOngoingByClassroomID(classroomID string) (sessionInfo datatransfers.SessionInfo, err error) {
	var session models.Session
	if session, err = m.db.sessionOrmer.GetOneOngoingByClassroomID(classroomID); err != nil {
		return
	}
	sessionInfo = datatransfers.SessionInfo{
		ID:             session.ID,
		Title:          session.Title,
		Description:    session.Description,
		Pages:          session.Pages,
		NameStory:      session.NameStory,
		NameCharacter:  session.NameCharacter,
		NameBackground: session.NameBackground,
		Completed:      session.Completed,
		CreatedAt:      session.CreatedAt,
	}
	return
}

// SessionInsert inserts a new session.
func (m *module) SessionInsert(sessionInfo datatransfers.SessionInfo) (id string, err error) {
	if id, err = m.db.sessionOrmer.Insert(models.Session{
		ClassroomID:    sessionInfo.ClassroomID,
		Title:          sessionInfo.Title,
		Description:    sessionInfo.Description,
		Pages:          sessionInfo.Pages,
		NameStory:      "",
		NameCharacter:  "",
		NameBackground: "",
		Completed:      false,
	}); err != nil {
		return "", err
	}
	return
}

// SessionUpdate updates a session.
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

// SessionDeleteByIDByClassroomID deletes a session by its ID and ClassroomID.
// It stops the session if it is still ongoing and deletes its static files.
func (m *module) SessionDeleteByIDByClassroomID(id, classroomID string) (err error) {
	if err = m.db.sessionOrmer.DeleteByIDByClassroomID(id, classroomID); err != nil {
		return err
	}
	sess := &activeSession{
		classroomID: classroomID,
		sessionID:   id,
	}
	m.sessions.mutex.Lock()
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

// SessionCleanUp kicks all controllers and hub from the session and deletes its static files.
func (m *module) SessionCleanUp(sess *activeSession) {
	_ = sess.BroadcastMessage(&pb.WSMessage{
		Type: pb.WSMessageType_JOIN,
		Data: &pb.WSMessage_Join{
			Join: &pb.WSJoinMessageData{
				Role:    pb.ControllerRole_HUB,
				Joining: false,
			},
		},
	})
	if conn := m.GetActiveSessionController(sess, pb.ControllerRole_STORY); conn != nil {
		_ = conn.Close()
	}
	if conn := m.GetActiveSessionController(sess, pb.ControllerRole_CHARACTER); conn != nil {
		_ = conn.Close()
	}
	if conn := m.GetActiveSessionController(sess, pb.ControllerRole_BACKGROUND); conn != nil {
		_ = conn.Close()
	}
	if conn := sess.hubConn; conn != nil {
		_ = conn.Close()
	}
	go m.sessionClearStaticByIDByClassroomID(sess.sessionID, sess.classroomID)
}

// sessionClearStaticByIDByClassroomID deletes a session's static files.
func (m *module) sessionClearStaticByIDByClassroomID(id, classroomID string) {
	_ = os.RemoveAll(utils.GetSessionStaticDir(id, classroomID))
}
