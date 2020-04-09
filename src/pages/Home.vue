<template>
  <div id="home">
    <div class="scrolling-area"></div>
    <div class="main-container">
      <div class="logo floating-wrapper">
        <div class="floating-container" :style="logoContainerStyle">
          <LogoSVG class="svg"></LogoSVG>
        </div>
      </div>

      <div class="title floating-wrapper">
        <div class="floating-container" :style="titleContainerStyle">
          <TitleSVG class="svg"></TitleSVG>
        </div>
      </div>

      <!-- <div class="floating-wrapper">
        <div class="floating-container">
          <h1 class="header-ch">
            <span v-for="char in headerCH" :key="`header-ch-char-${char}`">
              {{ char }}
            </span>
          </h1>
        </div>
      </div> -->
    </div>
  </div>
</template>

<script lang="ts">
import { Vue, Component } from 'vue-property-decorator'
import LogoSVG from '@/assets/images/npc-logo.svg'
import TitleSVG from '@/assets/images/npc-title.svg'
import transitionSet from '@/assets/transition-sets/pages/home'
import { calculateMultipleTransitions, TransitionSet } from '@/utils/transition'
import appModule from '../store/modules/app'

interface ScrollingTransition {
  fromPercentage: number;
  toPercentage: number;
  values: {
    from: number;
    to: number;
  }[];
}

@Component({
  components: {
    LogoSVG,
    TitleSVG
  }
})
export default class Home extends Vue {
  private scrollingPercentage = 0
  private scrollingTransitionTime = 1
  private updateScrollingPercentage = function () { /* pass */ }
  private transitionSet: TransitionSet = transitionSet
  private headerCH = '北科程式設計研究社'

  private get logoContainerStyle () {
    let translateXKey = 'translateX'
    if (appModule.isTablet) {
      translateXKey = 'translateXTablet'
    } else if (appModule.isMobile) {
      translateXKey = 'translateXMobile'
    }
    const result = calculateMultipleTransitions({
      currentPercentage: this.scrollingPercentage,
      transitions: this.transitionSet.npcLogo
    })
    return {
      // transition: `all linear ${this.scrollingTransitionTime}ms`,
      '--svg-color': `hsl(${result.svgColorHue}turn, 50%, 50%)`,
      opacity: result.opacity,
      transform: `translateX(${result[translateXKey]}%) translateY(calc(-50% - ${result.translateY}px)) translateZ(0) rotate(${result.rotate}turn) scale(${result.scale})`
    }
  }

  private get titleContainerStyle () {
    let translateXKey = 'translateX'
    if (appModule.isTablet) {
      translateXKey = 'translateXTablet'
    } else if (appModule.isMobile) {
      translateXKey = 'translateXMobile'
    }
    const result = calculateMultipleTransitions({
      currentPercentage: this.scrollingPercentage,
      transitions: this.transitionSet.npcTitle
    })
    return {
      // transition: `all linear ${this.scrollingTransitionTime}ms`,
      '--svg-color': `hsl(${result.svgColorHue}turn, 50%, 50%)`,
      opacity: result.opacity,
      transform: `translateX(${result[translateXKey]}%) translateY(calc(-50% - ${result.translateY}px)) translateZ(0) rotate(${result.rotate}turn) scale(${result.scale})`
    }
  }

  private genUpdateScrollingPercentageFunction () {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const vm = this
    const gap = 1
    let timeout = -1
    return function (this: Home) {
      if (timeout === -1) {
        timeout = setTimeout(() => {
          const appElement = document.getElementById('app')
          const pageElement = document.getElementById('home')
          if (!appElement || !pageElement) return
          const [totalHeight, scrollTop, windowHeight] = [pageElement.offsetHeight, appElement.scrollTop, window.innerHeight]
          const newScrollingPercentage = scrollTop / (totalHeight - windowHeight)
          vm.scrollingTransitionTime = 1
          vm.scrollingPercentage = newScrollingPercentage
          timeout = -1
        }, gap)
      }
    }
  }

  private mounted () {
    this.updateScrollingPercentage = this.genUpdateScrollingPercentageFunction()
    const appElement = document.getElementById('app')
    if (appElement) appElement.addEventListener('scroll', this.updateScrollingPercentage)

    this.$emit('page-load')
  }

  private beforeDestroy () {
    const appElement = document.getElementById('app')
    if (appElement) appElement.removeEventListener('scroll', this.updateScrollingPercentage)
  }
}
</script>
