/**
 * The icon system. Every glyph in the app is drawn here — on one 24×24 grid, at
 * one stroke weight, with square caps and mitred joins, because the world is
 * made of steel hardware rather than rounded outlines.
 *
 * Nothing in the app may fall back to a unicode character or emoji for an icon:
 * those render differently on every platform, cannot inherit stroke weight, and
 * were what made the old build read as unfinished.
 */

export type IconName =
  | 'barbell'
  | 'chart'
  | 'torso'
  | 'bolt'
  | 'tick'
  | 'plus'
  | 'minus'
  | 'close'
  | 'next'
  | 'prev'
  | 'up'
  | 'down'
  | 'timer'
  | 'warn'
  | 'trash'
  | 'undo'
  | 'road'
  | 'plate'
  | 'pencil'
  | 'archive'
  | 'export'
  | 'import'

const PATHS: Record<IconName, string> = {
  // A bar with two plates and collars.
  barbell: 'M2 12h20 M6.5 8.5v7 M9.5 6v12 M14.5 6v12 M17.5 8.5v7',
  // A load chart: four ascending bars on a baseline.
  chart: 'M3 20.5h18 M5.5 20.5V15 M10.5 20.5V11 M15.5 20.5V13 M20.5 20.5V5',
  // Head and shoulders. A bathroom scale drawn at 23px read as a garage door.
  torso: 'M12 3.5a3.4 3.4 0 100 6.8 3.4 3.4 0 000-6.8 M4 20.5c0-4.3 3.6-7.2 8-7.2s8 2.9 8 7.2',
  // A hex bolt head, seen face on.
  bolt: 'M12 2.8l7.9 4.6v9.2L12 21.2l-7.9-4.6V7.4z M12 8.8a3.2 3.2 0 100 6.4 3.2 3.2 0 000-6.4z',
  tick: 'M3.5 12.5l5.5 5.5L20.5 6.5',
  plus: 'M12 4.5v15 M4.5 12h15',
  minus: 'M4.5 12h15',
  close: 'M5.5 5.5l13 13 M18.5 5.5l-13 13',
  next: 'M9 4.5l7.5 7.5L9 19.5',
  prev: 'M15 4.5L7.5 12l7.5 7.5',
  up: 'M12 20V4.5 M4.5 12L12 4.5 19.5 12',
  down: 'M12 4v15.5 M19.5 12L12 19.5 4.5 12',
  // A stopwatch: crown, stem, hand.
  timer: 'M12 21a8 8 0 100-16 8 8 0 000 16z M12 13V8.5 M9.5 2.5h5 M12 2.5V5',
  warn: 'M12 3.5L2 20.5h20z M12 9.5v5 M12 17.2v1.2',
  trash: 'M3.5 7h17 M9 7V4h6v3 M5.5 7l1 13.5h11L18.5 7',
  undo: 'M3.5 9h9.5a5 5 0 010 10H7.5 M7.5 5L3.5 9l4 4',
  // A road running to the horizon, dashed centre line. Weak perspective made
  // this read as a ladder, so the verges converge hard.
  road: 'M4.5 21L10 3.5 M19.5 21L14 3.5 M12 6v2.5 M12 12v3 M12 18.5V21',
  // A bumper plate, seen face on.
  plate: 'M12 3.5a8.5 8.5 0 100 17 8.5 8.5 0 000-17z M12 9.5a2.5 2.5 0 100 5 2.5 2.5 0 000-5z',
  pencil: 'M4 20h4L19.5 8.5 15.5 4.5 4 16z M14 6l4 4',
  archive: 'M3.5 6.5h17v4h-17z M5.5 10.5V20h13v-9.5 M9.5 14.5h5',
  export: 'M12 16.5V3.5 M7 8.5L12 3.5l5 5 M4 15.5v5h16v-5',
  import: 'M12 3.5v13 M7 11.5l5 5 5-5 M4 15.5v5h16v-5',
}

export default function Icon({
  name,
  size = 22,
  strokeWidth,
}: {
  name: IconName
  size?: number
  /** Only for icons rendered much larger or smaller than the 22px default. */
  strokeWidth?: number
}) {
  return (
    <svg
      className="ico"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
      style={strokeWidth ? { strokeWidth } : undefined}
    >
      <path d={PATHS[name]} />
    </svg>
  )
}
