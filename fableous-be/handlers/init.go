package handlers

import (
	"fmt"
	"log"
	"sync"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"

	"github.com/deco-finter/fableous/fableous-be/config"
	"github.com/deco-finter/fableous/fableous-be/datatransfers"
	"github.com/deco-finter/fableous/fableous-be/models"
)

var Handler HandlerFunc

type HandlerFunc interface {
	// Auth
	Authenticate(userInfo datatransfers.UserLogin) (token string, err error)

	// User
	UserRegister(userInfo datatransfers.UserSignup) (err error)
	UserGetOneByID(id string) (userInfo datatransfers.UserInfo, err error)
	UserUpdate(userInfo datatransfers.UserInfo) (err error)

	// WebSocket
	ConnectHubWS(ctx *gin.Context, classroomID string) (err error)
	ConnectControllerWS(ctx *gin.Context, classroomToken, role string) (err error)
	HubCommandWorker(conn *websocket.Conn, classroomID string) (err error)
	ControllerCommandWorker(conn *websocket.Conn, classroomToken, role string) (err error)
}

type module struct {
	db       *dbEntity
	sessions sessionsEntity
}

type dbEntity struct {
	conn      *gorm.DB
	userOrmer models.UserOrmer
}

type sessionsEntity struct {
	keys  map[string]*session
	mutex sync.RWMutex
}

type session struct {
	classroomID         string
	characterConnected  bool
	backgroundConnected bool
	storyConnected      bool
}

func InitializeHandler() (err error) {
	// Initialize DB
	var db *gorm.DB
	db, err = gorm.Open(postgres.Open(
		fmt.Sprintf("host=%s port=%d dbname=%s user=%s password=%s sslmode=disable TimeZone=Etc/UTC",
			config.AppConfig.DBHost, config.AppConfig.DBPort, config.AppConfig.DBDatabase,
			config.AppConfig.DBUsername, config.AppConfig.DBPassword),
	), &gorm.Config{})
	if err != nil {
		log.Fatalln("[INIT] failed connecting to PostgreSQL")
	}
	log.Println("[INIT] successfully connected to PostgreSQL")

	// Compose handler modules
	Handler = &module{
		db: &dbEntity{
			conn:      db,
			userOrmer: models.NewUserOrmer(db),
		},
		sessions: sessionsEntity{
			keys: make(map[string]*session),
		},
	}
	return
}
