package datatransfers

import (
	"time"
)

// UserLogin is the data transfer object used for logging in a user.
type UserLogin struct {
	Email    string `json:"email" binding:"required"`
	Password string `json:"password" binding:"required"`
}

// UserSignup is the data transfer object used for signing up a new user.
type UserSignup struct {
	Name     string `json:"name" binding:"required"`
	Email    string `json:"email" binding:"required"`
	Password string `json:"password" binding:"required"`
}

// UserUpdate is the data transfer object used for updating the User entity.
type UserUpdate struct {
	Name  string `json:"name" binding:"-"`
	Email string `json:"email" binding:"-"`
}

// UserInfo is the data transfer object for the User entity.
type UserInfo struct {
	ID        string    `json:"id" uri:"id"`
	Name      string    `json:"name"`
	Email     string    `json:"email"`
	CreatedAt time.Time `json:"createdAt"`
}
