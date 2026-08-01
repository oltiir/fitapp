export interface Series {
  points: { x: number; y: number }[]
  color: string
  kind: 'line' | 'dots'
}

// Fixed internal coordinate space scaled by viewBox: the chart fills its card at
// any screen width with no measurement and no resize observer.
const W = 320
const PAD_L = 34
const PAD_R = 6
const PAD_T = 8
const PAD_B = 18

export default function LineChart({
  series,
  height = 150,
  format = (v: number) => String(Math.round(v * 10) / 10),
  xLabels = [],
  emptyLabel = 'No data yet',
}: {
  series: Series[]
  height?: number
  format?: (v: number) => string
  xLabels?: { x: number; label: string }[]
  emptyLabel?: string
}) {
  const all = series.flatMap((s) => s.points)
  if (all.length === 0) return <div className="empty">{emptyLabel}</div>

  const xs = all.map((p) => p.x)
  const ys = all.map((p) => p.y)

  let yMin = Math.min(...ys)
  let yMax = Math.max(...ys)
  // A flat series would otherwise give a zero-height domain and divide by zero.
  if (yMax - yMin < 0.001) {
    yMin -= 1
    yMax += 1
  }
  const headroom = (yMax - yMin) * 0.06
  yMin -= headroom
  yMax += headroom

  const xMin = Math.min(...xs)
  const xMax = Math.max(...xs)
  const xSpan = xMax - xMin || 1

  const px = (x: number) => PAD_L + ((x - xMin) / xSpan) * (W - PAD_L - PAD_R)
  const py = (y: number) => PAD_T + (1 - (y - yMin) / (yMax - yMin)) * (height - PAD_T - PAD_B)

  const gridValues = [yMin + headroom, (yMin + yMax) / 2, yMax - headroom]

  return (
    <svg className="chart" viewBox={`0 0 ${W} ${height}`} role="img">
      {gridValues.map((v, i) => (
        <g key={i}>
          <line
            x1={PAD_L}
            x2={W - PAD_R}
            y1={py(v)}
            y2={py(v)}
            stroke="var(--line)"
            strokeWidth="0.5"
          />
          <text x="2" y={py(v) + 3.5} fill="var(--dim)" fontSize="8.5">
            {format(v)}
          </text>
        </g>
      ))}

      {xLabels.map((t, i) => (
        <text
          key={i}
          x={px(t.x)}
          y={height - 4}
          fill="var(--dim)"
          fontSize="8.5"
          // Anchor by position. Centring every label clips the ones at the plot
          // edges against the viewBox — the last date rendered as "Jul 2"
          // when it was really "Jul 27".
          textAnchor={
            px(t.x) <= PAD_L + 14 ? 'start' : px(t.x) >= W - PAD_R - 14 ? 'end' : 'middle'
          }
        >
          {t.label}
        </text>
      ))}

      {series.map((s, i) =>
        s.kind === 'line' ? (
          <polyline
            key={i}
            fill="none"
            stroke={s.color}
            strokeWidth="1.8"
            strokeLinejoin="round"
            points={s.points.map((p) => `${px(p.x)},${py(p.y)}`).join(' ')}
          />
        ) : (
          <g key={i}>
            {s.points.map((p, j) => (
              <circle key={j} cx={px(p.x)} cy={py(p.y)} r="2.4" fill={s.color} />
            ))}
          </g>
        ),
      )}
    </svg>
  )
}
