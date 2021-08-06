package main

import (
	"fmt"
	"log"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"

	"github.com/deco-finter/fableous/fableous-be/config"
	"github.com/deco-finter/fableous/fableous-be/controllers"
	"github.com/deco-finter/fableous/fableous-be/handlers"
)

func init() {
	config.InitializeAppConfig()
	if !config.AppConfig.Debug {
		gin.SetMode(gin.ReleaseMode)
	}
}

func main() {
	err := handlers.InitializeHandler()
	if err != nil {
		log.Fatal(err)
	}

	s := &http.Server{
		Addr:           fmt.Sprintf("0.0.0.0:%d", config.AppConfig.Port),
		Handler:        controllers.InitializeRouter(),
		ReadTimeout:    10 * time.Second,
		WriteTimeout:   10 * time.Second,
		MaxHeaderBytes: 1 << 20,
	}

	if err := s.ListenAndServe(); err != nil {
		log.Fatalf("[INIT] failed starting server at %s. %v", s.Addr, err)
	}
}
