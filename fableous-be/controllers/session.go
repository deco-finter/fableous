package controllers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"github.com/deco-finter/fableous/fableous-be/constants"
	"github.com/deco-finter/fableous/fableous-be/datatransfers"
	"github.com/deco-finter/fableous/fableous-be/handlers"
)

// GETSessionList handles session list for a classroom request.
func GETSessionList(c *gin.Context) {
	var err error
	var sessionInfos []datatransfers.SessionInfo
	if sessionInfos, err = handlers.Handler.SessionGetAllByClassroomID(c.Param("classroom_id")); err == gorm.ErrRecordNotFound {
		c.JSON(http.StatusNotFound, datatransfers.Response{})
		return
	} else if err != nil {
		c.JSON(http.StatusInternalServerError, datatransfers.Response{Error: "cannot get session list"})
		return
	}
	c.JSON(http.StatusOK, datatransfers.Response{Data: sessionInfos})
}

// GETSession handles session detail request.
func GETSession(c *gin.Context) {
	var err error
	var sessionInfo datatransfers.SessionInfo
	if sessionInfo, err = handlers.Handler.SessionGetOneByIDByClassroomID(c.Param("session_id"), c.Param("classroom_id")); err == gorm.ErrRecordNotFound {
		c.JSON(http.StatusNotFound, datatransfers.Response{})
		return
	} else if err != nil {
		c.JSON(http.StatusInternalServerError, datatransfers.Response{Error: "cannot get session detail"})
		return
	}
	c.JSON(http.StatusOK, datatransfers.Response{Data: sessionInfo})
}

// GETOngoinSession handles ongoing session request.
// 404 if no ongoing session is found.
func GETOngoingSession(c *gin.Context) {
	var err error
	var sessionInfo datatransfers.SessionInfo
	if sessionInfo, err = handlers.Handler.SessionGetOneOngoingByClassroomID(c.Param("classroom_id")); err == gorm.ErrRecordNotFound {
		c.JSON(http.StatusNotFound, datatransfers.Response{})
		return
	} else if err != nil {
		c.JSON(http.StatusInternalServerError, datatransfers.Response{Error: "cannot get ongoing session detail"})
		return
	}
	c.JSON(http.StatusOK, datatransfers.Response{Data: sessionInfo})
}

// POSTSession handles session creation request.
func POSTSession(c *gin.Context) {
	var err error
	var classroomInfo datatransfers.ClassroomInfo
	if classroomInfo, err = handlers.Handler.ClassroomGetOneByID(c.Param("classroom_id")); err == gorm.ErrRecordNotFound {
		c.JSON(http.StatusInternalServerError, datatransfers.Response{Error: "classroom does not exist"})
		return
	} else if err != nil {
		c.JSON(http.StatusInternalServerError, datatransfers.Response{Error: "cannot get classroom detail"})
		return
	}
	if classroomInfo.UserID != c.GetString(constants.RouterKeyUserID) {
		c.JSON(http.StatusForbidden, datatransfers.Response{Error: "user does not own this classroom"})
		return
	}
	var sessionInfo datatransfers.SessionInfo
	if sessionInfo, err = handlers.Handler.SessionGetOneOngoingByClassroomID(classroomInfo.ID); sessionInfo.ID != "" {
		c.JSON(http.StatusBadRequest, datatransfers.Response{Error: "classroom already has ongoing session"})
		return
	} else if err != gorm.ErrRecordNotFound {
		c.JSON(http.StatusInternalServerError, datatransfers.Response{Error: "cannot check for ongoing session"})
		return
	}
	if err = c.ShouldBind(&sessionInfo); err != nil {
		c.JSON(http.StatusBadRequest, datatransfers.Response{Error: err.Error()})
		return
	}
	sessionInfo.ClassroomID = classroomInfo.ID
	if sessionInfo.ID, err = handlers.Handler.SessionInsert(sessionInfo); err != nil {
		c.JSON(http.StatusNotModified, datatransfers.Response{Error: "cannot create session"})
		return
	}
	c.JSON(http.StatusOK, datatransfers.Response{Data: sessionInfo.ID})
}

// PUTSession handles session update request.
func PUTSession(c *gin.Context) {
	var err error
	var classroomInfo datatransfers.ClassroomInfo
	if classroomInfo, err = handlers.Handler.ClassroomGetOneByID(c.Param("classroom_id")); err == gorm.ErrRecordNotFound {
		c.JSON(http.StatusInternalServerError, datatransfers.Response{Error: "classroom does not exist"})
		return
	} else if err != nil {
		c.JSON(http.StatusInternalServerError, datatransfers.Response{Error: "cannot get classroom detail"})
		return
	}
	if classroomInfo.UserID != c.GetString(constants.RouterKeyUserID) {
		c.JSON(http.StatusForbidden, datatransfers.Response{Error: "user does not own this classroom"})
		return
	}
	var sessionUpdate datatransfers.SessionUpdate
	if err = c.ShouldBind(&sessionUpdate); err != nil {
		c.JSON(http.StatusBadRequest, datatransfers.Response{Error: err.Error()})
		return
	}
	sessionUpdate.ClassroomID = classroomInfo.ID
	sessionUpdate.ID = c.Param("session_id")
	if err = handlers.Handler.SessionUpdate(sessionUpdate); err != nil {
		c.JSON(http.StatusNotModified, datatransfers.Response{Error: "cannot update session"})
		return
	}
	c.JSON(http.StatusOK, datatransfers.Response{})
}

// DELETESession handles session deletion request.
func DELETESession(c *gin.Context) {
	var err error
	var classroomInfo datatransfers.ClassroomInfo
	if classroomInfo, err = handlers.Handler.ClassroomGetOneByID(c.Param("classroom_id")); err == gorm.ErrRecordNotFound {
		c.JSON(http.StatusInternalServerError, datatransfers.Response{Error: "classroom does not exist"})
		return
	} else if err != nil {
		c.JSON(http.StatusInternalServerError, datatransfers.Response{Error: "cannot get classroom detail"})
		return
	}
	if classroomInfo.UserID != c.GetString(constants.RouterKeyUserID) {
		c.JSON(http.StatusForbidden, datatransfers.Response{Error: "user does not own this classroom"})
		return
	}
	if err = handlers.Handler.SessionDeleteByIDByClassroomID(c.Param("session_id"), classroomInfo.ID); err == gorm.ErrRecordNotFound {
		c.JSON(http.StatusNotFound, datatransfers.Response{})
		return
	} else if err != nil {
		c.JSON(http.StatusInternalServerError, datatransfers.Response{Error: "cannot get session list"})
		return
	}
	c.JSON(http.StatusOK, datatransfers.Response{})
}
