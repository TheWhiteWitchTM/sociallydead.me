'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { Button } from "@/components/ui/button"

const COLS = 40
const ROWS = 25

function generateMap(level) {
  const map = Array.from({ length: ROWS }, () => Array(COLS).fill('#'))

  const rooms = []

  const numRooms = 5 + Math.floor(level / 5) + Math.floor(Math.random() * 4)
  for (let i = 0; i < numRooms; i++) {
    const w = 6 + Math.floor(level / 8) + Math.floor(Math.random() * 10)
    const h = 4 + Math.floor(level / 8) + Math.floor(Math.random() * 8)
    const x = 2 + Math.floor(Math.random() * (COLS - w - 4))
    const y = 2 + Math.floor(Math.random() * (ROWS - h - 4))

    for (let dy = 0; dy < h; dy++) {
      for (let dx = 0; dx < w; dx++) {
        map[y + dy][x + dx] = '.'
      }
    }

    rooms.push({ centerX: x + Math.floor(w / 2), centerY: y + Math.floor(h / 2) })
  }

  for (let i = 1; i < rooms.length; i++) {
    const p = rooms[i - 1]
    const c = rooms[i]
    const px = p.centerX, py = p.centerY
    const cx = c.centerX, cy = c.centerY

    const twistCount = Math.floor(level / 10) + Math.floor(Math.random() * 2)

    let currentX = px
    let currentY = py

    for (let t = 0; t < twistCount + 1; t++) {
      const midX = currentX + Math.floor((cx - currentX) / (twistCount + 1 - t)) + Math.floor(Math.random() * 3) - 1
      const midY = currentY + Math.floor((cy - currentY) / (twistCount + 1 - t)) + Math.floor(Math.random() * 3) - 1

      for (let xx = Math.min(currentX, midX); xx <= Math.max(currentX, midX); xx++) {
        map[currentY][xx] = '.'
      }

      for (let yy = Math.min(currentY, midY); yy <= Math.max(currentY, midY); yy++) {
        map[yy][midX] = '.'
      }

      currentX = midX
      currentY = midY
    }

    for (let xx = Math.min(currentX, cx); xx <= Math.max(currentX, cx); xx++) {
      map[currentY][xx] = '.'
    }

    for (let yy = Math.min(currentY, cy); yy <= Math.max(currentY, cy); yy++) {
      map[yy][cx] = '.'
    }
  }

  const wallDensity = 0.1 + (level / 26) * 0.2
  for (let y = 1; y < ROWS - 1; y++) {
    for (let x = 1; x < COLS - 1; x++) {
      if (map[y][x] === '.' && Math.random() < wallDensity) {
        map[y][x] = '#'
      }
    }
  }

  const visited = Array.from({ length: ROWS }, () => Array(COLS).fill(false))
  floodFill(map, visited, rooms[0].centerX, rooms[0].centerY)

  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      if (map[y][x] === '.' && !visited[y][x]) {
        let connected = false
        for (let dy of [-1, 0, 1]) {
          for (let dx of [-1, 0, 1]) {
            const ny = y + dy
            const nx = x + dx
            if (ny >= 0 && ny < ROWS && nx >= 0 && nx < COLS && visited[ny][nx]) {
              map[y][x] = '.'
              connected = true
              break
            }
          }
          if (connected) break
        }
      }
    }
  }

  return map
}

function floodFill(map, visited, x, y) {
  const stack = [[x, y]]
  while (stack.length > 0) {
    const [cx, cy] = stack.pop()
    if (cx < 0 || cx >= COLS || cy < 0 || cy >= ROWS || visited[cy][cx] || map[cy][cx] !== '.') continue

    visited[cy][cx] = true

    stack.push([cx + 1, cy])
    stack.push([cx - 1, cy])
    stack.push([cx, cy + 1])
    stack.push([cx, cy - 1])
  }
}

