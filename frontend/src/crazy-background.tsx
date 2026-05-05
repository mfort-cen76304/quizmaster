import { useEffect, useRef } from 'react'

// ─── angel + heart types ─────────────────────────────────────────────────────

type Heart = {
    x: number
    y: number
    vx: number
    vy: number
    size: number
    opacity: number
    hue: number
    color?: string
}

type Angel = {
    x: number
    y: number
    vx: number
    vy: number
    flip: boolean
    wingAngle: number
    /** frame counter */
    t: number
    hearts: Heart[]
    shootCooldown: number
}

type Satan = {
    x: number
    y: number
    vx: number
    vy: number
    flip: boolean
    wingAngle: number
    tailAngle: number
    t: number
    hearts: Heart[]
    shootCooldown: number
}

type SplatParticle = {
    x: number
    y: number
    vx: number
    vy: number
    size: number
    opacity: number
    color: string
}

type FireParticle = {
    x: number
    y: number
    vx: number
    vy: number
    size: number
    opacity: number
    color: string
}

function makeAngel(_w: number, h: number): Angel {
    return {
        x: -60,
        y: Math.random() * h * 0.7 + 40,
        vx: 1.2 + Math.random() * 1.4,
        vy: (Math.random() - 0.5) * 0.6,
        flip: false,
        wingAngle: 0,
        t: 0,
        hearts: [],
        shootCooldown: Math.floor(Math.random() * 90),
    }
}

function hitTest(heart: Heart, x: number, y: number, radius: number) {
    const dx = heart.x - x
    const dy = heart.y + heart.size * 0.7 - y
    return dx * dx + dy * dy < radius * radius
}

function makeAngelSplat(x: number, y: number): SplatParticle[] {
    const colors = ['#7f1d1d', '#991b1b', '#b91c1c', '#dc2626', '#450a0a', '#ffe8c8']

    return Array.from({ length: 46 }, () => {
        const angle = Math.random() * Math.PI * 2
        const speed = 1.6 + Math.random() * 6.4

        return {
            x,
            y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            size: 2.5 + Math.random() * 5.5,
            opacity: 1,
            color: colors[Math.floor(Math.random() * colors.length)],
        }
    })
}

function makeHellfire(x: number, y: number): FireParticle[] {
    const colors = ['#fff7ad', '#facc15', '#fb923c', '#f97316', '#dc2626', '#7f1d1d', '#111827']

    return Array.from({ length: 70 }, () => {
        const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.25
        const speed = 1.5 + Math.random() * 6.5
        const smoke = Math.random() < 0.18

        return {
            x: x + (Math.random() - 0.5) * 18,
            y: y + (Math.random() - 0.5) * 18,
            vx: Math.cos(angle) * speed * (smoke ? 0.45 : 1),
            vy: Math.sin(angle) * speed - (smoke ? 0.6 : 0),
            size: smoke ? 8 + Math.random() * 12 : 3 + Math.random() * 8,
            opacity: smoke ? 0.62 : 1,
            color: colors[Math.floor(Math.random() * colors.length)],
        }
    })
}

function makeSatan(w: number, h: number): Satan {
    return {
        x: w + 70,
        y: Math.random() * h * 0.78 + 30,
        vx: -(1.45 + Math.random() * 1.7),
        vy: (Math.random() - 0.5) * 0.7,
        flip: true,
        wingAngle: Math.random() * Math.PI * 2,
        tailAngle: Math.random() * Math.PI * 2,
        t: 0,
        hearts: [],
        shootCooldown: 20 + Math.floor(Math.random() * 90),
    }
}

// ─── draw helpers ────────────────────────────────────────────────────────────

function drawHeart(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, alpha: number, hue: number) {
    ctx.save()
    ctx.globalAlpha = alpha
    ctx.fillStyle = `hsl(${hue}, 100%, 57%)`
    ctx.beginPath()
    ctx.moveTo(x, y + size * 0.3)
    ctx.bezierCurveTo(x, y, x - size, y, x - size, y + size * 0.4)
    ctx.bezierCurveTo(x - size, y + size * 0.9, x, y + size * 1.3, x, y + size * 1.5)
    ctx.bezierCurveTo(x, y + size * 1.3, x + size, y + size * 0.9, x + size, y + size * 0.4)
    ctx.bezierCurveTo(x + size, y, x, y, x, y + size * 0.3)
    ctx.fill()
    ctx.restore()
}

