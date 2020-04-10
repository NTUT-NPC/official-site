interface Range<T> {
  from: T;
  to: T;
}

interface WithKey {
  key: string;
}

interface WithValue {
  value: Range<number>;
}

interface WithPercentage {
  percentage: Range<number>;
}

interface Transition extends WithKey, WithValue, WithPercentage {}

export interface TransitionValueSet {
  [key: string]: Range<number>;
}

interface TransitionPackStep {
  isAutoPatched?: boolean;
  percentage: Range<number>;
  transitionValueSet: TransitionValueSet;
}

interface TransitionPackStepsLine {
  steps: TransitionPackStep[];
}

interface TransitionPack {
  steps: TransitionPackStep[];
}

export interface TransitionPackSet {
  [key: string]: TransitionPack;
}

export interface TransitionSet {
  [key: string]: Transition[];
}

interface TransitionCalculatingOptions {
  currentPercentage: number;
  transition: Transition;
}

interface MultipleTransitionsCalculatingOptions {
  currentPercentage: number;
  transitions: Transition[];
}

interface TransitionResult {
  [key: string]: number | null;
}

function calculateTransition (options: TransitionCalculatingOptions) {
  const { currentPercentage, transition } = options
  if (currentPercentage >= transition.percentage.from && currentPercentage <= transition.percentage.to) {
    if (transition.value.from === transition.value.to) {
      return transition.value.from
    }
    const deltaPercentage = ((Math.min(transition.percentage.to, Math.max(transition.percentage.from, currentPercentage)) - transition.percentage.from) / (transition.percentage.to - transition.percentage.from))
    return transition.value.from + (transition.value.to - transition.value.from) * deltaPercentage
  } else {
    return null
  }
}

export function calculateMultipleTransitions (options: MultipleTransitionsCalculatingOptions) {
  const { currentPercentage, transitions } = options
  const result: TransitionResult = {}
  for (const transition of transitions) {
    if (result[transition.key] === undefined || result[transition.key] === null) {
      result[transition.key] = calculateTransition({
        currentPercentage,
        transition
      })
    }
  }
  return result
}

function sortSteps (steps: TransitionPackStep[]) {
  return steps.sort((stepA, stepB) => {
    if (stepA.percentage.from - stepB.percentage.from < 0 || (stepA.percentage.from - stepB.percentage.from === 0 && stepA.percentage.to - stepB.percentage.to < 0)) {
      return -1
    } else {
      return stepA.percentage.from - stepB.percentage.from
    }
  })
}

function generateNoChangesStep (accordingTo: TransitionPackStep, isPrevious = true): TransitionPackStep {
  return {
    percentage: {
      from: isPrevious ? 0 : accordingTo.percentage.to,
      to: isPrevious ? accordingTo.percentage.from : 1
    },
    transitionValueSet: Object.fromEntries(
      Object.entries(accordingTo.transitionValueSet)
        .map((entry) => {
          const key = entry[0]
          const value: Range<number> = {
            from: entry[1][isPrevious ? 'from' : 'to'],
            to: entry[1][isPrevious ? 'from' : 'to']
          }
          return [key, value]
        })
    ),
    isAutoPatched: true
  }
}

function expandStepsLines (steps: TransitionPackStep[]) {
  return steps.map<TransitionPackStepsLine>((step) => {
    const lineSteps: TransitionPackStep[] = [step]
    lineSteps.unshift(generateNoChangesStep(step, true))
    lineSteps.push(generateNoChangesStep(step, false))
    return {
      steps: lineSteps
    }
  })
}

function getAllTransitionPercentagePointsFromStepLines (lines: TransitionPackStepsLine[]) {
  const percentagePoints = new Set<number>()
  lines.forEach((line) => {
    line.steps.forEach((step) => {
      percentagePoints.add(step.percentage.from)
      percentagePoints.add(step.percentage.to)
    })
  })
  return [...percentagePoints]
}

function generateEmptySteps (points: number[]) {
  const emptySteps: TransitionPackStep[] = []
  for (let i = 0; i < points.length - 1; i++) {
    const [from, to] = [points[i], points[i + 1]]
    emptySteps.push({
      percentage: {
        from,
        to
      },
      transitionValueSet: {}
    })
  }
  return emptySteps
}

function mergeStepsLines (lines: TransitionPackStepsLine[]) {
  const points = getAllTransitionPercentagePointsFromStepLines(lines)
  const mergedLine: TransitionPackStepsLine = {
    steps: generateEmptySteps(points)
  }
  mergedLine.steps.forEach((step) => {
    const { from, to } = step.percentage
    let entries: {
      key: string;
      value: Range<number>;
      isAutoPatched: boolean;
    }[] = []
    lines.forEach((line) => {
      const tempStep = line.steps.find((step) => step.percentage.from <= from && step.percentage.to >= to)
      if (tempStep) {
        const tempEntries = Object.entries(tempStep.transitionValueSet).map((entry) => {
          return {
            key: entry[0],
            value: entry[1],
            isAutoPatched: !!tempStep.isAutoPatched
          }
        })
        entries.push(...tempEntries)
      }
    })
    entries = entries.sort((entryA, entryB) => {
      if (!entryA.isAutoPatched && entryB.isAutoPatched) return -1
      else return 0
    })
    entries.forEach((entry) => {
      if (!step.transitionValueSet[entry.key]) {
        step.transitionValueSet[entry.key] = entry.value
      }
    })
  })
  return mergedLine
}

function completeTransitionPackSteps (originalSteps: TransitionPackStep[]) {
  const sortedSteps = sortSteps(originalSteps)
  const lines = expandStepsLines(sortedSteps)
  const mergedLine = mergeStepsLines(lines)
  const { steps } = mergedLine
  return steps
}

function generateTransitionsFromStep (step: TransitionPackStep) {
  const transitions: Transition[] = Object.entries(step.transitionValueSet)
    .map((entry) => {
      return {
        key: entry[0],
        percentage: step.percentage,
        value: entry[1]
      }
    })
  return transitions
}

export function transferTransitionPackToTransitions (transitionPack: TransitionPack) {
  const steps = completeTransitionPackSteps(transitionPack.steps)
  const transitions: Transition[] = []
  steps.forEach((step) => {
    transitions.push(...generateTransitionsFromStep(step))
  })
  return transitions
}

export function transferTransitionPackSetToTransitionSet (transitionPackSet: TransitionPackSet) {
  return Object.fromEntries(
    Object.entries(transitionPackSet)
      .map((entry) => [entry[0], transferTransitionPackToTransitions(entry[1])])
  )
}
