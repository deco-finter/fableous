package controllers

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"github.com/deco-finter/fableous/fableous-be/config"
	"github.com/deco-finter/fableous/fableous-be/controllers/middleware"
	"github.com/deco-finter/fableous/fableous-be/utils"
)

// InitializeRouter initialize the gin router.
func InitializeRouter() (router *gin.Engine) {
	router = gin.Default()
	router.Use(
		middleware.CORSMiddleware,
		middleware.AuthMiddleware,
	)
	api := router.Group("/api")
	{
		api.GET("/ping", GETPing)
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
			classroom.GET("/", utils.AuthOnly, GETClassroomList)
			classroom.GET("/:classroom_id", GETClassroom)
			classroom.POST("/", utils.AuthOnly, POSTClassroom)
			classroom.PUT("/:classroom_id", utils.AuthOnly, PUTClassroom)
			classroom.DELETE("/:classroom_id", utils.AuthOnly, DELETEClassroom)
			session := classroom.Group("/:classroom_id/session")
			{
				session.GET("/", GETSessionList)
				session.GET("/:session_id", GETSession)
				session.GET("/ongoing", GETOngoingSession)
				session.POST("/", utils.AuthOnly, POSTSession)
				session.PUT("/:session_id", utils.AuthOnly, PUTSession)
				session.DELETE("/:session_id", utils.AuthOnly, DELETESession)
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
