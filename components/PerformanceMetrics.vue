<template>
  <v-card class="performance-metrics">
    <v-card-title class="d-flex align-center">
      <v-icon icon="mdi-chart-line" class="mr-2" />
      Performance Metrics
      <v-spacer />
      <v-btn icon @click="refreshMetrics">
        <v-icon>mdi-refresh</v-icon>
      </v-btn>
    </v-card-title>
    
    <v-card-text>
      <v-tabs v-model="activeTab">
        <v-tab value="page">Page Load</v-tab>
        <v-tab value="resources">Resources</v-tab>
        <v-tab value="cache">Cache</v-tab>
        <v-tab value="network">Network</v-tab>
      </v-tabs>
      
      <v-window v-model="activeTab" class="mt-4">
        <!-- Page Load Metrics -->
        <v-window-item value="page">
          <v-row v-if="pageMetrics">
            <v-col cols="12" sm="6" md="4" v-for="(value, key) in pageMetrics" :key="key">
              <metric-card 
                :title="formatMetricName(key)" 
                :value="formatMetricValue(value)" 
                :icon="getMetricIcon(key)"
              />
            </v-col>
          </v-row>
          <v-alert v-else type="info" text="No page load metrics available yet" />
        </v-window-item>
        
        <!-- Resource Timing -->
        <v-window-item value="resources">
          <template v-if="resourceMetrics">
            <v-expansion-panels>
              <v-expansion-panel v-for="(resources, type) in resourceMetrics" :key="type">
                <v-expansion-panel-title>
                  {{ type }} Resources ({{ resources.length }})
                </v-expansion-panel-title>
                <v-expansion-panel-text>
                  <v-list>
                    <v-list-item v-for="(resource, i) in resources" :key="i">
                      <v-list-item-title>{{ resource.url }}</v-list-item-title>
                      <v-list-item-subtitle>
                        Duration: {{ resource.duration.toFixed(2) }}ms | 
                        Size: {{ formatBytes(resource.transferSize) }}
                      </v-list-item-subtitle>
                    </v-list-item>
                  </v-list>
                </v-expansion-panel-text>
              </v-expansion-panel>
            </v-expansion-panels>
          </template>
          <v-alert v-else type="info" text="No resource metrics available yet" />
        </v-window-item>
        
        <!-- Cache Metrics -->
        <v-window-item value="cache">
          <v-row v-if="cacheMetrics">
            <v-col cols="12" md="6">
              <v-card>
                <v-card-title>Cache Hit Rate</v-card-title>
                <v-card-text class="text-center">
                  <v-progress-circular
                    :model-value="parseFloat(cacheMetrics.cacheHitRate)"
                    :color="getCacheHitRateColor(cacheMetrics.cacheHitRate)"
                    size="100"
                    width="15"
                  >
                    {{ cacheMetrics.cacheHitRate }}%
                  </v-progress-circular>
                </v-card-text>
              </v-card>
            </v-col>
            <v-col cols="12" md="6">
              <v-list>
                <v-list-item>
                  <v-list-item-title>Cache Hits</v-list-item-title>
                  <v-list-item-subtitle>{{ cacheMetrics.cacheHits }}</v-list-item-subtitle>
                </v-list-item>
                <v-list-item>
                  <v-list-item-title>Cache Misses</v-list-item-title>
                  <v-list-item-subtitle>{{ cacheMetrics.cacheMisses }}</v-list-item-subtitle>
                </v-list-item>
                <v-list-item>
                  <v-list-item-title>Total Requests</v-list-item-title>
                  <v-list-item-subtitle>{{ cacheMetrics.totalRequests }}</v-list-item-subtitle>
                </v-list-item>
                <v-list-item>
                  <v-list-item-title>Network Failures</v-list-item-title>
                  <v-list-item-subtitle>{{ cacheMetrics.networkFailures }}</v-list-item-subtitle>
                </v-list-item>
              </v-list>
            </v-col>
          </v-row>
          <v-alert v-else type="info" text="No cache metrics available yet" />
        </v-window-item>
        
        <!-- Network Info -->
        <v-window-item value="network">
          <v-row v-if="networkInfo">
            <v-col cols="12" md="6">
              <v-card>
                <v-card-title>Connection Type</v-card-title>
                <v-card-text class="text-center">
                  <v-chip
                    :color="getConnectionColor(networkInfo.effectiveType)"
                    size="x-large"
                  >
                    {{ networkInfo.effectiveType }}
                  </v-chip>
                  <div class="mt-4" v-if="networkInfo.saveData">
                    <v-chip color="warning">Data Saver Mode</v-chip>
                  </div>
                </v-card-text>
              </v-card>
            </v-col>
            <v-col cols="12" md="6">
              <v-list>
                <v-list-item>
                  <v-list-item-title>Downlink</v-list-item-title>
                  <v-list-item-subtitle>{{ networkInfo.downlink }} Mbps</v-list-item-subtitle>
                </v-list-item>
                <v-list-item>
                  <v-list-item-title>Round Trip Time</v-list-item-title>
                  <v-list-item-subtitle>{{ networkInfo.rtt }} ms</v-list-item-subtitle>
                </v-list-item>
                <v-list-item>
                  <v-list-item-title>Low Data Mode</v-list-item-title>
                  <v-list-item-subtitle>
                    <v-icon :color="isLowDataMode ? 'warning' : 'success'">
                      {{ isLowDataMode ? 'mdi-check' : 'mdi-close' }}
                    </v-icon>
                    {{ isLowDataMode ? 'Enabled' : 'Disabled' }}
                  </v-list-item-subtitle>
                </v-list-item>
              </v-list>
            </v-col>
          </v-row>
          <v-alert v-else type="info" text="Network information not available" />
        </v-window-item>
      </v-window>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { usePerformanceMonitor } from '../composable/usePerformanceMonitor';
