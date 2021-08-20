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

func GETClassroomList(c *gin.Context) {
	var err error
	var classroomInfos []datatransfers.ClassroomInfo
	userID := c.GetString(constants.RouterKeyUserID)
	if classroomInfos, err = handlers.Handler.ClassroomGetAllByUserID(userID); err != nil {
		c.JSON(http.StatusNotFound, datatransfers.Response{Error: "cannot find classroom"})
		return
	}
	c.JSON(http.StatusOK, datatransfers.Response{Data: classroomInfos})
}

func POSTClassroom(c *gin.Context) {
	var err error
	var classroomInfo datatransfers.ClassroomInfo
	if err = c.ShouldBind(&classroomInfo); err != nil {
		c.JSON(http.StatusBadRequest, datatransfers.Response{Error: err.Error()})
		return
	}
	classroomInfo.UserID = c.GetString(constants.RouterKeyUserID)
	if classroomInfo.ID, err = handlers.Handler.ClassroomInsert(classroomInfo); err != nil {
		c.JSON(http.StatusInternalServerError, datatransfers.Response{Error: "cannot create classroom"})
		return
	}
	c.JSON(http.StatusOK, datatransfers.Response{Data: classroomInfo.ID})
}

func PUTClassroom(c *gin.Context) {
	var err error
	var classroomInfo datatransfers.ClassroomInfo
	if classroomInfo, err = handlers.Handler.ClassroomGetOneByID(c.Param("classroom_id")); err != nil {
		c.JSON(http.StatusNotFound, datatransfers.Response{Error: "cannot find classroom"})
		return
	}
	if classroomInfo.UserID != c.GetString(constants.RouterKeyUserID) {
		c.JSON(http.StatusForbidden, datatransfers.Response{Error: "user does not own this classroom"})
		return
	}
	if err = c.ShouldBind(&classroomInfo); err != nil {
		c.JSON(http.StatusBadRequest, datatransfers.Response{Error: err.Error()})
		return
	}
	if err = handlers.Handler.ClassroomUpdate(classroomInfo); err != nil {
		c.JSON(http.StatusInternalServerError, datatransfers.Response{Error: "cannot update classroom"})
		return
	}
	c.JSON(http.StatusOK, datatransfers.Response{})
}

func DELETEClassroom(c *gin.Context) {
	var err error
	var classroomInfo datatransfers.ClassroomInfo
	classroomInfo.ID = c.Param("classroom_id")
	if classroomInfo, err = handlers.Handler.ClassroomGetOneByID(classroomInfo.ID); err != nil {
		c.JSON(http.StatusNotFound, datatransfers.Response{Error: "cannot find classroom"})
		return
	}
	if classroomInfo.UserID != c.GetString(constants.RouterKeyUserID) {
		c.JSON(http.StatusForbidden, datatransfers.Response{Error: "user does not own this classroom"})
		return
	}
	if err = handlers.Handler.ClassroomDeleteByID(classroomInfo.ID); err != nil {
		c.JSON(http.StatusInternalServerError, datatransfers.Response{Error: "cannot delete classroom"})
		return
	}
	c.JSON(http.StatusOK, datatransfers.Response{})
}
