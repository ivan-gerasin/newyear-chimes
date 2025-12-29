const VIDEO_ID = "wJelEXaPhJ8"; // Куранты 2024
const DEFAULT_OFFSET_SECONDS = 70; // Насколько раньше запускаем видео до последнего удара

const countdownEl = document.getElementById("countdown");
const statusEl = document.getElementById("status");
const startInfoEl = document.getElementById("start-info");
const targetInfoEl = document.getElementById("target-info");
const customForm = document.getElementById("custom-form");
const customTargetInput = document.getElementById("custom-target");
const offsetInput = document.getElementById("offset");
const resetButton = document.getElementById("reset");
const toggleSoundButton = document.getElementById("toggle-sound");

let player;
let playerReady = false;
let videoStarted = false;
let targetTime = nextMidnight();
let offsetSeconds = DEFAULT_OFFSET_SECONDS;
let startTime = calculateStartTime();
let countdownTimer;

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

function updateSchedule(newTarget, newOffset) {
  targetTime = newTarget ?? targetTime;
  offsetSeconds = Number.isFinite(newOffset) ? newOffset : offsetSeconds;
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

function ensureMutedAutoplay() {
  if (player && typeof player.isMuted === "function" && player.isMuted()) {
    return;
  }
  try {
    player?.mute?.();
    toggleSoundButton.hidden = false;
  } catch (e) {
    /* autoplay policies differ */
  }
}

function startVideo() {
  if (!playerReady || videoStarted) return;
  ensureMutedAutoplay();
  player.seekTo(0, true);
  player.playVideo();
  videoStarted = true;
  toggleSoundButton.hidden = false;
}

function handleCustomSchedule(event) {
  event.preventDefault();
  const customDate = customTargetInput.value
    ? new Date(customTargetInput.value)
    : nextMidnight();
  const customOffset = offsetInput.value ? parseInt(offsetInput.value, 10) : DEFAULT_OFFSET_SECONDS;
  updateSchedule(customDate, customOffset);
  startCountdown();
}

function resetSchedule() {
  customTargetInput.value = "";
  offsetInput.value = "";
  updateSchedule(nextMidnight(), DEFAULT_OFFSET_SECONDS);
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
    videoId: VIDEO_ID,
    playerVars: {
      controls: 1,
      rel: 0,
      modestbranding: 1,
      start: 0,
    },
    events: {
      onReady: () => {
        playerReady = true;
        ensureMutedAutoplay();
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
