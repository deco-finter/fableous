package handlers

import (
	"errors"
	"fmt"

	"golang.org/x/crypto/bcrypt"

	"github.com/deco-finter/fableous/fableous-be/datatransfers"
	"github.com/deco-finter/fableous/fableous-be/models"
)

func (m *module) UserRegister(credentials datatransfers.UserSignup) (err error) {
	var hashedPassword []byte
	if hashedPassword, err = bcrypt.GenerateFromPassword([]byte(credentials.Password), bcrypt.DefaultCost); err != nil {
		return errors.New("failed hashing password")
	}
	if _, err = m.db.userOrmer.Insert(models.User{
		Name:     credentials.Name,
		Email:    credentials.Email,
		Password: string(hashedPassword),
	}); err != nil {
		return fmt.Errorf("error inserting user. %v", err)
	}
	return
}

func (m *module) UserGetOneByID(id string) (userInfo datatransfers.UserInfo, err error) {
	var user models.User
	if user, err = m.db.userOrmer.GetOneByID(id); err != nil {
		return datatransfers.UserInfo{}, err
	}
	userInfo = datatransfers.UserInfo{
		ID:        user.ID,
		Name:      user.Name,
		Email:     user.Email,
		CreatedAt: user.CreatedAt,
	}
	return
}

func (m *module) UserUpdate(userInfo datatransfers.UserInfo) (err error) {
	if err = m.db.userOrmer.Update(models.User{
		ID:    userInfo.ID,
		Name:  userInfo.Name,
		Email: userInfo.Email,
	}); err != nil {
		return err
	}
	return
}
