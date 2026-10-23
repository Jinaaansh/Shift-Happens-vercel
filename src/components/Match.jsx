import { useEffect, useRef, useState } from 'react'
import { useElixir } from '../game/useElixir'
import { subscribeToMatch, playCardInMatch } from '../game/matchService'
import { saveHp } from '../game/hpService'
import { MAX_HP, LAUGH_DEADZONE, DAMAGE_PER_SECOND } from '../game/constants'

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

export default function Match({ roomCode, uid, deckCards, laughScore }) {
  const [match, setMatch] = useState(null)
  const [usedIds, setUsedIds] = useState([])
  const [shownCard, setShownCard] = useState(null)
  const [myHp, setMyHp] = useState(MAX_HP)
  const { elixir, spend } = useElixir()

  const laughRef = useRef(laughScore)
  laughRef.current = laughScore
  const hpRef = useRef(MAX_HP)

  useEffect(() => {
    return subscribeToMatch(roomCode, setMatch)
  }, [roomCode])

  useEffect(() => {
    const tick = setInterval(() => {
      const score = laughRef.current
      if (score > LAUGH_DEADZONE && hpRef.current > 0) {
        const damage = (score / 100) * DAMAGE_PER_SECOND * 0.2
        hpRef.current = Math.max(0, hpRef.current - damage)
        setMyHp(hpRef.current)
      }
    }, 200)
    return () => clearInterval(tick)
  }, [])

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

  const lastPlay = match?.lastPlay
  const opponentId = match?.playerIds?.find((id) => id !== uid)
  const opponentHp = match?.hp?.[opponentId] ?? MAX_HP

  useEffect(() => {
    if (!lastPlay || lastPlay.playedBy === uid) return
    setShownCard(lastPlay.card)
    const hide = setTimeout(() => setShownCard(null), 5000)
    return () => clearTimeout(hide)
  }, [lastPlay?.playId])

  function handlePlay(card) {
    if (usedIds.includes(card.id)) return
    if (!spend(card.cost ?? 2)) return
    setUsedIds([...usedIds, card.id])
    playCardInMatch(roomCode, uid, card)
  }

  function renderCard(card) {
    if (card.type === 'video') return <video src={card.url} autoPlay muted loop width="300" />
    if (card.type === 'audio') return <audio src={card.url} autoPlay controls />
    return <img src={card.url} alt={card.title} width="300" />
  }

  return (
    <div style={{ padding: 16 }}>
      <HpBar label="You" hp={myHp} />
      <HpBar label="Opponent" hp={opponentHp} />
      <p>Your laugh meter: {Math.round(laughScore)}</p>

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
              disabled={used || elixir < (card.cost ?? 2)}
              style={{ opacity: used ? 0.3 : 1, textDecoration: used ? 'line-through' : 'none' }}
            >
              {card.title} ({card.cost ?? 2})
            </button>
          )
        })}
      </div>
    </div>
  )
}