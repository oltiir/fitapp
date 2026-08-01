import { useEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

/**
 * A full-screen sheet with its actions in the header.
 *
 * Deliberately not a bottom sheet: on iOS the keyboard covers the bottom of the
 * screen, which hid the Save button, and `position: fixed` elements jump around
 * while the keyboard animates — the tab bar ended up painted over the sheet.
 * Actions at the top are always reachable, whatever the keyboard is doing.
 *
 * Rendered through a portal so it can never be trapped inside a scrolling or
 * transformed ancestor.
 */
export default function Sheet({
  title,
  onClose,
  primary,
  children,
}: {
  title: string
  onClose: () => void
  primary?: { label: string; onClick: () => void; disabled?: boolean }
  children: ReactNode
}) {
  // Stop the page behind from scrolling under the sheet.
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [])

  return createPortal(
    <div className="sheet">
      <header className="sheet-head">
        <button className="sheet-action" onClick={onClose}>
          Cancel
        </button>
        <strong className="sheet-title">{title}</strong>
        {primary ? (
          <button
            className="sheet-action primary"
            disabled={primary.disabled}
            onClick={primary.onClick}
          >
            {primary.label}
          </button>
        ) : (
          <span className="sheet-action" />
        )}
      </header>
      <div className="sheet-body">{children}</div>
    </div>,
    document.body,
  )
}
