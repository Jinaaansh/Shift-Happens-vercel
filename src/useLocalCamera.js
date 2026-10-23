import { useCallback, useEffect, useRef, useState } from "react";

/**
 * useLocalCamera
 * Turns on this player's webcam and gives you the stream.
 *
 * Returns: { stream, error, start, stop }
 */
export function useLocalCamera() {
  const [stream, setStream] = useState(null);
  const [error, setError] = useState(null);
  const streamRef = useRef(null);
  const aliveRef = useRef(true);

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (aliveRef.current) setStream(null);
  }, []);

  const start = useCallback(async () => {
    if (streamRef.current) return;
    try {
      const s = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 },
        audio: false,
      });
      if (!aliveRef.current) {
        s.getTracks().forEach((t) => t.stop());
        return;
      }
      streamRef.current = s;
      setStream(s);
      setError(null);
    } catch (e) {
      setError(e.message || String(e));
    }
  }, []);

  // Release the camera when the component unmounts.
  useEffect(() => {
    aliveRef.current = true;
    return () => {
      aliveRef.current = false;
      stop();
    };
  }, [stop]);

  return { stream, error, start, stop };
}
