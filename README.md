![LOGO](./images/raspibeat-logo.svg)

A lightweight, self-hosted music central built with Go and Vanilla JavaScript, designed to run smoothly on a Raspberry Pi Zero W. 

RaspiBeat scans your local music folder and provides a clean web interface to stream and control your music from any device (phone, tablet, or PC) connected to your local network.

## ✨ Features

- **Local Library Scanning:** Automatically detects audio files (`.mp3`, `.flac`, `.m4a`, `.ogg`) from a local folder.
- **HTTP Streaming:** Efficient audio streaming using HTTP Range Requests. This allows you to seek (skip forward/backward) without downloading the entire file, keeping the Raspberry Pi's RAM usage extremely low.
- **Auto-Play Next:** Automatically plays the next track in the list when the current one ends.
- **Media Session API:** Integrates with the operating system's media controls. Allows background playback and provides playback controls (Play, Pause, Next, Previous) on your phone's lock screen or notification center.
- **Zero Dependencies (Frontend):** Built with pure HTML, CSS, and Vanilla JavaScript. No React, Vue, or npm required.

## 🛠️ Tech Stack

- **Backend:** Go (Standard Library only)
- **Frontend:** HTML5, CSS3, Vanilla JavaScript
- **Streaming:** `http.ServeFile` (built-in Range Request support)

## 🚀 Getting Started

### Prerequisites

- [Go](https://go.dev/doc/install) (version 1.21 or higher)
- A local network (the device you access the web page from must be on the same Wi-Fi/LAN as the server).

### Installation & Running

1. **Clone the repository:**
   ```bash
   git clone https://github.com/olivercalazans/raspibeat.git
   cd raspibeat
   ```

2. **Add your music:**
   Create a folder named `music` in the root of the project and drop your audio files inside:
   ```bash
   mkdir music
   # Copy your .mp3 files into the music folder
   ```

3. **Run the server:**
   ```bash
   go run .
   ```

4. **Access the interface:**
   Open your browser and go to:
   - On the same machine: `http://localhost:60888`
   - From your phone/PC: `http://<IP_ADDRESS_OF_YOUR_PI>:60888`

## 🔌 API Endpoints

The backend exposes two simple API endpoints consumed by the frontend:

- `GET /api/library`: Returns a JSON array of available tracks.
- `GET /stream?file=<filename>`: Streams the requested audio file with support for HTTP Range Requests.


## 📄 License

This project is open-source and available under the [Apache-2.0 License](LICENSE).
