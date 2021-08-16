package handlers

import (
	"github.com/deco-finter/fableous/fableous-be/datatransfers"
	"github.com/deco-finter/fableous/fableous-be/models"
)

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