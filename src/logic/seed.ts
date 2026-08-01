import { SPLITS, type Exercise, type Split, type Template } from '../types'

/**
 * Rest defaults to 60s everywhere. The rest chip on the workout screen cycles
 * 45/60/90/120/150/180 in one tap and persists the choice to the exercise, so
 * the heavy compounds get retuned in situ rather than in a settings screen.
 */
interface SeedExercise {
  id: string
  name: string
  restSeconds: number
  incrementKg: number
}

const SEED: Record<Split, SeedExercise[]> = {
  push: [
    { id: 'bench-press', name: 'Barbell Bench Press', restSeconds: 60, incrementKg: 2.5 },
    { id: 'incline-db-press', name: 'Incline Dumbbell Press', restSeconds: 60, incrementKg: 2 },
    { id: 'shoulder-press', name: 'Seated Shoulder Press', restSeconds: 60, incrementKg: 2.5 },
    { id: 'lateral-raise', name: 'Cable Lateral Raise', restSeconds: 60, incrementKg: 2.5 },
    { id: 'triceps-pushdown', name: 'Triceps Pushdown', restSeconds: 60, incrementKg: 2.5 },
    {
      id: 'overhead-extension',
      name: 'Overhead Triceps Extension',
      restSeconds: 60,
      incrementKg: 2.5,
    },
  ],
  pull: [
    { id: 'barbell-row', name: 'Barbell Row', restSeconds: 60, incrementKg: 2.5 },
    { id: 'lat-pulldown', name: 'Lat Pulldown', restSeconds: 60, incrementKg: 2.5 },
    { id: 'seated-row', name: 'Seated Cable Row', restSeconds: 60, incrementKg: 2.5 },
    { id: 'face-pull', name: 'Face Pull', restSeconds: 60, incrementKg: 2.5 },
    { id: 'barbell-curl', name: 'Barbell Curl', restSeconds: 60, incrementKg: 2.5 },
    { id: 'hammer-curl', name: 'Hammer Curl', restSeconds: 60, incrementKg: 2 },
  ],
  legs: [
    { id: 'squat', name: 'Barbell Squat', restSeconds: 60, incrementKg: 2.5 },
    { id: 'romanian-deadlift', name: 'Romanian Deadlift', restSeconds: 60, incrementKg: 2.5 },
    { id: 'leg-press', name: 'Leg Press', restSeconds: 60, incrementKg: 5 },
    { id: 'leg-extension', name: 'Leg Extension', restSeconds: 60, incrementKg: 2.5 },
    { id: 'leg-curl', name: 'Leg Curl', restSeconds: 60, incrementKg: 2.5 },
    { id: 'calf-raise', name: 'Standing Calf Raise', restSeconds: 60, incrementKg: 2.5 },
  ],
}

export function seedData(now: Date): { exercises: Exercise[]; templates: Template[] } {
  const createdAt = now.toISOString()
  const exercises: Exercise[] = []
  const templates: Template[] = []

  for (const split of SPLITS) {
    const list = SEED[split]
    for (const e of list) {
      exercises.push({ ...e, archived: false, createdAt })
    }
    templates.push({ split, exerciseIds: list.map((e) => e.id), updatedAt: createdAt })
  }

  return { exercises, templates }
}
