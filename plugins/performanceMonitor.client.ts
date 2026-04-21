/**
 * Performance monitoring plugin
 * Automatically measures page load performance and tracks critical user interactions
 */
import { usePerformanceMonitor } from '../composable/usePerformanceMonitor';
import { useLocalCache } from '../composable/useLocalCache';

export default defineNuxtPlugin((nuxtApp) => {
  // Only run on client side
  if (process.server) return;
  
  // Import the performance monitor composable
  const {
    measurePageLoad,
    getResourceTiming,
    startMark,
    endMark,
    getNetworkInfo,
    shouldUseLowDataMode,
    logMetrics
  } = usePerformanceMonitor();
  
  // Import local cache for storing metrics
  const { setItem, getItem } = useLocalCache();
  
  // Store for historical performance data
  const performanceHistory = ref<Record<string, any>[]>(
    getItem<Record<string, any>[]>('performance_history', [])
  );
  
  // Network connection info
  const networkInfo = ref(getNetworkInfo());
  
  // Low data mode state
  const isLowDataMode = ref(shouldUseLowDataMode());
  
  // Expose to the app
  const performanceState = {
    isLowDataMode,
    networkInfo,
    performanceHistory
  };
  
  // Measure page load performance when the page is fully loaded
  window.addEventListener('load', () => {
    // Wait a moment to ensure all resources are loaded
    setTimeout(() => {
      // Get basic metrics
      const metrics = measurePageLoad();
      
      if (metrics) {
        // Get resource timing for critical resources
        const resourceTiming = getResourceTiming();
        
        // Combine metrics
        const allMetrics = {
          ...metrics,
          timestamp: Date.now(),
          url: window.location.pathname,
          resources: resourceTiming,
          connection: networkInfo.value
        };
        
        // Log metrics to console
        logMetrics(metrics);
        
        // Store in history (keep last 10 page loads)
        performanceHistory.value.push(allMetrics);
        if (performanceHistory.value.length > 10) {
          performanceHistory.value.shift();
        }
        
        // Save to local storage
        setItem('performance_history', performanceHistory.value);
        
        // Could also send metrics to an analytics service here
      }
    }, 100);
  });
  
  // Track navigation performance using Nuxt hooks
  let currentNavPath: string | null = null;

  nuxtApp.hook('page:start', () => {
    currentNavPath = useRouter().currentRoute.value.path;
    startMark(`navigation:${currentNavPath}`);
  });

  nuxtApp.hook('page:finish', () => {
    if (currentNavPath) {
      endMark(`navigation:${currentNavPath}`);
      currentNavPath = null;
    }
  });
  
  // Add custom performance marks for key user interactions
  const trackInteraction = (elementId: string, eventType: string) => {
    const element = document.getElementById(elementId);
    if (element) {
      element.addEventListener(eventType, () => {
        const markName = `interaction:${elementId}:${eventType}`;
        startMark(markName);
        
        // Use requestAnimationFrame to measure time to next render
        requestAnimationFrame(() => {
          endMark(markName);
        });
      });
    }
  };
  
  // Expose performance monitoring to the app
  return {
    provide: {
      performance: {
        ...performanceState,
        trackInteraction
      }
    }
  };
});