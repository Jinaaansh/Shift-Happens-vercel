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

// --- NEW: only allow links from sites we trust ---
// A host matches if it is exactly the entry, or a sub-domain of it
// (so "giphy.com" also allows "media.giphy.com").
const TRUSTED_HOSTS = [
  'placehold.co',
  'imgur.com',
  'giphy.com',
  'tenor.com',
  'wikimedia.org',
  'redd.it',
  'githubusercontent.com',
  'firebasestorage.googleapis.com',
  'interactive-examples.mdn.mozilla.net',
]

export function isSafeUrl(url) {
  try {
    const u = new URL(url)
    if (u.protocol !== 'https:') return false
    if (u.username || u.password) return false
    const host = u.hostname.toLowerCase()
    return TRUSTED_HOSTS.some((h) => host === h || host.endsWith('.' + h))
  } catch {
    return false
  }
}
