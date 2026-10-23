const COSTS = { meme: 2, gif: 2, photo: 2, audio: 3, video: 4 }

export function costOf(card) {
  return COSTS[card.type] ?? 2
}

export function typeFromUrl(url) {
  const clean = url.split('?')[0].toLowerCase()
  if (/\.(jpg|jpeg|png|gif|webp)$/.test(clean)) return 'photo'
  if (/\.(mp3|wav|ogg|m4a)$/.test(clean)) return 'audio'
  if (/\.(mp4|webm|mov)$/.test(clean)) return 'video'
  return null
}