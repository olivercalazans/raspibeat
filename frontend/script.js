const libraryEl = document.getElementById('library');
const audioPlayer = document.getElementById('player');
const fileInput = document.getElementById('file-upload');
const trackCountEl = document.getElementById('track-count');
const nowTitleEl = document.getElementById('now-title');
const uploadBtn = document.getElementById('upload-btn');
const repeatBtn = document.getElementById('repeat-toggle');

let tracks = [];
let currentIndex = -1;

// Repeat modes: 'off' (Play to end), 'all' (Repeat playlist), 'one' (Repeat single track)
let repeatMode = 'off';

if (repeatBtn) {
  repeatBtn.addEventListener('click', () => {
    if (repeatMode === 'off') {
      repeatMode = 'all';
    } else if (repeatMode === 'all') {
      repeatMode = 'one';
    } else {
      repeatMode = 'off';
    }
    updateRepeatBtnUI();
  });
}

function updateRepeatBtnUI() {
  if (!repeatBtn) return;
  repeatBtn.className = `repeat-btn mode-${repeatMode}`;
  const icon = repeatBtn.querySelector('svg');
  const text = repeatBtn.querySelector('.repeat-text');

  if (repeatMode === 'off') {
    repeatBtn.title = "Mode: Play through to end (No repeat)";
    text.textContent = "End";
    icon.innerHTML = `<path d="M5 12h14M13 5l7 7-7 7"/>`;
  } else if (repeatMode === 'all') {
    repeatBtn.title = "Mode: Repeat all tracks";
    text.textContent = "All";
    icon.innerHTML = `<path d="M17 2l4 4-4 4"/><path d="M3 11v-1a4 4 0 0 1 4-4h14"/><path d="M7 22l-4-4 4-4"/><path d="M21 13v1a4 4 0 0 1-4 4H3"/>`;
  } else if (repeatMode === 'one') {
    repeatBtn.title = "Mode: Repeat current track";
    text.textContent = "1";
    icon.innerHTML = `<path d="M17 2l4 4-4 4"/><path d="M3 11v-1a4 4 0 0 1 4-4h14"/><path d="M7 22l-4-4 4-4"/><path d="M21 13v1a4 4 0 0 1-4 4H3"/><path d="M11 10h1v4"/>`;
  }
}

// Fetch the track list from the backend
async function loadLibrary() {
  try {
    const response = await fetch('/api/library');
    tracks = await response.json();
    renderLibrary();
  } catch (error) {
    console.error("Failed to load library:", error);
    trackCountEl.textContent = 'offline';
    libraryEl.innerHTML = '<li class="empty">Failed to load library.</li>';
  }
}

// Render the track list in the DOM
function renderLibrary() {
  libraryEl.innerHTML = '';
  trackCountEl.textContent = tracks.length + (tracks.length === 1 ? ' track' : ' tracks');

  if (tracks.length === 0) {
    libraryEl.innerHTML = '<li class="empty">No tracks found. Add some music to start.</li>';
    return;
  }

  tracks.forEach((track, index) => {
    const li = document.createElement('li');
    li.tabIndex = 0;

    const num = document.createElement('span');
    num.className = 'track-index';
    num.textContent = String(index + 1).padStart(2, '0');

    const name = document.createElement('span');
    name.className = 'track-name';
    name.textContent = track.name;

    li.append(num, name);
    li.classList.toggle('playing', index === currentIndex);

    li.addEventListener('click', () => playTrack(index));
    li.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        playTrack(index);
      }
    });

    libraryEl.appendChild(li);
  });
}

// Play a track by its index in the array
function playTrack(index) {
  if (index < 0 || index >= tracks.length) {
    return;
  }

  currentIndex = index;
  const track = tracks[index];

  const items = libraryEl.querySelectorAll('li');
  items.forEach((el, i) => {
    el.classList.toggle('playing', i === index);
  });

  nowTitleEl.textContent = track.name;

  audioPlayer.src = '/stream?file=' + encodeURIComponent(track.file);
  audioPlayer.play().catch(error => {
    console.error("Playback error:", error);
  });

  updateMediaSession(track);
}

// Drive the equalizer animation from the real playback state
audioPlayer.addEventListener('play', () => document.body.classList.add('is-playing'));
audioPlayer.addEventListener('pause', () => document.body.classList.remove('is-playing'));

// Listen for the 'ended' event to handle playback options
audioPlayer.addEventListener('ended', () => {
  if (repeatMode === 'one') {
    // 1. Repeat single track
    audioPlayer.currentTime = 0;
    audioPlayer.play().catch(console.error);
    return;
  }

  const nextIndex = currentIndex + 1;

  if (nextIndex < tracks.length) {
    // Play next track in list
    playTrack(nextIndex);
  } else if (repeatMode === 'all' && tracks.length > 0) {
    // 2. Repeat all tracks (restart playlist)
    playTrack(0);
  } else {
    // 3. Play through to end (stop playback)
    console.log("End of playlist.");
    libraryEl.querySelectorAll('li').forEach(el => el.classList.remove('playing'));
    currentIndex = -1;
    nowTitleEl.textContent = 'Nothing playing';
    document.body.classList.remove('is-playing');

    if ('mediaSession' in navigator) {
      navigator.mediaSession.playbackState = 'none';
    }
  }
});

// Setup Media Session API for background play and lock screen controls
function updateMediaSession(track) {
  if ('mediaSession' in navigator) {
    navigator.mediaSession.metadata = new MediaMetadata({
      title: track.name,
      artist: 'RaspiBeat',
      album: 'Local Library'
    });

    navigator.mediaSession.playbackState = 'playing';

    navigator.mediaSession.setActionHandler('play', () => {
      audioPlayer.play();
      navigator.mediaSession.playbackState = 'playing';
    });

    navigator.mediaSession.setActionHandler('pause', () => {
      audioPlayer.pause();
      navigator.mediaSession.playbackState = 'paused';
    });

    navigator.mediaSession.setActionHandler('nexttrack', () => {
      const nextIndex = currentIndex + 1;
      if (nextIndex < tracks.length) {
        playTrack(nextIndex);
      } else if (repeatMode === 'all' && tracks.length > 0) {
        playTrack(0);
      }
    });

    navigator.mediaSession.setActionHandler('previoustrack', () => {
      const prevIndex = currentIndex - 1;
      if (prevIndex >= 0) {
        playTrack(prevIndex);
      } else {
        audioPlayer.currentTime = 0;
      }
    });
  }
}

fileInput.addEventListener('change', async (e) => {
  const files = e.target.files;
  if (files.length === 0) return;

  const formData = new FormData();
  for (let i = 0; i < files.length; i++) {
    formData.append('files', files[i]);
  }

  const labelText = uploadBtn.querySelector('.upload-text');
  const originalText = labelText.textContent;

  // Activate upload visual state (spinner)
  uploadBtn.classList.add('is-uploading');
  labelText.textContent = 'Uploading...';

  try {
    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData
    });

    if (response.ok) {
      const result = await response.json();
      console.log(`Uploaded ${result.count} file(s).`);

      await loadLibrary();
    } else {
      alert("Upload failed.");
    }
  } catch (err) {
    console.error("Upload error:", err);
    alert("Upload error. Check the console.");
  } finally {
    uploadBtn.classList.remove('is-uploading');
    labelText.textContent = originalText;
    fileInput.value = '';
  }
});

loadLibrary();