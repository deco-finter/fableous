package models

import (
	"time"

	"gorm.io/gorm"
)

type sessionOrm struct {
	db *gorm.DB
}

type Session struct {
	ID          string    `gorm:"column:id;primaryKey;type:uuid;default:uuid_generate_v4()" json:"-"`
	Classroom   Classroom `gorm:"foreignKey:ClassroomID;references:id;constraint:OnUpdate:CASCADE,OnDelete:CASCADE" json:"-"`
	ClassroomID string    `json:"-"`
	Title       string    `gorm:"column:title;type:varchar(255);not null" json:"-"`
	Description string    `gorm:"column:description;type:text" json:"-"`
	Pages       int       `gorm:"column:pages;not null" json:"-"`
	Completed   bool      `gorm:"column:completed;type:boolean;not null" json:"-"`
	CreatedAt   time.Time `gorm:"autoCreateTime" json:"-"`
	UpdatedAt   time.Time `gorm:"autoUpdateTime" json:"-"`
}

type SessionOrmer interface {
	GetOneByIDByClassroomID(id, classroomID string) (session Session, err error)
	GetOneOngoingByClassroomID(classroomID string) (session Session, err error)
	GetAllByClassroomID(classroomID string) (sessions []Session, err error)
	GetAllCompletedByClassroomID(classroomID string) (sessions []Session, err error)
	Insert(session Session) (id string, err error)
	Update(session Session) (err error)
	Delete(classroomID, id string) (err error)
}

func NewSessionOrmer(db *gorm.DB) SessionOrmer {
	_ = db.AutoMigrate(&Session{})
	return &sessionOrm{db}
}

func (o *sessionOrm) GetOneByIDByClassroomID(id, classroomID string) (session Session, err error) {
	result := o.db.Model(&Session{}).Where("id = ? AND classroom_id = ?", id, classroomID).First(&session)
	return session, result.Error
}

func (o *sessionOrm) GetOneOngoingByClassroomID(classroomID string) (session Session, err error) {
	result := o.db.Model(&Session{}).Where("classroom_id = ? AND completed = ?", classroomID, false).First(&session)
	return session, result.Error
}

func (o *sessionOrm) GetAllByClassroomID(classroomID string) (sessions []Session, err error) {
	result := o.db.Model(&Session{}).Where("classroom_id = ?", classroomID).Order("created_at ASC").Find(&sessions)
	return sessions, result.Error
}

func (o *sessionOrm) GetAllCompletedByClassroomID(classroomID string) (sessions []Session, err error) {
	result := o.db.Model(&Session{}).Where("classroom_id = ? AND completed = ?", classroomID, true).Order("created_at ASC").Find(&sessions)
	return sessions, result.Error
}

func (o *sessionOrm) Insert(session Session) (id string, err error) {
	result := o.db.Model(&Session{}).Create(&session)
	return session.ID, result.Error
}

func (o *sessionOrm) Update(session Session) (err error) {
	result := o.db.Model(&Session{}).Model(&session).Where("id = ? AND classroom_id = ?", session.ID, session.ClassroomID).Updates(&session)
	return result.Error
}

func (o *sessionOrm) Delete(classroomID, id string) (err error) {
	result := o.db.Model(&Session{}).Delete(&Session{ID: id, ClassroomID: classroomID})
	return result.Error
}
