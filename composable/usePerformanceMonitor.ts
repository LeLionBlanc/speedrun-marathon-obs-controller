/**
 * Performance monitoring utility
 * Provides methods to measure and report performance metrics
 */

export const usePerformanceMonitor = () => {
  // Store performance marks and measures
  const marks = ref<Record<string, number>>({});
  const measures = ref<Record<string, number>>({});
  
  /**
   * Start timing a performance mark
   * @param name Name of the mark
   */
  const startMark = (name: string): void => {
    if (process.server) return;
    
    // Use Performance API if available
    if (window.performance && window.performance.mark) {
      window.performance.mark(`${name}-start`);
    }
    
    // Also track with Date for browsers without Performance API
    marks.value[name] = Date.now();
  };
  
  /**
   * End timing a performance mark and calculate duration
   * @param name Name of the mark (must match a previous startMark call)
   * @returns Duration in milliseconds
   */
  const endMark = (name: string): number | null => {
    if (process.server) return null;
    
    let duration: number | null = null;
    
    // Use Performance API if available
    if (window.performance && window.performance.mark && window.performance.measure) {
      window.performance.mark(`${name}-end`);
      
      try {
        window.performance.measure(name, `${name}-start`, `${name}-end`);
        const entries = window.performance.getEntriesByName(name);
        if (entries.length > 0) {
          duration = entries[0].duration;
        }
      } catch (e) {
        console.error(`Error measuring performance for ${name}:`, e);
      }
    }
    
    // Fall back to Date if Performance API failed or isn't available
    if (duration === null && marks.value[name]) {
      duration = Date.now() - marks.value[name];
    }
    
    if (duration !== null) {
      measures.value[name] = duration;
    }
    
    return duration;
  };
  
  /**
   * Get all recorded performance measures
   * @returns Record of all performance measures
   */
  const getAllMeasures = (): Record<string, number> => {
    return { ...measures.value };
  };
  
  /**
   * Measure initial page load performance
   * Should be called after the page is fully loaded
   * @returns Object with various load time metrics
   */
  const measurePageLoad = (): Record<string, number> | null => {
    if (process.server) return null;
    
    // Check for Performance API support
    if (!window.performance) return null;
    
    const metrics: Record<string, number> = {};
    
    // Use Navigation Timing API if available
    if (window.performance.timing) {
      const timing = window.performance.timing;
      
      metrics.ttfb = timing.responseStart - timing.navigationStart;
      metrics.domLoading = timing.domInteractive - timing.navigationStart;
      metrics.domInteractive = timing.domInteractive - timing.navigationStart;
      metrics.domComplete = timing.domComplete - timing.navigationStart;
      metrics.loadTime = timing.loadEventEnd - timing.navigationStart;
      metrics.networkLatency = timing.responseEnd - timing.fetchStart;
      metrics.domProcessing = timing.domComplete - timing.domLoading;
      metrics.redirectTime = timing.redirectEnd - timing.redirectStart;
      metrics.dnsLookupTime = timing.domainLookupEnd - timing.domainLookupStart;
      metrics.tcpConnectionTime = timing.connectEnd - timing.connectStart;
      metrics.serverResponseTime = timing.responseEnd - timing.requestStart;
      metrics.contentDownloadTime = timing.responseEnd - timing.responseStart;
    }
    
    // Add First Paint and First Contentful Paint metrics if available
    const paintMetrics = getPaintMetrics();
    if (paintMetrics) {
      Object.assign(metrics, paintMetrics);
    }
    
    // Add memory usage if available (Chrome-specific)
    // Need to use any type since this is a non-standard Chrome extension
    const perf = window.performance as any;
    if (perf && perf.memory) {
      metrics.jsHeapSizeLimit = perf.memory.jsHeapSizeLimit;
      metrics.totalJSHeapSize = perf.memory.totalJSHeapSize;
      metrics.usedJSHeapSize = perf.memory.usedJSHeapSize;
    }
    
    return metrics;
  };
  
  /**
   * Get paint timing metrics (FP, FCP)
   * @returns Object with paint timing metrics
   */
  const getPaintMetrics = (): Record<string, number> | null => {
    if (process.server || !window.performance || !window.performance.getEntriesByType) {
      return null;
    }
    
    const metrics: Record<string, number> = {};
    const paintMetrics = window.performance.getEntriesByType('paint');
    
    paintMetrics.forEach(entry => {
      if (entry.name === 'first-paint') {
        metrics.firstPaint = entry.startTime;
      } else if (entry.name === 'first-contentful-paint') {
        metrics.firstContentfulPaint = entry.startTime;
      }
    });
    
    return Object.keys(metrics).length > 0 ? metrics : null;
  };
  
  /**
   * Get resource timing information for critical resources
   * @param resourceTypes Types of resources to include (e.g., 'script', 'css', 'img')
   * @param limit Maximum number of resources to include per type
   * @returns Object with resource timing information
   */
  const getResourceTiming = (resourceTypes: string[] = ['script', 'css', 'img', 'fetch'], limit: number = 5): Record<string, any> | null => {
    if (process.server || !window.performance || !window.performance.getEntriesByType) {
      return null;
    }
    
    const resources = window.performance.getEntriesByType('resource');
    const result: Record<string, any> = {};
    
    // Group resources by type
    resourceTypes.forEach(type => {
      const typeResources = resources
        .filter(resource => {
          const url = resource.name;
          switch (type) {
            case 'script': return url.endsWith('.js');
            case 'css': return url.endsWith('.css');
            case 'img': return /\.(png|jpg|jpeg|gif|svg|webp)$/.test(url);
            case 'fetch': return !url.match(/\.(js|css|png|jpg|jpeg|gif|svg|webp)$/);
            default: return false;
          }
        })
        .map(resource => ({
          url: resource.name.split('/').pop(),
          duration: resource.duration,
          transferSize: (resource as PerformanceResourceTiming).transferSize || 0,
          startTime: resource.startTime
        }))
        .sort((a, b) => b.duration - a.duration) // Sort by duration (slowest first)
        .slice(0, limit); // Limit number of resources
      
      if (typeResources.length > 0) {
        result[type] = typeResources;
      }
    });
    
    return Object.keys(result).length > 0 ? result : null;
  };
  
  /**
   * Log performance metrics to console
   * @param metrics Metrics to log
   */
  const logMetrics = (metrics: Record<string, number>): void => {
    if (process.server) return;
    
    console.group('Performance Metrics');
    Object.entries(metrics).forEach(([key, value]) => {
      console.log(`${key}: ${value.toFixed(2)}ms`);
    });
    console.groupEnd();
  };
  
  /**
   * Get network connection information
   * @returns Object with network connection details or null if not supported
   */
  const getNetworkInfo = (): Record<string, any> | null => {
    if (process.server) return null;
    
    // Check if Network Information API is available
    const connection = (navigator as any).connection ||
                      (navigator as any).mozConnection ||
                      (navigator as any).webkitConnection;
    
    if (!connection) return null;
    
    return {
      effectiveType: connection.effectiveType || 'unknown', // 4g, 3g, 2g, slow-2g
      downlink: connection.downlink, // Mbps
      rtt: connection.rtt, // Round trip time in ms
      saveData: connection.saveData || false // Data saver mode
    };
  };
  
  /**
   * Determine if the app should use low-data mode based on connection
   * @returns Boolean indicating if low-data mode should be used
   */
  const shouldUseLowDataMode = (): boolean => {
    if (process.server) return false;
    
    const networkInfo = getNetworkInfo();
    if (!networkInfo) return false;
    
    // Use low data mode if explicitly requested via saveData
    if (networkInfo.saveData) return true;
    
    // Use low data mode on slow connections
    if (networkInfo.effectiveType === '2g' || networkInfo.effectiveType === 'slow-2g') return true;
    
    // Use low data mode if RTT is high (> 500ms) or downlink is low (< 1Mbps)
    if ((networkInfo.rtt && networkInfo.rtt > 500) ||
        (networkInfo.downlink && networkInfo.downlink < 1)) {
      return true;
    }
    
    return false;
  };
  
  return {
    startMark,
    endMark,
    getAllMeasures,
    measurePageLoad,
    getPaintMetrics,
    getResourceTiming,
    getNetworkInfo,
    shouldUseLowDataMode,
    logMetrics
  };
};