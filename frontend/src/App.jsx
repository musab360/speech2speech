// import React, { useState, useRef } from "react";
// import axios from "axios";

// function App() {
//   const [text, setText] = useState("");
//   const [recording, setRecording] = useState(false);
//   const [loading, setLoading] = useState(false);
//   const [audioUrl, setAudioUrl] = useState(null); // 👈 backend audio

//   const mediaRecorderRef = useRef(null);
//   const audioChunksRef = useRef([]);

//   // Start recording
//   const startRecording = async () => {
//     const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
//     mediaRecorderRef.current = new MediaRecorder(stream);
//     audioChunksRef.current = [];

//     mediaRecorderRef.current.ondataavailable = (e) => {
//       if (e.data.size > 0) {
//         audioChunksRef.current.push(e.data);
//       }
//     };

//     mediaRecorderRef.current.onstop = async () => {
//       setLoading(true);

//       // Create a blob from the user’s recorded audio
//       const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });

//       // Send to backend
//       const formData = new FormData();
//       formData.append("audio", audioBlob, "audio.webm");

//       try {
//         // ✅ Important: responseType must be inside same config
//         const res = await axios.post("http://127.0.0.1:5000/transcribe", formData, {
//           headers: { "Content-Type": "multipart/form-data" },
//           responseType: "blob", // 👈 expect binary blob
//         });

//         // Convert backend response (audio/mpeg) into playable URL
//         const backendAudioBlob = new Blob([res.data], { type: "audio/mpeg" });
//         const url = URL.createObjectURL(backendAudioBlob);

//         setAudioUrl(url); // for <audio> tag
//         const audio = new Audio(url);
//         audio.play(); // auto-play response audio

//         setText("✅ AI audio response ready. Playing...");
//       } catch (err) {
//         console.error("Backend error:", err);
//         setText("❌ Error receiving audio from backend.");
//       } finally {
//         setLoading(false);
//       }
//     };

//     mediaRecorderRef.current.start();
//     setRecording(true);
//   };

//   // Stop recording
//   const stopRecording = () => {
//     if (mediaRecorderRef.current) {
//       mediaRecorderRef.current.stop();
//       setRecording(false);
//     }
//   };

//   return (
//     <div className="flex flex-col items-center justify-center h-screen bg-gray-900 text-white p-6">
//       <h1 className="text-3xl font-bold mb-6">🎤 Speech → AI Audio Response</h1>

//       <div className="space-x-4 mb-6">
//         {!recording ? (
//           <button
//             onClick={startRecording}
//             className="px-6 py-3 bg-green-600 rounded-lg hover:bg-green-700 transition"
//           >
//             Start Recording
//           </button>
//         ) : (
//           <button
//             onClick={stopRecording}
//             className="px-6 py-3 bg-red-600 rounded-lg hover:bg-red-700 transition"
//           >
//             Stop Recording
//           </button>
//         )}
//       </div>

//       {/* AI Response Audio */}
//       {audioUrl && (
//         <div className="mb-6">
//           <h2 className="text-lg font-semibold mb-2">AI Response Audio:</h2>
//           <audio controls autoPlay src={audioUrl}></audio>
//         </div>
//       )}

//       {/* Status */}
//       <div className="w-full max-w-2xl bg-gray-800 p-6 rounded-lg shadow-lg">
//         <h2 className="text-xl font-semibold mb-3">Status:</h2>
//         {loading ? (
//           <p className="text-yellow-400">⏳ Processing...</p>
//         ) : (
//           <p className="whitespace-pre-wrap">{text}</p>
//         )}
//       </div>
//     </div>
//   );
// }

// export default App;



import React, { useRef, useState } from "react";
import axios from "axios";
import { PiWaveformBold } from "react-icons/pi";
import { FaPhoneSlash } from "react-icons/fa6";

