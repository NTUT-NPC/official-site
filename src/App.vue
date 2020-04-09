<template>
  <div id="app" :class="[themeClass]">
    <router-view class="page-container" @page-load="onPageLoaded" />
  </div>
</template>

<script lang="ts">
import { Vue, Component } from 'vue-property-decorator'
import appModule, { DeviceType, ThemeMode } from '@/store/modules/app'

@Component
export default class App extends Vue {
  private get themeClass () {
    return appModule.themeClass
  }

  private onPageLoaded () {
    document.dispatchEvent(new Event('x-app-rendered'))
  }

  private detectDeviceType () {
    const windowWidth = window.innerWidth
    const root = document.documentElement
    const mobileMaxWidth = parseInt(getComputedStyle(root).getPropertyValue('--mobile-max-width').replace('px', ''))
    const tabletMaxWidth = parseInt(getComputedStyle(root).getPropertyValue('--tablet-max-width').replace('px', ''))
    const laptopMaxWidth = parseInt(getComputedStyle(root).getPropertyValue('--laptop-max-width').replace('px', ''))
    if (windowWidth > laptopMaxWidth) {
      appModule.setDeviceType(DeviceType.Desktop)
    } else if (windowWidth > tabletMaxWidth) {
      appModule.setDeviceType(DeviceType.Laptop)
    } else if (windowWidth > mobileMaxWidth) {
      appModule.setDeviceType(DeviceType.Tablet)
    } else {
      appModule.setDeviceType(DeviceType.Mobile)
    }
  }

  private detectSystemPrefersColorSchema () {
    if (!window.matchMedia) return 'light'
    const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches
    return isDarkMode ? 'dark' : 'light'
  }

  private detectLocalStorageColorSchema () {
    const availableValues = ['auto', 'light', 'dark']
    let colorSchema = `${localStorage.getItem('colorSchema')}`
    if (!availableValues.includes(colorSchema)) colorSchema = 'auto'
    return colorSchema
  }

  private detectColorSchema () {
    let colorSchema = 'light'
    const localStorageColorSchema = this.detectLocalStorageColorSchema()
    if (localStorageColorSchema === 'auto') {
      colorSchema = this.detectSystemPrefersColorSchema()
    } else {
      colorSchema = localStorageColorSchema
    }
    appModule.setThemeMode(colorSchema === 'dark' ? ThemeMode.Dark : ThemeMode.Light)
  }

  private mounted () {
    this.detectDeviceType()
    window.addEventListener('resize', this.detectDeviceType)

    this.detectColorSchema()
    window.matchMedia('(prefers-color-scheme: dark)').addListener(this.detectColorSchema)
  }

  private beforeDestroy () {
    window.removeEventListener('resize', this.detectDeviceType)
    window.matchMedia('(prefers-color-scheme: dark)').removeListener(this.detectColorSchema)
  }
}
</script>
