package models

import (
	"time"

	"gorm.io/gorm"
)

type userOrm struct {
	db *gorm.DB
}

type User struct {
	ID        string    `gorm:"column:id;primaryKey;type:uuid;default:uuid_generate_v4()" json:"-"`
	Name      string    `gorm:"column:name;type:varchar(32);not null" json:"-"`
	Email     string    `gorm:"uniqueIndex;not null" json:"-"`
	Password  string    `gorm:"not null" json:"-"`
	CreatedAt time.Time `gorm:"autoCreateTime" json:"-"`
	UpdatedAt time.Time `gorm:"autoUpdateTime" json:"-"`
}

type UserOrmer interface {
	GetOneByID(id string) (user User, err error)
	GetOneByEmail(email string) (user User, err error)
	Insert(user User) (id string, err error)
	Update(user User) (err error)
}

func NewUserOrmer(db *gorm.DB) UserOrmer {
	_ = db.AutoMigrate(&User{}) // builds table when enabled
	return &userOrm{db}
}

func (o *userOrm) GetOneByID(id string) (user User, err error) {
	result := o.db.Model(&User{}).Where("id = ?", id).First(&user)
	return user, result.Error
}

func (o *userOrm) GetOneByEmail(email string) (user User, err error) {
	result := o.db.Model(&User{}).Where("email = ?", email).First(&user)
	return user, result.Error
}

func (o *userOrm) Insert(user User) (id string, err error) {
	result := o.db.Model(&User{}).Create(&user)
	return user.ID, result.Error
}

func (o *userOrm) Update(user User) (err error) {
	// By default, only non-empty fields are updated. See https://gorm.io/docs/update.html#Updates-multiple-columns
	result := o.db.Model(&User{}).Model(&user).Updates(&user)
	return result.Error
}
