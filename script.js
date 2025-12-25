let mediaRecorder;
let chunks = [];
let audioBlob;
let audioURL;
let audioContext;

const recordBtn = document.getElementById("recordBtn");
const playBtn = document.getElementById("playBtn");
const pitchSlider = document.getElementById("pitch");

recordBtn.addEventListener("click", async () => {
  if (!mediaRecorder || mediaRecorder.state === "inactive") {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

    chunks = [];

    mediaRecorder = new MediaRecorder(stream);

    mediaRecorder.ondataavailable = e => {
      if (e.data.size > 0) chunks.push(e.data);
    };

    mediaRecorder.onstop = () => {
      audioBlob = new Blob(chunks);
      audioURL = URL.createObjectURL(audioBlob);
      playBtn.disabled = false;
      console.log("Recording saved");
    };

    mediaRecorder.start();
    recordBtn.textContent = "Stop Recording";
    console.log("Recording started");
  } else {
    mediaRecorder.stop();
    recordBtn.textContent = "Start Recording";
    console.log("Recording stopped");
  }
});

playBtn.addEventListener("click", async () => {
  if (!audioBlob) return;

  if (!audioContext) {
    audioContext = new AudioContext();
  }

  const response = await fetch(audioURL);
  const buffer = await response.arrayBuffer();
  const audioBuffer = await audioContext.decodeAudioData(buffer);

  const source = audioContext.createBufferSource();
  source.buffer = audioBuffer;

  // Pitch (speed-linked)
  source.playbackRate.value = pitchSlider.value;

  source.connect(audioContext.destination);
  source.start();
});
