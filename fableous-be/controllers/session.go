package controllers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

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
	classroomID := c.Param("classroom_id")
	// TODO: check classroom ownership
	if _, err = handlers.Handler.SessionGetOneOngoingByClassroomID(classroomID); err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusBadRequest, datatransfers.Response{Error: "classroom already has ongoing session"})
			return
		} else {
			c.JSON(http.StatusInternalServerError, datatransfers.Response{Error: "cannot check for ongoing session"})
			return
		}
	}
	var sessionInfo datatransfers.SessionInfo
	if err = c.ShouldBind(&sessionInfo); err != nil {
		c.JSON(http.StatusBadRequest, datatransfers.Response{Error: err.Error()})
		return
	}
	sessionInfo.ClassroomID = classroomID
	if sessionInfo.ID, err = handlers.Handler.SessionInsert(sessionInfo); err != nil {
		c.JSON(http.StatusNotModified, datatransfers.Response{Error: "cannot create session"})
		return
	}
	c.JSON(http.StatusOK, datatransfers.Response{Data: sessionInfo.ID})
}
