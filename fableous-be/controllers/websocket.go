package controllers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"

	"github.com/deco-finter/fableous/fableous-be/constants"
	"github.com/deco-finter/fableous/fableous-be/datatransfers"
	"github.com/deco-finter/fableous/fableous-be/handlers"
	pb "github.com/deco-finter/fableous/fableous-be/protos"
)

func GETConnectHubWS(c *gin.Context) {
	var err error
	var classroomInfo datatransfers.ClassroomInfo
	if classroomInfo.ID = c.Request.URL.Query().Get("classroom_id"); classroomInfo.ID == "" {
		c.JSON(http.StatusBadRequest, datatransfers.Response{Error: "classroom_id required"})
		return
	}
	if classroomInfo, err = handlers.Handler.ClassroomGetOneByID(classroomInfo.ID); err != nil {
		c.JSON(http.StatusInternalServerError, datatransfers.Response{Error: "cannot retrieve classroom detail"})
		return
	}
	if classroomInfo.UserID != c.GetString(constants.RouterKeyUserID) {
		c.JSON(http.StatusForbidden, datatransfers.Response{Error: "user does not own this classroom"})
		return
	}
	_ = handlers.Handler.ConnectHubWS(c, classroomInfo.ID)
}

func GETConnectControllerWS(c *gin.Context) {
	var err error
	var classroomToken string
	if classroomToken = c.Request.URL.Query().Get("classroom_token"); classroomToken == "" {
		c.JSON(http.StatusBadRequest, datatransfers.Response{Error: "classroom_token required"})
		return
	}
	var rawRole int
	if rawRole, err = strconv.Atoi(c.Request.URL.Query().Get("role")); err != nil {
		c.JSON(http.StatusBadRequest, datatransfers.Response{Error: "role invalid"})
		return
	}
	role := pb.ControllerRole(rawRole)
	if role != pb.ControllerRole_STORY && role != pb.ControllerRole_CHARACTER && role != pb.ControllerRole_BACKGROUND {
		c.JSON(http.StatusBadRequest, datatransfers.Response{Error: "role invalid"})
		return
	}
	var name string
	if name = c.Request.URL.Query().Get("name"); name == "" {
		c.JSON(http.StatusBadRequest, datatransfers.Response{Error: "name required"})
		return
	}
	_ = handlers.Handler.ConnectControllerWS(c, classroomToken, role, name)
}
