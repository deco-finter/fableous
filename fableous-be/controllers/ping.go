package controllers

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"github.com/deco-finter/fableous/fableous-be/config"
)

func GETPing(c *gin.Context) {
	c.JSON(http.StatusOK, map[string]string{"version": config.AppConfig.Version})
}
