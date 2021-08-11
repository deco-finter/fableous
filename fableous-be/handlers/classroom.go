package handlers

import (
	"github.com/deco-finter/fableous/fableous-be/datatransfers"
	"github.com/deco-finter/fableous/fableous-be/models"
)

func (m *module) ClassroomGetOneByID(id string) (classroomInfo datatransfers.ClassroomInfo, err error) {
	var classroom models.Classroom
	if classroom, err = m.db.classroomOrmer.GetOneByID(id); err != nil {
		return datatransfers.ClassroomInfo{}, err
	}
	classroomInfo = datatransfers.ClassroomInfo{
		ID:        classroom.ID,
		Name:      classroom.Name,
		CreatedAt: classroom.CreatedAt,
	}
	return
}

func (m *module) ClassroomUpdate(classroomInfo datatransfers.ClassroomInfo) (err error) {
	if err = m.db.classroomOrmer.Update(models.Classroom{
		ID:   classroomInfo.ID,
		Name: classroomInfo.Name,
	}); err != nil {
		return err
	}
	return
}
