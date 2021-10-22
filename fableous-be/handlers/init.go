package handlers

import (
	"fmt"
	"log"
	"net/http"
	"sync"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"

	"github.com/deco-finter/fableous/fableous-be/config"
	"github.com/deco-finter/fableous/fableous-be/datatransfers"
	"github.com/deco-finter/fableous/fableous-be/models"
	pb "github.com/deco-finter/fableous/fableous-be/protos"
)

// Handler is a global reference to the application handlers.
var Handler HandlerFunc

// HandlerFunc is the handler interface.
type HandlerFunc interface {
	// Auth handlers
	Authenticate(userInfo datatransfers.UserLogin) (token string, err error)

	// User handlers
	UserRegister(userInfo datatransfers.UserSignup) (err error)
	UserGetOneByID(id string) (userInfo datatransfers.UserInfo, err error)
	UserUpdate(userInfo datatransfers.UserInfo) (err error)

	// Classroom handlers
	ClassroomGetOneByID(id string) (classroomInfo datatransfers.ClassroomInfo, err error)
	ClassroomGetAllByUserID(userID string) (classroomInfos []datatransfers.ClassroomInfo, err error)
	ClassroomInsert(classroomInfo datatransfers.ClassroomInfo) (classroomID string, err error)
	ClassroomUpdate(classroomInfo datatransfers.ClassroomInfo) (err error)
	ClassroomDeleteByID(classroomID string) (err error)

	// Session handlers
	SessionGetAllByClassroomID(classroomID string) (sessionInfos []datatransfers.SessionInfo, err error)
	SessionGetOneByIDByClassroomID(id, classroomID string) (sessionInfo datatransfers.SessionInfo, err error)
	SessionGetOneOngoingByClassroomID(classroomID string) (sessionInfo datatransfers.SessionInfo, err error)
	SessionInsert(sessionInfo datatransfers.SessionInfo) (id string, err error)
	SessionUpdate(sessionUpdate datatransfers.SessionUpdate) (err error)
	SessionDeleteByIDByClassroomID(id, classroomID string) (err error)
	SessionCleanUp(sess *activeSession)

	// WebSocket handlers
	ConnectHubWS(ctx *gin.Context, classroomID string) (err error)
	ConnectControllerWS(ctx *gin.Context, classroomToken string, role pb.ControllerRole, name string) (err error)
	HubCommandWorker(conn *websocket.Conn, sess *activeSession) (err error)
	ControllerCommandWorker(conn *websocket.Conn, sess *activeSession, role pb.ControllerRole, name string) (err error)
}

// module holds all shared references for the handlers.
type module struct {
	db       *dbEntity
	upgrader websocket.Upgrader
	sessions activeSessionsEntity
}

// dbEntity contains all databse ormers.
type dbEntity struct {
	conn           *gorm.DB
	userOrmer      models.UserOrmer
	classroomOrmer models.ClassroomOrmer
	sessionOrmer   models.SessionOrmer
}

// activeSessionsEntity is a collection of all active sessions.
type activeSessionsEntity struct {
	keys map[string]*activeSession // key: classroomToken, value: activeSession

	// Mutex for keys
	mutex sync.RWMutex
}

// InitalizeHandler initializes the handler module.
func InitializeHandler() (err error) {
	// initialize database
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

	// compose handler modules
	Handler = &module{
		db: &dbEntity{
			conn:           db,
			userOrmer:      models.NewUserOrmer(db),
			classroomOrmer: models.NewClassroomOrmer(db),
			sessionOrmer:   models.NewSessionOrmer(db),
		},
		upgrader: websocket.Upgrader{
			CheckOrigin: func(r *http.Request) bool {
				return true
			},
		},
		sessions: activeSessionsEntity{
			keys: make(map[string]*activeSession),
		},
	}
	return
}
