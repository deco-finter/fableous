package controllers

import (
	"github.com/gin-gonic/gin"

	"github.com/deco-finter/fableous/fableous-be/controllers/middleware"
	"github.com/deco-finter/fableous/fableous-be/utils"
)

func InitializeRouter() (router *gin.Engine) {
	router = gin.Default()
	router.Use(
		middleware.CORSMiddleware,
		middleware.AuthMiddleware,
	)
	api := router.Group("/api")
	{
		auth := api.Group("/auth")
		{
			auth.POST("/login", POSTLogin)
			auth.POST("/signup", POSTRegister)
		}
		user := api.Group("/user")
		{
			user.GET("/:username", utils.AuthOnly, GETUser)
			user.PUT("/", utils.AuthOnly, PUTUser)
		}
	}
	return
}
