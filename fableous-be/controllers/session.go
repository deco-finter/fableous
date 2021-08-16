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
	var sessionInfo datatransfers.SessionInfo
	if err = c.ShouldBind(&sessionInfo); err != nil {
		c.JSON(http.StatusBadRequest, datatransfers.Response{Error: err.Error()})
		return
	}
	sessionInfo.ClassroomID = classroomID
	if sessionInfo.ID, err = handlers.Handler.SessionInsert(sessionInfo); err != nil {
		c.JSON(http.StatusNotModified, datatransfers.Response{Error: "failed creating session"})
		return
	}
	c.JSON(http.StatusOK, datatransfers.Response{Data: sessionInfo.ID})
}
