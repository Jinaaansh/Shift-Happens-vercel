const photo = (id, title) => ({
  id,
  title,
  type: 'photo',
  url: `https://placehold.co/300x200?text=${encodeURIComponent(title)}`,
  uploadedBy: 'library',
})

export const LIBRARY = [
  photo('p1', 'Awkward Cat'),
  photo('p2', 'Surprised Dog'),
  photo('p3', 'Dad Joke'),
  photo('p4', 'Wrong Answer'),
  photo('p5', 'Monday Mood'),
  photo('p6', 'Silent Scream'),
  photo('p7', 'Funny Face'),
  photo('p8', 'Epic Fail'),
  photo('p9', 'Bad Pun'),
  photo('p10', 'Cringe Moment'),
  photo('p11', 'Plot Twist'),
  photo('p12', 'Trust Me'),
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
]