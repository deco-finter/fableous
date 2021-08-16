package controllers

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"github.com/deco-finter/fableous/fableous-be/constants"
	"github.com/deco-finter/fableous/fableous-be/datatransfers"
	"github.com/deco-finter/fableous/fableous-be/handlers"
)

func GETClassroom(c *gin.Context) {
	var err error
	var classroomInfo datatransfers.ClassroomInfo
	classroomInfo.ID = c.Param("classroom_id")
	if classroomInfo, err = handlers.Handler.ClassroomGetOneByID(classroomInfo.ID); err != nil {
		c.JSON(http.StatusNotFound, datatransfers.Response{Error: "cannot find classroom"})
		return
	}
	c.JSON(http.StatusOK, datatransfers.Response{Data: classroomInfo})
}

func GETClassrooms(c *gin.Context) {
	var err error
	var classroomInfos []datatransfers.ClassroomInfo
	userID := c.GetString(constants.RouterKeyUserID)
	if classroomInfos, err = handlers.Handler.ClassroomGetAllByUserID(userID); err != nil {
		c.JSON(http.StatusNotFound, datatransfers.Response{Error: "cannot find classroom"})
		return
	}
	c.JSON(http.StatusOK, datatransfers.Response{Data: classroomInfos})
}

func PUTClassroom(c *gin.Context) {
	var err error
	var classroomInfo datatransfers.ClassroomInfo
	if err = c.ShouldBind(&classroomInfo); err != nil {
		c.JSON(http.StatusBadRequest, datatransfers.Response{Error: err.Error()})
		return
	}
	classroomInfo.ID = c.Param("classroom_id")
	if err = handlers.Handler.ClassroomUpdate(classroomInfo); err != nil {
		c.JSON(http.StatusInternalServerError, datatransfers.Response{Error: "failed updating classroom"})
		return
	}
	c.JSON(http.StatusOK, datatransfers.Response{})
}
