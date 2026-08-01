export default function WeekRing({ count, target }: { count: number; target: number }) {
  const hit = count >= target
  return (
    <div className="spread">
      {/* The dot row is capped at `target` while the label shows the true count, so a
          seventh session in a six-target week reads 7 / 6 rather than growing the row. */}
      <div className="dots">
        {Array.from({ length: target }, (_, i) => (
          <span key={i} className={`dot${i < count ? ' filled' : ''}${hit ? ' gold' : ''}`} />
        ))}
      </div>
      <strong className={`mono${hit ? ' gold-text' : ''}`}>
        {count} / {target}
      </strong>
    </div>
  )
}
