package datatransfers

import "time"

// SessionUpdate is the data transfer object used for updating the Session entity.
type SessionUpdate struct {
	ID          string `json:"id" binding:"-"`
	ClassroomID string `json:"-" binding:"-"`
	Title       string `json:"title" binding:"required"`
	Description string `json:"description" binding:"required"`
}

// SessionInfo is the data transfer object for the Session entity.
type SessionInfo struct {
	ID             string    `json:"id" binding:"-"`
	ClassroomID    string    `json:"-" binding:"-"`
	Title          string    `json:"title" binding:"required"`
	Description    string    `json:"description" binding:"required"`
	Pages          int       `json:"pages" binding:"required"`
	NameStory      string    `json:"nameStory" binding:"-"`
	NameCharacter  string    `json:"nameCharacter" binding:"-"`
	NameBackground string    `json:"nameBackground" binding:"-"`
	Completed      bool      `json:"completed" bindingg:"-"`
	CreatedAt      time.Time `json:"createdAt" binding:"-"`
}