export default function Rogue() {
  const [level, setLevel] = useState(1)
  const [map, setMap] = useState(generateMap(1))
  const [player, setPlayer] = useState({ x: 20, y: 12, hp: 25, gold: 0 })
  const [golds, setGolds] = useState([])
  const [monsters, setMonsters] = useState([])
  const [gameOver, setGameOver] = useState(false)
  const [victory, setVictory] = useState(false)
  const [levelCleared, setLevelCleared] = useState(false)
  const [playerHit, setPlayerHit] = useState(false)
  const [showLevelCleared, setShowLevelCleared] = useState(false)

  const audioCtx = useRef(null)

  useEffect(() => {
    audioCtx.current = new (window.AudioContext || window.webkitAudioContext)()
  }, [])

  const playSound = (frequency, duration = 0.1, type = 'sine', volume = 0.5) => {
    if (!audioCtx.current) return
    const osc = audioCtx.current.createOscillator()
    const gain = audioCtx.current.createGain()
    osc.connect(gain)
    gain.connect(audioCtx.current.destination)
    osc.frequency.value = frequency
    osc.type = type
    gain.gain.setValueAtTime(volume, audioCtx.current.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.current.currentTime + duration)
    osc.start()
    osc.stop(audioCtx.current.currentTime + duration)
  }

  const coinSound = () => playSound(1200, 0.08, 'triangle', 0.6)
  const hitSound = () => playSound(150, 0.15, 'sawtooth', 0.7)
  const stepSound = () => playSound(400, 0.05, 'square', 0.3)

  const resetLevel = useCallback(() => {
    const newMap = generateMap(level)
    setMap(newMap)

    let px = Math.floor(COLS / 2)
    let py = Math.floor(ROWS / 2)
    let attempts = 0
    while (newMap[py][px] !== '.' && attempts < 500) {
      px = 2 + Math.floor(Math.random() * (COLS - 4))
      py = 2 + Math.floor(Math.random() * (ROWS - 4))
      attempts++
    }

    if (newMap[py][px] !== '.') {
      for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
          if (newMap[y][x] === '.') {
            px = x
            py = y
            break
          }
        }
        if (newMap[py][px] === '.') break
      }
    }

    setPlayer({
      x: px,
      y: py,
      hp: Math.min(25 + level * 5, 100),
      gold: 0
    })

    const goldCount = 6 + level * 2
    const monsterCount = 3 + Math.floor(level * 1.3)

    const newGolds = []
    const newMonsters = []

    for (let i = 0; i < goldCount; i++) {
      let x, y, attempts = 0
      do {
        x = 2 + Math.floor(Math.random() * (COLS - 4))
        y = 2 + Math.floor(Math.random() * (ROWS - 4))
        attempts++
      } while (
        newMap[y][x] !== '.' ||
        newGolds.some(g => g.x === x && g.y === y) ||
        (x === px && y === py) ||
        attempts > 500
        )
      if (newMap[y][x] === '.') newGolds.push({ x, y })
    }

    for (let i = 0; i < monsterCount; i++) {
      let x, y, attempts = 0
      do {
        x = 2 + Math.floor(Math.random() * (COLS - 4))
        y = 2 + Math.floor(Math.random() * (ROWS - 4))
        attempts++
      } while (
        newMap[y][x] !== '.' ||
        newGolds.some(g => g.x === x && g.y === y) ||
        newMonsters.some(m => m.x === x && m.y === y) ||
        (x === px && y === py) ||
        attempts > 500
        )
      if (newMap[y][x] === '.') newMonsters.push({ x, y })
    }

    setGolds(newGolds)
    setMonsters(newMonsters)
    setGameOver(false)
    setVictory(false)
    setLevelCleared(false)
    setPlayerHit(false)
    setShowLevelCleared(false)
  }, [level])

  useEffect(() => {
    resetLevel()
  }, [resetLevel])

  const move = useCallback((dx, dy) => {
    if (gameOver || victory || levelCleared) return

    const nx = player.x + dx
    const ny = player.y + dy

    if (nx < 0 || nx >= COLS || ny < 0 || ny >= ROWS || map[ny][nx] === '#') return

    stepSound()

    const hitMonster = monsters.some(m => m.x === nx && m.y === ny)
    if (hitMonster) {
      setPlayer(p => ({ ...p, hp: Math.max(0, p.hp - (5 + Math.floor(level / 3))) }))
      setPlayerHit(true)
      hitSound()
      setTimeout(() => setPlayerHit(false), 1500)
      return
    }

    const goldIdx = golds.findIndex(g => g.x === nx && g.y === ny)
    if (goldIdx !== -1) {
      setGolds(prev => prev.filter((_, i) => i !== goldIdx))
      setPlayer(p => ({ ...p, gold: p.gold + 1 }))
      coinSound()
    }

    setPlayer(p => ({ ...p, x: nx, y: ny }))

    setMonsters(prev => prev.map(m => {
      if (Math.random() > 0.65 + level * 0.008) return m

      const dirs = [[0,-1],[0,1],[-1,0],[1,0]]
      const [ddx, ddy] = dirs[Math.floor(Math.random() * 4)]
      const mx = m.x + ddx
      const my = m.y + ddy

      if (mx < 0 || mx >= COLS || my < 0 || my >= ROWS || map[my][mx] === '#') return m
      if (prev.some(o => o !== m && o.x === mx && o.y === my)) return m

      if (mx === nx && my === ny) {
        setPlayer(p => ({ ...p, hp: Math.max(0, p.hp - (4 + Math.floor(level / 4))) }))
        setPlayerHit(true)
        hitSound()
        setTimeout(() => setPlayerHit(false), 1500)
        return m
      }

      return { x: mx, y: my }
    }))
  }, [player, map, golds, monsters, gameOver, victory, levelCleared, level])

  useEffect(() => {
    const handler = e => {
      switch (e.key.toLowerCase()) {
        case 'arrowup': case 'w': case 'k': move(0, -1); break
        case 'arrowdown': case 's': case 'j': move(0, 1); break
        case 'arrowleft': case 'a': case 'h': move(-1, 0); break
        case 'arrowright': case 'd': case 'l': move(1, 0); break
        case 'r':
          if (gameOver || victory) resetLevel()
          break
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [move, resetLevel, gameOver, victory])

  useEffect(() => {
    if (player.hp <= 0 && !gameOver) setGameOver(true)
  }, [player.hp, gameOver])

  useEffect(() => {
    if (golds.length === 0 && !gameOver && !victory && !levelCleared) {
      setLevelCleared(true)
      setShowLevelCleared(true)
      setTimeout(() => {
        setShowLevelCleared(false)
        setLevelCleared(false)
        if (level < 26) {
          setLevel(l => l + 1)
          resetLevel()
        } else {
          setVictory(true)
        }
      }, 3000)
    }
  }, [golds.length, level, gameOver, victory, levelCleared, resetLevel])

  const display = map.map(row => row.slice())
  golds.forEach(g => { display[g.y][g.x] = '💰'})
  monsters.forEach(m => { display[m.y][m.x] = '👹'})
  display[player.y][player.x] = '🧙'

  const cells = []
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      const char = display[y][x]
      let textColor = 'text-gray-900'
      let bgColor = 'bg-black'
      let border = ''

      if (char === '#') {
        textColor = 'text-red-500'
        bgColor = 'bg-red-950'
      } else if (char === '.') {
        textColor = 'text-blue-500'
        bgColor = 'bg-blue-950'
      } else if (char === '💰') {
        textColor = 'text-amber-300'
        bgColor = 'bg-black'
        border = 'border-2 border-amber-400 rounded-sm'
      } else if (char === '👹') {
        textColor = 'text-rose-600'
        bgColor = 'bg-black'
        border = 'border-2 border-red-600 rounded-full'
      } else if (char === '🧙') {
        textColor = 'text-lime-400 font-bold text-4xl md:text-5xl lg:text-6xl'
        bgColor = 'bg-black'
        border = 'border-2 border-lime-500 rounded-full'
      }

      if (gameOver || victory) {
        textColor = char === '🧙' ? 'text-red-700' : 'text-gray-700 opacity-60'
        bgColor = 'bg-black'
        border = ''
      }

      cells.push(
        <div
          key={`${x}-${y}`}
          className={`
            flex items-center justify-center
            text-xl sm:text-2xl md:text-3xl lg:text-4xl
            leading-none select-none
            ${textColor} ${bgColor} ${border}
            ${char === '🧙' && playerHit ? 'animate-pulse' : ''}
          `}
        >
          {char === '#' ? '.' : char}
        </div>
      )
    }
  }

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col overflow-hidden">
      <div className="shrink-0 flex justify-between px-4 py-2 bg-gray-950 border-b border-stone-800 text-base md:text-lg font-mono">
        <div className={"text-lg pt-1"}>🧙‍♀️Witch!✨</div>
        <div>Level: {level}/26</div>
        <div>HP: {player.hp}</div>
        <div className={"pr-10"}>Gold: {player.gold}</div>
      </div>

      <div className="flex-1 grid grid-cols-40 grid-rows-25 gap-0 bg-black overflow-hidden">
        {cells}
      </div>

      {showLevelCleared && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[10000] pointer-events-none">
          <h1 className="text-5xl md:text-7xl font-bold text-emerald-400 animate-pulse">
            LEVEL CLEARED!
          </h1>
        </div>
      )}

      <div className="shrink-0 text-center text-sm text-stone-700 py-2 md:hidden">
        arrows / wasd / hjkl
      </div>

      {victory && (
        <div className="fixed inset-0 bg-black/90 flex flex-col items-center justify-center z-[10000]">
          <h1 className="text-6xl md:text-8xl font-bold text-emerald-400 mb-8 animate-pulse">
            VICTORY!
          </h1>
          <p className="text-3xl md:text-5xl text-amber-300 mb-10">
            You conquered all 26 levels!
          </p>
          <p className="text-2xl text-gray-400 mb-12">
            Total gold collected: {player.gold}
          </p>
          <Button
            variant="outline"
            size="lg"
            className="text-3xl px-16 py-8 border-emerald-500 text-emerald-400 hover:bg-emerald-950"
            onClick={() => {
              setLevel(1)
              resetLevel()
            }}
          >
            Play Again
          </Button>
        </div>
      )}

      {gameOver && (
        <div className="fixed inset-0 bg-black/90 flex flex-col items-center justify-center z-[10000]">
          <h1 className="text-7xl md:text-10xl font-bold text-red-600 mb-8 animate-pulse">
            YOU DIED
          </h1>
          <p className="text-3xl md:text-5xl text-gray-300 mb-6">
            Level reached: {level}
          </p>
          <p className="text-2xl text-amber-300 mb-12">
            Gold collected: {player.gold}
          </p>
          <Button
            variant="outline"
            size="lg"
            className="text-3xl px-16 py-8 border-red-600 text-red-400 hover:bg-red-950"
            onClick={() => {
              setLevel(1)
              resetLevel()
            }}
          >
            Play Again
          </Button>
        </div>
      )}
    </div>
  )
}