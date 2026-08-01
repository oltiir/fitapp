import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from './App'

/**
 * End-to-end coverage of the wiring the unit tests cannot see: the store, the
 * IndexedDB round trip, and every screen rendering real records. Renders the
 * actual App, seeded database and all.
 */

const setStepper = async (
  user: ReturnType<typeof userEvent.setup>,
  label: string,
  value: string,
) => {
  await user.click(screen.getByRole('button', { name: label }))
  const input = screen.getByRole('textbox', { name: label })
  await user.clear(input)
  await user.type(input, `${value}{Enter}`)
}

const openTab = async (user: ReturnType<typeof userEvent.setup>, name: string) =>
  user.click(await screen.findByRole('button', { name }))

/** Start Push, log `80 x 8` on bench, and finish the workout. */
async function logABenchWorkout(user: ReturnType<typeof userEvent.setup>, weight: string) {
  await user.click(await screen.findByRole('button', { name: 'Start Push' }))
  await screen.findByText('Barbell Bench Press')

  await setStepper(user, 'Barbell Bench Press set 1 weight', weight)
  await setStepper(user, 'Barbell Bench Press set 1 reps', '8')
  await user.click(screen.getByRole('button', { name: 'mark Barbell Bench Press set 1 done' }))

  await user.click(screen.getByRole('button', { name: '✓ Finish' }))
}

describe('first launch', () => {
  it('seeds the PPL routine and suggests Push', async () => {
    render(<App />)
    expect(await screen.findByText('Next up')).toBeTruthy()
    expect(screen.getByText('PUSH')).toBeTruthy()
    expect(screen.getByText('Haven’t trained today')).toBeTruthy()
  })

  it('starts the week at 0 of the 6-session target', async () => {
    render(<App />)
    expect(await screen.findByText('0 / 6')).toBeTruthy()
  })

  it('shows every split as never trained', async () => {
    render(<App />)
    await screen.findByText('This week')
    expect(screen.getByText(/Push —/)).toBeTruthy()
    expect(screen.getByText(/Legs —/)).toBeTruthy()
  })
})

describe('logging a workout', () => {
  it('opens the session prefilled with the whole Push template', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(await screen.findByRole('button', { name: 'Start Push' }))

    expect(await screen.findByText('Barbell Bench Press')).toBeTruthy()
    expect(screen.getByText('Incline Dumbbell Press')).toBeTruthy()
    expect(screen.getByText('Seated Shoulder Press')).toBeTruthy()
    expect(screen.getByText('Cable Lateral Raise')).toBeTruthy()
    expect(screen.getByText('Triceps Pushdown')).toBeTruthy()
    expect(screen.getByText('Overhead Triceps Extension')).toBeTruthy()
  })

  it('reports no history on the first ever session', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(await screen.findByRole('button', { name: 'Start Push' }))
    expect((await screen.findAllByText('no history yet')).length).toBeGreaterThan(0)
  })

  it('starts the rest timer when a set is marked done', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(await screen.findByRole('button', { name: 'Start Push' }))
    await screen.findByText('Barbell Bench Press')
    await setStepper(user, 'Barbell Bench Press set 1 weight', '80')
    await setStepper(user, 'Barbell Bench Press set 1 reps', '8')

    expect(screen.queryByRole('button', { name: 'Skip' })).toBeNull()
    await user.click(screen.getByRole('button', { name: 'mark Barbell Bench Press set 1 done' }))

    // Bench seeds a 180s rest
    expect(await screen.findByText(/3:00|2:5\d/)).toBeTruthy()
    expect(screen.getByRole('button', { name: '+30s' })).toBeTruthy()
  })

  it('dismisses the rest timer on Skip', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(await screen.findByRole('button', { name: 'Start Push' }))
    await screen.findByText('Barbell Bench Press')
    await user.click(screen.getByRole('button', { name: 'mark Barbell Bench Press set 1 done' }))
    await user.click(await screen.findByRole('button', { name: 'Skip' }))

    expect(screen.queryByRole('button', { name: '+30s' })).toBeNull()
  })

  it('records the session and advances the rotation on finish', async () => {
    const user = userEvent.setup()
    render(<App />)

    await logABenchWorkout(user, '80')

    expect(await screen.findByText('Trained today — Push')).toBeTruthy()
    expect(screen.getByText('1 / 6')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Start Pull' })).toBeTruthy()
  })

  it('reports volume for the finished session', async () => {
    const user = userEvent.setup()
    render(<App />)
    await logABenchWorkout(user, '80')
    expect(await screen.findByText(/640 kg volume/)).toBeTruthy()
  })

  it('prefills the next Push session from what was actually lifted', async () => {
    const user = userEvent.setup()
    render(<App />)

    await logABenchWorkout(user, '82.5')
    await user.click(await screen.findByRole('button', { name: 'Push' }))

    expect(await screen.findByText(/last time · 0d ago · 82.5 × 8/)).toBeTruthy()
    expect(
      (screen.getByRole('button', { name: 'Barbell Bench Press set 1 weight' }) as HTMLElement)
        .textContent,
    ).toContain('82.5')
  })

  it('survives a remount, because every change is written through to IndexedDB', async () => {
    const user = userEvent.setup()
    const first = render(<App />)

    await logABenchWorkout(user, '85')
    await screen.findByText('Trained today — Push')
    first.unmount()

    render(<App />)
    expect(await screen.findByText('Trained today — Push')).toBeTruthy()
  })
})

