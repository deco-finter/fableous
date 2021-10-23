package datatransfers

import (
	"time"
)

// ClassroomInfo is the data transfer object for the Classroom entity.
type ClassroomInfo struct {
	ID        string    `json:"id" binding:"-"`
	UserID    string    `json:"-" binding:"-"`
	Name      string    `json:"name" binding:"required"`
	CreatedAt time.Time `json:"createdAt" binding:"-"`
}
