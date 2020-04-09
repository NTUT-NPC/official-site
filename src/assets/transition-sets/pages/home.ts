import { TransitionPackSet, TransitionSet, transferTransitionPackSetToTransitionSet } from '@/utils/transition'
const transitionPackSet: TransitionPackSet = {
  npcLogo: {
    steps: [
      {
        percentage: {
          from: 0,
          to: 0.5
        },
        transitionValueSet: {
          scale: {
            from: 2,
            to: 0
          },
          translateX: {
            from: -50,
            to: -50
          },
          translateY: {
            from: 0,
            to: 0
          },
          svgColorHue: {
            from: 0,
            to: 1
          },
          rotate: {
            from: 0,
            to: 10
          }
        }
      }
    ]
  },
  npcTitle: {
    steps: [
      {
        percentage: {
          from: 0,
          to: 0.5
        },
        transitionValueSet: {
          scale: {
            from: 2,
            to: 0
          },
          translateX: {
            from: -50,
            to: -50
          },
          translateY: {
            from: 0,
            to: 0
          },
          rotate: {
            from: 0,
            to: 10
          }
        }
      }
    ]
  }
}

const transitionSet: TransitionSet = transferTransitionPackSetToTransitionSet(transitionPackSet)

export default transitionSet
