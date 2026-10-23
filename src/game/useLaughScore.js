import { useEffect, useRef, useState } from 'react'
import { LaughDetector } from '../laugh-detector.js'

export function useLaughScore(stream) {
  const [score, setScore] = useState(0)
  const [status, setStatus] = useState('idle')
  const detectorRef = useRef(null)

  useEffect(() => {
    if (!stream) return
    let cancelled = false
    const video = document.createElement('video')
    video.muted = true
    video.playsInline = true
    video.srcObject = stream
    video.style.cssText = 'position:fixed;width:1px;height:1px;opacity:0;pointer-events:none;'
    document.body.appendChild(video)
    video.play().catch(() => {})

    async function run() {
      try {
        setStatus('loading')
        await new Promise((res) => {
          if (video.readyState >= 2) res()
          else video.onloadeddata = res
        })
        const detector = new LaughDetector(video)
        await detector.init()
        if (cancelled) return
        setStatus('calibrating')
        await detector.calibrate()
        if (cancelled) return
        detector.onScore(setScore)
        detector.start()
        detectorRef.current = detector
        setStatus('ready')
      } catch (e) {
        console.error(e)
        setStatus('error')
      }
    }
    run()

    return () => {
      cancelled = true
      detectorRef.current?.stop()
      video.srcObject = null
      video.remove()
    }
  }, [stream])

  return { score, status }
}