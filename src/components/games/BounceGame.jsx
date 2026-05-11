import { useEffect, useRef, useState, useCallback } from 'react'
import './BounceGame.css'
import { SFX } from './sound.js'

// ── Constants ─────────────────────────────────────────────────────────────────
const GAME_WIDTH        = 500
const GAME_HEIGHT       = 600
const WALL_THICKNESS    = 16
const PLANK_HEIGHT      = 14
const PLANK_Y           = 520   // fixed plank Y (not tied to water)
const BALL_RADIUS       = 10
const PLANK_SPEED       = 14
const WATER_HEIGHT      = 60
const WATER_SURFACE     = GAME_HEIGHT - WATER_HEIGHT
const MAX_LIVES         = 3
const INITIAL_BALL_SPEED = 5
const LEVEL_SPEED_BONUS = 0.6
const PLANK_WIDTH       = 100   // base plank width (modified by power-ups)

// Brick grid dimensions
const BRICK_COLS    = 8
const BRICK_ROWS    = 5
const BRICK_GAP     = 4
const BRICK_TOP     = WALL_THICKNESS + 30
const BRICK_H       = 18
const BRICK_AREA_W  = GAME_WIDTH - WALL_THICKNESS * 2 - BRICK_GAP
const BRICK_W       = (BRICK_AREA_W - (BRICK_COLS - 1) * BRICK_GAP) / BRICK_COLS
const BRICK_START_X = WALL_THICKNESS + BRICK_GAP / 2

const ROW_COLORS   = ['#e63946', '#f4a261', '#e9c46a', '#2a9d8f', '#457b9d']
const ARMORED_COLOR = '#4a4e69'

// Brick types
const BT = {
  NORMAL:    'normal',
  ARMORED:   'armored',
  EXPLOSIVE: 'explosive',
  MOVING:    'moving',
  STEEL:     'steel',
  BONUS:     'bonus',
}

// Power-up types
const PT = {
  WIDE:   'WIDE',
  NARROW: 'NARROW',
  SLOW:   'SLOW',
  LIFE:   'LIFE',
  BOMB:   'BOMB',
  MAGNET: 'MAGNET',
  MULTI:  'MULTI',
}

const POWERUP_COLORS = {
  WIDE:   '#4cc9f0',
  NARROW: '#e63946',
  SLOW:   '#2a9d8f',
  LIFE:   '#f72585',
  BOMB:   '#f4a261',
  MAGNET: '#9d4edd',
  MULTI:  '#e9c46a',
}

const POWERUP_LABELS = {
  WIDE:   '+W',
  NARROW: '-W',
  SLOW:   'SLO',
  LIFE:   '♥',
  BOMB:   'BOM',
  MAGNET: 'MAG',
  MULTI:  '×3',
}

const POWERUP_DURATION = { WIDE: 10000, NARROW: 8000, SLOW: 6000 }

// ── Pure helpers (no hooks) ───────────────────────────────────────────────────

function ballSpeedForLevel(level) {
  return INITIAL_BALL_SPEED + (level - 1) * LEVEL_SPEED_BONUS
}

/** Return a ball velocity within [25°, 65°] from horizontal, random left/right. */
function safeBallAngle(speed) {
  const minRad = 25 * Math.PI / 180
  const maxRad = 65 * Math.PI / 180
  const angle  = minRad + Math.random() * (maxRad - minRad)
  const sign   = Math.random() > 0.5 ? 1 : -1
  return { vx: speed * Math.cos(angle) * sign, vy: -speed * Math.sin(angle) }
}

/** Prevent the ball from going nearly horizontal. Re-normalise to speed. */
function clampHoriz(vx, vy, speed) {
  const minHx = 0.28 * speed
  if (Math.abs(vx) < minHx) {
    vx = minHx * (vx >= 0 ? 1 : -1)
    const scale = speed / Math.sqrt(vx * vx + vy * vy)
    vx *= scale; vy *= scale
  }
  return { vx, vy }
}

/** Prevent the ball from going nearly vertical (too-horizontal zig-zag).
 *  Ensures |vy| >= MIN_VERT_FRAC * speed so the ball always has enough
 *  vertical movement to reach bricks/plank in reasonable time. */
function clampVert(vx, vy, speed) {
  const minVy = 0.28 * speed
  if (Math.abs(vy) < minVy) {
    vy = minVy * (vy >= 0 ? 1 : -1)
    const scale = speed / Math.sqrt(vx * vx + vy * vy)
    vx *= scale; vy *= scale
  }
  return { vx, vy }
}

/** Apply BOTH angle clamps: not too horizontal, not too vertical. */
function clampAngle(vx, vy, speed) {
  let c = clampHoriz(vx, vy, speed)
  c = clampVert(c.vx, c.vy, speed)
  return c
}

/** Return effective plank width given active power-ups map. */
function getPlankWidth(ap) {
  if (ap.WIDE   && ap.WIDE   > Date.now()) return PLANK_WIDTH * 1.5
  if (ap.NARROW && ap.NARROW > Date.now()) return PLANK_WIDTH * 0.6
  return PLANK_WIDTH
}

/** Build the brick grid for a given level. */
function buildBricks(level) {
  const bricks = []
  // Rows scale with level: 2 rows at L1, +1 per level, cap at BRICK_ROWS (5)
  const totalRows   = Math.min(2 + (level - 1), BRICK_ROWS)
  const armoredRows = Math.min(level - 1, totalRows)   // L1→0 armored, L2→1, etc.
  const normalRows  = totalRows - armoredRows

  for (let row = 0; row < totalRows; row++) {
    for (let col = 0; col < BRICK_COLS; col++) {
      let type = row >= normalRows ? BT.ARMORED : BT.NORMAL
      let hp   = type === BT.ARMORED ? 2 : 1
      const r  = Math.random()

      // Special brick overrides escalate with level
      if      (level >= 5 && row === 0 && r < 0.25)  { type = BT.STEEL;     hp = 999 }
      else if (level >= 4 && row <= 1  && r < 0.18)  { type = BT.MOVING;    hp = 1   }
      else if (level >= 3              && r < 0.09)  { type = BT.EXPLOSIVE; hp = 1   }
      else if (level >= 2              && r < 0.10)  { type = BT.BONUS;     hp = 1   }

      bricks.push({
        x:         BRICK_START_X + col * (BRICK_W + BRICK_GAP),
        y:         BRICK_TOP     + row * (BRICK_H + BRICK_GAP),
        w:         BRICK_W,
        h:         BRICK_H,
        hp,
        maxHp:     type === BT.STEEL ? 999 : hp,
        type,
        row,
        col,
        moveDir:   Math.random() > 0.5 ? 1 : -1,
        moveSpeed: 0.3 + Math.random() * 0.35,
      })
    }
  }
  return bricks
}

