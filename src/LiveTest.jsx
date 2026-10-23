import { useEffect, useRef, useState } from "react";
import { useLocalCamera } from "./useLocalCamera";
import { usePeerRoom } from "./usePeerRoom";

// Small helper: shows a MediaStream in a <video>.
function Video({ stream, mirror = false, label }) {
  const ref = useRef(null);
  useEffect(() => {
    if (ref.current) ref.current.srcObject = stream || null;
  }, [stream]);

  return (
    <div style={{ width: 320 }}>
      <div>{label}</div>
      <video
        ref={ref}
        autoPlay
        playsInline
        muted
        style={{
          width: "100%",
          height: 240,
          background: "#000",
          borderRadius: 12,
          objectFit: "cover",
          transform: mirror ? "scaleX(-1)" : "none",
        }}
      />
    </div>
  );
}

export default function LiveTest() {
  const [codeInput, setCodeInput] = useState("");
  const [log, setLog] = useState([]);

  const addLog = (line) => setLog((l) => [...l, line]);

  const camera = useLocalCamera();
  const room = usePeerRoom({
    localStream: camera.stream,
    onMessage: (data) => addLog("Received: " + JSON.stringify(data)),
  });

  const sendTest = () => {
    const msg = { type: "hello", time: Date.now() };
    room.send(msg);
    addLog("Sent: " + JSON.stringify(msg));
  };

  const statusText = {
    idle: camera.stream ? "Camera on. Create a room or join one." : "Start your camera first.",
    waiting: `Room created. Share this code: ${room.roomCode}`,
    connecting: "Connecting...",
    connected: "Connected!",
    disconnected: "Opponent left.",
    error: `Error: ${room.error}`,
  }[room.status];

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", maxWidth: 700, margin: "20px auto", color: "#eee" }}>
      <h2>Live 1v1 Video Test</h2>

      <p style={{ color: "#9ca3af" }}>Step 1: turn on your camera</p>
      <button onClick={camera.start} disabled={!!camera.stream}>Start camera</button>
      {camera.error && <p style={{ color: "#f87171" }}>Camera error: {camera.error}</p>}

      <p style={{ color: "#9ca3af" }}>Step 2a: Player 1 creates a room</p>
      <button onClick={() => room.createRoom()} disabled={!camera.stream}>Create room</button>

      <p style={{ color: "#9ca3af" }}>Step 2b: Player 2 enters the code and joins</p>
      <input
        value={codeInput}
        onChange={(e) => setCodeInput(e.target.value.toUpperCase())}
        placeholder="CODE"
        maxLength={4}
        style={{ width: 90, marginRight: 8, padding: 8, fontSize: 16 }}
      />
      <button onClick={() => room.joinRoom(codeInput)} disabled={!camera.stream}>Join room</button>

      <p style={{ fontWeight: "bold", color: "#facc15" }}>{statusText}</p>

      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", margin: "16px 0" }}>
        <Video stream={camera.stream} mirror label="You" />
        <Video stream={room.remoteStream} label="Opponent" />
      </div>

      <p style={{ color: "#9ca3af" }}>Step 3: test sending data</p>
      <button onClick={sendTest} disabled={room.status !== "connected"}>Send test message</button>
      <button onClick={room.leave} style={{ marginLeft: 8 }}>Leave room</button>

      <pre style={{ background: "#1c1c1c", padding: 10, borderRadius: 8, minHeight: 60 }}>
        {log.join("\n")}
      </pre>
    </div>
  );
}
