let mediaRecorder;
let audioChunks = [];
let audioBlob;
let audioUrl;
let audioContext;
let source;

const recordBtn = document.getElementById("recordBtn");
const playBtn = document.getElementById("playBtn");
const pitchSlider = document.getElementById("pitch");

recordBtn.onclick = async () => {
  if (!mediaRecorder || mediaRecorder.state === "inactive") {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder = new MediaRecorder(stream);
    audioChunks = [];

    mediaRecorder.ondataavailable = e => audioChunks.push(e.data);

    mediaRecorder.onstop = () => {
      audioBlob = new Blob(audioChunks, { type: "audio/webm" });
      audioUrl = URL.createObjectURL(audioBlob);
      playBtn.disabled = false;
    };

    mediaRecorder.start();
    recordBtn.textContent = "Stop Recording";
  } else {
    mediaRecorder.stop();
    recordBtn.textContent = "Start Recording";
  }
};

playBtn.onclick = async () => {
  if (!audioBlob) return;

  if (!audioContext) {
    audioContext = new AudioContext();
  }

  const response = await fetch(audioUrl);
  const arrayBuffer = await response.arrayBuffer();
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

  if (source) source.stop();

  source = audioContext.createBufferSource();
  source.buffer = audioBuffer;

  // 🎚 Pitch control (affects speed too)
  source.playbackRate.value = pitchSlider.value;

  source.connect(audioContext.destination);
  source.start();
};
