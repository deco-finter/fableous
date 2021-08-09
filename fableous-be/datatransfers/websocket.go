package datatransfers

type WSMessage struct {
	Type string        `json:"type"`
	Role string        `json:"role,omitempty"`
	Data WSMessageData `json:"data"`
}

type WSMessageData struct {
	X      float32 `json:"x,omitempty"`
	Y      float32 `json:"y,omitempty"`
	Text   string  `json:"text,omitempty"`
	Colour string  `json:"colour,omitempty"`
	Width  int     `json:"width,omitempty"`
}