/** Spawn explosion particles centred on (x, y). */
function spawnParticles(particles, x, y, color, count = 8) {
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i / count) + Math.random() * 0.6
    const speed = 1.5 + Math.random() * 2.5
    particles.push({
      x, y,
      vx:    Math.cos(angle) * speed,
      vy:    Math.sin(angle) * speed - 0.8,
      life:  1.0,
      decay: 0.025 + Math.random() * 0.02,
      color,
      r:     2 + Math.random() * 3,
    })
  }
}

/** Maybe drop a power-up capsule from a destroyed brick. */
function maybeDropPowerup(powerups, brick, forced = false) {
  const roll = Math.random()
  const drop = forced || brick.type === BT.BONUS || roll < 0.18
  if (!drop) return
  const types = Object.values(PT)
  const type  = types[Math.floor(Math.random() * types.length)]
  powerups.push({
    x:    brick.x + brick.w / 2 - 18,
    y:    brick.y,
    vy:   1.2,
    type,
    w:    36,
    h:    18,
  })
}

/** Destroy all adjacent bricks when an EXPLOSIVE brick is hit. */
function triggerExplosion(bricks, sourceBrick, particles) {
  for (const b of bricks) {
    if (b === sourceBrick || b.hp <= 0 || b.type === BT.STEEL) continue
    if (Math.abs(b.col - sourceBrick.col) <= 1 && Math.abs(b.row - sourceBrick.row) <= 1) {
      b.hp = 0
      spawnParticles(particles, b.x + b.w / 2, b.y + b.h / 2, ROW_COLORS[b.row % ROW_COLORS.length], 5)
    }
  }
}

/** Destroy all bricks within radius 130 of the grid centre (BOMB power-up). */
function triggerBomb(bricks, particles) {
  const cx = GAME_WIDTH / 2
  const cy = BRICK_TOP + (BRICK_ROWS * (BRICK_H + BRICK_GAP)) / 2
  for (const b of bricks) {
    if (b.hp <= 0 || b.type === BT.STEEL) continue
    const bx = b.x + b.w / 2, by = b.y + b.h / 2
    if ((bx - cx) ** 2 + (by - cy) ** 2 < 130 ** 2) {
      b.hp = 0
      spawnParticles(particles, bx, by, ROW_COLORS[b.row % ROW_COLORS.length], 6)
    }
  }
}

// ── Leaderboard helpers ───────────────────────────────────────────────────────

function getLeaderboard() {
  try { return JSON.parse(localStorage.getItem('bounce_scores') || '[]') } catch { return [] }
}

function addToLeaderboard(initials, score, level) {
  const entry = { initials: initials.toUpperCase().slice(0, 3).padEnd(3, '_'), score, level }
  const lb    = [...getLeaderboard(), entry].sort((a, b) => b.score - a.score).slice(0, 5)
  localStorage.setItem('bounce_scores', JSON.stringify(lb))
  return lb
}

function isHighScore(score) {
  const lb = getLeaderboard()
  return lb.length < 5 || score > lb[lb.length - 1].score
}

// ── Game-state factory ────────────────────────────────────────────────────────

function initGameState(fromLevel = 1) {
  const speed      = ballSpeedForLevel(fromLevel)
  const { vx, vy } = safeBallAngle(speed)
  const ball = {
    x: GAME_WIDTH / 2, y: PLANK_Y - BALL_RADIUS - 20,
    vx, vy, speed, trail: [],
    magnetAttached: false, magnetAttachedAt: 0,
  }
  return {
    balls:          [ball],
    plank:          { x: (GAME_WIDTH - PLANK_WIDTH) / 2, y: PLANK_Y, vx: 0, prevX: (GAME_WIDTH - PLANK_WIDTH) / 2 },
    bricks:         buildBricks(fromLevel),
    particles:      [],
    powerups:       [],   // falling capsules
    activePowerups: {},   // { WIDE: endsAt, NARROW: endsAt, SLOW: endsAt, MAGNET: true }
    lives:          MAX_LIVES,
    level:          fromLevel,
    combo:          0,
    comboDisplays:  [],   // [{ x, y, text, createdAt }]
    brickScore:     0,    // total points from bricks broken (replaces time-based score)
    shake:          0,
    levelingUp:     false,
    levelUpStart:   0,
    resetting:      false,
    resetStart:     0,
    // Speed-up tracking
    rallyCount:         0,   // consecutive plank hits; every 5 → +10% speed
    brickStreakCount:   0,   // bricks broken since last missed plank; every 3 → +8%
    timePressureTick:  Date.now(), // last 30s tick for time-pressure bump
    flashMsg:          null,  // { text, color, createdAt } shown in HUD briefly
  }
}

/** Reset ball(s) after life loss; also clears power-ups and combo. */
function resetBall(state) {
  const speed      = ballSpeedForLevel(state.level)
  const { vx, vy } = safeBallAngle(speed)
  state.balls = [{
    x: GAME_WIDTH / 2, y: PLANK_Y - BALL_RADIUS - 20,
    vx, vy, speed, trail: [],
    magnetAttached: false, magnetAttachedAt: 0,
  }]
  state.plank.x       = (GAME_WIDTH - PLANK_WIDTH) / 2
  state.activePowerups = {}
  state.combo          = 0
  state.powerups       = []
  state.resetting      = true
  state.resetStart     = Date.now()
}

