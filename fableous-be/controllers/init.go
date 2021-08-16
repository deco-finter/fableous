package controllers

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"github.com/deco-finter/fableous/fableous-be/config"
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
			auth.POST("/register", POSTRegister)
		}
		user := api.Group("/user")
		{
			user.GET("/", utils.AuthOnly, GETUser)
			user.PUT("/", utils.AuthOnly, PUTUser)
		}
		classroom := api.Group("/classroom")
		{
			classroom.GET("/:classroom_id", utils.AuthOnly, GETClassroom)
			classroom.GET("/", utils.AuthOnly, GETClassrooms)
			classroom.PUT("/:classroom_id", utils.AuthOnly, PUTClassroom)
			session := classroom.Group("/:classroom_id/session")
			{
				session.GET("/", GETSession)
				session.POST("/", utils.AuthOnly, POSTSession)
			}
		}
		gallery := api.Group("/gallery")
		{
			gallery.StaticFS("/assets", utils.FilteredFileSystem{FileSystem: http.Dir(config.AppConfig.StaticDir)})
		}
	}
	ws := router.Group("/ws")
	{
		ws.GET("/controller", GETConnectControllerWS)
		ws.GET("/hub", utils.AuthOnly, GETConnectHubWS)
	}
	return
}
