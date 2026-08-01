import { useRef, useState } from 'react'
import { useStore } from '../store/StoreContext'
import Segmented from '../components/Segmented'
import TemplateEditor from '../components/TemplateEditor'
import ExerciseEditor from '../components/ExerciseEditor'
import { backupFilename, ImportError, parseImport, serializeExport } from '../logic/backup'
import { daysBetween, toISODate, todayISO } from '../logic/dates'
import { SPLIT_LABEL, SPLITS, type Split } from '../types'

export default function SettingsScreen() {
  const { data, saveSettings, importData } = useStore()
  const [split, setSplit] = useState<Split>('push')
  const [importErr, setImportErr] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const { settings } = data

  function exportBackup() {
    const now = new Date()
    const blob = new Blob([serializeExport(data, now)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = backupFilename(now)
    a.click()
    URL.revokeObjectURL(url)
    void saveSettings({ ...settings, lastBackupAt: now.toISOString() })
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
      <h1>Settings</h1>

      <h2>Backup</h2>
      <div className="card">
        <div className="spread" style={{ marginBottom: 12 }}>
          <span className="sub">Last backup</span>
          <strong className={backupStale ? 'amber' : undefined}>{backupLabel}</strong>
        </div>
        <p className="sub" style={{ marginTop: 0 }}>
          Your data lives only in this browser on this device. An export is the only copy that
          survives a lost phone.
        </p>
        <button className="btn btn-primary" onClick={exportBackup} style={{ marginBottom: 8 }}>
          Export backup
        </button>
        <button className="btn" onClick={() => fileRef.current?.click()}>
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
      </div>

      <h2>Workout templates</h2>
      <Segmented
        options={SPLITS.map((s) => ({ id: s, label: SPLIT_LABEL[s] }))}
        value={split}
        onChange={setSplit}
      />
      <TemplateEditor split={split} />

      <h2>Exercises</h2>
      <ExerciseEditor />

      <h2>Preferences</h2>
      <div className="card">
        <div className="field">
          <label htmlFor="pref-unit">Weight unit</label>
          <select
            id="pref-unit"
            value={settings.unit}
            onChange={(e) =>
              void saveSettings({ ...settings, unit: e.target.value as 'kg' | 'lb' })
            }
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
          <input
            id="pref-target"
            type="text"
            inputMode="numeric"
            value={String(settings.weeklyTarget)}
            onChange={(e) => {
              const n = Math.round(Number(e.target.value))
              if (Number.isFinite(n) && n >= 1 && n <= 14) {
                void saveSettings({ ...settings, weeklyTarget: n })
              }
            }}
          />
        </div>

        <div className="spread">
          <label htmlFor="pref-beep" style={{ margin: 0 }}>
            Beep when rest ends
          </label>
          <input
            id="pref-beep"
            type="checkbox"
            style={{ width: 24, minHeight: 24 }}
            checked={settings.restBeepEnabled}
            onChange={(e) => void saveSettings({ ...settings, restBeepEnabled: e.target.checked })}
          />
        </div>
      </div>
    </div>
  )
}
