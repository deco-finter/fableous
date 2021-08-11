package controllers

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"github.com/deco-finter/fableous/fableous-be/datatransfers"
	"github.com/deco-finter/fableous/fableous-be/handlers"
)

func GETClassroom(c *gin.Context) {
	var err error
	var classroomInfo datatransfers.ClassroomInfo
	if err = c.ShouldBindUri(&classroomInfo); err != nil {
		c.JSON(http.StatusBadRequest, datatransfers.Response{Error: err.Error()})
		return
	}
	if classroomInfo, err = handlers.Handler.ClassroomGetOneByID(classroomInfo.ID); err != nil {
		c.JSON(http.StatusNotFound, datatransfers.Response{Error: "cannot find classroom"})
		return
	}
	c.JSON(http.StatusOK, datatransfers.Response{Data: classroomInfo})
}
