package router

import (
	"github.com/gin-gonic/gin"

	"github.com/deco-finter/fableous/fableous-be/controllers/middleware"
	v1 "github.com/deco-finter/fableous/fableous-be/controllers/v1"
	"github.com/deco-finter/fableous/fableous-be/utils"
)

func InitializeRouter() (router *gin.Engine) {
	router = gin.Default()
	v1route := router.Group("/api/v1")
	v1route.Use(
		middleware.CORSMiddleware,
		middleware.AuthMiddleware,
	)
	{
		auth := v1route.Group("/auth")
		{
			auth.POST("/login", v1.POSTLogin)
			auth.POST("/signup", v1.POSTRegister)
		}
		user := v1route.Group("/user")
		{
			user.GET("/:username", utils.AuthOnly, v1.GETUser)
			user.PUT("", utils.AuthOnly, v1.PUTUser)
		}
	}
	return
}
