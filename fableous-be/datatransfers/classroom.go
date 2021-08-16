package datatransfers

import (
	"time"
)

type ClassroomInfo struct {
	ID        string    `json:"id" uri:"id"`
	Name      string    `json:"name" binding:"required"`
	CreatedAt time.Time `json:"createdAt"`
}
