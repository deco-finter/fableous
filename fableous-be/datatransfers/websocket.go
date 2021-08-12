package datatransfers

type WSMessage struct {
	Type string      `json:"type"`
	Role string      `json:"role,omitempty"`
	Data interface{} `json:"data"`
}

type WSMessageData struct {
	X1    int    `json:"x1,omitempty"`
	Y1    int    `json:"y1,omitempty"`
	X2    int    `json:"x2,omitempty"`
	Y2    int    `json:"y2,omitempty"`
	ID    int    `json:"id,omitempty"`
	Text  string `json:"text,omitempty"`
	Color string `json:"color,omitempty"`
	Width int    `json:"width,omitempty"`
}
