package handlers

import (
	"fmt"
	"os"

	"gorm.io/gorm"

	"github.com/deco-finter/fableous/fableous-be/config"
	"github.com/deco-finter/fableous/fableous-be/datatransfers"
	"github.com/deco-finter/fableous/fableous-be/models"
)

// ClassroomGetByID returns a classroom by its ID.
func (m *module) ClassroomGetOneByID(id string) (classroomInfo datatransfers.ClassroomInfo, err error) {
	var classroom models.Classroom
	if classroom, err = m.db.classroomOrmer.GetOneByID(id); err != nil {
		return datatransfers.ClassroomInfo{}, err
	}
	classroomInfo = datatransfers.ClassroomInfo{
		ID:        classroom.ID,
		UserID:    classroom.UserID,
		Name:      classroom.Name,
		CreatedAt: classroom.CreatedAt,
	}
	return
}

// ClassroomGetAllByUserID returns all classrooms owned by a user.
func (m *module) ClassroomGetAllByUserID(userID string) (classroomInfos []datatransfers.ClassroomInfo, err error) {
	var classrooms []models.Classroom
	classroomInfos = make([]datatransfers.ClassroomInfo, 0)
	if classrooms, err = m.db.classroomOrmer.GetAllByUserID(userID); err == gorm.ErrRecordNotFound {
		return classroomInfos, nil
	} else if err != nil {
		return classroomInfos, err
	}
	for _, classroom := range classrooms {
		classroomInfos = append(classroomInfos, datatransfers.ClassroomInfo{
			ID:        classroom.ID,
			UserID:    classroom.UserID,
			Name:      classroom.Name,
			CreatedAt: classroom.CreatedAt,
		})
	}
	return
}

// ClassroomInsert inserts a new classroom.
func (m *module) ClassroomInsert(classroomInfo datatransfers.ClassroomInfo) (classroomID string, err error) {
	if classroomID, err = m.db.classroomOrmer.Insert(models.Classroom{
		UserID: classroomInfo.UserID,
		Name:   classroomInfo.Name,
	}); err != nil {
		return "", err
	}
	return
}

// ClassroomUpdate updates a classroom.
func (m *module) ClassroomUpdate(classroomInfo datatransfers.ClassroomInfo) (err error) {
	if err = m.db.classroomOrmer.Update(models.Classroom{
		ID:   classroomInfo.ID,
		Name: classroomInfo.Name,
	}); err != nil {
		return err
	}
	return
}

// ClassroomDeleteByID deletes a classroom by its ID.
// It also stops any ongoing session and removes all its sessions' static files.
func (m *module) ClassroomDeleteByID(classroomID string) (err error) {
	m.sessions.mutex.Lock()
	for classroomToken, sess := range m.sessions.keys {
		if sess.classroomID == classroomID {
			delete(m.sessions.keys, classroomToken)
			go m.SessionCleanUp(sess)
		}
	}
	m.sessions.mutex.Unlock()
	_ = os.RemoveAll(fmt.Sprintf("%s/%s", config.AppConfig.StaticDir, classroomID))
	if err = m.db.classroomOrmer.DeleteByID(classroomID); err != nil {
		return err
	}
	return
}
