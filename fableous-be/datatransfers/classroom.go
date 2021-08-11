package datatransfers

import (
	"time"
)

type ClassroomUpdate struct {
	Name string `json:"name" binding:"-"`
}

type ClassroomInfo struct {
	ID        string    `json:"id" uri:"id"`
	Name      string    `json:"name"`
	CreatedAt time.Time `json:"createdAt"`
}
