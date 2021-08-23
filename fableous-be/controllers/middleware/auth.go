package middleware

import (
	"fmt"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v4"

	"github.com/deco-finter/fableous/fableous-be/config"
	"github.com/deco-finter/fableous/fableous-be/constants"
	"github.com/deco-finter/fableous/fableous-be/datatransfers"
	"github.com/deco-finter/fableous/fableous-be/handlers"
)

func AuthMiddleware(c *gin.Context) {
	var token string
	if token = strings.TrimPrefix(c.GetHeader("Authorization"), "Bearer "); token == "" {
		if token = c.Request.URL.Query().Get("token"); token == "" {
			c.Set(constants.RouterKeyIsAuthenticated, false)
			c.Next()
			return
		}
	}
	var err error
	var claims datatransfers.JWTClaims
	if claims, err = parseToken(token, config.AppConfig.JWTSecret); err != nil {
		c.AbortWithStatusJSON(http.StatusUnauthorized, datatransfers.Response{Error: err.Error()})
		return
	}
	if _, err = handlers.Handler.UserGetOneByID(claims.ID); err != nil {
		c.AbortWithStatusJSON(http.StatusUnauthorized, datatransfers.Response{Error: err.Error()})
		return
	}
	c.Set(constants.RouterKeyIsAuthenticated, true)
	c.Set(constants.RouterKeyUserID, claims.ID)
	c.Next()
}

func parseToken(tokenString, secret string) (claims datatransfers.JWTClaims, err error) {
	if token, err := jwt.ParseWithClaims(tokenString, &claims, func(token *jwt.Token) (interface{}, error) {
		return []byte(secret), nil
	}); err != nil || !token.Valid {
		return datatransfers.JWTClaims{}, fmt.Errorf("invalid token. %s", err)
	}
	return
}
