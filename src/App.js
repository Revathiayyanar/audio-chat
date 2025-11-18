import React, { useState, useRef, useEffect } from "react";
import "./App.css";

function App() {
  const [chatOpen, setChatOpen] = useState(false);
  const [recording, setRecording] = useState(false);
  const [messages, setMessages] = useState([]);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  // ✅ Add a default "received" recording on mount
  useEffect(() => {
    const addDefaultAudio = async () => {
      // Create a small silent audio blob for demo
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const buffer = ctx.createBuffer(1, ctx.sampleRate * 1, ctx.sampleRate); // 1 second silent
      const dest = ctx.createMediaStreamDestination();
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(dest);
      source.start();

      const recorder = new MediaRecorder(dest.stream);
      const chunks = [];
      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: "audio/webm" });
        const url = URL.createObjectURL(blob);
        setMessages([{ url, from: "other" }]); // default message
      };
      recorder.start();
      setTimeout(() => recorder.stop(), 500);
    };
    addDefaultAudio();
  }, []);

  const handleRecordClick = async () => {
    if (!recording) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorderRef.current = new MediaRecorder(stream);
        audioChunksRef.current = [];

        mediaRecorderRef.current.ondataavailable = (e) => {
          audioChunksRef.current.push(e.data);
        };

        mediaRecorderRef.current.onstop = () => {
          const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
          const url = URL.createObjectURL(blob);
          setMessages((prev) => [...prev, { url, from: "me" }]);

          // Simulated auto reply
          setTimeout(() => {
            const dummy = new Blob([], { type: "audio/webm" });
            const dummyUrl = URL.createObjectURL(dummy);
            setMessages((prev) => [...prev, { url: dummyUrl, from: "other" }]);
          }, 1200);
        };

        mediaRecorderRef.current.start();
        setRecording(true);
      } catch (err) {
        alert("Microphone access denied!");
      }
    } else {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  };

  return (
    <div className="App">
      <button className="open-chat-btn" onClick={() => setChatOpen(true)}>
        Open Chat
      </button>

      {chatOpen && (
        <div className="chat-window">
          <div className="chat-header">
            <div>
              <div className="chat-title">Audio Chat</div>
              <div className="chat-sub">Demo — Audio Only</div>
            </div>
            <button className="close-btn" onClick={() => setChatOpen(false)}>
              ✕
            </button>
          </div>

          <div className="messages">
            {messages.map((m, i) => (
              <div key={i} className={`msg ${m.from}`}>
                <audio controls src={m.url}></audio>
              </div>
            ))}
          </div>

          <div className="chat-input">
            <button
              className={`record-btn ${recording ? "recording" : ""}`}
              onClick={handleRecordClick}
            >
              {recording ? "⏹ Stop Recording" : "🎤 Start Recording"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
