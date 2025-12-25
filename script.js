let mediaRecorder;
let chunks = [];
let audioBlob;
let audioURL;
let audioContext;
let currentBuffer;

const recordBtn = document.getElementById("recordBtn");
const playBtn = document.getElementById("playBtn");
const reverseBtn = document.getElementById("reverseBtn");
const downloadBtn = document.getElementById("downloadBtn");
const pitchSlider = document.getElementById("pitch");

/* ===== RECORD ===== */
recordBtn.addEventListener("click", async () => {
  if (!mediaRecorder || mediaRecorder.state === "inactive") {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

    chunks = [];
    mediaRecorder = new MediaRecorder(stream);

    mediaRecorder.ondataavailable = e => {
      if (e.data.size > 0) chunks.push(e.data);
    };

    mediaRecorder.onstop = async () => {
      audioBlob = new Blob(chunks);
      audioURL = URL.createObjectURL(audioBlob);

      if (!audioContext) {
        audioContext = new AudioContext();
      }

      const buffer = await (await fetch(audioURL)).arrayBuffer();
      currentBuffer = await audioContext.decodeAudioData(buffer);

      playBtn.disabled = false;
      reverseBtn.disabled = false;
      downloadBtn.disabled = false;
    };

    mediaRecorder.start();
    recordBtn.textContent = "Stop Recording";
  } else {
    mediaRecorder.stop();
    recordBtn.textContent = "Start Recording";
  }
});

/* ===== PLAY ===== */
playBtn.addEventListener("click", () => {
  if (!currentBuffer) return;

  const source = audioContext.createBufferSource();
  source.buffer = currentBuffer;
  source.playbackRate.value = pitchSlider.value;
  source.connect(audioContext.destination);
  source.start();
});

/* ===== REVERSE ===== */
reverseBtn.addEventListener("click", () => {
  if (!currentBuffer) return;

  for (let c = 0; c < currentBuffer.numberOfChannels; c++) {
    currentBuffer
      .getChannelData(c)
      .reverse();
  }
});

/* ===== DOWNLOAD ===== */
downloadBtn.addEventListener("click", () => {
  if (!currentBuffer) return;

  const wavBlob = audioBufferToWav(currentBuffer);
  const url = URL.createObjectURL(wavBlob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "voice-changed.wav";
  a.click();

  URL.revokeObjectURL(url);
});

/* ===== AUDIO BUFFER → WAV ===== */
function audioBufferToWav(buffer) {
  const length = buffer.length * buffer.numberOfChannels * 2 + 44;
  const arrayBuffer = new ArrayBuffer(length);
  const view = new DataView(arrayBuffer);

  const writeString = (offset, string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  let offset = 0;

  writeString(offset, "RIFF"); offset += 4;
  view.setUint32(offset, length - 8, true); offset += 4;
  writeString(offset, "WAVE"); offset += 4;
  writeString(offset, "fmt "); offset += 4;
  view.setUint32(offset, 16, true); offset += 4;
  view.setUint16(offset, 1, true); offset += 2;
  view.setUint16(offset, buffer.numberOfChannels, true); offset += 2;
  view.setUint32(offset, buffer.sampleRate, true); offset += 4;
  view.setUint32(offset, buffer.sampleRate * buffer.numberOfChannels * 2, true); offset += 4;
  view.setUint16(offset, buffer.numberOfChannels * 2, true); offset += 2;
  view.setUint16(offset, 16, true); offset += 2;
  writeString(offset, "data"); offset += 4;
  view.setUint32(offset, buffer.length * buffer.numberOfChannels * 2, true); offset += 4;

  for (let i = 0; i < buffer.length; i++) {
    for (let c = 0; c < buffer.numberOfChannels; c++) {
      const sample = Math.max(-1, Math.min(1, buffer.getChannelData(c)[i]));
      view.setInt16(offset, sample * 0x7fff, true);
      offset += 2;
    }
  }

  return new Blob([view], { type: "audio/wav" });
}
