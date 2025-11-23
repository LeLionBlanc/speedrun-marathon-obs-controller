// import this after install `@mdi/font` package
import '@mdi/font/css/materialdesignicons.css'

import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import { md3 } from 'vuetify/blueprints'

export default defineNuxtPlugin((app) => {
  const vuetify = createVuetify({
    blueprint: md3,
    theme: {
      defaultTheme: 'light',
      themes: {
        light: {
          dark: false,
          colors: {
            primary: '#1976D2',
            secondary: '#424242',
            accent: '#82B1FF',
            error: '#FF5252',
            info: '#2196F3',
            success: '#4CAF50',
            warning: '#FB8C00',
            background: '#F5F5F5',
          }
        },
        dark: {
          dark: true,
          colors: {
            primary: '#2196F3',
            secondary: '#757575',
            accent: '#FF4081',
            error: '#FF5252',
            info: '#2196F3',
            success: '#4CAF50',
            warning: '#FB8C00',
            background: '#121212',
          }
        }
      }
    },
    defaults: {
      VBtn: {
        variant: 'elevated',
        rounded: 'md',
      },
      VCard: {
        rounded: 'lg',
      },
      VTextField: {
        variant: 'outlined',
        density: 'comfortable',
      },
      VTextarea: {
        variant: 'outlined',
        density: 'comfortable',
      },
    }
  })
  app.vueApp.use(vuetify)
})