function App() {
  const [recording, setRecording] = useState(false);
  const [responses, setResponses] = useState([]);   // [{ url, text }]
  const [transcripts, setTranscripts] = useState([]);
  const [ttsText, setTtsText] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);

  const recognitionRef = useRef(null);
  const audioRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const sourceRef = useRef(null);
  const animationRef = useRef(null);

  // 🎵 Setup analyser on backend <audio>
  const setupBars = async () => {
    if (!audioRef.current) return;

    if (audioContextRef.current) {
      await audioContextRef.current.close();
    }

    audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();

    // resume context (required on Chrome)
    await audioContextRef.current.resume();

    sourceRef.current = audioContextRef.current.createMediaElementSource(audioRef.current);
    analyserRef.current = audioContextRef.current.createAnalyser();
    analyserRef.current.fftSize = 256;

    sourceRef.current.connect(analyserRef.current);
    analyserRef.current.connect(audioContextRef.current.destination);

    drawBars();
  };

  // 🎵 Draw WhatsApp-style bars based on audio output
  const drawBars = () => {
    if (!analyserRef.current) return;
    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    const bars = document.getElementsByClassName("bar");

    const draw = () => {
      animationRef.current = requestAnimationFrame(draw);
      analyserRef.current.getByteFrequencyData(dataArray);

      const step = Math.floor(dataArray.length / bars.length);

      for (let i = 0; i < bars.length; i++) {
        let sum = 0;
        for (let j = 0; j < step; j++) {
          sum += dataArray[i * step + j];
        }
        const avg = sum / step;
        const scale = isPlaying ? Math.max(0.2, avg / 50) : 0.2;

        bars[i].style.transform = `scaleY(${scale})`;
      }
    };
    draw();
  };

  // 🔊 Call Flask /tts route
  const handleTTS = async (textParam) => {
    const textToSpeak = textParam || ttsText;
    if (!textToSpeak.trim()) return;

    try {
      const res = await axios.post(
        "http://127.0.0.1:5000/tts",
        { text: textToSpeak },
        { responseType: "arraybuffer" }
      );

      const blob = new Blob([res.data], { type: "audio/mpeg" });
      const url = URL.createObjectURL(blob);

      setResponses([{ url, text: textToSpeak }]);

      setTimeout(() => {
        if (audioRef.current) {
          audioRef.current.src = url;

          // when audio starts playing, setup bars
          audioRef.current.onplay = () => {
            setupBars();
            setIsPlaying(true);
          };

          audioRef.current.play();
        }
      }, 300);
    } catch (err) {
      console.error("TTS error:", err);
    }
  };

  // 🎤 SpeechRecognition
  const startStreaming = async () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = "en-US";

      recognitionRef.current.onresult = (event) => {
        let transcript = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setTranscripts((prev) => [...prev, transcript]);
        handleTTS(transcript);
      };

      recognitionRef.current.onerror = (event) => {
        console.error("SpeechRecognition Error:", event.error);
      };

      recognitionRef.current.onend = () => {
        if (recording) {
          console.log("⚠️ Restarting SpeechRecognition...");
          setTimeout(() => recognitionRef.current.start(), 500);
        }
      };

      recognitionRef.current.start();
      setRecording(true);
    }
  };

  const stopStreaming = () => {
    if (recognitionRef.current) recognitionRef.current.stop();
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    if (audioContextRef.current) audioContextRef.current.close();
    setRecording(false);
    console.log("🛑 Streaming stopped");
  };

  // 🎵 Pause/Play toggle
  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  return (
    <div style={{ padding: "2rem" }}>
      <div className="relative size-60 rounded-full overflow-hidden">
        {/* Golden spinning disc background */}
        <span className="absolute inset-0 flex items-center justify-center">
          <span className="size-60 rounded-full animate-spin-slow bg-[conic-gradient(from_180deg_at_50%_50%,#ffd700,#fff8dc,#ffd700,#ffcc00,#ffd700)] shadow-[0_0_30px_rgba(255,215,0,0.6)]"></span>
        </span>

        {/* Centered clickable icon */}
        <span className="relative z-10 flex items-center justify-center w-full h-full">
          {!recording ? (
            <button
              onClick={startStreaming}
              className="flex items-center justify-center size-10 rounded-full bg-black"
            >
              <PiWaveformBold className="text-white text-2xl" />
            </button>
          ) : (
            <button
              className="flex items-center justify-center size-10 rounded-full bg-black"
              onClick={stopStreaming}
            >
              <FaPhoneSlash className="text-white text-2xl" />

            </button>
          )}
        </span>
      </div>

      {/* Custom Audio Player */}
      {responses.length > 0 && (
        <div style={{ margin: "20px 0", textAlign: "center" }}>
          <p>
            <strong>Text:</strong> {responses[0].text}
          </p>
          <div
            style={{
              display: "flex",
              gap: "6px",
              alignItems: "center",
              justifyContent: "center",
              height: "80px",
              margin: "20px 0",
            }}
          >
            {[...Array(7)].map((_, i) => (
              <div
                key={i}
                className="bar"
                style={{
                  width: "6px",
                  background: "#00cc66",
                  height: "100%",
                  transform: "scaleY(0.2)",
                  transformOrigin: "center",
                  borderRadius: "3px",
                  transition: "transform 0.1s ease",
                }}
              ></div>
            ))}
          </div>
          <button onClick={togglePlay} style={{ padding: "10px 20px" }}>
            {isPlaying ? "⏸ Pause" : "▶️ Play"}
          </button>
          {/* hidden audio tag */}
          <audio
            ref={audioRef}
            onEnded={() => setIsPlaying(false)}
            style={{ display: "none" }}
          />
        </div>
      )}

      {/* Manual TTS */}
      <div style={{ marginTop: "2rem" }}>
        <h3>Manual Text to Speech:</h3>
        <input
          type="text"
          value={ttsText}
          onChange={(e) => setTtsText(e.target.value)}
          placeholder="Enter text to speak..."
          style={{ width: "300px" }}
        />
        <button onClick={() => handleTTS()} style={{ marginLeft: "10px" }}>
          Speak
        </button>
      </div>

      <h3>Live Transcripts:</h3>
      <ul>
        {transcripts.map((t, i) => (
          <li key={i}>{t}</li>
        ))}
      </ul>
    </div>

  );
}

export default App;