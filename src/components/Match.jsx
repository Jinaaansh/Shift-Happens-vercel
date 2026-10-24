import { useCallback, useEffect, useRef, useState } from 'react'
import { useElixir } from '../game/useElixir'
import { subscribeToMatch, playCardInMatch, saveResult } from '../game/matchService'
import { saveHp } from '../game/hpService'
import { costOf, isSafeUrl } from '../game/cardCost'
import {
  MAX_HP,
  LAUGH_DEADZONE,
  DAMAGE_PER_SECOND,
  MATCH_SECONDS,
  OVERTIME_SECONDS,
  NO_FACE_DAMAGE_PER_SECOND,
  FORFEIT_AFTER_MS,
} from '../game/constants'

function HpBar({ label, hp }) {
  const pct = Math.max(0, Math.min(100, (hp / MAX_HP) * 100))
  return (
    <div style={{ margin: '8px 0' }}>
      <div>{label}: {Math.round(hp)} / {MAX_HP}</div>
      <div style={{ width: 300, height: 20, background: '#333', borderRadius: 10, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: pct > 30 ? '#4caf50' : '#f44336' }} />
      </div>
    </div>
  )
}

export default function Match({
  roomCode,
  uid,
  deckCards,
  laughScore,
  faceVisible = true,     // NEW: false when the camera can't see your face
  opponentLeft = false,   // NEW: true when the video/data link to the opponent dropped
}) {
  const [match, setMatch] = useState(null)
  const [usedIds, setUsedIds] = useState([])
  const [shownCard, setShownCard] = useState(null)
  const [myHp, setMyHp] = useState(MAX_HP)
  const [timeLeft, setTimeLeft] = useState(MATCH_SECONDS)
  const [phase, setPhase] = useState('playing') // 'playing' | 'overtime'
  const { elixir, spend } = useElixir()

  const laughRef = useRef(laughScore)
  const faceRef = useRef(faceVisible)
  const hpRef = useRef(MAX_HP)
  const overRef = useRef(false)
  const endAtRef = useRef(Date.now() + MATCH_SECONDS * 1000) // wall-clock end of the current period
  const proposedRef = useRef(false)
  const seenPlaysRef = useRef(null)

  useEffect(() => {
    return subscribeToMatch(roomCode, setMatch)
  }, [roomCode])

  const opponentId = match?.playerIds?.find((id) => id !== uid)
  const opponentHp = match?.hp?.[opponentId] ?? MAX_HP
  const result = match?.result            // { winner } once the match is officially over
  const over = !!result
  const outcome = !result ? null : result.winner === 'tie' ? 'tie' : result.winner === uid ? 'win' : 'lose'

  // keep the "latest value" boxes up to date
  useEffect(() => {
    laughRef.current = laughScore
    faceRef.current = faceVisible
    overRef.current = over
  })

  // ---- Damage loop (CHANGED) ----
  // 1) Damage is now based on REAL elapsed time (dt), not "one tick = 0.2 s".
  //    Browsers slow timers in hidden tabs, so counting ticks would under-punish.
  // 2) If your face is hidden, or you switch to another tab, you lose
  //    NO_FACE_DAMAGE_PER_SECOND instead of being immune.
  useEffect(() => {
    let last = performance.now()
    const tick = setInterval(() => {
      const now = performance.now()
      const dt = (now - last) / 1000
      last = now
      if (overRef.current || hpRef.current <= 0) return

      let damage = 0
      if (document.hidden || !faceRef.current) {
        damage = NO_FACE_DAMAGE_PER_SECOND * dt
      } else if (laughRef.current > LAUGH_DEADZONE) {
        damage = (laughRef.current / 100) * DAMAGE_PER_SECOND * dt
      }
      if (damage > 0) {
        hpRef.current = Math.max(0, hpRef.current - damage)
        setMyHp(hpRef.current)
      }
    }, 200)
    return () => clearInterval(tick)
  }, [])

  // save my HP to the database (only when the rounded number changed)
  useEffect(() => {
    let last = MAX_HP
    const save = setInterval(() => {
      const rounded = Math.round(hpRef.current)
      if (rounded !== last) {
        last = rounded
        saveHp(roomCode, uid, rounded).catch(console.error)
      }
    }, 500)
    return () => clearInterval(save)
  }, [roomCode, uid])

  // ---- Showing the opponent's cards (CHANGED: now reads the "plays" list) ----
  const plays = match?.plays
  useEffect(() => {
    if (!plays) return
    if (seenPlaysRef.current === null) {
      // first time we see the list: everything already in it is old news
      seenPlaysRef.current = new Set(plays.map((p) => p.playId))
      return
    }
    const fresh = plays.filter((p) => !seenPlaysRef.current.has(p.playId))
    fresh.forEach((p) => seenPlaysRef.current.add(p.playId))
    const theirs = fresh.filter((p) => p.playedBy !== uid)
    if (theirs.length > 0) setShownCard(theirs[theirs.length - 1].card)
  }, [plays, uid])

  useEffect(() => {
    if (!shownCard) return
    const hide = setTimeout(() => setShownCard(null), 5000)
    return () => clearTimeout(hide)
  }, [shownCard])

  // ---- Clock (CHANGED: based on the real clock so hidden tabs can't slow it) ----
  useEffect(() => {
    if (over) return
    const t = setInterval(() => {
      setTimeLeft(Math.max(0, Math.ceil((endAtRef.current - Date.now()) / 1000)))
    }, 250)
    return () => clearInterval(t)
  }, [phase, over])

  // ---- Official result (CHANGED) ----
  // Whoever notices the end first proposes the result. The database accepts
  // only the first proposal, so both players always see the SAME outcome.
  const propose = useCallback(
    (winner) => {
      if (proposedRef.current) return
      proposedRef.current = true
      saveResult(roomCode, winner).catch((e) => {
        console.error(e)
        proposedRef.current = false
      })
    },
    [roomCode]
  )

  useEffect(() => {
    if (over || !opponentId) return
    const mine = Math.round(myHp)
    const theirs = Math.round(opponentHp)
    if (mine <= 0 && theirs <= 0) return propose('tie')
    if (mine <= 0) return propose(opponentId)
    if (theirs <= 0) return propose(uid)
    if (timeLeft === 0) {
      if (mine > theirs) return propose(uid)
      if (mine < theirs) return propose(opponentId)
      if (phase === 'playing') {
        endAtRef.current = Date.now() + OVERTIME_SECONDS * 1000
        setPhase('overtime')
        setTimeLeft(OVERTIME_SECONDS)
      } else {
        propose('tie')
      }
    }
  }, [myHp, opponentHp, timeLeft, phase, over, opponentId, uid, propose])

  // ---- Opponent left (NEW): if they stay disconnected, I win by forfeit ----
  useEffect(() => {
    if (!opponentLeft || over || !opponentId) return
    const t = setTimeout(() => propose(uid), FORFEIT_AFTER_MS)
    return () => clearTimeout(t)
  }, [opponentLeft, over, opponentId, uid, propose])

  // ---- Warn before accidentally refreshing / closing the tab (NEW) ----
  useEffect(() => {
    if (over) return
    const warn = (e) => {
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [over])

  function handlePlay(card) {
    if (over || usedIds.includes(card.id)) return
    if (!spend(costOf(card))) return
    setUsedIds((u) => [...u, card.id])
    playCardInMatch(roomCode, uid, card).catch(console.error)
  }

  // CHANGED: the opponent's card URL is checked again before it is shown, in case
  // someone bypassed the pick screen and wrote a bad link straight to the database.
  function renderCard(card) {
    if (!isSafeUrl(card.url)) return <p>⚠️ Card blocked (untrusted link)</p>
    if (card.type === 'video') return <video src={card.url} autoPlay muted loop width="300" />
    if (card.type === 'audio') return <audio src={card.url} autoPlay controls />
    return <img src={card.url} alt={card.title} width="300" />
  }

  const minutes = Math.floor(timeLeft / 60)
  const seconds = String(timeLeft % 60).padStart(2, '0')

  return (
    <div style={{ padding: 16 }}>
      <h3>
        {phase === 'overtime' ? 'OVERTIME! ' : ''}Time: {minutes}:{seconds}
      </h3>

      {/* NEW warning banner */}
      {!over && !faceVisible && (
        <p style={{ color: '#f87171', fontWeight: 'bold' }}>
          ⚠️ We can't see your face! Your composure is draining.
        </p>
      )}
      {!over && opponentLeft && (
        <p style={{ color: '#facc15' }}>Opponent disconnected... you win if they don't return.</p>
      )}

      <HpBar label="You" hp={myHp} />
      <HpBar label="Opponent" hp={opponentHp} />
      <p>Your laugh meter: {Math.round(laughScore)}</p>

      {over && (
        <h1>
          {outcome === 'win' ? '🏆 YOU WIN!' : outcome === 'lose' ? '💀 YOU LOSE' : '🤝 TIE'}
        </h1>
      )}

      {shownCard && (
        <div style={{ border: '3px solid red', padding: 8, margin: '12px 0' }}>
          <p>Opponent played: {shownCard.title}. Don't laugh!</p>
          {renderCard(shownCard)}
        </div>
      )}

      <p>Elixir: {Math.floor(elixir)} / 10 | Cards left: {deckCards.length - usedIds.length}</p>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {deckCards.map((card) => {
          const used = usedIds.includes(card.id)
          return (
            <button
              key={card.id}
              onClick={() => handlePlay(card)}
              disabled={over || used || elixir < costOf(card)}
              style={{ opacity: used ? 0.3 : 1, textDecoration: used ? 'line-through' : 'none' }}
            >
              {card.title} ({card.type}, cost {costOf(card)})
            </button>
          )
        })}
      </div>
    </div>
  )
}
