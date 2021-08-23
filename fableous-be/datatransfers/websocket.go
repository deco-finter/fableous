package datatransfers

type WSMessage struct {
	Type string        `json:"type"`
	Role string        `json:"role,omitempty"`
	Data WSMessageData `json:"data"`
}

type WSMessageData struct {
	WSPaintMessageData
	WSControlMessageData
	WSJoinMessageData
	WSErrorMessageData
}

type WSPaintMessageData struct {
	X1    float32 `json:"x1,omitempty"`
	Y1    float32 `json:"y1,omitempty"`
	X2    float32 `json:"x2,omitempty"`
	Y2    float32 `json:"y2,omitempty"`
	ID    int     `json:"id,omitempty"`
	Text  string  `json:"text,omitempty"`
	Color string  `json:"color,omitempty"`
	Width float32 `json:"width,omitempty"`
}

type WSControlMessageData struct {
	ClassroomToken string `json:"classroomToken,omitempty"`
	ClassroomID    string `json:"classroomId,omitempty"`
	SessionID      string `json:"sessionId,omitempty"`
	CurrentPage    *int   `json:"currentPage,omitempty"`
	NextPage       *bool  `json:"nextPage,omitempty"`
}

type WSJoinMessageData struct {
	Role    string `json:"role,omitempty"`
	Name    string `json:"name,omitempty"`
	Joining *bool  `json:"joining,omitempty"`
}

type WSErrorMessageData struct {
	Error string `json:"error,omitempty"`
}
