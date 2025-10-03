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



import { io } from "socket.io-client";
import React, { useRef, useState } from "react";

function App() {
  const [recording, setRecording] = useState(false);
  const [responses, setResponses] = useState([]); // store all AI responses
  const socketRef = useRef(null);
  const mediaRecorderRef = useRef(null);

  const startStreaming = async () => {
    socketRef.current = io("http://127.0.0.1:5000");

    socketRef.current.on("connect", () => {
      console.log("✅ Connected to backend");
    });

    socketRef.current.on("audio_response", (data) => {
      const backendAudioBlob = new Blob([res.data], { type: "audio/mpeg" });
      const url = URL.createObjectURL(backendAudioBlob);

      setAudioUrl(url); // for <audio> tag
      const audio = new Audio(url);
      audio.play();

      // Also keep in history for replay
      setResponses((prev) => [...prev, url]);
    });


    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorderRef.current = new MediaRecorder(stream, { mimeType: "audio/webm" });

    mediaRecorderRef.current.ondataavailable = (e) => {
      if (e.data.size > 0) {
        e.data.arrayBuffer().then((buf) => {
          socketRef.current.emit("audio_chunk", buf);
        });
      }
    };

    mediaRecorderRef.current.start(2000); // send every 2s
    setRecording(true);
  };

  console.log(responses)
  return (
    <div style={{ padding: "2rem" }}>
      {!recording ? (
        <button onClick={startStreaming}>Start Streaming</button>
      ) : (
        <p>🎤 Streaming...</p>
      )}

      <h3>AI Responses:</h3>
      <ul>
        {responses.map((url, i) => (
          <li key={i} style={{ marginBottom: "1rem" }}>
            <audio controls src={url}></audio>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;
