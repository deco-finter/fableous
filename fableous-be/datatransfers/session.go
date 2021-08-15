package datatransfers

import "time"

type SessionInfo struct {
	ID          string    `json:"id"`
	Title       string    `json:"title"`
	Description string    `json:"description"`
	Pages       int       `json:"pages"`
	Completed   bool      `json:"completed"`
	CreatedAt   time.Time `json:"createdAt"`
}
