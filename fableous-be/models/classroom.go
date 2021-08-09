package models

import (
	"gorm.io/gorm"
)

type classroomOrm struct {
	db *gorm.DB
}

type Classroom struct {
	ID   string `gorm:"column:id;primaryKey;type:uuid;default:uuid_generate_v4()" json:"-"`
	Name string `gorm:"column:name;type:varchar(32);not null" json:"-"`
}

type ClassroomOrmer interface {
	GetOneByID(id string) (classroom Classroom, err error)
	// GetOneByEmail(email string) (classroom Classroom, err error)
	Insert(classroom Classroom) (id string, err error)
	Update(classroom Classroom) (err error)
}

func NewClassroomOrmer(db *gorm.DB) ClassroomOrmer {
	_ = db.AutoMigrate(&Classroom{}) // builds table when enabled
	return &classroomOrm{db}
}

func (o *classroomOrm) GetOneByID(id string) (classroom Classroom, err error) {
	result := o.db.Model(&Classroom{}).Where("id = ?", id).First(&classroom)
	return classroom, result.Error
}

func (o *classroomOrm) Insert(classroom Classroom) (id string, err error) {
	result := o.db.Model(&Classroom{}).Create(&classroom)
	return classroom.ID, result.Error
}

func (o *classroomOrm) Update(classroom Classroom) (err error) {
	// By default, only non-empty fields are updated. See https://gorm.io/docs/update.html#Updates-multiple-columns
	result := o.db.Model(&Classroom{}).Model(&classroom).Updates(&classroom)
	return result.Error
}