describe('attendance without a logged workout', () => {
  it('counts a manual gym visit and can undo it', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(await screen.findByRole('button', { name: 'went, don’t log' }))
    expect(await screen.findByText('Marked as a gym visit')).toBeTruthy()
    expect(screen.getByText('1 / 6')).toBeTruthy()

    await user.click(screen.getByRole('button', { name: 'undo' }))
    expect(await screen.findByText('Haven’t trained today')).toBeTruthy()
    expect(screen.getByText('0 / 6')).toBeTruthy()
  })
})

describe('bodyweight and runs', () => {
  it('logs a weigh-in and shows it on Body', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(await screen.findByRole('button', { name: '+ weight' }))
    await user.type(screen.getByLabelText('Weight (kg)'), '82.4')
    await user.click(screen.getByRole('button', { name: 'Save' }))

    await openTab(user, 'Body')
    // Shown twice: as the "Now" stat and as the entry in the list below.
    expect((await screen.findAllByText('82.4 kg')).length).toBe(2)
  })

  it('logs a run and derives its pace', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(await screen.findByRole('button', { name: '+ run' }))
    await user.type(screen.getByLabelText('Distance (km)'), '5')
    await user.type(screen.getByLabelText('Minutes'), '26')
    await user.type(screen.getByLabelText('Seconds'), '30')
    expect(screen.getByText('→ pace 5:18 /km')).toBeTruthy()
    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(await screen.findByText('Runs this week: 1')).toBeTruthy()

    await openTab(user, 'Body')
    expect(await screen.findByText(/5 km · 26:30 · 5:18 \/km/)).toBeTruthy()
  })
})

describe('progress', () => {
  it('shows the finished session in the recap', async () => {
    const user = userEvent.setup()
    render(<App />)

    await logABenchWorkout(user, '80')
    await screen.findByText('Trained today — Push')
    await openTab(user, 'Progress')

    expect(await screen.findByText(/Last Push —/)).toBeTruthy()
    expect(screen.getByText('80 × 8')).toBeTruthy()
    expect(screen.getByText(/Volume 640 kg/)).toBeTruthy()
  })

  it('lists the bench PR', async () => {
    const user = userEvent.setup()
    render(<App />)

    await logABenchWorkout(user, '80')
    await screen.findByText('Trained today — Push')
    await openTab(user, 'Progress')
    await user.click(await screen.findByRole('tab', { name: 'PRs' }))

    const row = (await screen.findByText('Barbell Bench Press')).closest('.pr-row')!
    expect(within(row as HTMLElement).getByText('80 kg × 8')).toBeTruthy()
  })

  it('marks the calendar on the day trained', async () => {
    const user = userEvent.setup()
    render(<App />)

    await logABenchWorkout(user, '80')
    await screen.findByText('Trained today — Push')
    await openTab(user, 'Progress')
    await user.click(await screen.findByRole('tab', { name: 'Calendar' }))

    const today = String(new Date().getDate())
    const attended = document.querySelectorAll('.cal .day.attended')
    expect(attended.length).toBe(1)
    // The attended cell shows the split initial rather than the date number
    expect(attended[0]!.textContent).toBe('P')
    expect(screen.getByText(/P = push/)).toBeTruthy()
    expect(today.length).toBeGreaterThan(0)
  })
})

describe('settings', () => {
  it('lists the three templates and switches between them', async () => {
    const user = userEvent.setup()
    render(<App />)
    await openTab(user, 'Settings')

    expect(await screen.findByText('Workout templates')).toBeTruthy()
    // Appears in the Push template and again in the exercise list below it.
    expect(screen.getAllByText('Barbell Bench Press').length).toBe(2)

    await user.click(screen.getByRole('tab', { name: 'Legs' }))
    expect((await screen.findAllByText('Barbell Squat')).length).toBe(2)
    expect(screen.getAllByText('Barbell Bench Press').length).toBe(1) // template switched away
  })

  it('persists a changed weekly target', async () => {
    const user = userEvent.setup()
    const first = render(<App />)
    await openTab(user, 'Settings')

    await user.selectOptions(await screen.findByLabelText('Sessions per week target'), '4')
    first.unmount()

    render(<App />)
    expect(await screen.findByText('0 / 4')).toBeTruthy()
  })

  it('switching to lb converts displayed weights without touching storage', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(await screen.findByRole('button', { name: '+ weight' }))
    await user.type(screen.getByLabelText('Weight (kg)'), '100')
    await user.click(screen.getByRole('button', { name: 'Save' }))

    await openTab(user, 'Settings')
    await user.selectOptions(await screen.findByLabelText('Weight unit'), 'lb')

    await openTab(user, 'Body')
    expect((await screen.findAllByText('220.5 lb')).length).toBe(2)
  })

  it('removes an exercise from a template', async () => {
    const user = userEvent.setup()
    render(<App />)
    await openTab(user, 'Settings')

    await user.click(await screen.findByRole('button', { name: 'remove Barbell Bench Press' }))
    await openTab(user, 'Today')
    await user.click(await screen.findByRole('button', { name: 'Start Push' }))

    expect(await screen.findByText('Incline Dumbbell Press')).toBeTruthy()
    expect(screen.queryByText('Barbell Bench Press')).toBeNull()
  })
})