import { useLocalCache } from '../composable/useLocalCache';

// Tabs
const activeTab = ref('page');

// Get performance data
const { getItem } = useLocalCache();
const { measurePageLoad, getResourceTiming, getNetworkInfo, shouldUseLowDataMode } = usePerformanceMonitor();

// Performance data
const pageMetrics = ref<Record<string, number> | null>(null);
const resourceMetrics = ref<Record<string, any> | null>(null);
const cacheMetrics = ref<Record<string, any> | null>(getItem('sw_metrics', null));
const networkInfo = ref<Record<string, any> | null>(null);
const isLowDataMode = ref(false);

// Refresh metrics
const refreshMetrics = () => {
  // Page load metrics
  pageMetrics.value = measurePageLoad();
  
  // Resource timing
  resourceMetrics.value = getResourceTiming();
  
  // Cache metrics from local storage
  cacheMetrics.value = getItem('sw_metrics', null);
  
  // Network info
  networkInfo.value = getNetworkInfo();
  
  // Low data mode
  isLowDataMode.value = shouldUseLowDataMode();
};

// Format metric name for display
const formatMetricName = (key: string): string => {
  return key
    .replace(/([A-Z])/g, ' $1') // Add space before capital letters
    .replace(/^./, (str) => str.toUpperCase()) // Capitalize first letter
    .replace(/([a-z])([A-Z])/g, '$1 $2'); // Add space between camelCase words
};

// Format metric value
const formatMetricValue = (value: number): string => {
  return `${value.toFixed(2)} ms`;
};

// Get icon for metric
const getMetricIcon = (key: string): string => {
  const iconMap: Record<string, string> = {
    ttfb: 'mdi-server-network',
    domLoading: 'mdi-file-document-outline',
    domInteractive: 'mdi-gesture-tap',
    domComplete: 'mdi-check-circle-outline',
    loadTime: 'mdi-timer-outline',
    networkLatency: 'mdi-access-point-network',
    domProcessing: 'mdi-cog-outline',
    firstPaint: 'mdi-brush',
    firstContentfulPaint: 'mdi-palette',
    redirectTime: 'mdi-directions',
    dnsLookupTime: 'mdi-dns',
    tcpConnectionTime: 'mdi-lan-connect',
    serverResponseTime: 'mdi-server',
    contentDownloadTime: 'mdi-download'
  };
  
  return iconMap[key] || 'mdi-chart-line';
};

// Format bytes to human-readable format
const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Get color for cache hit rate
const getCacheHitRateColor = (rate: string): string => {
  const numRate = parseFloat(rate);
  if (numRate >= 80) return 'success';
  if (numRate >= 50) return 'warning';
  return 'error';
};

// Get color for connection type
const getConnectionColor = (type: string): string => {
  switch (type) {
    case '4g': return 'success';
    case '3g': return 'info';
    case '2g': return 'warning';
    case 'slow-2g': return 'error';
    default: return 'grey';
  }
};

// Initial load
onMounted(() => {
  refreshMetrics();
});
</script>

<style scoped>
.performance-metrics {
  max-width: 100%;
  overflow-x: hidden;
}
</style>