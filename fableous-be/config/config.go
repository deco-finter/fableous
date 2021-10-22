package config

import (
	"log"

	"github.com/spf13/viper"
)

// AppConfig is a global reference to the application config.
var AppConfig Config

// Config is the base application configuration struct.
type Config struct {
	Version     string
	Port        int
	Environment string
	Debug       bool

	// Directory to store static gallery files
	StaticDir string

	// PostgreSQL database configuration
	DBHost     string
	DBPort     int
	DBDatabase string
	DBUsername string
	DBPassword string

	JWTSecret string
}

// InitializeAppConfig loads AppConfig from environment variables.
func InitializeAppConfig() {
	viper.SetConfigName(".env") // allow directly reading from .env file
	viper.SetConfigType("env")
	viper.AddConfigPath(".")
	viper.AddConfigPath("./config")
	viper.AddConfigPath("/")
	viper.AllowEmptyEnv(true)
	viper.AutomaticEnv()
	_ = viper.ReadInConfig()

	AppConfig.Port = viper.GetInt("PORT")
	AppConfig.Environment = viper.GetString("ENVIRONMENT")
	AppConfig.Debug = viper.GetBool("DEBUG")

	AppConfig.StaticDir = viper.GetString("STATIC_DIR")

	AppConfig.DBHost = viper.GetString("DB_HOST")
	AppConfig.DBPort = viper.GetInt("DB_PORT")
	AppConfig.DBDatabase = viper.GetString("DB_DATABASE")
	AppConfig.DBUsername = viper.GetString("DB_USERNAME")
	AppConfig.DBPassword = viper.GetString("DB_PASSWORD")

	AppConfig.JWTSecret = viper.GetString("JWT_SECRET")

	log.Println("[INIT] configuration loaded")
}
