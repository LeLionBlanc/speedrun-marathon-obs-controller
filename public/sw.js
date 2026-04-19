// Service Worker for OBS Controller
const CACHE_NAME = 'obs-controller-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/dashboard',
  // Add other important assets and routes
];

// Performance metrics tracking
const performanceMetrics = {
  cacheHits: 0,
  cacheMisses: 0,
  totalRequests: 0,
  networkFailures: 0,
  averageNetworkTime: 0,
  totalNetworkTime: 0,
  networkRequests: 0
};

// Function to calculate cache hit rate
const calculateCacheHitRate = () => {
  if (performanceMetrics.totalRequests === 0) return 0;
  return (performanceMetrics.cacheHits / performanceMetrics.totalRequests * 100).toFixed(2);
};

// Function to post metrics to the main thread
const postMetricsToMain = () => {
  const metrics = {
    ...performanceMetrics,
    cacheHitRate: calculateCacheHitRate(),
    timestamp: Date.now()
  };
  
  self.clients.matchAll().then(clients => {
    clients.forEach(client => {
      client.postMessage({
        type: 'sw-metrics',
        metrics
      });
    });
  });
};

// Schedule regular metrics reporting
setInterval(postMetricsToMain, 60000); // Report every minute

// Install event - cache assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Cache opened');
        return cache.addAll(urlsToCache);
      })
  );
});

// Fetch event - serve from cache, fall back to network
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;
  
  // Skip browser-sync and other development resources
  if (event.request.url.includes('browser-sync') ||
      event.request.url.includes('webpack-hmr') ||
      event.request.url.includes('sockjs-node')) {
    return;
  }
  
  performanceMetrics.totalRequests++;
  const fetchStart = performance.now();
  
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Cache hit - return the response from cache
        if (response) {
          performanceMetrics.cacheHits++;
          return response;
        }

        // Cache miss
        performanceMetrics.cacheMisses++;
        
        // Clone the request because it's a one-time use stream
        const fetchRequest = event.request.clone();

        return fetch(fetchRequest)
          .then((response) => {
            // Track network time
            const fetchEnd = performance.now();
            const networkTime = fetchEnd - fetchStart;
            performanceMetrics.totalNetworkTime += networkTime;
            performanceMetrics.networkRequests++;
            performanceMetrics.averageNetworkTime =
              performanceMetrics.totalNetworkTime / performanceMetrics.networkRequests;
            
            // Check if we received a valid response
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clone the response because it's a one-time use stream
            const responseToCache = response.clone();

            // Cache the fetched resource
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });

            return response;
          })
          .catch(error => {
            performanceMetrics.networkFailures++;
            console.error('Fetch failed:', error);
            throw error;
          });
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];

  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            // Delete old caches
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Listen for messages from the main thread
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'get-metrics') {
    postMetricsToMain();
  }
});