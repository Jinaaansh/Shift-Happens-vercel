import { useEffect, useRef, useState } from "react";
import { LaughDetector } from "./laugh-detector.js";

export default function LaughTest() {
  const videoRef = useRef(null);
  const detectorRef = useRef(null);
  const timerRef = useRef(null);
  const activeRef = useRef(false);
  const [status, setStatus] = useState("Click Start");
  const [score, setScore] = useState(0);
  const [ready, setReady] = useState(false);
  const [roundActive, setRoundActive] = useState(false);
  const [result, setResult] = useState("");

  useEffect(() => {
    const video = videoRef.current;
    return () => {
      clearInterval(timerRef.current);
      detectorRef.current?.stop();
      video?.srcObject?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  async function start() {
    try {
      setStatus("Loading model...");
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      const video = videoRef.current;
      video.srcObject = stream;
      await new Promise((r) => (video.onloadeddata = r));

      const detector = new LaughDetector(video);
      await detector.init();
      setStatus("Keep a straight face for 2 seconds...");
      await detector.calibrate();

      detector.onScore((s) => setScore(s));
      detector.onLaugh(() => finishRound("You laughed!"));
      detector.start();
      detectorRef.current = detector;
      setStatus("Ready");
      setReady(true);
    } catch (e) {
      setStatus("Error: " + e.message);
      console.error(e);
    }
  }

  function startRound() {
    setResult("");
    detectorRef.current.startRound();
    activeRef.current = true;
    setRoundActive(true);
    let left = 10;
    setStatus(`Round: ${left}s`);
    timerRef.current = setInterval(() => {
      left -= 1;
      setStatus(`Round: ${left}s`);
      if (left <= 0) finishRound("You held your poker face!");
    }, 1000);
  }

  function finishRound(message) {
    if (!activeRef.current) return;
    activeRef.current = false;
    clearInterval(timerRef.current);
    const r = detectorRef.current.endRound();
    setResult(`${message} (peak ${Math.round(r.peak)}, avg ${Math.round(r.avg)})`);
    setRoundActive(false);
    setStatus("Ready");
  }

  return (
    <div style={{ textAlign: "center" }}>
      <h2>Detector Test</h2>
      <p>{status}</p>
      <button onClick={start} disabled={ready}>Start</button>{" "}
      <button onClick={startRound} disabled={!ready || roundActive}>Start 10s round</button>
      <br /><br />
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        style={{ width: 400, borderRadius: 12, transform: "scaleX(-1)" }}
      />
      <div style={{ width: 400, height: 24, background: "#333", margin: "12px auto", borderRadius: 12, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${score}%`, background: score > 50 ? "#f44336" : "#4caf50" }} />
      </div>
      <h3>{Math.round(score)}</h3>
      <p>{result}</p>
    </div>
  );
}