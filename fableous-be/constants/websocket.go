package constants

const (
	WSMessageTypePaint   = "PAINT"
	WSMessageTypeFill    = "FILL"
	WSMessageTypeText    = "TEXT"
	WSMessageTypeAudio   = "AUDIO"
	WSMessageTypeConnect = "CONNECT"
	WSMessageTypeControl = "CONTROL"
	WSMessageTypePing    = "PING"
	WSMessageTypeError   = "ERROR"

	WSMessageDataPayloadKey = "text"

	ControllerRoleCharacter  = "CHARACTER"
	ControllerRoleBackground = "BACKGROUND"
	ControllerRoleStory      = "STORY"
	ControllerRoleHub        = "HUB"
)
