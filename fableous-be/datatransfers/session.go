package datatransfers

import "time"

type SessionUpdate struct {
	ID          string `json:"id" binding:"-"`
	ClassroomID string `json:"-" binding:"-"`
	Title       string `json:"title" binding:"required"`
	Description string `json:"description" binding:"required"`
}

type SessionInfo struct {
	ID          string    `json:"id" binding:"-"`
	ClassroomID string    `json:"-" binding:"-"`
	Title       string    `json:"title" binding:"required"`
	Description string    `json:"description" binding:"required"`
	Pages       int       `json:"pages" binding:"required"`
	Completed   bool      `json:"completed" binding:"-"`
	CreatedAt   time.Time `json:"createdAt" binding:"-"`
}
