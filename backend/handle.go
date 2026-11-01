/*
Copyright 2026 Oliver R. Calazans Jeronimo

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

package backend

import (
	"encoding/json"
	"net/http"
	"os"
	"path/filepath"
	"strings"
)



type Music struct {
	Name string `json:"name"`
	File string `json:"file"`
}



func HandleLibrary(w http.ResponseWriter, _ *http.Request) {
	entries, err := os.ReadDir("./music")
	
	if err != nil {
		http.Error(w, "could not read music directory", http.StatusInternalServerError)
		return
	}

	list := []Music{} 
	for _, e := range entries {
		if e.IsDir() {
			continue
		}

		ext := strings.ToLower(filepath.Ext(e.Name()))
		if ext != ".mp3" && ext != ".flac" && ext != ".m4a" && ext != ".ogg" {
			continue
		}

		name := strings.TrimSuffix(e.Name(), filepath.Ext(e.Name()))
		list  = append(list, Music{Name: name, File: e.Name()})
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(list)
}



func HandleStream(w http.ResponseWriter, r *http.Request) {
	file := r.URL.Query().Get("file")

	if file == "" {
		http.Error(w, "file not specified", http.StatusBadRequest)
		return
	}

	safeFile := filepath.Base(file)
	path 	 := filepath.Join("./music", safeFile)

	http.ServeFile(w, r, path)
}