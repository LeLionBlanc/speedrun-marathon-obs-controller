import vuetify, { transformAssetUrls } from 'vite-plugin-vuetify'

export default defineNuxtConfig({
  // Improve build performance
  build: {
    transpile: ['vuetify'],
    // Enable build cache for faster rebuilds
    cache: true,
  },

  // Optimize module loading
  modules: [
    '@pinia/nuxt',
    (_options, nuxt) => {
      nuxt.hooks.hook('vite:extendConfig', (config) => {
        // @ts-expect-error
        config.plugins.push(vuetify({ autoImport: true }))
      })
    },
  ],

  // Improve runtime performance
  app: {
    // Enable page transitions for smoother navigation
    pageTransition: { name: 'page', mode: 'out-in' },
    // Set proper cache headers
    head: {
      htmlAttrs: {
        lang: 'en'
      },
      link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' }
      ]
    }
  },

  // Optimize Vite configuration
  vite: {
    // Improve build speed
    build: {
      // Optimize chunk size
      chunkSizeWarningLimit: 1000,
      // Minify output
      minify: 'terser',
      // Terser options
      terserOptions: {
        compress: {
          drop_console: false,
          drop_debugger: true
        }
      }
    },
    // Optimize CSS
    css: {
      devSourcemap: false
    },
    // Optimize Vue template compilation
    vue: {
      template: {
        transformAssetUrls,
      },
    },
    // Optimize dependencies
    optimizeDeps: {
      include: [
        'vue',
        'vue-router',
        'vuetify',
        'pinia'
      ]
    },
    // Enable server-side rendering optimizations
    ssr: {
      noExternal: ['vuetify']
    }
  },

  // Enable nitro optimizations
  nitro: {
    // Enable compression for faster asset delivery
    compressPublicAssets: true,
    // Minify output
    minify: true
  },

  // Improve TypeScript performance
  typescript: {
    strict: true,
    typeCheck: false // Disable type checking during development for faster builds
  },

  // Set proper compatibility date
  compatibilityDate: '2024-11-20',
})