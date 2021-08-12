package utils

import (
	"errors"
	"io/fs"
	"net/http"
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
