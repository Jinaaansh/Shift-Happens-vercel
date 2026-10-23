import { useEffect, useState } from "react";
import { signInAnonymously } from "firebase/auth";
import { auth } from "../firebase";
import { createMatch, joinMatch, subscribeToMatch } from "../game/matchService";

export default function GameSandbox() {
  const [uid, setUid] = useState(null);
  const [match, setMatch] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    signInAnonymously(auth)
      .then((cred) => setUid(cred.user.uid))
      .catch((e) => setError(e.message));
  }, []);

  useEffect(() => {
    const unsub = subscribeToMatch("TEST", setMatch);
    return unsub;
  }, []);

  async function run(fn) {
    try {
      setError("");
      await fn("TEST", uid);
    } catch (e) {
      setError(e.message);
    }
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>My uid: {uid || "signing in..."}</h2>
      <button disabled={!uid} onClick={() => run(createMatch)}>Create room TEST</button>{" "}
      <button disabled={!uid} onClick={() => run(joinMatch)}>Join room TEST</button>
      {error && <p style={{ color: "red" }}>{error}</p>}
      <pre>{JSON.stringify(match, null, 2)}</pre>
    </div>
  );
}