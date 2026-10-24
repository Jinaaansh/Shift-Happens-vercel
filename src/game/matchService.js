import {
  doc, setDoc, updateDoc, onSnapshot, arrayUnion, increment,
  serverTimestamp, runTransaction, Timestamp,
} from "firebase/firestore";
import { db } from "../firebase";
import { MAX_HP } from "./constants";

const matchRef = (roomCode) => doc(db, "matches", roomCode);

// CHANGED: the new match document starts with hp, ready, plays, started and result
// already in place. The security rules (firestore.rules) rely on these existing.
export async function createMatch(roomCode, uid) {
  await setDoc(matchRef(roomCode), {
    playerIds: [uid],
    scores: { [uid]: 0 },
    hp: { [uid]: MAX_HP },
    ready: {},
    plays: [],            // replaces the old single "lastPlay" (see Match.jsx)
    started: false,       // becomes true when both players are ready
    result: null,         // { winner: <uid> | "tie" } once the match is over
    status: "waiting",
    createdAt: serverTimestamp(),
    // Optional: in the Firebase console add a TTL policy on "expireAt"
    // and old rooms delete themselves after a day.
    expireAt: Timestamp.fromMillis(Date.now() + 24 * 60 * 60 * 1000),
  });
}

// CHANGED: a "transaction" reads and writes as one safe step, so two people
// can't both squeeze in as the 2nd player at the same time.
export async function joinMatch(roomCode, uid) {
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(matchRef(roomCode));
    if (!snap.exists()) throw new Error("Room not found");
    const ids = snap.data().playerIds || [];
    if (ids.includes(uid)) {
      throw new Error("You are already in this room (to test alone, use a different browser or an incognito window)");
    }
    if (ids.length >= 2) throw new Error("Room is full");
    tx.update(matchRef(roomCode), {
      playerIds: arrayUnion(uid),
      [`scores.${uid}`]: 0,
      [`hp.${uid}`]: MAX_HP,
      status: "playing",
    });
  });
}

// CHANGED: every play is added to a list instead of overwriting one "lastPlay",
// so two cards played at nearly the same moment are both kept.
export async function playCardInMatch(roomCode, uid, card) {
  await updateDoc(matchRef(roomCode), {
    plays: arrayUnion({ playId: `${uid}-${Date.now()}`, playedBy: uid, card, at: Date.now() }),
  });
}

// NEW: tells both players "go!" at the same moment. The security rules only let
// the first write succeed, so a second attempt is simply refused (that is fine).
export async function startMatchIfNeeded(roomCode) {
  await updateDoc(matchRef(roomCode), { started: true });
}

// NEW: one official result for the match. winner = a player's uid, or "tie".
// Only the first write is accepted, so both screens show the same outcome.
export async function saveResult(roomCode, winner) {
  await updateDoc(matchRef(roomCode), { result: { winner } });
}

export async function awardPoint(roomCode, playerId, points = 1) {
  await updateDoc(matchRef(roomCode), { [`scores.${playerId}`]: increment(points) });
}

export function subscribeToMatch(roomCode, callback) {
  return onSnapshot(
    matchRef(roomCode),
    (snap) => callback(snap.data()),
    (err) => console.error("Match listener error:", err)
  );
}
