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
	X1    string `json:"x1,omitempty"`
	Y1    string `json:"y1,omitempty"`
	X2    string `json:"x2,omitempty"`
	Y2    string `json:"y2,omitempty"`
	ID    string `json:"id,omitempty"`
	Text  string `json:"text,omitempty"`
	Color string `json:"color,omitempty"`
	Width string `json:"width,omitempty"`
}

type WSControlMessageData struct {
	ClassroomToken string `json:"classroomToken,omitempty"`
	ClassroomID    string `json:"classroomId,omitempty"`
	SessionID      string `json:"sessionId,omitempty"`
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
