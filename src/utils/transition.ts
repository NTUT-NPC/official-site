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

interface TransitionValueSet {
  [key: string]: Range<number>;
}

interface TransitionPackStep {
  percentage: Range<number>;
  transitionValueSet: TransitionValueSet;
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

function diffStepsTransitionValueSetKey (sortedSteps: TransitionPackStep[]) {
  const objs = sortedSteps.map((step) => step.transitionValueSet)
  const keyCount: { [key: string]: number } = {}
  for (const obj of objs) {
    for (const key of Object.keys(obj)) {
      keyCount[key] = keyCount[key] || 0
      keyCount[key] += 1
    }
  }

  return Object.entries(keyCount).filter((entry) => entry[1] <= sortedSteps.length).map((entry) => entry[0])
}

function deepClone<T> (obj: T) {
  return JSON.parse(JSON.stringify(obj)) as T
}

function generateStartStep (percentageTo: number): TransitionPackStep {
  return {
    percentage: {
      from: 0,
      to: percentageTo
    },
    transitionValueSet: {}
  }
}

function patchTransitionValueSetKeysFromNextSteps (options: {
  previousStep?: TransitionPackStep;
  currentStep: TransitionPackStep;
  nextSteps: TransitionPackStep[];
  diffKeys: string[];
}) {
  const { previousStep, currentStep, nextSteps, diffKeys } = options
  const clonedCurrentStep = deepClone(currentStep)
  for (const key of diffKeys) {
    if (clonedCurrentStep.transitionValueSet[key]) continue
    const nextStep = nextSteps.find((step) => step.transitionValueSet[key])
    const patchedValue = previousStep?.transitionValueSet[key] || nextStep?.transitionValueSet[key]
    const isPatchedFromPrevious = !!previousStep?.transitionValueSet[key]

    if (!patchedValue) continue
    clonedCurrentStep.transitionValueSet[key] = {
      from: isPatchedFromPrevious ? patchedValue.to : patchedValue.from,
      to: isPatchedFromPrevious ? patchedValue.to : patchedValue.from
    }
  }
  return clonedCurrentStep
}

function generateNoChangesTransitionValueSet (originalTransitionValueSet: TransitionValueSet) {
  return Object.fromEntries(
    Object.entries(originalTransitionValueSet)
      .map((entry) => {
        const key = entry[0]
        const value: Range<number> = {
          from: entry[1].to,
          to: entry[1].to
        }
        return [key, value]
      })
  )
}

function fillNoChangesSteps (patchedSteps: TransitionPackStep[]) {
  const filledSteps: TransitionPackStep[] = []
  patchedSteps.forEach((step, index, { length }) => {
    let nextStepPercentageTo: number
    if (index === length - 1) {
      nextStepPercentageTo = 1
    } else {
      nextStepPercentageTo = patchedSteps[index + 1].percentage.from
    }
    filledSteps.push(step)
    if (step.percentage.to !== nextStepPercentageTo) {
      const noChangesStep: TransitionPackStep = {
        percentage: {
          from: step.percentage.to,
          to: nextStepPercentageTo
        },
        transitionValueSet: generateNoChangesTransitionValueSet(step.transitionValueSet)
      }
      filledSteps.push(noChangesStep)
    }
  })
  return filledSteps
}

function completeTransitionPackSteps (originalSteps: TransitionPackStep[]) {
  let steps = sortSteps(originalSteps)
  const diffKeys = diffStepsTransitionValueSetKey(steps)
  if (steps[0].percentage.from !== 0) {
    steps.unshift(generateStartStep(steps[0].percentage.from))
  }

  steps.forEach((step, index) => {
    steps[index] = patchTransitionValueSetKeysFromNextSteps({
      previousStep: steps[index - 1],
      currentStep: step,
      nextSteps: steps.slice(index + 1),
      diffKeys
    })
  })

  steps = fillNoChangesSteps(steps)

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
  for (const step of steps) {
    transitions.push(...generateTransitionsFromStep(step))
  }
  return transitions
}

export function transferTransitionPackSetToTransitionSet (transitionPackSet: TransitionPackSet) {
  return Object.fromEntries(
    Object.entries(transitionPackSet)
      .map((entry) => [entry[0], transferTransitionPackToTransitions(entry[1])])
  )
}
