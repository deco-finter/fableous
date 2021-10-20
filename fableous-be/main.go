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

var (
	version string
)

func init() {
	log.Printf("[INIT] starting fableous-be %s", version)
	config.InitializeAppConfig()
	config.AppConfig.Version = version
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
