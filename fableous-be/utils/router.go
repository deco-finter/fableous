package utils

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"github.com/deco-finter/fableous/fableous-be/constants"
	"github.com/deco-finter/fableous/fableous-be/datatransfers"
)

// AuthOnly is a middleware that checks if the user is authenticated.
func AuthOnly(c *gin.Context) {
	if !c.GetBool(constants.RouterKeyIsAuthenticated) {
		c.AbortWithStatusJSON(http.StatusUnauthorized, datatransfers.Response{Error: "user not authenticated"})
	}
}
