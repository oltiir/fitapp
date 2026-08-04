import { useRef, useState } from 'react'
import { useStore } from '../store/StoreContext'
import Segmented from '../components/Segmented'
import TemplateEditor from '../components/TemplateEditor'
import ExerciseEditor from '../components/ExerciseEditor'
import Icon from '../components/Icon'
import { backupFilename, ImportError, parseImport, serializeExport } from '../logic/backup'
import { daysBetween, toISODate, todayISO } from '../logic/dates'
import { seedData } from '../logic/seed'
import { DEFAULT_SETTINGS, SPLIT_LABEL, SPLITS, type Split } from '../types'

export default function SettingsScreen() {
  const { data, saveSettings, importData } = useStore()
  const [split, setSplit] = useState<Split>('push')
  const [importErr, setImportErr] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const { settings } = data

  async function exportBackup() {
    const now = new Date()
    const json = serializeExport(data, now)
    const filename = backupFilename(now)
    const markDone = () => saveSettings({ ...settings, lastBackupAt: now.toISOString() })

    // Prefer the share sheet on iOS: a standalone PWA handles `<a download>`
    // unreliably, and the sheet routes straight to "Save to Files", which is
    // where the backup belongs anyway. Only fall back if sharing is unavailable.
    const file = new File([json], filename, { type: 'application/json' })
    if (navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: filename })
        await markDone()
        return
      } catch (e) {
        // A cancelled share is not a backup — leave lastBackupAt alone.
        if (e instanceof Error && e.name === 'AbortError') return
        // Anything else: fall through to the download path below.
      }
    }

    const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }))
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
    await markDone()
  }

  /** Two confirmations, because this is unrecoverable and sits in a settings list. */
  async function resetEverything() {
    if (!confirm('Reset all data?\n\nEvery workout, weigh-in and run will be deleted.')) return
    if (!confirm('Really delete everything? This cannot be undone.')) return
    const seed = seedData(new Date())
    await importData({
      exercises: seed.exercises,
      templates: seed.templates,
      sessions: [],
      bodyweights: [],
      runs: [],
      visits: [],
      settings: { ...DEFAULT_SETTINGS, unit: settings.unit, weeklyTarget: settings.weeklyTarget },
    })
  }

  async function onFilePicked(file: File) {
    setImportErr(null)
    try {
      const text = await file.text()
      const incoming = parseImport(text)
      const exportedAt = (JSON.parse(text) as { exportedAt?: string }).exportedAt ?? 'unknown date'
      const summary = [
        `${incoming.sessions.length} sessions`,
        `${incoming.exercises.length} exercises`,
        `${incoming.bodyweights.length} weigh-ins`,
        `${incoming.runs.length} runs`,
      ].join(', ')
      const ok = confirm(
        `Restore the backup from ${exportedAt.slice(0, 10)}?\n\n${summary}\n\n` +
          'This REPLACES everything currently in the app.',
      )
      if (ok) await importData(incoming)
    } catch (e) {
      setImportErr(e instanceof ImportError ? e.message : `Could not read that file: ${String(e)}`)
    }
  }

  const backupAgeDays =
    settings.lastBackupAt === null
      ? null
      : daysBetween(toISODate(new Date(settings.lastBackupAt)), todayISO(new Date()))
  const backupLabel =
    backupAgeDays === null
      ? 'never'
      : backupAgeDays === 0
        ? 'today'
        : `${backupAgeDays} day${backupAgeDays === 1 ? '' : 's'} ago`
  const backupStale = backupAgeDays === null || backupAgeDays > 30

  return (
    <div className="screen">
      <header className="rail">
        <span className="where">Settings</span>
        <span className="when">{data.exercises.filter((e) => !e.archived).length} exercises</span>
      </header>

      <h2 className="rule">Backup</h2>
      <div className="readings">
        <div className="reading">
          <span className="k">Last export</span>
          <span className="lead" />
          <span className="v" style={{ color: backupStale ? 'var(--signal)' : undefined }}>
            {backupLabel}
          </span>
        </div>
      </div>
      <p className="sub">
        Your data lives only in this browser on this device. An export is the only copy that
        survives a lost phone.
      </p>
      <button className="buckle" onClick={() => void exportBackup()}>
        <span className="stitch" aria-hidden="true" />
        <Icon name="export" size={20} strokeWidth={2.2} />
        Export backup
      </button>
      <button
        className="steel-btn"
        style={{ marginTop: 'var(--s2)' }}
        onClick={() => fileRef.current?.click()}
      >
        <Icon name="import" size={19} />
        Import backup
      </button>
      <input
        ref={fileRef}
        type="file"
        accept="application/json,.json"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0]
          e.target.value = '' // allow re-picking the same file
          if (file) void onFilePicked(file)
        }}
      />
      {importErr && <div className="err">{importErr}</div>}

      <h2 className="rule">Workout templates</h2>
      <Segmented
        options={SPLITS.map((s) => ({ id: s, label: SPLIT_LABEL[s] }))}
        value={split}
        onChange={setSplit}
      />
      <TemplateEditor split={split} />

      <h2 className="rule">Exercises</h2>
      <ExerciseEditor />

      <h2 className="rule">Preferences</h2>
      <div className="field">
        <label htmlFor="pref-unit">Weight unit</label>
        <select
          id="pref-unit"
          value={settings.unit}
          onChange={(e) => void saveSettings({ ...settings, unit: e.target.value as 'kg' | 'lb' })}
        >
          <option value="kg">kg</option>
          <option value="lb">lb</option>
        </select>
        <div className="sub" style={{ marginTop: 6 }}>
          Display only — weights are always stored in kilograms.
        </div>
      </div>

      <div className="field">
        <label htmlFor="pref-target">Sessions per week target</label>
        {/* A select rather than a number field: a controlled text input rejects
            its own intermediate states (an empty field is out of range), so the
            value snaps back and typing appends instead of replacing. */}
        <select
          id="pref-target"
          value={String(settings.weeklyTarget)}
          onChange={(e) => void saveSettings({ ...settings, weeklyTarget: Number(e.target.value) })}
        >
          {Array.from({ length: 14 }, (_, i) => i + 1).map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </div>

      <div className="list-item" style={{ borderTop: '1px solid var(--line)' }}>
        <span className="grow nm">Beep when rest ends</span>
        {/* A button rather than a checkbox: a native checkbox renders at
            24x24, well under the 44px minimum for a reliable tap. */}
        <button
          className="steel-btn sm"
          role="switch"
          aria-checked={settings.restBeepEnabled}
          aria-label="Beep when rest ends"
          onClick={() =>
            void saveSettings({ ...settings, restBeepEnabled: !settings.restBeepEnabled })
          }
        >
          {settings.restBeepEnabled ? 'On' : 'Off'}
        </button>
      </div>

      <h2 className="rule">Reset</h2>
      <div className="hazard">
        <div className="stripe" />
        <div className="inner">
          <Icon name="warn" size={24} />
          <div className="txt">
            <div className="hd">No undo</div>
            <div className="sub">
              Wipes every workout, weigh-in and run, and restores the default Push/Pull/Legs
              templates. Export a backup first if you might want any of it.
            </div>
          </div>
        </div>
      </div>
      <button className="steel-btn danger" onClick={() => void resetEverything()}>
        <Icon name="trash" size={19} />
        Reset all data
      </button>
    </div>
  )
}
