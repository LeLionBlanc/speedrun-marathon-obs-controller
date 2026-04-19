// Service Worker registration plugin
// This plugin only runs on the client side
import { useLocalCache } from '../composable/useLocalCache';

export default defineNuxtPlugin(() => {
  if (process.client && 'serviceWorker' in navigator) {
    const { setItem, getItem } = useLocalCache();
    
    // Store for service worker metrics
    const swMetrics = ref(getItem('sw_metrics', {
      cacheHits: 0,
      cacheMisses: 0,
      totalRequests: 0,
      networkFailures: 0,
      averageNetworkTime: 0,
      cacheHitRate: '0.00',
      timestamp: 0
    }));
    
    // Listen for messages from the service worker
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'sw-metrics') {
        // Update metrics
        swMetrics.value = event.data.metrics;
        
        // Store in local storage
        setItem('sw_metrics', swMetrics.value);
        
        console.log('Service Worker Metrics:', swMetrics.value);
      }
    });
    
    // Request metrics from service worker periodically
    const requestMetrics = () => {
      if (navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'get-metrics'
        });
      }
    };
    
    // Register the service worker
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then(registration => {
          console.log('ServiceWorker registration successful with scope:', registration.scope);
          
          // Request initial metrics after registration
          setTimeout(requestMetrics, 3000);
          
          // Set up periodic metrics requests
          setInterval(requestMetrics, 60000); // Every minute
        })
        .catch(error => {
          console.error('ServiceWorker registration failed:', error);
        });
    });
    
    // Expose service worker metrics to the app
    return {
      provide: {
        swMetrics
      }
    };
  }
  
  return {};
});