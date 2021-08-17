package models

import (
	"time"

	"gorm.io/gorm"
)

type classroomOrm struct {
	db *gorm.DB
}

type Classroom struct {
	ID        string    `gorm:"column:id;primaryKey;type:uuid;default:uuid_generate_v4()" json:"-"`
	User      User      `gorm:"foreignKey:UserID;references:id;constraint:OnUpdate:CASCADE,OnDelete:CASCADE" json:"-"`
	UserID    string    `json:"-"`
	Name      string    `gorm:"column:name;type:varchar(32);not null" json:"-"`
	CreatedAt time.Time `gorm:"autoCreateTime" json:"-"`
	UpdatedAt time.Time `gorm:"autoUpdateTime" json:"-"`
}

type ClassroomOrmer interface {
	GetOneByID(id string) (classroom Classroom, err error)
	GetAllByUserID(userID string) (classrooms []Classroom, err error)
	Insert(classroom Classroom) (id string, err error)
	Update(classroom Classroom) (err error)
	Delete(classroomID string) (err error)
}

func NewClassroomOrmer(db *gorm.DB) ClassroomOrmer {
	_ = db.AutoMigrate(&Classroom{}) // builds table when enabled
	return &classroomOrm{db}
}

func (o *classroomOrm) GetOneByID(id string) (classroom Classroom, err error) {
	result := o.db.Model(&Classroom{}).Where("id = ?", id).First(&classroom)
	return classroom, result.Error
}

func (o *classroomOrm) GetAllByUserID(userID string) (classrooms []Classroom, err error) {
	result := o.db.Model(&Classroom{}).Where("user_id = ?", userID).Find(&classrooms)
	return classrooms, result.Error
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

func (o *classroomOrm) Delete(id string) (err error) {
	result := o.db.Model(&Classroom{}).Delete(&Classroom{ID: id})
	return result.Error
}
