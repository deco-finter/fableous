package datatransfers

type WSMessage struct {
	Type string      `json:"type"`
	Role string      `json:"role,omitempty"`
	Data interface{} `json:"data"`
}
