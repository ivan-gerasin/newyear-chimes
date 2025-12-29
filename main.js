const DEFAULT_VIDEO_ID  = "nfN9muBmSIk"; // Куранты 2024
const DEFAULT_OFFSET_SECONDS = 60; // Насколько раньше запускаем видео до последнего удара

const countdownEl = document.getElementById("countdown");
const statusEl = document.getElementById("status");
const startInfoEl = document.getElementById("start-info");
const targetInfoEl = document.getElementById("target-info");
const customForm = document.getElementById("custom-form");
const customTargetInput = document.getElementById("custom-target");
const offsetInput = document.getElementById("offset");
const videoInput = document.getElementById("video-input");
const resetButton = document.getElementById("reset");
const toggleSoundButton = document.getElementById("toggle-sound");
const videoInfoEl = document.getElementById("video-info");

let player;
let playerReady = false;
let videoStarted = false;
let targetTime = nextMidnight();
let offsetSeconds = DEFAULT_OFFSET_SECONDS;
let currentVideoId = DEFAULT_VIDEO_ID;
let startTime = calculateStartTime();
let countdownTimer;

function extractVideoId(input) {
  if (!input) return null;

  const trimmed = input.trim();

  try {
    const url = new URL(trimmed);
    if (url.hostname.includes("youtu.be")) {
      return url.pathname.replace("/", "") || null;
    }
    if (url.hostname.includes("youtube.com")) {
      return url.searchParams.get("v");
    }
  } catch (e) {
    /* not a URL, try raw ID */
  }

  if (/^[a-zA-Z0-9_-]{6,}$/u.test(trimmed)) {
    return trimmed;
  }

  return DEFAULT_VIDEO_ID;
}

function updateVideo(videoId) {
  if (!videoId || videoId === currentVideoId) return;

  currentVideoId = videoId;
  videoStarted = false;
  toggleSoundButton.hidden = true;

  if (playerReady && typeof player.cueVideoById === "function") {
    player.cueVideoById(videoId);
  }
}

function nextMidnight() {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  return midnight;
}

function formatDateTime(date) {
  return date.toLocaleString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    day: "2-digit",
    month: "2-digit",
  });
}

function formatDuration(ms) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600).toString().padStart(2, "0");
  const minutes = Math.floor((totalSeconds % 3600) / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (totalSeconds % 60).toString().padStart(2, "0");
  return `${hours}:${minutes}:${seconds}`;
}

function calculateStartTime() {
  return new Date(targetTime.getTime() - offsetSeconds * 1000);
}

function updateSchedule(newTarget, newOffset, newVideoId) {
  targetTime = newTarget ?? targetTime;
  offsetSeconds = Number.isFinite(newOffset) ? newOffset : offsetSeconds;
  updateVideo(newVideoId);
  startTime = calculateStartTime();
  player?.pauseVideo?.();
  videoStarted = false;
  toggleSoundButton.hidden = true;
  updateTexts();
}

function updateTexts() {
  startInfoEl.textContent = `Старт видео: ${formatDateTime(startTime)}`;
  targetInfoEl.textContent = `Ориентир двенадцатого удара: ${formatDateTime(targetTime)}`;
  statusEl.textContent = `Смещение старта: ${offsetSeconds} сек.`;
  videoInfoEl.textContent = `Видео: ${currentVideoId}`;
}

function tick() {
  const now = new Date();
  const msToStart = startTime - now;
  if (msToStart > 0) {
    countdownEl.textContent = formatDuration(msToStart);
    videoStarted = false;
  } else {
    countdownEl.textContent = "Идет трансляция";
    startVideo();
  }
}

function startCountdown() {
  clearInterval(countdownTimer);
  tick();
  countdownTimer = setInterval(tick, 500);
}

function startVideo() {
  if (!playerReady || videoStarted) return;
  player.seekTo(0, true);
  player.playVideo();
  try {
    unmute() 
  } catch(e) {
    //ignore
  }


  videoStarted = true;
  toggleSoundButton.hidden = false;
}

function unmute() {
  if (!playerReady || videoStarted) return;
  player?.unMute()
  player.setVolume(100)
  document.querySelector("#soundIndicator").innerText  = "✅"
}

function handleCustomSchedule(event) {
  event.preventDefault();
  const customDate = customTargetInput.value
    ? new Date(customTargetInput.value)
    : nextMidnight();
  const customOffset = offsetInput.value ? parseInt(offsetInput.value, 0) : DEFAULT_OFFSET_SECONDS;
  const newVideoId = extractVideoId(videoInput.value);
  if (videoInput.value && !newVideoId) {
    videoInput.setCustomValidity("Введите ссылку или идентификатор YouTube.");
    videoInput.reportValidity();
    return;
  }
  videoInput.setCustomValidity("");

  updateSchedule(customDate, customOffset, newVideoId ?? DEFAULT_VIDEO_ID);
  startCountdown();
}

function resetSchedule() {
  customTargetInput.value = "";
  offsetInput.value = "";
  videoInput.value = "";
  updateSchedule(nextMidnight(), DEFAULT_OFFSET_SECONDS, DEFAULT_VIDEO_ID);
  startCountdown();
}

function attachEvents() {
  customForm.addEventListener("submit", handleCustomSchedule);
  resetButton.addEventListener("click", resetSchedule);
  toggleSoundButton.addEventListener("click", () => {
    try {
      player.unMute();
    } catch (e) {
      /* ignored */
    }
    toggleSoundButton.hidden = true;
  });
}

function onYouTubeIframeAPIReady() {
  player = new YT.Player("player", {
    width: "100%",
    height: "100%",
    videoId: currentVideoId,
    playerVars: {
      controls: 1,
      rel: 0,
      modestbranding: 1,
      start: 0,
    },
    events: {
      onReady: () => {
        playerReady = true;
        startCountdown();
      },
      onStateChange: (event) => {
        if (event.data === YT.PlayerState.ENDED) {
          toggleSoundButton.hidden = true;
        }
      },
    },
  });
}

// Expose callback for the YouTube API
window.onYouTubeIframeAPIReady = onYouTubeIframeAPIReady;

attachEvents();
updateTexts();
startCountdown();
