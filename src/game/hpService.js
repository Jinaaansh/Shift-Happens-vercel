import { doc, updateDoc } from 'firebase/firestore'
import { db } from '../firebase'

export function saveHp(roomCode, uid, hp) {
  return updateDoc(doc(db, 'matches', roomCode), { [`hp.${uid}`]: hp })
}