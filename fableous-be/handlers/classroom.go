package handlers

import (
	"errors"
	"fmt"

	"golang.org/x/crypto/bcrypt"

	"github.com/deco-finter/fableous/fableous-be/datatransfers"
	"github.com/deco-finter/fableous/fableous-be/models"
)

func (m *module) ClassroomRegister(credentials datatransfers.ClassroomSignup) (err error) {
	var hashedPassword []byte
	if hashedPassword, err = bcrypt.GenerateFromPassword([]byte(credentials.Password), bcrypt.DefaultCost); err != nil {
		return errors.New("failed hashing password")
	}
	if _, err = m.db.classroomOrmer.Insert(models.Classroom{
		Name:     credentials.Name,
		Password: string(hashedPassword),
	}); err != nil {
		return fmt.Errorf("error inserting classroom. %v", err)
	}
	return
}

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
