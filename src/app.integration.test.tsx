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
  // No clear(), and skipClick: tapping the value button mounts the input
  // already focused with its contents selected, so typing replaces. Clearing
  // first — or letting user-event click again, which collapses the selection —
  // would hide an append-instead-of-replace regression.
  await user.type(input, `${value}{Enter}`, { skipClick: true })
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

  await user.click(screen.getByRole('button', { name: 'Finish' }))
}

describe('first launch', () => {
  it('seeds the PPL routine and suggests Push', async () => {
    render(<App />)
    expect(await screen.findByText('Push is next — never trained')).toBeTruthy()
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
    // Each split is one tag that both reports how long since and starts it.
    expect(screen.getByRole('button', { name: 'Start Push — never trained' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Start Legs — never trained' })).toBeTruthy()
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

    // Rest defaults to 60s and runs in the dock, where the commit bar was.
    // Scoped to the timer so this cannot pass on the chip that sets the duration.
    const timer = await screen.findByRole('timer', { name: 'rest remaining' })
    expect(timer.textContent).toMatch(/(1:00|0:5\d)/)
    expect(screen.getByRole('button', { name: '+30s' })).toBeTruthy()
  })

  it('dismisses the rest timer on Skip', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(await screen.findByRole('button', { name: 'Start Push' }))
    await screen.findByText('Barbell Bench Press')
    await setStepper(user, 'Barbell Bench Press set 1 reps', '8')
    await user.click(screen.getByRole('button', { name: 'mark Barbell Bench Press set 1 done' }))
    await user.click(await screen.findByRole('button', { name: 'Skip' }))

    expect(screen.queryByRole('button', { name: '+30s' })).toBeNull()
  })

  it('refuses to complete a set with no reps entered', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(await screen.findByRole('button', { name: 'Start Push' }))
    await screen.findByText('Barbell Bench Press')

    // A 0-rep set is meaningless and would pollute history and PRs.
    const doneBtn = screen.getByRole('button', { name: 'mark Barbell Bench Press set 1 done' })
    expect((doneBtn as HTMLButtonElement).disabled).toBe(true)
    await user.click(doneBtn)
    expect(screen.queryByRole('button', { name: 'Skip' })).toBeNull()

    await setStepper(user, 'Barbell Bench Press set 1 reps', '5')
    expect((doneBtn as HTMLButtonElement).disabled).toBe(false)
  })

  it('keeps the exercise open after its last set, instead of jumping away', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(await screen.findByRole('button', { name: 'Start Push' }))
    await screen.findByText('Barbell Bench Press')

    await setStepper(user, 'Barbell Bench Press set 1 reps', '8')
    await user.click(screen.getByRole('button', { name: 'mark Barbell Bench Press set 1 done' }))

    // Bench has no unfinished sets now, but you may well want another one.
    expect(screen.getByRole('button', { expanded: true }).textContent).toContain(
      'Barbell Bench Press',
    )
    expect(screen.getByText('All 1 sets done')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Add set' })).toBeTruthy()
  })

  it('records the session and advances the rotation on finish', async () => {
    const user = userEvent.setup()
    render(<App />)

    await logABenchWorkout(user, '80')

    // The plate reports the state above the split it credits you with.
    expect(await screen.findByText('Trained today')).toBeTruthy()
    expect(screen.getByRole('heading', { name: 'PUSH' })).toBeTruthy()
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
    await user.click(await screen.findByRole('button', { name: /^Start Push — today$/ }))

    expect(await screen.findByText(/earlier today · 82.5 × 8/)).toBeTruthy()
    expect(
      (screen.getByRole('button', { name: 'Barbell Bench Press set 1 weight' }) as HTMLElement)
        .textContent,
    ).toContain('82.5')
  })

  it('replaces a prefilled weight when typed over, instead of appending to it', async () => {
    const user = userEvent.setup()
    render(<App />)

    await logABenchWorkout(user, '80')
    await user.click(await screen.findByRole('button', { name: /^Start Push — today$/ }))
    await screen.findByText('Barbell Bench Press')

    // The field is prefilled with 80. Typing 85 must give 85, not 8085 —
    // an appended value would be logged as a permanent, bogus PR.
    await setStepper(user, 'Barbell Bench Press set 1 weight', '85')

    const value = screen.getByRole('button', { name: 'Barbell Bench Press set 1 weight' })
    expect(value.textContent).toContain('85')
    expect(value.textContent).not.toContain('8085')
  })

  it('expands only one exercise at a time, and follows a tap to another', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(await screen.findByRole('button', { name: 'Start Push' }))
    await screen.findByText('Barbell Bench Press')

    // Bench is first and unfinished, so it opens by default; nothing else does.
    expect(screen.getByRole('button', { expanded: true }).textContent).toContain(
      'Barbell Bench Press',
    )
    expect(screen.getAllByRole('button', { expanded: true })).toHaveLength(1)
    expect(screen.queryByRole('button', { name: 'Cable Lateral Raise set 1 weight' })).toBeNull()

    await user.click(screen.getByRole('button', { name: /Cable Lateral Raise/ }))
    expect(screen.getAllByRole('button', { expanded: true })).toHaveLength(1)
    expect(screen.getByRole('button', { expanded: true }).textContent).toContain(
      'Cable Lateral Raise',
    )
    // The steppers moved with it.
    expect(screen.getByRole('button', { name: 'Cable Lateral Raise set 1 weight' })).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Barbell Bench Press set 1 weight' })).toBeNull()
  })

  it('retunes and remembers an exercise’s rest from the picker', async () => {
    const user = userEvent.setup()
    const first = render(<App />)
    await user.click(await screen.findByRole('button', { name: 'Start Push' }))
    await screen.findByText('Barbell Bench Press')

    // The chip opens a picker of real choices. Cycling one tap at a time cost up
    // to five taps to get from 45s to 3:00.
    await user.click(screen.getByRole('button', { name: /rest 60 seconds/ }))
    await user.click(screen.getByRole('button', { name: 'set rest to 1:30' }))
    expect(screen.getByRole('button', { name: /rest 90 seconds/ })).toBeTruthy()

    // Persisted to the exercise, so the next workout starts from the new value.
    first.unmount()
    render(<App />)
    await user.click(await screen.findByRole('button', { name: 'Resume' }))
    expect(await screen.findByRole('button', { name: /rest 90 seconds/ })).toBeTruthy()
  })

  it('survives a remount, because every change is written through to IndexedDB', async () => {
    const user = userEvent.setup()
    const first = render(<App />)

    await logABenchWorkout(user, '85')
    await screen.findByText('Trained today')
    first.unmount()

    render(<App />)
    expect(await screen.findByText('Trained today')).toBeTruthy()
    expect(screen.getByRole('heading', { name: 'PUSH' })).toBeTruthy()
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
    expect(screen.getByText('pace 5:18 /km')).toBeTruthy()
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
    await screen.findByText('Trained today')
    await openTab(user, 'Progress')

    expect(await screen.findByText(/Last Push —/)).toBeTruthy()
    expect(screen.getByText('80 × 8')).toBeTruthy()
    expect(screen.getByText(/Volume 640 kg/)).toBeTruthy()
  })

  it('lists the bench PR', async () => {
    const user = userEvent.setup()
    render(<App />)

    await logABenchWorkout(user, '80')
    await screen.findByText('Trained today')
    await openTab(user, 'Progress')
    await user.click(await screen.findByRole('tab', { name: 'PRs' }))

    const row = (await screen.findByText('Barbell Bench Press')).closest('.pr-row')!
    expect(within(row as HTMLElement).getByText('80 kg × 8')).toBeTruthy()
  })

  it('marks the calendar on the day trained', async () => {
    const user = userEvent.setup()
    render(<App />)

    await logABenchWorkout(user, '80')
    await screen.findByText('Trained today')
    await openTab(user, 'Progress')
    await user.click(await screen.findByRole('tab', { name: 'Calendar' }))

    const today = String(new Date().getDate())
    const attended = document.querySelectorAll('.cal .day.attended')
    expect(attended.length).toBe(1)
    // The cell keeps its date and adds the split marker — dropping the date
    // made attended days impossible to find by eye.
    expect(attended[0]!.querySelector('.daynum')!.textContent).toBe(today)
    expect(attended[0]!.querySelector('.marks')!.textContent).toBe('PS')
    expect(screen.getByText('PS = push')).toBeTruthy()
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

  it('persists the rest-beep switch', async () => {
    const user = userEvent.setup()
    const first = render(<App />)
    await openTab(user, 'Settings')

    const beep = await screen.findByRole('switch', { name: 'Beep when rest ends' })
    expect(beep.getAttribute('aria-checked')).toBe('true')
    await user.click(beep)
    expect(beep.getAttribute('aria-checked')).toBe('false')
    first.unmount()

    render(<App />)
    await openTab(user, 'Settings')
    expect(
      (await screen.findByRole('switch', { name: 'Beep when rest ends' })).getAttribute(
        'aria-checked',
      ),
    ).toBe('false')
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
