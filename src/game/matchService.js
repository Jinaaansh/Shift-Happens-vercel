import { doc, setDoc, updateDoc, onSnapshot, arrayUnion, increment, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";

const matchRef = (roomCode) => doc(db, "matches", roomCode);

export async function createMatch(roomCode, uid) {
  await setDoc(matchRef(roomCode), {
    playerIds: [uid],
    scores: { [uid]: 0 },
    lastPlay: null,
    status: "waiting",
    createdAt: serverTimestamp(),
  });
}

export async function joinMatch(roomCode, uid) {
  await updateDoc(matchRef(roomCode), {
    playerIds: arrayUnion(uid),
    [`scores.${uid}`]: 0,
    status: "playing",
  });
}

export async function playCardInMatch(roomCode, uid, card) {
  await updateDoc(matchRef(roomCode), {
    lastPlay: { playId: `${uid}-${Date.now()}`, playedBy: uid, card },
  });
}

export async function awardPoint(roomCode, playerId, points = 1) {
  await updateDoc(matchRef(roomCode), { [`scores.${playerId}`]: increment(points) });
}

export function subscribeToMatch(roomCode, callback) {
  return onSnapshot(matchRef(roomCode), (snap) => callback(snap.data()));
}