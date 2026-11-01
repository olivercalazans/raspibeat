const libraryEl = document.getElementById('library');
const audioPlayer = document.getElementById('player');
const fileInput = document.getElementById('file-upload');
const trackCountEl = document.getElementById('track-count');
const nowTitleEl = document.getElementById('now-title');


let tracks = [];
let currentIndex = -1;


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


// Listen for the 'ended' event to automatically play the next track
audioPlayer.addEventListener('ended', () => {
  const nextIndex = currentIndex + 1;

  if (nextIndex < tracks.length) {
    playTrack(nextIndex);
  } else {
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

  const label = document.querySelector('.upload-btn');
  const labelText = label.querySelector('.upload-text');
  const originalText = labelText.textContent;
  labelText.textContent = 'Uploading...';
  label.style.opacity = '0.7';
  label.style.pointerEvents = 'none';

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
    labelText.textContent = originalText;
    label.style.opacity = '1';
    label.style.pointerEvents = 'auto';
    fileInput.value = '';
  }
});


loadLibrary();
