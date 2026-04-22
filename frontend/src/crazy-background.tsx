import { useEffect, useRef } from 'react'

// ─── helpers ────────────────────────────────────────────────────────────────

type Vec3 = [number, number, number]

function rotateX(v: Vec3, a: number): Vec3 {
    const [x, y, z] = v
    return [x, y * Math.cos(a) - z * Math.sin(a), y * Math.sin(a) + z * Math.cos(a)]
}
function rotateY(v: Vec3, a: number): Vec3 {
    const [x, y, z] = v
    return [x * Math.cos(a) + z * Math.sin(a), y, -x * Math.sin(a) + z * Math.cos(a)]
}
function rotateZ(v: Vec3, a: number): Vec3 {
    const [x, y, z] = v
    return [x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a), z]
}
function project(v: Vec3, fov: number, cx: number, cy: number): [number, number] {
    const z = v[2] + fov
    const scale = fov / Math.max(z, 0.1)
    return [cx + v[0] * scale, cy + v[1] * scale]
}

// ─── cube geometry ───────────────────────────────────────────────────────────

const CUBE_VERTS: Vec3[] = [
    [-1, -1, -1],
    [1, -1, -1],
    [1, 1, -1],
    [-1, 1, -1],
    [-1, -1, 1],
    [1, -1, 1],
    [1, 1, 1],
    [-1, 1, 1],
]
const CUBE_FACES: number[][] = [
    [0, 1, 2, 3],
    [4, 5, 6, 7],
    [0, 1, 5, 4],
    [2, 3, 7, 6],
    [0, 3, 7, 4],
    [1, 2, 6, 5],
]
const FACE_COLORS = ['#ff2d95', '#00dbff', '#ffe04d', '#00c8b5', '#ff7a00', '#a855f7']

// ─── angel + heart types ─────────────────────────────────────────────────────

type Heart = {
    x: number
    y: number
    vx: number
    vy: number
    size: number
    opacity: number
    hue: number
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

function makeAngel(w: number, h: number): Angel {
    const fromLeft = Math.random() < 0.5
    return {
        x: fromLeft ? -60 : w + 60,
        y: Math.random() * h * 0.7 + 40,
        vx: fromLeft ? 1.2 + Math.random() * 1.4 : -(1.2 + Math.random() * 1.4),
        vy: (Math.random() - 0.5) * 0.6,
        flip: !fromLeft,
        wingAngle: 0,
        t: 0,
        hearts: [],
        shootCooldown: Math.floor(Math.random() * 90),
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
        let angleX = 0
        let angleY = 0
        let angleZ = 0
        const angels: Angel[] = []

        function resize() {
            w = canvas!.width = window.innerWidth
            h = canvas!.height = window.innerHeight
        }
        resize()
        window.addEventListener('resize', resize)

        // seed angels
        for (let i = 0; i < 15; i++) angels.push(makeAngel(w, h))

        function tick() {
            ctx!.clearRect(0, 0, w, h)

            // ── rotating cube ──────────────────────────────
            angleX += 0.008
            angleY += 0.013
            angleZ += 0.005

            const cx = w * 0.5
            const cy = h * 0.44
            const fov = 260
            const size = Math.min(w, h) * 0.14

            const verts = CUBE_VERTS.map(v => {
                let p: Vec3 = [v[0] * size, v[1] * size, v[2] * size]
                p = rotateX(p, angleX)
                p = rotateY(p, angleY)
                p = rotateZ(p, angleZ)
                return p
            })

            // sort faces by average depth (painter's algorithm)
            const faces = CUBE_FACES.map((face, i) => ({
                face,
                color: FACE_COLORS[i],
                z: face.reduce((s, vi) => s + verts[vi][2], 0) / face.length,
            })).sort((a, b) => a.z - b.z)

            for (const { face, color, z } of faces) {
                const pts = face.map(vi => project(verts[vi], fov, cx, cy))
                ctx!.beginPath()
                ctx!.moveTo(pts[0][0], pts[0][1])
                for (let i = 1; i < pts.length; i++) ctx!.lineTo(pts[i][0], pts[i][1])
                ctx!.closePath()

                // fill
                const bright = Math.min(1, (z / size + 1.4) * 0.42)
                ctx!.globalAlpha = 0.62 + bright * 0.22
                ctx!.fillStyle = color
                ctx!.fill()

                // edge glow
                ctx!.globalAlpha = 0.5
                ctx!.strokeStyle = 'rgba(255,255,255,0.65)'
                ctx!.lineWidth = 1.5
                ctx!.stroke()
            }

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
                    if (hrt.opacity <= 0) {
                        a.hearts.splice(j, 1)
                        continue
                    }
                    drawHeart(ctx!, hrt.x, hrt.y, hrt.size, hrt.opacity, hrt.hue)
                }

                drawAngel(ctx!, a)

                // recycle when off-screen
                if (a.x < -100 || a.x > w + 100) {
                    angels[i] = makeAngel(w, h)
                }
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
