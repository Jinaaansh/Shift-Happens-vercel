import { useEffect, useRef, useState } from 'react'
import { signInAnonymously } from 'firebase/auth'
import { auth } from '../firebase'
import { useLocalCamera } from '../useLocalCamera'
import { usePeerRoom } from '../usePeerRoom'
import { useLaughScore } from '../game/useLaughScore'
import { createMatch, joinMatch, subscribeToMatch } from '../game/matchService'
import { markReady } from '../game/readyService'
import Match from './Match'
import PickPhase from './PickPhase'

function Video({ stream, muted = false, mirror = false, label }) {
  const ref = useRef(null)
  useEffect(() => {
    if (ref.current) ref.current.srcObject = stream || null
  }, [stream])
  return (
    <div style={{ width: 200 }}>
      <div>{label}</div>
      <video
        ref={ref}
        autoPlay
        playsInline
        muted={muted}
        style={{
          width: '100%',
          height: 150,
          background: '#000',
          borderRadius: 12,
          objectFit: 'cover',
          transform: mirror ? 'scaleX(-1)' : 'none',
        }}
      />
    </div>
  )
}

export default function GameFlow() {
  const [uid, setUid] = useState(null)
  const [role, setRole] = useState(null)
  const [codeInput, setCodeInput] = useState('')
  const [activeCode, setActiveCode] = useState(null)
  const [error, setError] = useState('')
  const [phase, setPhase] = useState('lobby')
  const [deck, setDeck] = useState(null)
  const createdRef = useRef(false)

  const camera = useLocalCamera()
  const room = usePeerRoom({ localStream: camera.stream, onMessage: () => {} })
  const laugh = useLaughScore(camera.stream)

  useEffect(() => {
    signInAnonymously(auth)
      .then((c) => setUid(c.user.uid))
      .catch((e) => setError(e.message))
  }, [])

  useEffect(() => {
    if (role !== 'host' || !room.roomCode || !uid || createdRef.current) return
    createdRef.current = true
    createMatch(room.roomCode, uid)
      .then(() => setActiveCode(room.roomCode))
      .catch((e) => setError(e.message))
  }, [role, room.roomCode, uid])

  useEffect(() => {
    if (room.status === 'connected' && activeCode && phase === 'lobby') setPhase('pick')
  }, [room.status, activeCode, phase])

  useEffect(() => {
    if (phase !== 'pick' || !activeCode) return
    return subscribeToMatch(activeCode, (m) => {
      const ready = m?.ready || {}
      if (Object.values(ready).filter(Boolean).length >= 2) setPhase('match')
    })
  }, [phase, activeCode])

  function handleCreate() {
    setError('')
    setRole('host')
    room.createRoom()
  }

  async function handleJoin() {
    setError('')
    try {
      await joinMatch(codeInput, uid)
      setRole('guest')
      setActiveCode(codeInput)
      room.joinRoom(codeInput)
    } catch (e) {
      setError('Could not join: ' + e.message)
    }
  }

  function handleDeckDone(chosen) {
    setDeck(chosen)
    markReady(activeCode, uid).catch((e) => setError(e.message))
  }

  const canPlay = camera.stream && laugh.status === 'ready' && uid
  const laughText = {
    idle: 'Start your camera first.',
    loading: 'Loading face detector...',
    calibrating: 'Keep a NEUTRAL face for 2 seconds...',
    ready: 'Detector ready.',
    error: 'Detector error (see console).',
  }[laugh.status]

  if (phase === 'pick' || phase === 'match') {
    return (
      <div style={{ display: 'flex', gap: 16, padding: 16, color: '#eee' }}>
        <div>
          <Video stream={camera.stream} muted mirror label="You" />
          <Video stream={room.remoteStream} label="Opponent" />
        </div>
        {phase === 'pick' && !deck && <PickPhase onDone={handleDeckDone} />}
        {phase === 'pick' && deck && <h2>Deck locked in! Waiting for your opponent...</h2>}
        {phase === 'match' && (
          <Match
            key={activeCode}
            roomCode={activeCode}
            uid={uid}
            deckCards={deck}
            laughScore={laugh.score}
          />
        )}
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 600, margin: '20px auto', padding: 16, color: '#eee' }}>
      <h2>Poker Face Arena</h2>
      <p>{uid ? 'Signed in.' : 'Signing in...'}</p>

      <button onClick={camera.start} disabled={!!camera.stream}>Start camera</button>
      {camera.error && <p style={{ color: '#f87171' }}>Camera error: {camera.error}</p>}
      <p>{laughText}</p>

      <button onClick={handleCreate} disabled={!canPlay || role === 'host'}>Create room</button>
      {room.roomCode && role === 'host' && (
        <p style={{ fontWeight: 'bold', color: '#facc15' }}>Share this code: {room.roomCode}</p>
      )}

      <p>Or join a friend:</p>
      <input
        value={codeInput}
        onChange={(e) => setCodeInput(e.target.value.toUpperCase())}
        placeholder="CODE"
        maxLength={4}
        style={{ width: 90, marginRight: 8, padding: 8, fontSize: 16 }}
      />
      <button onClick={handleJoin} disabled={!canPlay || codeInput.length < 4}>Join room</button>

      <p>Status: {room.status}</p>
      {error && <p style={{ color: '#f87171' }}>{error}</p>}
    </div>
  )
}