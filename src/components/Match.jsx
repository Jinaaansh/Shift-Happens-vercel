import { useEffect, useRef, useState } from 'react'
import { createDeckState, playCard } from '../game/deck'
import { useElixir } from '../game/useElixir'
import { subscribeToMatch, playCardInMatch, awardPoint } from '../game/matchService'

export default function Match({ roomCode, uid, deckCards, isSmiling }) {
  const [match, setMatch] = useState(null)
  const [deck, setDeck] = useState(() => createDeckState(deckCards))
  const [shownCard, setShownCard] = useState(null)
  const { elixir, spend } = useElixir()

  const smilingRef = useRef(isSmiling)
  smilingRef.current = isSmiling
  const scoredPlays = useRef(new Set())

  useEffect(() => {
    return subscribeToMatch(roomCode, setMatch)
  }, [roomCode])

  const lastPlay = match?.lastPlay
  const opponentId = match?.playerIds?.find((id) => id !== uid)

  useEffect(() => {
    if (!lastPlay || lastPlay.playedBy === uid) return
    setShownCard(lastPlay.card)
    const playId = lastPlay.playId
    const poll = setInterval(() => {
      if (smilingRef.current && !scoredPlays.current.has(playId)) {
        scoredPlays.current.add(playId)
        awardPoint(roomCode, lastPlay.playedBy)
      }
    }, 200)
    const hide = setTimeout(() => {
      clearInterval(poll)
      setShownCard(null)
    }, 5000)
    return () => {
      clearInterval(poll)
      clearTimeout(hide)
    }
  }, [lastPlay?.playId])

  function handlePlay(card) {
    if (!spend(card.cost ?? 2)) return
    setDeck(playCard(deck, card.id))
    playCardInMatch(roomCode, uid, card)
  }

  function renderCard(card) {
    if (card.type === 'video') return <video src={card.url} autoPlay muted loop width="300" />
    if (card.type === 'audio') return <audio src={card.url} autoPlay controls />
    return <img src={card.url} alt={card.title} width="300" />
  }

  const myScore = match?.scores?.[uid] ?? 0
  const theirScore = opponentId ? match?.scores?.[opponentId] ?? 0 : 0

  return (
    <div style={{ padding: 16 }}>
      <h2>You {myScore} : {theirScore} Opponent</h2>

      {shownCard && (
        <div style={{ border: '3px solid red', padding: 8, margin: '12px 0' }}>
          <p>Opponent played: {shownCard.title}. Don't smile!</p>
          {renderCard(shownCard)}
        </div>
      )}

      <p>Elixir: {Math.floor(elixir)} / 10</p>

      <div style={{ display: 'flex', gap: 8 }}>
        {deck.hand.map((card) => (
          <button
            key={card.id}
            onClick={() => handlePlay(card)}
            disabled={elixir < (card.cost ?? 2)}
          >
            {card.title} ({card.cost ?? 2})
          </button>
        ))}
      </div>

      <p>Next: {deck.next?.title}</p>
    </div>
  )
}