function drawColoredHeart(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    size: number,
    alpha: number,
    hue: number,
    color?: string,
) {
    if (!color) {
        drawHeart(ctx, x, y, size, alpha, hue)
        return
    }

    ctx.save()
    ctx.globalAlpha = alpha
    ctx.fillStyle = color
    ctx.strokeStyle = 'rgba(255, 45, 149, 0.55)'
    ctx.lineWidth = Math.max(1, size * 0.14)
    ctx.beginPath()
    ctx.moveTo(x, y + size * 0.3)
    ctx.bezierCurveTo(x, y, x - size, y, x - size, y + size * 0.4)
    ctx.bezierCurveTo(x - size, y + size * 0.9, x, y + size * 1.3, x, y + size * 1.5)
    ctx.bezierCurveTo(x, y + size * 1.3, x + size, y + size * 0.9, x + size, y + size * 0.4)
    ctx.bezierCurveTo(x + size, y, x, y, x, y + size * 0.3)
    ctx.fill()
    ctx.stroke()
    ctx.restore()
}

function drawAngel(ctx: CanvasRenderingContext2D, angel: Angel) {
    const { x, y, flip, wingAngle } = angel
    ctx.save()
    ctx.translate(x, y)
    if (flip) ctx.scale(-1, 1)

    // wings
    const wFlap = Math.sin(wingAngle) * 22
    ctx.globalAlpha = 0.88
    ctx.fillStyle = 'rgba(255,255,255,0.82)'
    ctx.strokeStyle = 'rgba(200,160,255,0.9)'
    ctx.lineWidth = 1.2

    // left wing
    ctx.beginPath()
    ctx.ellipse(-20, -4, 18, 9 + wFlap * 0.35, -0.4 + Math.sin(wingAngle) * 0.2, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()

    // right wing (back)
    ctx.beginPath()
    ctx.ellipse(-14, -2, 14, 7 + wFlap * 0.25, -0.2 + Math.sin(wingAngle + 0.4) * 0.15, 0, Math.PI * 2)
    ctx.globalAlpha = 0.52
    ctx.fill()
    ctx.stroke()

    // body
    ctx.globalAlpha = 0.95
    ctx.fillStyle = '#ffe8c8'
    ctx.beginPath()
    ctx.ellipse(0, 6, 8, 11, 0, 0, Math.PI * 2)
    ctx.fill()

    // head
    ctx.beginPath()
    ctx.arc(0, -8, 9, 0, Math.PI * 2)
    ctx.fillStyle = '#ffd7a3'
    ctx.fill()

    // halo
    ctx.strokeStyle = '#ffe04d'
    ctx.lineWidth = 2
    ctx.globalAlpha = 0.8
    ctx.beginPath()
    ctx.ellipse(0, -18, 9, 3.5, 0, 0, Math.PI * 2)
    ctx.stroke()

    // eyes
    ctx.fillStyle = '#2d1a4f'
    ctx.globalAlpha = 1
    ctx.beginPath()
    ctx.arc(-3, -9, 1.5, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.arc(3, -9, 1.5, 0, Math.PI * 2)
    ctx.fill()

    // smirk
    ctx.strokeStyle = '#c0806a'
    ctx.lineWidth = 1.2
    ctx.beginPath()
    ctx.arc(1, -5, 3.5, 0.3, Math.PI - 0.3)
    ctx.stroke()

    // gun (tiny rifle)
    ctx.globalAlpha = 0.9
    ctx.strokeStyle = '#555'
    ctx.lineWidth = 2.5
    ctx.beginPath()
    ctx.moveTo(5, 0)
    ctx.lineTo(28, -2)
    ctx.stroke()
    // barrel end
    ctx.strokeStyle = '#333'
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.moveTo(28, -2)
    ctx.lineTo(33, -2)
    ctx.stroke()
    // trigger
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.moveTo(16, 0)
    ctx.lineTo(16, 5)
    ctx.stroke()

    ctx.restore()
}

function drawSatan(ctx: CanvasRenderingContext2D, satan: Satan, scale = 1, opacity = 1) {
    const { x, y, flip, wingAngle, tailAngle } = satan
    ctx.save()
    ctx.translate(x, y)
    if (flip) ctx.scale(-1, 1)
    ctx.scale(scale, scale)

    const wingPulse = Math.sin(wingAngle)

    // bat wings
    ctx.globalAlpha = 0.86 * opacity
    ctx.fillStyle = '#1a0b1f'
    ctx.strokeStyle = '#ff2d55'
    ctx.lineWidth = 1.4

    ctx.beginPath()
    ctx.moveTo(-7, 0)
    ctx.lineTo(-34, -14 - wingPulse * 5)
    ctx.lineTo(-25, 7 + wingPulse * 3)
    ctx.lineTo(-15, 1)
    ctx.closePath()
    ctx.fill()
    ctx.stroke()

    ctx.beginPath()
    ctx.moveTo(7, 0)
    ctx.lineTo(34, -14 - wingPulse * 5)
    ctx.lineTo(25, 7 + wingPulse * 3)
    ctx.lineTo(15, 1)
    ctx.closePath()
    ctx.fill()
    ctx.stroke()

    // tail
    ctx.globalAlpha = 0.9 * opacity
    ctx.strokeStyle = '#7f1d1d'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(-2, 12)
    ctx.quadraticCurveTo(-20, 20 + Math.sin(tailAngle) * 6, -26, 4 + Math.cos(tailAngle) * 4)
    ctx.stroke()
    ctx.fillStyle = '#ef4444'
    ctx.beginPath()
    ctx.moveTo(-29, 0)
    ctx.lineTo(-20, 4)
    ctx.lineTo(-29, 9)
    ctx.closePath()
    ctx.fill()

    // body
    ctx.globalAlpha = 0.96 * opacity
    ctx.fillStyle = '#b91c1c'
    ctx.beginPath()
    ctx.ellipse(0, 7, 9, 12, 0, 0, Math.PI * 2)
    ctx.fill()

    // head
    ctx.fillStyle = '#dc2626'
    ctx.beginPath()
    ctx.arc(0, -8, 9, 0, Math.PI * 2)
    ctx.fill()

    // horns
    ctx.fillStyle = '#111827'
    ctx.beginPath()
    ctx.moveTo(-6, -15)
    ctx.lineTo(-12, -27)
    ctx.lineTo(-1, -18)
    ctx.closePath()
    ctx.fill()
    ctx.beginPath()
    ctx.moveTo(6, -15)
    ctx.lineTo(12, -27)
    ctx.lineTo(1, -18)
    ctx.closePath()
    ctx.fill()

    // eyes
    ctx.fillStyle = '#facc15'
    ctx.beginPath()
    ctx.arc(-3.5, -9, 1.8, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.arc(3.5, -9, 1.8, 0, Math.PI * 2)
    ctx.fill()

    // tiny cannon
    ctx.globalAlpha = 0.94 * opacity
    ctx.strokeStyle = '#050505'
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.moveTo(5, 0)
    ctx.lineTo(29, -1)
    ctx.stroke()
    ctx.strokeStyle = '#7f1d1d'
    ctx.lineWidth = 1.6
    ctx.beginPath()
    ctx.moveTo(29, -1)
    ctx.lineTo(36, -1)
    ctx.stroke()

    ctx.restore()
}

// ─── main component ──────────────────────────────────────────────────────────

export function CrazyBackground() {
    const canvasRef = useRef<HTMLCanvasElement>(null)

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')
        if (!ctx) return

        let raf: number
        let w = 0
        let h = 0
        const angels: Angel[] = []
        const satans: Satan[] = []
        const splats: SplatParticle[] = []
        const hellfires: FireParticle[] = []

        function resize() {
            w = canvas!.width = window.innerWidth
            h = canvas!.height = window.innerHeight
        }
        resize()
        window.addEventListener('resize', resize)

        // seed angels
        for (let i = 0; i < 15; i++) angels.push(makeAngel(w, h))
        for (let i = 0; i < 7; i++) satans.push(makeSatan(w, h))

        function tick() {
            ctx!.clearRect(0, 0, w, h)
            ctx!.globalAlpha = 1

            // ── angels ────────────────────────────────────
            for (let i = angels.length - 1; i >= 0; i--) {
                const a = angels[i]
                a.t++
                a.wingAngle += 0.14
                a.x += a.vx
                a.y += a.vy + Math.sin(a.t * 0.03) * 0.55

                // spawn hearts
                a.shootCooldown--
                if (a.shootCooldown <= 0) {
                    a.shootCooldown = 55 + Math.floor(Math.random() * 60)
                    const dir = a.flip ? -1 : 1
                    a.hearts.push({
                        x: a.x + dir * 36,
                        y: a.y - 2,
                        vx: dir * (3.5 + Math.random() * 2.5),
                        vy: (Math.random() - 0.5) * 2,
                        size: 7 + Math.random() * 7,
                        opacity: 1,
                        hue: Math.random() * 60 + 330,
                    })
                }

                // update & draw hearts
                for (let j = a.hearts.length - 1; j >= 0; j--) {
                    const hrt = a.hearts[j]
                    hrt.x += hrt.vx
                    hrt.y += hrt.vy
                    hrt.vy += 0.04
                    hrt.opacity -= 0.008

                    const hitSatanIdx = satans.findIndex(s => hitTest(hrt, s.x, s.y, 30 + hrt.size))
                    if (hitSatanIdx !== -1) {
                        hellfires.push(...makeHellfire(satans[hitSatanIdx].x, satans[hitSatanIdx].y))
                        satans[hitSatanIdx] = makeSatan(w, h)
                        a.hearts.splice(j, 1)
                        continue
                    }

                    if (hrt.opacity <= 0) {
                        a.hearts.splice(j, 1)
                        continue
                    }
                    drawColoredHeart(ctx!, hrt.x, hrt.y, hrt.size, hrt.opacity, hrt.hue, hrt.color)
                }

                drawAngel(ctx!, a)

                // recycle when off-screen
                if (a.x < -100 || a.x > w + 100) {
                    angels[i] = makeAngel(w, h)
                }
            }

            // -- satans -------------------------------------------------
            for (let i = satans.length - 1; i >= 0; i--) {
                const s = satans[i]
                s.t++
                s.wingAngle += 0.18
                s.tailAngle += 0.12
                s.x += s.vx
                s.y += s.vy + Math.sin(s.t * 0.04) * 0.7

                s.shootCooldown--
                if (s.shootCooldown <= 0) {
                    s.shootCooldown = 38 + Math.floor(Math.random() * 50)
                    const dir = s.flip ? -1 : 1
                    s.hearts.push({
                        x: s.x + dir * 38,
                        y: s.y - 3,
                        vx: dir * (4.4 + Math.random() * 2.8),
                        vy: (Math.random() - 0.5) * 2.4,
                        size: 6 + Math.random() * 6,
                        opacity: 0.95,
                        hue: 0,
                        color: '#050505',
                    })
                }

                for (let j = s.hearts.length - 1; j >= 0; j--) {
                    const hrt = s.hearts[j]
                    hrt.x += hrt.vx
                    hrt.y += hrt.vy
                    hrt.vy += 0.025
                    hrt.opacity -= 0.01

                    const hitAngelIdx = angels.findIndex(a => hitTest(hrt, a.x, a.y, 26 + hrt.size))
                    if (hitAngelIdx !== -1) {
                        splats.push(...makeAngelSplat(angels[hitAngelIdx].x, angels[hitAngelIdx].y))
                        angels[hitAngelIdx] = makeAngel(w, h)
                        s.hearts.splice(j, 1)
                        continue
                    }

                    if (hrt.opacity <= 0) {
                        s.hearts.splice(j, 1)
                        continue
                    }
                    drawColoredHeart(ctx!, hrt.x, hrt.y, hrt.size, hrt.opacity, hrt.hue, hrt.color)
                }

                drawSatan(ctx!, s)

                if (s.x < -120 || s.x > w + 120) {
                    satans[i] = makeSatan(w, h)
                }
            }

            for (let i = splats.length - 1; i >= 0; i--) {
                const p = splats[i]
                p.x += p.vx
                p.y += p.vy
                p.vy += 0.05
                p.opacity -= 0.018
                p.size *= 0.985
                if (p.opacity <= 0) {
                    splats.splice(i, 1)
                    continue
                }

                ctx!.save()
                ctx!.globalAlpha = p.opacity
                ctx!.fillStyle = p.color
                ctx!.beginPath()
                ctx!.arc(p.x, p.y, p.size, 0, Math.PI * 2)
                ctx!.fill()
                ctx!.restore()
            }

            for (let i = hellfires.length - 1; i >= 0; i--) {
                const fire = hellfires[i]
                fire.x += fire.vx
                fire.y += fire.vy
                fire.vx *= 0.97
                fire.vy -= 0.04
                fire.size *= 1.015
                fire.opacity -= 0.016

                if (fire.opacity <= 0) {
                    hellfires.splice(i, 1)
                    continue
                }

                ctx!.save()
                ctx!.globalAlpha = fire.opacity
                ctx!.fillStyle = fire.color
                ctx!.shadowColor = fire.color === '#111827' ? '#111827' : '#fb923c'
                ctx!.shadowBlur = fire.color === '#111827' ? 2 : 14
                ctx!.beginPath()
                ctx!.ellipse(fire.x, fire.y, fire.size * 0.75, fire.size * 1.2, 0, 0, Math.PI * 2)
                ctx!.fill()
                ctx!.restore()
            }

            raf = requestAnimationFrame(tick)
        }

        raf = requestAnimationFrame(tick)

        return () => {
            cancelAnimationFrame(raf)
            window.removeEventListener('resize', resize)
        }
    }, [])

    return (
        <canvas
            ref={canvasRef}
            style={{
                position: 'fixed',
                inset: 0,
                width: '100%',
                height: '100%',
                pointerEvents: 'none',
                zIndex: 0,
            }}
        />
    )
}
