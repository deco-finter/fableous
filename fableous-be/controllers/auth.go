package controllers

import (
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"

	"github.com/deco-finter/fableous/fableous-be/datatransfers"
	"github.com/deco-finter/fableous/fableous-be/handlers"
)

// POSTLogin handles login request.
func POSTLogin(c *gin.Context) {
	var err error
	var user datatransfers.UserLogin
	if err = c.ShouldBind(&user); err != nil {
		c.JSON(http.StatusBadRequest, datatransfers.Response{Error: err.Error()})
		return
	}
	var token string
	if token, err = handlers.Handler.Authenticate(user); err != nil {
		c.JSON(http.StatusUnauthorized, datatransfers.Response{Error: "incorrect username or password"})
		return
	}
	c.Header("Authorization", fmt.Sprintf("Bearer %s", token))
	c.JSON(http.StatusOK, datatransfers.Response{})
}

// POSTRegister handles register request.
func POSTRegister(c *gin.Context) {
	var err error
	var user datatransfers.UserSignup
	if err = c.ShouldBind(&user); err != nil {
		c.JSON(http.StatusBadRequest, datatransfers.Response{Error: err.Error()})
		return
	}
	if err = handlers.Handler.UserRegister(user); err != nil {
		c.JSON(http.StatusUnauthorized, datatransfers.Response{Error: "failed registering user"})
		return
	}
	c.JSON(http.StatusCreated, datatransfers.Response{Data: "user created"})
}
