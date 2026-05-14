import AOS from 'aos'
import { defineNuxtPlugin, onNuxtReady } from '#app'

export default defineNuxtPlugin((nuxtApp) => {
  onNuxtReady(() => {
    AOS.init({
      duration: 700,
      easing: 'ease-out-cubic',
      once: true,
      offset: 80,
    })
  })

  nuxtApp.hook('page:finish', () => {
    window.requestAnimationFrame(() => AOS.refresh())
  })
})
