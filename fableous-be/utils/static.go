package utils

import (
	"errors"
	"fmt"
	"io/fs"
	"net/http"

	"github.com/deco-finter/fableous/fableous-be/config"
)

// FS to disable directory listing
type FilteredFileSystem struct {
	FileSystem http.FileSystem
}

func (f FilteredFileSystem) Open(path string) (file http.File, err error) {
	if file, err = f.FileSystem.Open(path); err != nil {
		return
	}
	var stat fs.FileInfo
	if stat, err = file.Stat(); err != nil {
		return
	}
	if stat.IsDir() {
		return nil, errors.New("target is not a file")
	}
	return file, nil
}

func GetSessionStaticDir(sessionID, classroomID string) string {
	return fmt.Sprintf("%s/%s/%s", config.AppConfig.StaticDir, classroomID, sessionID)
}
