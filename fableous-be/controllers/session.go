package controllers

import (
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"github.com/deco-finter/fableous/fableous-be/constants"
	"github.com/deco-finter/fableous/fableous-be/datatransfers"
	"github.com/deco-finter/fableous/fableous-be/handlers"
)

func GETSession(c *gin.Context) {
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
	log.Println(classroomInfo.UserID)
	log.Println(c.GetString(constants.RouterKeyUserID))
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
