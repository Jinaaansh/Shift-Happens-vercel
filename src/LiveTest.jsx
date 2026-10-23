import { useState } from "react";
import { useLocalCamera } from "./useLocalCamera";
import { usePeerRoom } from "./usePeerRoom";
import VideoPanel from "./video/VideoPanel";

export default function LiveTest() {
  const [codeInput, setCodeInput] = useState("");
  const [log, setLog] = useState([]);
  const [messages, setMessages] = useState([]);

  const addLog = (line) => setLog((l) => [...l, line]);

  const camera = useLocalCamera();
  const room = usePeerRoom({
    localStream: camera.stream,
    onMessage: (data) => {
      if (data?.type === "chat") {
        setMessages((m) => [...m, { from: "them", text: data.text }]);
      } else {
        addLog("Received: " + JSON.stringify(data));
      }
    },
  });

  const sendChat = (text) => {
    room.send({ type: "chat", text });
    setMessages((m) => [...m, { from: "me", text }]);
  };

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

      <p style={{ color: "#9ca3af" }}>Step 1: turn on your camera and mic (use headphones)</p>
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

      <div style={{ margin: "16px 0" }}>
        <VideoPanel
          localStream={camera.stream}
          remoteStream={room.remoteStream}
          messages={messages}
          onSendChat={room.status === "connected" ? sendChat : undefined}
        />
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
