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

package main

import (
	"encoding/json"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strings"
)



type Music struct {
	Name string `json:"name"`
	File string `json:"file"`
}



func handleLibrary(w http.ResponseWriter, r *http.Request) {
	entries, err := os.ReadDir("./music")
	if err != nil {
		http.Error(w, "Unable to read the music folder", http.StatusInternalServerError)
		return
	}

	var list []Music
	
	for _, e := range entries {
		if e.IsDir() {
			continue
		}
		
		ext := strings.ToLower(filepath.Ext(e.Name()))
		if ext != ".mp3" && ext != ".flac" && ext != ".m4a" && ext != ".ogg" {
			continue
		}
		
		name := strings.TrimSuffix(e.Name(), filepath.Ext(e.Name()))
		list = append(list, Music{Name: name, File: e.Name()})
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(list)
}



func handleStream(w http.ResponseWriter, r *http.Request) {
	file := r.URL.Query().Get("file")
	if file == "" {
		http.Error(w, "File not specified", http.StatusBadRequest)
		return
	}

	safeFile := filepath.Base(file)
	path := filepath.Join("./music", safeFile)

	http.ServeFile(w, r, path)
}



func main() {
	http.HandleFunc("/api/library", handleLibrary)
	http.HandleFunc("/stream", handleStream)

	http.Handle("/", http.FileServer(http.Dir("./static")))

	log.Println("Servindo em http://0.0.0.0:60888")
	log.Fatal(http.ListenAndServe(":60888", nil))
}