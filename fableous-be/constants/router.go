package constants

const (
	// RouterKeyIsAuthenticated is the key for the request authentication status injected by the auth middleware.
	RouterKeyIsAuthenticated = "is_authenticated"

	// RouterKeyUserID is the key for the requesting userID injected by the auth middleware.
	// Empty if the request is not authenticated.
	RouterKeyUserID = "user_id"
)
