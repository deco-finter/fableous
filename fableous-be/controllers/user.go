package controllers

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"github.com/deco-finter/fableous/fableous-be/constants"
	"github.com/deco-finter/fableous/fableous-be/datatransfers"
	"github.com/deco-finter/fableous/fableous-be/handlers"
)

// GETUser handles user detail request.
func GETUser(c *gin.Context) {
	var err error
	var userInfo datatransfers.UserInfo
	if userInfo, err = handlers.Handler.UserGetOneByID(c.GetString(constants.RouterKeyUserID)); err != nil {
		c.JSON(http.StatusInternalServerError, datatransfers.Response{Error: "cannot get user detail"})
		return
	}
	c.JSON(http.StatusOK, datatransfers.Response{Data: userInfo})
}

// PUTUser handles user update request.
func PUTUser(c *gin.Context) {
	var err error
	var user datatransfers.UserUpdate
	if err = c.ShouldBind(&user); err != nil {
		c.JSON(http.StatusBadRequest, datatransfers.Response{Error: err.Error()})
		return
	}
	if err = handlers.Handler.UserUpdate(datatransfers.UserInfo{
		ID:    c.GetString(constants.RouterKeyUserID),
		Name:  user.Name,
		Email: user.Email,
	}); err != nil {
		c.JSON(http.StatusInternalServerError, datatransfers.Response{Error: "failed updating user"})
		return
	}
	c.JSON(http.StatusOK, datatransfers.Response{})
}
