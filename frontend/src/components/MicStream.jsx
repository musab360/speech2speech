// src/components/MicStream.js
import React, { useState, useRef, useEffect } from "react";
import { FaMicrophone } from "react-icons/fa";

export default function MicStream() {
  const [isRecording, setIsRecording] = useState(false);
  const [amplitude, setAmplitude] = useState(0); // for wave animation
  const mediaRecorderRef = useRef(null);
  const wsRef = useRef(null);
  const analyserRef = useRef(null);
  const animationRef = useRef(null);

  // Start recording & streaming
  const startRecording = async () => {
    try {
      // connect websocket
      wsRef.current = new WebSocket("http://127.0.0.1:5000/audio");

      wsRef.current.onopen = () => console.log("✅ Connected to backend");

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Setup MediaRecorder
      mediaRecorderRef.current = new MediaRecorder(stream, { mimeType: "audio/webm" });
      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0 && wsRef.current?.readyState === 1) {
          wsRef.current.send(e.data); // send audio chunk
        }
      };
      mediaRecorderRef.current.start(250); // send chunks every 250ms

      // Setup analyser for live wave
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const analyser = audioContext.createAnalyser();
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);
      analyser.fftSize = 256;
      analyserRef.current = analyser;

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const updateAmplitude = () => {
        analyser.getByteFrequencyData(dataArray);
        const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
        setAmplitude(avg / 128); // normalize
        animationRef.current = requestAnimationFrame(updateAmplitude);
      };
      updateAmplitude();

      setIsRecording(true);
    } catch (err) {
      console.error("Mic error:", err);
    }
  };

  // Stop recording
  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    wsRef.current?.close();
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    setIsRecording(false);
    setAmplitude(0);
  };

  useEffect(() => {
    return () => {
      stopRecording(); // cleanup if component unmounts
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex flex-col items-center justify-center">
      <button
        onClick={isRecording ? stopRecording : startRecording}
        className={`relative flex items-center justify-center w-20 h-20 rounded-full 
          ${isRecording ? "bg-red-500" : "bg-blue-500"} text-white shadow-lg`}
      >
        <FaMicrophone size={32} />
        {/* Pulse animation when recording */}
        {isRecording && (
          <span className="absolute w-full h-full rounded-full animate-ping bg-red-400 opacity-50"></span>
        )}
      </button>

      {/* Live animated waves */}
      <div className="flex gap-1 mt-6 h-10 items-end">
        {[...Array(5)].map((_, i) => (
          <span
            key={i}
            className="w-2 bg-blue-500 rounded"
            style={{
              height: `${10 + amplitude * (20 + i * 5)}px`,
              transition: "height 0.1s ease",
            }}
          />
        ))}
      </div>
    </div>
  );
}
