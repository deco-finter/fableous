package config

import (
	"github.com/spf13/viper"
)

var AppConfig Config

type Config struct {
	Port        int
	Environment string
	Debug       bool

	DBHost     string
	DBPort     int
	DBDatabase string
	DBUsername string
	DBPassword string

	RedisHost     string
	RedisPort     int
	RedisDatabase string
	RedisPassword string

	JWTSecret string
}

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

	AppConfig.DBHost = viper.GetString("DB_HOST")
	AppConfig.DBPort = viper.GetInt("DB_PORT")
	AppConfig.DBDatabase = viper.GetString("DB_DATABASE")
	AppConfig.DBUsername = viper.GetString("DB_USERNAME")
	AppConfig.DBPassword = viper.GetString("DB_PASSWORD")

	AppConfig.RedisHost = viper.GetString("REDIS_HOSTNAME")
	AppConfig.RedisPort = viper.GetInt("REDIS_PORT")
	AppConfig.RedisDatabase = viper.GetString("REDIS_DATABASE")
	AppConfig.RedisPassword = viper.GetString("REDIS_PASSWORD")

	AppConfig.JWTSecret = viper.GetString("JWT_SECRET")
}