/** Apply the effect of a caught power-up capsule to the game state. */
function applyPowerup(type, state, setLives) {
  const ap  = state.activePowerups
  const now = Date.now()

  if (type === PT.WIDE)   { ap.WIDE   = now + POWERUP_DURATION.WIDE }
  if (type === PT.NARROW) { ap.NARROW = now + POWERUP_DURATION.NARROW }
  if (type === PT.SLOW)   {
    ap.SLOW = now + POWERUP_DURATION.SLOW
    const slowSpeed = ballSpeedForLevel(state.level) * 0.65
    state.balls.forEach(b => { b.speed = slowSpeed })
  }
  if (type === PT.LIFE)   {
    state.lives = Math.min(MAX_LIVES + 1, state.lives + 1)
    setLives(state.lives)
  }
  if (type === PT.BOMB)   { triggerBomb(state.bricks, state.particles); state.shake += 8 }
  if (type === PT.MAGNET) { ap.MAGNET = true }
  if (type === PT.MULTI)  {
    const speed = ballSpeedForLevel(state.level)
    for (let i = 0; i < 2; i++) {
      const { vx, vy } = safeBallAngle(speed)
      state.balls.push({
        x: state.plank.x + getPlankWidth(ap) / 2,
        y: PLANK_Y - BALL_RADIUS - 5,
        vx, vy, speed, trail: [],
        magnetAttached: false, magnetAttachedAt: 0,
      })
    }
  }
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function App() {
  const canvasRef    = useRef(null)
  const gameStateRef = useRef(null)
  const animFrameRef = useRef(null)
  const keysRef      = useRef({})

  const [score,               setScore]              = useState(0)
  const [gameStatus,          setGameStatus]          = useState('idle')
  const [finalScore,          setFinalScore]          = useState(0)
  const [lives,               setLives]               = useState(MAX_LIVES)
  const [level,               setLevel]               = useState(1)
  const [leaderboard,         setLeaderboard]         = useState(() => getLeaderboard())
  const [enteringInitials,    setEnteringInitials]    = useState(false)
  const [initials,            setInitials]            = useState('')
  const [anyMagnetAttached,   setAnyMagnetAttached]   = useState(false)
  const [activePowersDisplay, setActivePowersDisplay] = useState({})
  const [ballSpeed,           setBallSpeed]           = useState(INITIAL_BALL_SPEED)

  // ── Magnet release (Space or LAUNCH button) ────────────────────────────────
  const handleMagnetRelease = useCallback(() => {
    const state = gameStateRef.current
    if (!state) return
    let released = false
    state.balls.forEach(ball => {
      if (ball.magnetAttached) {
        const { vx, vy } = safeBallAngle(ball.speed)
        ball.vx = vx; ball.vy = vy
        ball.magnetAttached = false
        released = true
      }
    })
    if (released) {
      SFX.magnetRelease()
      setAnyMagnetAttached(false)
    }
  }, [])

  // ── Save initials after high score ────────────────────────────────────────
  const handleSaveInitials = useCallback(() => {
    if (!initials.length) return
    const lb = addToLeaderboard(initials, finalScore, level)
    setLeaderboard(lb)
    setEnteringInitials(false)
    setInitials('')
  }, [initials, finalScore, level])

  // ── Start / restart game ──────────────────────────────────────────────────
  const startGame = useCallback(() => {
    gameStateRef.current = initGameState(1)
    setScore(0)
    setLives(MAX_LIVES)
    setLevel(1)
    setAnyMagnetAttached(false)
    setActivePowersDisplay({})
    setEnteringInitials(false)
    setInitials('')
    setGameStatus('playing')
  }, [])

  // ── Global key handlers ───────────────────────────────────────────────────
  useEffect(() => {
    const down = (e) => {
      keysRef.current[e.key] = true
      if (['ArrowLeft', 'ArrowRight', ' '].includes(e.key)) e.preventDefault()
      // Space → release any magnetAttached balls
      if (e.key === ' ') {
        const state = gameStateRef.current
        if (!state) return
        let released = false
        state.balls.forEach(ball => {
          if (ball.magnetAttached) {
            const { vx, vy } = safeBallAngle(ball.speed)
            ball.vx = vx; ball.vy = vy
            ball.magnetAttached = false
            released = true
          }
        })
        if (released) { SFX.magnetRelease(); setAnyMagnetAttached(false) }
      }
    }
    const up = (e) => { keysRef.current[e.key] = false }
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up) }
  }, [])

  // ── Enter key confirms initials submission ────────────────────────────────
  useEffect(() => {
    if (!enteringInitials) return
    const handler = (e) => {
      if (e.key === 'Enter' && initials.length > 0) handleSaveInitials()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [enteringInitials, initials, handleSaveInitials])

  // ── Main game loop ────────────────────────────────────────────────────────
  useEffect(() => {
    if (gameStatus !== 'playing') {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
      return
    }

    const canvas = canvasRef.current
    const ctx    = canvas.getContext('2d')

    const loop = () => {
      const state = gameStateRef.current
      if (!state) return
      const now = Date.now()

      // ── 1. Level-up pause (2.2 s) ──────────────────────────────────────────
      if (state.levelingUp) {
        drawScene(ctx, state, now)
        drawLevelBanner(ctx, state.level + 1)
        if (now - state.levelUpStart >= 2200) {
          state.levelingUp = false
          state.level     += 1
          state.bricks     = buildBricks(state.level)
          setLevel(state.level)
          resetBall(state)   // sets resetting = true → 1.2 s pause next
          SFX.levelUp()
        }
        animFrameRef.current = requestAnimationFrame(loop)
        return
      }

      // ── 2. Ball-reset pause (1.2 s) ────────────────────────────────────────
      if (state.resetting) {
        drawScene(ctx, state, now)
        drawResetOverlay(ctx, state.lives)
        if (now - state.resetStart >= 1200) state.resetting = false
        animFrameRef.current = requestAnimationFrame(loop)
        return
      }

      // ── 3. Move MOVING bricks ──────────────────────────────────────────────
      for (const brick of state.bricks) {
        if (brick.hp <= 0 || brick.type !== BT.MOVING) continue
        brick.x += brick.moveDir * brick.moveSpeed
        if (brick.x <= WALL_THICKNESS || brick.x + brick.w >= GAME_WIDTH - WALL_THICKNESS)
          brick.moveDir *= -1
      }

      // ── 4. Move plank ──────────────────────────────────────────────────────
      const effectivePW   = getPlankWidth(state.activePowerups)
      state.plank.prevX   = state.plank.x
      if (keysRef.current['ArrowLeft'])
        state.plank.x = Math.max(WALL_THICKNESS, state.plank.x - PLANK_SPEED)
      if (keysRef.current['ArrowRight'])
        state.plank.x = Math.min(GAME_WIDTH - WALL_THICKNESS - effectivePW, state.plank.x + PLANK_SPEED)
      state.plank.vx = state.plank.x - state.plank.prevX

      // ── 5. Process each ball ───────────────────────────────────────────────
      for (const ball of state.balls) {
        const pw = getPlankWidth(state.activePowerups)

        // 5a. Magnet hold — follow plank until released or auto-timeout
        if (ball.magnetAttached) {
          ball.x = state.plank.x + pw / 2
          ball.y = PLANK_Y - BALL_RADIUS - 1
          ball.trail.push({ x: ball.x, y: ball.y })
          if (ball.trail.length > 12) ball.trail.shift()
          // Auto-release after 3 s
          if (now - ball.magnetAttachedAt > 3000) {
            const { vx, vy } = safeBallAngle(ball.speed)
            ball.vx = vx; ball.vy = vy
            ball.magnetAttached = false
            SFX.magnetRelease()
          }
          continue
        }

        // 5b. Move ball
        ball.x += ball.vx
        ball.y += ball.vy

        // 5c. Trail
        ball.trail.push({ x: ball.x, y: ball.y })
        if (ball.trail.length > 12) ball.trail.shift()

        // 5d. Wall bounces (no speed increase, just reflect + clamp)
        if (ball.x - BALL_RADIUS <= WALL_THICKNESS) {
          ball.x  = WALL_THICKNESS + BALL_RADIUS
          ball.vx = Math.abs(ball.vx)
          const c = clampAngle(ball.vx, ball.vy, ball.speed)
          ball.vx = c.vx; ball.vy = c.vy
          SFX.wallBounce(); state.shake += 1
        }
        if (ball.x + BALL_RADIUS >= GAME_WIDTH - WALL_THICKNESS) {
          ball.x  = GAME_WIDTH - WALL_THICKNESS - BALL_RADIUS
          ball.vx = -Math.abs(ball.vx)
          const c = clampAngle(ball.vx, ball.vy, ball.speed)
          ball.vx = c.vx; ball.vy = c.vy
          SFX.wallBounce(); state.shake += 1
        }
        if (ball.y - BALL_RADIUS <= WALL_THICKNESS) {
          ball.y  = WALL_THICKNESS + BALL_RADIUS
          ball.vy = Math.abs(ball.vy)
          const c = clampAngle(ball.vx, ball.vy, ball.speed)
          ball.vx = c.vx; ball.vy = c.vy
          SFX.wallBounce(); state.shake += 1
        }

        // 5e. Brick collision (AABB + radius, one brick per ball per frame)
        for (const brick of state.bricks) {
          if (brick.hp <= 0) continue
          const nearX = Math.max(brick.x, Math.min(ball.x, brick.x + brick.w))
          const nearY = Math.max(brick.y, Math.min(ball.y, brick.y + brick.h))
          const dx = ball.x - nearX, dy = ball.y - nearY
          if (dx * dx + dy * dy >= BALL_RADIUS * BALL_RADIUS) continue

          // Determine bounce axis
          const oL = ball.x - (brick.x - BALL_RADIUS)
          const oR = (brick.x + brick.w + BALL_RADIUS) - ball.x
          const oT = ball.y - (brick.y - BALL_RADIUS)
          const oB = (brick.y + brick.h + BALL_RADIUS) - ball.y
          const minO = Math.min(oL, oR, oT, oB)
          if (minO === oT || minO === oB) ball.vy = -ball.vy
          else ball.vx = -ball.vx

          if (brick.type === BT.STEEL) {
            // Steel bricks are indestructible — only bounce
            SFX.armoredHit()
          } else {
            brick.hp -= 1
            state.combo++
            // Score: base points × combo multiplier. Armored=2pts, Bonus=5pts, others=1pt
            const basePoints = brick.type === BT.BONUS ? 5 : brick.type === BT.ARMORED ? 2 : 1
            state.brickScore += basePoints * state.combo
            state.brickStreakCount++

            // Brick streak speed-up: every 3 bricks broken → +8% speed
            if (state.brickStreakCount > 0 && state.brickStreakCount % 3 === 0) {
              state.balls.forEach(b => { b.speed = Math.min(b.speed * 1.08, ballSpeedForLevel(state.level) * 2.5) })
              SFX.wallBounce()
              state.flashMsg = { text: 'STREAK! +8%', color: '#e9c46a', createdAt: now }
            }

            spawnParticles(
              state.particles,
              brick.x + brick.w / 2, brick.y + brick.h / 2,
              getBrickBaseColor(brick), 6
            )

            if (brick.hp <= 0) {
              maybeDropPowerup(state.powerups, brick)
              if (brick.type === BT.EXPLOSIVE) {
                triggerExplosion(state.bricks, brick, state.particles)
                SFX.explosion()
                state.shake += 4
              }
              SFX.brickBreak()
            } else {
              SFX.armoredHit()
            }

            // Floating combo text when combo > 1
            if (state.combo > 1) {
              state.comboDisplays.push({
                x:         brick.x + brick.w / 2,
                y:         brick.y,
                text:      `×${state.combo}`,
                createdAt: now,
              })
              SFX.combo(Math.min(state.combo, 10))
            }
          }
          break // one brick per ball per frame
        }

        // 5f. Plank collision
        const plank = state.plank
        const hitX  = ball.x >= plank.x - 2 && ball.x <= plank.x + pw + 2
        const hitY  = ball.y + BALL_RADIUS >= plank.y && ball.y + BALL_RADIUS <= plank.y + PLANK_HEIGHT + 4
        if (hitX && hitY && ball.vy > 0) {
          ball.y = plank.y - BALL_RADIUS
          if (state.activePowerups.MAGNET) {
            // Attach ball to plank
            ball.magnetAttached  = true
            ball.magnetAttachedAt = now
            delete state.activePowerups.MAGNET
            SFX.magnet()
          } else {
            const influence = plank.vx * 0.6
            let newVx = ball.vx + influence
            let newVy = -Math.abs(ball.vy)
            const mag = Math.sqrt(newVx * newVx + newVy * newVy)
            newVx = (newVx / mag) * ball.speed
            newVy = (newVy / mag) * ball.speed
            const c = clampAngle(newVx, newVy, ball.speed)
            ball.vx = c.vx; ball.vy = c.vy
          }
          state.combo = 0   // combo resets on plank hit
          // Rally bonus: every 5 consecutive plank hits → +10% speed
          state.rallyCount++
          if (state.rallyCount % 5 === 0) {
            state.balls.forEach(b => { b.speed = Math.min(b.speed * 1.1, ballSpeedForLevel(state.level) * 2.5) })
            SFX.combo(state.rallyCount / 5)
            state.flashMsg = { text: `RALLY ×${state.rallyCount / 5}! +10%`, color: '#4cc9f0', createdAt: now }
          }
          SFX.plankHit()
          state.shake += 2
        }
      } // end ball loop

      // ── 6. Water check — remove balls that fell in ─────────────────────────
      state.balls = state.balls.filter(ball => {
        if (ball.y + BALL_RADIUS >= WATER_SURFACE) {
          SFX.ballLost()
          return false
        }
        return true
      })

      if (state.balls.length === 0) {
        const newLives = state.lives - 1
        state.lives    = newLives
        setLives(newLives)
        if (newLives <= 0) {
          const fs = state.brickScore
          setFinalScore(fs)
          setGameStatus('gameover')
          if (isHighScore(fs)) setEnteringInitials(true)
          else setLeaderboard(getLeaderboard())
          return
        }
        resetBall(state)
        // Reset speed-up streaks on life loss
        state.rallyCount       = 0
        state.brickStreakCount = 0
        state.timePressureTick = Date.now()
      }

      // ── 7. Update particles ────────────────────────────────────────────────
      for (const p of state.particles) {
        p.x  += p.vx; p.y += p.vy
        p.vy += 0.08  // gravity
        p.life -= p.decay
      }
      state.particles = state.particles.filter(p => p.life > 0)

      // ── 8. Update falling power-up capsules ───────────────────────────────
      const pw2 = getPlankWidth(state.activePowerups)
      state.powerups = state.powerups.filter(pu => {
        pu.y += pu.vy
        // Check if plank catches it
        if (
          pu.y + pu.h >= state.plank.y &&
          pu.y        <= state.plank.y + PLANK_HEIGHT &&
          pu.x + pu.w >= state.plank.x &&
          pu.x        <= state.plank.x + pw2
        ) {
          applyPowerup(pu.type, state, setLives)
          SFX.powerUp()
          if (pu.type === PT.BOMB) SFX.explosion()
          return false
        }
        return pu.y < GAME_HEIGHT
      })

      // ── 9. Expire timed power-ups ─────────────────────────────────────────
      const ap = state.activePowerups
      if (ap.WIDE   && ap.WIDE   < now) delete ap.WIDE
      if (ap.NARROW && ap.NARROW < now) delete ap.NARROW
      if (ap.SLOW   && ap.SLOW   < now) {
        // Restore ball speed to current level speed
        state.balls.forEach(b => {
          if (b.speed < ballSpeedForLevel(state.level)) b.speed = ballSpeedForLevel(state.level)
        })
        delete ap.SLOW
      }

      // ── 10. Expire combo display texts (>1.2 s old) ───────────────────────
      state.comboDisplays = state.comboDisplays.filter(d => now - d.createdAt < 1200)

      // ── 11. Decay screen shake ─────────────────────────────────────────────
      state.shake *= 0.78

      // ── 11b. Time pressure: every 30s alive → +5% speed ───────────────────
      if (now - state.timePressureTick >= 30000) {
        state.timePressureTick = now
        state.balls.forEach(b => { b.speed = Math.min(b.speed * 1.05, ballSpeedForLevel(state.level) * 2.5) })
        state.flashMsg = { text: 'TIME PRESSURE +5%', color: '#f4a261', createdAt: now }
        state.shake += 3
      }
      // Expire flash message after 1.5s
      if (state.flashMsg && now - state.flashMsg.createdAt > 1500) state.flashMsg = null

      // ── 12. Level clear check (catches BOMB wiping last brick) ─────────────
      if (!state.levelingUp && state.bricks.every(b => b.type === BT.STEEL || b.hp <= 0)) {
        state.levelingUp  = true
        state.levelUpStart = now
        SFX.levelUp()
      }

      // ── 13. Update React state for HUD ────────────────────────────────────
      setScore(state.brickScore)
      setAnyMagnetAttached(state.balls.some(b => b.magnetAttached))
      setActivePowersDisplay({ ...state.activePowerups })
      // Show the fastest ball's current speed (updates when rally/streak/time-pressure fire)
      const maxSpeed = state.balls.reduce((m, b) => Math.max(m, b.speed), 0)
      setBallSpeed(maxSpeed)

      // ── 14. Draw ──────────────────────────────────────────────────────────
      drawScene(ctx, state, now)
      animFrameRef.current = requestAnimationFrame(loop)
    }

    animFrameRef.current = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(animFrameRef.current)
  }, [gameStatus]) // stable setters don't need to be in deps

  // ── Idle / game-over background animation ─────────────────────────────────
  useEffect(() => {
    if (gameStatus === 'playing') return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx       = canvas.getContext('2d')
    const idleBricks = buildBricks(1)
    let rafId

    const anim = () => {
      const t = Date.now() / 1000
      ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT)
      ctx.fillStyle = '#0f0c29'
      ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT)
      drawWaterSection(ctx, WATER_SURFACE, WATER_HEIGHT, t)
      drawWalls(ctx, WATER_SURFACE)
      drawBricks(ctx, idleBricks)
      rafId = requestAnimationFrame(anim)
    }
    rafId = requestAnimationFrame(anim)
    return () => cancelAnimationFrame(rafId)
  }, [gameStatus])

  // ── JSX ───────────────────────────────────────────────────────────────────
  return (
    <div className="game-container">
      {/* HUD bar */}
      <div className="hud">
        <div className="hud-item lives-display">
          {Array.from({ length: Math.max(MAX_LIVES, lives) }).map((_, i) => (
            <span key={i} className={`heart ${i < lives ? 'heart-full' : 'heart-empty'}`}>♥</span>
          ))}
        </div>

        <div className="hud-item">
          <span className="hud-label">LVL</span>
          <span className="hud-value level-val">{level}</span>
        </div>

        <div className="hud-item">
          <span className="hud-label">SCORE</span>
          <span className="hud-value">{score}</span>
        </div>

        <div className="hud-item">
          <span className="hud-label">SPD</span>
          <span className="hud-value level-val">{ballSpeed.toFixed(1)}</span>
        </div>

        {/* Active power-up badges */}
        <div className="active-powerups">
          {Object.entries(activePowersDisplay).map(([type, val]) => {
            if (!val) return null
            if (typeof val === 'number' && val < Date.now()) return null
            return (
              <span
                key={type}
                className="powerup-badge"
                style={{ background: POWERUP_COLORS[type] }}
              >
                {POWERUP_LABELS[type]}
              </span>
            )
          })}
        </div>
      </div>

      {/* Canvas + overlays */}
      <div className="canvas-wrapper">
        <canvas ref={canvasRef} width={GAME_WIDTH} height={GAME_HEIGHT} />

        {/* ── Idle overlay ── */}
        {gameStatus === 'idle' && (
          <div className="overlay">
            <h1 className="game-title">BOUNCE</h1>
            <p className="game-subtitle">Break bricks. Survive.</p>
            <ul className="instructions">
              <li>← → Arrow keys to move the plank</li>
              <li>Moving plank curves the ball</li>
              <li>Catch power-ups with your plank</li>
              <li>Break all bricks to reach the next level</li>
              <li>Ball speeds up every level — you have {MAX_LIVES} lives</li>
            </ul>
            <button className="btn-start" onClick={startGame}>START GAME</button>
            <p className="controls-hint">← → move • SPACE release magnet</p>
          </div>
        )}

        {/* ── Game-over overlay ── */}
        {gameStatus === 'gameover' && (
          <div className="overlay">
            <h2 className="gameover-title">GAME OVER</h2>
            <p className="final-score">Score: <span>{finalScore}</span></p>
            <p className="final-level">Reached <span className="level-span">Level {level}</span></p>

            {enteringInitials ? (
              <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                <p style={{ color: '#f72585', fontWeight: 700, fontSize: 15, letterSpacing: 1 }}>
                  🏆 New High Score! Enter initials:
                </p>
                <input
                  maxLength={3}
                  value={initials}
                  onChange={e => setInitials(e.target.value.toUpperCase())}
                  className="initials-input"
                  autoFocus
                  placeholder="AAA"
                />
                <button
                  className="btn-start"
                  onClick={handleSaveInitials}
                  disabled={initials.length === 0}
                  style={{ padding: '10px 32px', fontSize: 14 }}
                >
                  SAVE
                </button>
              </div>
            ) : (
              <button className="btn-start" onClick={startGame}>PLAY AGAIN</button>
            )}

            {/* Leaderboard always shown */}
            {leaderboard.length > 0 && (
              <div style={{ marginTop: 8 }}>
                <p style={{ fontSize: 11, letterSpacing: 2, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', textAlign: 'center', marginBottom: 4 }}>
                  High Scores
                </p>
                <table className="leaderboard">
                  <thead>
                    <tr>
                      <th>#</th><th>NAME</th><th>SCORE</th><th>LVL</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaderboard.map((entry, i) => (
                      <tr key={i} className={entry.score === finalScore && !enteringInitials ? 'highlight' : ''}>
                        <td>{i + 1}</td>
                        <td>{entry.initials}</td>
                        <td>{entry.score}</td>
                        <td>{entry.level}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Touch / mouse controls */}
      <div className="touch-controls">
        <button
          className="touch-btn"
          onTouchStart={() => keysRef.current['ArrowLeft'] = true}
          onTouchEnd={()   => keysRef.current['ArrowLeft'] = false}
          onMouseDown={() => keysRef.current['ArrowLeft'] = true}
          onMouseUp={()   => keysRef.current['ArrowLeft'] = false}
          onMouseLeave={() => keysRef.current['ArrowLeft'] = false}
        >◀</button>

        {anyMagnetAttached && (
          <button className="touch-btn launch-btn" onClick={handleMagnetRelease}>
            LAUNCH
          </button>
        )}

        <button
          className="touch-btn"
          onTouchStart={() => keysRef.current['ArrowRight'] = true}
          onTouchEnd={()   => keysRef.current['ArrowRight'] = false}
          onMouseDown={() => keysRef.current['ArrowRight'] = true}
          onMouseUp={()   => keysRef.current['ArrowRight'] = false}
          onMouseLeave={() => keysRef.current['ArrowRight'] = false}
        >▶</button>
      </div>
    </div>
  )
}

// ── Drawing helpers (pure, outside component) ─────────────────────────────────

/** Return a base colour for a brick (used for particles + glow). */
function getBrickBaseColor(brick) {
  switch (brick.type) {
    case BT.STEEL:     return '#888888'
    case BT.EXPLOSIVE: return '#e85d04'
    case BT.MOVING:    return '#4cc9f0'
    case BT.BONUS:     return '#f9c74f'
    case BT.ARMORED:   return ARMORED_COLOR
    default:           return ROW_COLORS[brick.row % ROW_COLORS.length]
  }
}

/** Lighten a hex colour by `amt` points per channel. */
function lighten(hex, amt) {
  const n = parseInt(hex.replace('#', ''), 16)
  const r = Math.min(255, (n >> 16) + amt)
  const g = Math.min(255, ((n >> 8) & 0xff) + amt)
  const b = Math.min(255, (n & 0xff) + amt)
  return `rgb(${r},${g},${b})`
}

function drawWaterSection(ctx, waterSurface, waterHeight, t) {
  // Base gradient
  const grad = ctx.createLinearGradient(0, waterSurface, 0, GAME_HEIGHT)
  grad.addColorStop(0,    '#0096c7')
  grad.addColorStop(0.35, '#0077b6')
  grad.addColorStop(0.7,  '#023e8a')
  grad.addColorStop(1,    '#03045e')
  ctx.fillStyle = grad
  ctx.fillRect(0, waterSurface, GAME_WIDTH, waterHeight)

  // Animated wave layers
  const wave = (amp, period, speed, alpha, yOff) => {
    ctx.save()
    ctx.beginPath()
    const y0 = waterSurface + yOff
    ctx.moveTo(0, y0)
    for (let wx = 0; wx <= GAME_WIDTH; wx += 3) {
      ctx.lineTo(wx,
        y0
        + Math.sin(wx / period + t * speed) * amp
        + Math.sin(wx / (period * 0.6) - t * speed * 0.7) * (amp * 0.5)
      )
    }
    ctx.lineTo(GAME_WIDTH, GAME_HEIGHT)
    ctx.lineTo(0, GAME_HEIGHT)
    ctx.closePath()
    ctx.fillStyle = `rgba(0,180,255,${alpha})`
    ctx.fill()
    ctx.restore()
  }
  wave(5, 40, 2.2, 0.35, 0)
  wave(4, 28, 3.0, 0.25, 4)
  wave(3, 20, 1.6, 0.18, 8)

  // Highlight line at surface
  ctx.save()
  ctx.beginPath()
  ctx.moveTo(0, waterSurface)
  for (let wx = 0; wx <= GAME_WIDTH; wx += 3)
    ctx.lineTo(wx, waterSurface + Math.sin(wx / 40 + t * 2.2) * 5 + Math.sin(wx / 24 - t * 3) * 3)
  ctx.strokeStyle = 'rgba(150,230,255,0.55)'
  ctx.lineWidth = 2
  ctx.stroke()
  ctx.restore()

  // Floating bubbles
  ctx.save()
  for (let i = 0; i < 6; i++) {
    const fx = ((i * 83 + t * 30) % (GAME_WIDTH - 32)) + 16
    ctx.beginPath()
    ctx.arc(fx, waterSurface + Math.sin(fx / 25 + t * 2) * 4 + 6, 2.5, 0, Math.PI * 2)
    ctx.fillStyle = 'rgba(200,240,255,0.45)'
    ctx.fill()
  }
  ctx.restore()
}

function drawWalls(ctx, waterSurface) {
  ctx.fillStyle = '#1b1a3a'
  ctx.fillRect(0, 0, WALL_THICKNESS, waterSurface)
  ctx.fillRect(GAME_WIDTH - WALL_THICKNESS, 0, WALL_THICKNESS, waterSurface)
  ctx.fillRect(0, 0, GAME_WIDTH, WALL_THICKNESS)
  // Inner glow lines
  ctx.fillStyle = 'rgba(150,150,255,0.12)'
  ctx.fillRect(WALL_THICKNESS,              0,           2, waterSurface)
  ctx.fillRect(GAME_WIDTH - WALL_THICKNESS - 2, 0,       2, waterSurface)
  ctx.fillRect(0,                           WALL_THICKNESS, GAME_WIDTH, 2)
}

/** Draw the full brick grid, handling all brick types with distinct visuals. */
function drawBricks(ctx, bricks) {
  for (const brick of bricks) {
    if (brick.hp <= 0) continue
    ctx.save()

    switch (brick.type) {
      case BT.STEEL: {
        // Metallic grey — no glow
        ctx.shadowBlur = 0
        const g = ctx.createLinearGradient(brick.x, brick.y, brick.x, brick.y + brick.h)
        g.addColorStop(0, '#a0a0b0')
        g.addColorStop(0.5, '#606070')
        g.addColorStop(1, '#404050')
        ctx.fillStyle = g
        ctx.beginPath(); ctx.roundRect(brick.x, brick.y, brick.w, brick.h, 3); ctx.fill()
        // Metallic sheen
        ctx.strokeStyle = 'rgba(200,200,230,0.4)'; ctx.lineWidth = 1
        ctx.beginPath()
        ctx.moveTo(brick.x + 3, brick.y + 1)
        ctx.lineTo(brick.x + brick.w - 3, brick.y + 1)
        ctx.stroke()
        break
      }

      case BT.EXPLOSIVE: {
        ctx.shadowColor = '#ff6b35'; ctx.shadowBlur = 10
        const g = ctx.createLinearGradient(brick.x, brick.y, brick.x, brick.y + brick.h)
        g.addColorStop(0, '#ff9f1c'); g.addColorStop(1, '#e63946')
        ctx.fillStyle = g
        ctx.beginPath(); ctx.roundRect(brick.x, brick.y, brick.w, brick.h, 3); ctx.fill()
        // Burst star indicator
        const cx = brick.x + brick.w / 2, cy = brick.y + brick.h / 2
        ctx.strokeStyle = 'rgba(255,255,100,0.7)'; ctx.lineWidth = 1
        for (let a = 0; a < 4; a++) {
          const ang = (a * Math.PI / 4)
          ctx.beginPath()
          ctx.moveTo(cx, cy)
          ctx.lineTo(cx + Math.cos(ang) * 5, cy + Math.sin(ang) * 5)
          ctx.stroke()
        }
        break
      }

      case BT.MOVING: {
        ctx.shadowColor = '#4cc9f0'; ctx.shadowBlur = 8
        const g = ctx.createLinearGradient(brick.x, brick.y, brick.x, brick.y + brick.h)
        g.addColorStop(0, '#90e0ef'); g.addColorStop(1, '#0096c7')
        ctx.fillStyle = g
        ctx.beginPath(); ctx.roundRect(brick.x, brick.y, brick.w, brick.h, 3); ctx.fill()
        // Direction arrows
        ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.font = '8px Segoe UI'; ctx.textAlign = 'center'
        ctx.fillText('◀▶', brick.x + brick.w / 2, brick.y + brick.h - 3)
        break
      }

      case BT.BONUS: {
        ctx.shadowColor = '#f9c74f'; ctx.shadowBlur = 12
        const g = ctx.createLinearGradient(brick.x, brick.y, brick.x, brick.y + brick.h)
        g.addColorStop(0, '#ffe169'); g.addColorStop(1, '#f9844a')
        ctx.fillStyle = g
        ctx.beginPath(); ctx.roundRect(brick.x, brick.y, brick.w, brick.h, 3); ctx.fill()
        // Star highlight
        ctx.fillStyle = 'rgba(255,255,255,0.75)'; ctx.font = '9px Segoe UI'; ctx.textAlign = 'center'
        ctx.fillText('★', brick.x + brick.w / 2, brick.y + brick.h - 2)
        break
      }

      default: { // NORMAL and ARMORED
        const armored = brick.type === BT.ARMORED
        const cracked = armored && brick.hp === 1
        const base    = armored ? ARMORED_COLOR : ROW_COLORS[brick.row % ROW_COLORS.length]

        ctx.shadowColor = armored ? '#9a8c98' : ROW_COLORS[brick.row % ROW_COLORS.length]
        ctx.shadowBlur  = cracked ? 3 : 8

        const g = ctx.createLinearGradient(brick.x, brick.y, brick.x, brick.y + brick.h)
        g.addColorStop(0, cracked ? '#2e2e3a' : lighten(base, 22))
        g.addColorStop(1, cracked ? '#1a1a26' : base)
        ctx.fillStyle = g
        ctx.beginPath(); ctx.roundRect(brick.x, brick.y, brick.w, brick.h, 3); ctx.fill()

        if (cracked) {
          ctx.strokeStyle = 'rgba(255,200,100,0.6)'; ctx.lineWidth = 1.5
          const cx = brick.x + brick.w / 2, cy = brick.y + brick.h / 2
          ctx.beginPath()
          ctx.moveTo(cx - 4, cy - 6); ctx.lineTo(cx + 2, cy); ctx.lineTo(cx - 3, cy + 6)
          ctx.stroke()
        }
        ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.lineWidth = 1
        ctx.beginPath()
        ctx.moveTo(brick.x + 3, brick.y + 1)
        ctx.lineTo(brick.x + brick.w - 3, brick.y + 1)
        ctx.stroke()
      }
    }
    ctx.restore()
  }
}

/** Draw a ball with a fading comet trail. */
function drawBall(ctx, ball, level) {
  // Trail colour escalates with level
  const trailColor = level >= 6 ? '#ff4500' : level >= 4 ? '#ff9f1c' : '#7209b7'

  ball.trail.forEach((pt, i) => {
    const alpha = (i / ball.trail.length) * 0.5
    const r     = BALL_RADIUS * 0.55 * (i / ball.trail.length)
    ctx.save()
    ctx.globalAlpha = alpha
    ctx.beginPath()
    ctx.arc(pt.x, pt.y, Math.max(1, r), 0, Math.PI * 2)
    ctx.fillStyle = trailColor
    ctx.fill()
    ctx.restore()
  })

  // Ball body with radial gradient
  ctx.save()
  ctx.shadowColor = '#7209b7'; ctx.shadowBlur = 22
  const bg = ctx.createRadialGradient(ball.x - 3, ball.y - 3, 2, ball.x, ball.y, BALL_RADIUS)
  bg.addColorStop(0,   '#f8f0ff')
  bg.addColorStop(0.4, '#9d4edd')
  bg.addColorStop(1,   '#3a0ca3')
  ctx.fillStyle = bg
  ctx.beginPath()
  ctx.arc(ball.x, ball.y, BALL_RADIUS, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
}

/** Draw a falling power-up capsule. */
function drawPowerupCapsule(ctx, pu) {
  const color = POWERUP_COLORS[pu.type]
  ctx.save()
  ctx.shadowColor = color; ctx.shadowBlur = 10
  // Filled rounded rect
  ctx.fillStyle = color
  ctx.beginPath(); ctx.roundRect(pu.x, pu.y, pu.w, pu.h, 6); ctx.fill()
  // Label
  ctx.shadowBlur  = 0
  ctx.fillStyle   = '#000'
  ctx.font        = 'bold 9px Segoe UI'
  ctx.textAlign   = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(POWERUP_LABELS[pu.type], pu.x + pu.w / 2, pu.y + pu.h / 2)
  ctx.restore()
}

/** Draw time-remaining bars for timed power-ups (shown below plank). */
function drawActivePowerupBar(ctx, activePowerups, now) {
  const ap         = activePowerups
  const timedTypes = [PT.WIDE, PT.NARROW, PT.SLOW]
  const active     = timedTypes.filter(t => ap[t] && ap[t] > now)
  if (active.length === 0) return

  const iconW = 48, iconH = 9, gap = 5
  const totalW = active.length * iconW + (active.length - 1) * gap
  let sx = (GAME_WIDTH - totalW) / 2
  const y = PLANK_Y + PLANK_HEIGHT + 8

  for (const type of active) {
    const remaining = Math.max(0, (ap[type] - now) / POWERUP_DURATION[type])
    ctx.save()
    // Background track
    ctx.fillStyle = 'rgba(0,0,0,0.45)'
    ctx.beginPath(); ctx.roundRect(sx, y, iconW, iconH, 3); ctx.fill()
    // Progress bar
    ctx.fillStyle   = POWERUP_COLORS[type]
    ctx.shadowColor = POWERUP_COLORS[type]; ctx.shadowBlur = 5
    ctx.beginPath(); ctx.roundRect(sx, y, iconW * remaining, iconH, 3); ctx.fill()
    // Label
    ctx.shadowBlur = 0; ctx.fillStyle = '#fff'
    ctx.font = 'bold 7px Segoe UI'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
    ctx.fillText(POWERUP_LABELS[type], sx + iconW / 2, y + iconH / 2)
    ctx.restore()
    sx += iconW + gap
  }
}

/** Draw floating combo text that rises and fades. */
function drawComboDisplays(ctx, displays, now) {
  for (const d of displays) {
    const age   = now - d.createdAt
    const alpha = Math.max(0, 1 - age / 1200)
    const yOff  = age * 0.04
    ctx.save()
    ctx.globalAlpha = alpha
    ctx.font        = 'bold 20px Segoe UI'
    ctx.textAlign   = 'center'
    ctx.fillStyle   = '#ffe169'
    ctx.shadowColor = '#f9c74f'; ctx.shadowBlur = 8
    ctx.fillText(d.text, d.x, d.y - yOff)
    ctx.restore()
  }
}

/** Draw particles (colour preserved per particle). */
function drawParticles(ctx, particles) {
  for (const p of particles) {
    ctx.save()
    ctx.globalAlpha = Math.max(0, p.life)
    ctx.beginPath()
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
    ctx.fillStyle = p.color
    ctx.shadowColor = p.color; ctx.shadowBlur = 6
    ctx.fill()
    ctx.restore()
  }
}

/** Full scene render. Applies shake offset when state.shake > 0.1. */
function drawScene(ctx, state, now) {
  const t = now / 1000
  ctx.save()

  // Screen shake
  if (state.shake > 0.1) {
    ctx.translate(
      (Math.random() - 0.5) * state.shake * 2,
      (Math.random() - 0.5) * state.shake * 2
    )
  }

  // Background
  ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT)
  ctx.fillStyle = '#0f0c29'
  ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT)

  drawWaterSection(ctx, WATER_SURFACE, WATER_HEIGHT, t)
  drawWalls(ctx, WATER_SURFACE)
  drawBricks(ctx, state.bricks)
  drawParticles(ctx, state.particles)

  // Falling power-up capsules
  for (const pu of state.powerups) drawPowerupCapsule(ctx, pu)

  // Plank — colour reflects active power-up
  const ap  = state.activePowerups
  const pw  = getPlankWidth(ap)
  const plk = state.plank
  ctx.save()
  let pGradTop = '#ff4da6', pGradBot = '#b5179e', pGlow = '#f72585'
  if (ap.WIDE   && ap.WIDE   > now) { pGradTop = '#90e0ef'; pGradBot = '#0096c7'; pGlow = '#4cc9f0' }
  if (ap.NARROW && ap.NARROW > now) { pGradTop = '#ff6b6b'; pGradBot = '#e63946'; pGlow = '#e63946' }
  if (ap.MAGNET)                    { pGradTop = '#c77dff'; pGradBot = '#7209b7'; pGlow = '#9d4edd' }
  ctx.shadowColor = pGlow; ctx.shadowBlur = 14
  const pg = ctx.createLinearGradient(plk.x, plk.y, plk.x, plk.y + PLANK_HEIGHT)
  pg.addColorStop(0, pGradTop); pg.addColorStop(1, pGradBot)
  ctx.fillStyle = pg
  ctx.beginPath(); ctx.roundRect(plk.x, plk.y, pw, PLANK_HEIGHT, 6); ctx.fill()
  ctx.strokeStyle = 'rgba(255,150,220,0.5)'; ctx.lineWidth = 1; ctx.stroke()
  ctx.restore()

  // Active power-up time bars below plank
  drawActivePowerupBar(ctx, ap, now)

  // Balls with trails
  for (const ball of state.balls) drawBall(ctx, ball, state.level)

  // Floating combo text
  drawComboDisplays(ctx, state.comboDisplays, now)

  // Speed-up flash message (rally / streak / time pressure)
  if (state.flashMsg) {
    const age   = now - state.flashMsg.createdAt
    const alpha = Math.max(0, 1 - age / 1500)
    const yOff  = -age * 0.03
    ctx.save()
    ctx.globalAlpha = alpha
    ctx.font        = 'bold 18px "Segoe UI", sans-serif'
    ctx.textAlign   = 'center'
    ctx.shadowColor = state.flashMsg.color
    ctx.shadowBlur  = 12
    ctx.fillStyle   = state.flashMsg.color
    ctx.fillText(state.flashMsg.text, GAME_WIDTH / 2, GAME_HEIGHT / 2 - 60 + yOff)
    ctx.restore()
  }

  ctx.restore()
}

/** Full-screen level-up banner. */
function drawLevelBanner(ctx, nextLevel) {
  ctx.save()
  ctx.fillStyle = 'rgba(8,6,24,0.78)'
  ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT)

  const cx = GAME_WIDTH / 2, cy = GAME_HEIGHT / 2
  const rg = ctx.createRadialGradient(cx, cy, 10, cx, cy, 160)
  rg.addColorStop(0, 'rgba(114,9,183,0.35)')
  rg.addColorStop(1, 'rgba(114,9,183,0)')
  ctx.fillStyle = rg; ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT)

  ctx.textAlign  = 'center'
  ctx.shadowColor = '#7209b7'; ctx.shadowBlur = 30
  ctx.font       = 'bold 56px Segoe UI'
  ctx.fillStyle  = '#f8f0ff'
  ctx.fillText(`LEVEL ${nextLevel}`, cx, cy - 10)

  ctx.shadowBlur = 0
  ctx.font       = '18px Segoe UI'
  ctx.fillStyle  = 'rgba(255,255,255,0.55)'
  ctx.fillText('All bricks cleared! Get ready…', cx, cy + 28)

  ctx.font      = 'bold 14px Segoe UI'
  ctx.fillStyle = '#f8961e'
  ctx.fillText(`Ball speed: ${ballSpeedForLevel(nextLevel).toFixed(1)}`, cx, cy + 56)

  // Hint new brick types introduced at this level
  const hints = []
  if (nextLevel === 2) hints.push('BONUS bricks drop power-ups!')
  if (nextLevel === 3) hints.push('EXPLOSIVE bricks chain-destroy neighbours!')
  if (nextLevel === 4) hints.push('MOVING bricks slide sideways!')
  if (nextLevel === 5) hints.push('STEEL bricks are indestructible!')
  if (hints.length) {
    ctx.font = '12px Segoe UI'; ctx.fillStyle = '#4cc9f0'
    ctx.fillText(hints[0], cx, cy + 78)
  }
  ctx.restore()
}

/** Small "X lives remaining" text overlay during ball reset. */
function drawResetOverlay(ctx, livesLeft) {
  ctx.save()
  ctx.textAlign  = 'center'
  ctx.font       = 'bold 22px Segoe UI'
  ctx.fillStyle  = 'rgba(247,37,133,0.85)'
  ctx.shadowColor = '#f72585'; ctx.shadowBlur = 12
  ctx.fillText(
    `${livesLeft} ${livesLeft === 1 ? 'life' : 'lives'} remaining`,
    GAME_WIDTH / 2, WATER_SURFACE - 20
  )
  ctx.restore()
}
