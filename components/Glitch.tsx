'use client'

import { useEffect, useState } from 'react'

interface GlitchProps {
  children: string
  every?: number
}

export default function Glitch({ children, every = 5200 }: GlitchProps) {
  const [on, setOn] = useState(false)

  useEffect(() => {
    setOn(true)
    const t = setTimeout(() => setOn(false), 450)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    if (!every) return
    const i = setInterval(() => {
      setOn(true)
      setTimeout(() => setOn(false), 450)
    }, every)
    return () => clearInterval(i)
  }, [every])

  return (
    <span className={`glitch${on ? ' go' : ''}`} data-txt={children}>
      {children}
    </span>
  )
}
