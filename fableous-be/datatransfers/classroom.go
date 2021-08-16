package datatransfers

import (
	"time"
)

type ClassroomInfo struct {
	ID        string    `json:"id" binding:"-"`
	Name      string    `json:"name" binding:"required"`
	CreatedAt time.Time `json:"createdAt" binding:"-"`
}
