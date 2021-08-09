package controllers

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"github.com/deco-finter/fableous/fableous-be/datatransfers"
	"github.com/deco-finter/fableous/fableous-be/handlers"
)

func GETConnectHubWS(c *gin.Context) {
	var classroomID string
	if classroomID = c.Request.URL.Query().Get("classroom_id"); classroomID == "" {
		c.JSON(http.StatusBadRequest, datatransfers.Response{Error: "classroom_id required"})
		return
	}
	// TODO: check if user owns classroom
	_ = handlers.Handler.ConnectHubWS(c, classroomID)
}

func GETConnectControllerWS(c *gin.Context) {
	var classroomToken string
	if classroomToken = c.Request.URL.Query().Get("classroom_token"); classroomToken == "" {
		c.JSON(http.StatusBadRequest, datatransfers.Response{Error: "classroom_token required"})
		return
	}
	_ = handlers.Handler.ConnectControllerWS(c, classroomToken)
}
