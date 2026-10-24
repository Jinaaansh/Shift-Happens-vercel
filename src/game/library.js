const photo = (id, title) => ({
  id,
  title,
  type: 'photo',
  url: `https://placehold.co/300x200?text=${encodeURIComponent(title)}`,
  uploadedBy: 'library',
})

// NEW: placeholder GIFs. Replace the url with a real GIF link (giphy / tenor / imgur)
// whenever you have one.
const gif = (id, title) => ({
  id,
  title,
  type: 'gif',
  url: `https://placehold.co/300x200.gif?text=${encodeURIComponent(title)}`,
  uploadedBy: 'library',
})

// NEW: shield cards. effect: 'block' = cancels the attack, 'halve' = half damage.
const shield = (id, title, effect) => ({
  id,
  title,
  type: 'shield',
  effect,
  uploadedBy: 'library',
})

export const LIBRARY = [
  photo('p1', 'Awkward Cat'),
  photo('p2', 'Surprised Dog'),
  photo('p3', 'Dad Joke'),
  photo('p4', 'Wrong Answer'),
  photo('p5', 'Monday Mood'),
  photo('p6', 'Silent Scream'),
  gif('g1', 'Funny Face'),
  gif('g2', 'Epic Fail'),
  gif('g3', 'Bad Pun'),
  gif('g4', 'Cringe Moment'),
  {
    id: 'a1',
    title: 'T-Rex Roar',
    type: 'audio',
    url: 'https://interactive-examples.mdn.mozilla.net/media/cc0-audio/t-rex-roar.mp3',
    uploadedBy: 'library',
  },
  {
    id: 'v1',
    title: 'Flower Video',
    type: 'video',
    url: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
    uploadedBy: 'library',
  },
  shield('s1', 'Sunglasses', 'block'),
  shield('s2', 'Umbrella', 'halve'),
]
