import store from '@/store'
import { Module, Mutation, VuexModule, getModule } from 'vuex-module-decorators'

export enum DeviceType {
  Mobile,
  Tablet,
  Laptop,
  Desktop
}

export enum Theme {
  Default = 'default'
}

export enum ThemeMode {
  Light = 'light',
  Dark = 'dark'
}

@Module({ dynamic: true, store, name: 'app' })
class AppModule extends VuexModule {
  deviceType = DeviceType.Desktop
  theme = Theme.Default
  themeMode = ThemeMode.Light

  get isMobile () {
    return this.deviceType === DeviceType.Mobile
  }

  get isTablet () {
    return this.deviceType === DeviceType.Tablet
  }

  get isLaptop () {
    return this.deviceType === DeviceType.Laptop
  }

  get isDesktop () {
    return this.deviceType === DeviceType.Desktop
  }

  get themeClass () {
    return `theme-${this.theme.toLowerCase()}-${this.themeMode.toLowerCase()}`
  }

  @Mutation
  setDeviceType (deviceType: DeviceType) {
    this.deviceType = deviceType
  }

  @Mutation
  setTheme (theme: Theme) {
    this.theme = theme
  }

  @Mutation
  setThemeMode (themeMode: ThemeMode) {
    this.themeMode = themeMode
  }
}

const appModule = getModule(AppModule)

export default appModule
