<template>
  <v-container fluid>
    <v-card elevation="2">
      <v-tabs
        v-model="activeTab"
        bg-color="primary"
        align-tabs="center"
        show-arrows
        slider-color="white"
        height="56"
      >
        <v-tab value="home" to="/" class="px-4" :ripple="false">
          <v-icon start>mdi-home</v-icon>
          <span class="font-weight-medium">Home</span>
        </v-tab>
        <v-tab value="planning" @click="step = 'planning'" class="px-4" :ripple="false">
          <v-icon start>mdi-calendar</v-icon>
          <span class="font-weight-medium">Planning</span>
        </v-tab>
        <v-tab value="txt" @click="step = 'txt'" class="px-4" :ripple="false">
          <v-icon start>mdi-text</v-icon>
          <span class="font-weight-medium">Text Sources</span>
        </v-tab>
        <v-tab value="streamTitle" @click="step = 'streamTitle'" class="px-4" :ripple="false">
          <v-icon start>mdi-format-title</v-icon>
          <span class="font-weight-medium">Stream Title</span>
        </v-tab>
        <v-tab value="bluesky" @click="step = 'bluesky'" class="px-4" :ripple="false">
          <v-icon start>mdi-send</v-icon>
          <span class="font-weight-medium">Bluesky</span>
        </v-tab>
      </v-tabs>
    </v-card>

    <v-card class="mt-4" flat :style="{ marginTop: '16px' }">
      <v-card-text>
        <v-window v-model="step">
          <v-window-item value="home">
            <v-row justify="center">
              <v-col cols="12" md="8">
                <v-card variant="outlined">
                  <v-card-title class="text-h5">
                    OBS Controller Dashboard
                  </v-card-title>
                  <v-card-text>
                    <p>Select a tab above to manage your OBS stream.</p>
                    <v-alert
                      type="info"
                      variant="tonal"
                      class="mt-4"
                    >
                      This dashboard allows you to control OBS text sources and manage your stream planning.
                    </v-alert>
                  </v-card-text>
                </v-card>
              </v-col>
            </v-row>
          </v-window-item>

          <v-window-item value="planning">
            <Planning :auto-post-enabled="blueskyAutoPostEnabled" />
          </v-window-item>

          <v-window-item value="txt">
            <DisplayTest />
          </v-window-item>

          <v-window-item value="streamTitle">
            <StreamTitleConfig :current-run="currentRunData" />
          </v-window-item>

          <v-window-item value="incentives">
            <v-row>
              <v-col cols="12" md="8" :order="isMobile ? 2 : 1">
                <v-card class="mb-4">
                  <v-card-title class="d-flex align-center">
                    <div class="d-flex align-center">
                      <v-icon icon="mdi-trophy" class="mr-2"></v-icon>
                      Active Incentives
                    </div>
                    <v-spacer></v-spacer>
                    <div class="d-flex align-center">
                      <v-btn
                        icon="mdi-refresh"
                        variant="text"
                        size="small"
                        class="mr-2"
                        @click="refreshIncentives"
                        :loading="incentivesLoading"
                        :disabled="incentivesLoading"
                      ></v-btn>
                      <v-btn
                        color="primary"
                        variant="text"
                        :to="{ path: '/incentives' }"
                        prepend-icon="mdi-cog"
                      >
                        Manage
                      </v-btn>
                    </div>
                  </v-card-title>
                  <v-card-text>
                    <div v-if="incentivesLoading" class="d-flex justify-center my-4">
                      <v-progress-circular indeterminate color="primary"></v-progress-circular>
                    </div>
                    
                    <div v-else-if="incentives.length === 0" class="text-center my-4">
                      <v-icon icon="mdi-information-outline" size="large" color="grey"></v-icon>
                      <p class="text-body-1 mt-2">No active incentives found</p>
                    </div>
                    
                    <div v-else>
                      <v-row>
                        <v-col
                          v-for="incentive in incentives.slice(0, 3)"
                          :key="incentive.id"
                          cols="12"
                          sm="6"
                          lg="4"
                        >
                          <IncentiveDisplay
                            :incentive="incentive"
                            @click="selectedDashboardIncentive = incentive"
                            :auto-refresh="dashboardAutoRefresh"
                            :refresh-interval="30000"
                            @refresh="refreshIncentives"
                          />
                        </v-col>
                      </v-row>
                      
                      <div v-if="incentives.length > 3" class="text-center mt-2">
                        <v-btn
                          variant="text"
                          color="primary"
                          :to="{ path: '/incentives' }"
                        >
                          View All ({{ incentives.length }})
                          <v-icon end>mdi-chevron-right</v-icon>
                        </v-btn>
                      </div>
                    </div>
                  </v-card-text>
                </v-card>
                
                <v-card>
                  <v-card-text>
                    <v-switch
                      v-model="dashboardAutoRefresh"
                      label="Auto-refresh incentives"
                      color="primary"
                      hide-details
                    ></v-switch>
                  </v-card-text>
                </v-card>
              </v-col>
              
              <v-col cols="12" md="4" :order="isMobile ? 1 : 2">
                <v-card v-if="selectedDashboardIncentive">
                  <v-card-title class="d-flex align-center">
                    {{ selectedDashboardIncentive.name }}
                    <v-spacer></v-spacer>
                    <v-btn
                      v-if="isMobile"
                      icon="mdi-close"
                      variant="text"
                      size="small"
                      @click="selectedDashboardIncentive = null"
                    ></v-btn>
                  </v-card-title>
                  <v-card-text>
                    <p class="mb-4">{{ selectedDashboardIncentive.description }}</p>
                    
                    <IncentiveDisplay
                      :incentive="selectedDashboardIncentive"
                      :show-details="false"
                      :margin-bottom="false"
                      :auto-refresh="dashboardAutoRefresh"
                      :refresh-interval="30000"
                      @refresh="refreshIncentives"
                    />
                    
                    <v-divider class="my-4"></v-divider>
                    
                    <div class="d-flex flex-wrap justify-space-between align-center">
                      <div class="mb-2 mb-sm-0">
                        <div class="text-subtitle-2">Target</div>
                        <div class="text-h6">{{ selectedDashboardIncentive.target_amount.toLocaleString() }}</div>
                      </div>
                      <div class="mb-2 mb-sm-0">
                        <div class="text-subtitle-2">Current</div>
                        <div class="text-h6">{{ selectedDashboardIncentive.current_amount.toLocaleString() }}</div>
                      </div>
                    </div>
                  </v-card-text>
                </v-card>
                
                <v-card v-else>
                  <v-card-title>Incentive Details</v-card-title>
                  <v-card-text class="text-center pa-4">
                    <v-icon icon="mdi-hand-pointing-left" size="large" color="grey"></v-icon>
                    <p class="text-body-1 mt-2">Select an incentive to view details</p>
                  </v-card-text>
                </v-card>
              </v-col>
            </v-row>
          </v-window-item>
          
          <v-window-item value="bluesky">
            <BlueskyConfig ref="blueskyConfig" @update:auto-post-enabled="updateBlueskyAutoPost" />
          </v-window-item>
        </v-window>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, computed, onUnmounted } from 'vue';
import { useRoute } from 'vue-router';
import { useDisplay } from 'vuetify';
import BlueskyConfig from '../components/BlueskyConfig.vue';
import StreamTitleConfig from '../components/StreamTitleConfig.vue';
import { useIncentives } from '~/composable/useIncentives';
import type { Incentive } from '~/server/database/types';

const route = useRoute();
const step = ref('home');
const activeTab = ref<string | null>('home');
const blueskyAutoPostEnabled = ref(false);
const currentRunData = ref(null);
const selectedDashboardIncentive = ref<Incentive | null>(null);
const dashboardAutoRefresh = ref(true);
let refreshTimer: number | null = null;

const { mobile } = useDisplay();
const isMobile = computed(() => mobile.value);

const { incentives, loading: incentivesLoading, error: incentivesError, fetchIncentives } = useIncentives();

const refreshIncentives = async () => {
  await fetchIncentives();
};

const startAutoRefresh = () => {
  if (dashboardAutoRefresh.value) {
    stopAutoRefresh();
    refreshTimer = window.setInterval(() => {
      if (step.value === 'incentives') refreshIncentives();
    }, 30000);
  }
};

const stopAutoRefresh = () => {
  if (refreshTimer !== null) {
    clearInterval(refreshTimer);
    refreshTimer = null;
  }
};

const loadCurrentRunData = () => {
  if (!process.client) return;
  const planningData = localStorage.getItem('planningData');
  const idData = localStorage.getItem('idData');
  if (planningData && idData) {
    try {
      const runs = JSON.parse(planningData);
      const currentStep = parseInt(idData, 10);
      if (runs?.[currentStep]) currentRunData.value = runs[currentStep];
    } catch (e) {
      console.error('Error loading current run data:', e);
    }
  }
};

if (process.client) {
  const autoPostSetting = localStorage.getItem('blueskyAutoPost');
  if (autoPostSetting) blueskyAutoPostEnabled.value = JSON.parse(autoPostSetting);

  const autoRefreshSetting = localStorage.getItem('dashboardAutoRefresh');
  if (autoRefreshSetting) dashboardAutoRefresh.value = JSON.parse(autoRefreshSetting);
}

const updateBlueskyAutoPost = (enabled: boolean) => {
  blueskyAutoPostEnabled.value = enabled;
};

watch(dashboardAutoRefresh, (newValue) => {
  newValue ? startAutoRefresh() : stopAutoRefresh();
  if (process.client) localStorage.setItem('dashboardAutoRefresh', JSON.stringify(newValue));
});

watch(step, (newStep) => {
  activeTab.value = newStep;
  if (newStep === 'planning' || newStep === 'streamTitle') loadCurrentRunData();
  if (newStep === 'incentives') refreshIncentives();
});

onMounted(() => {
  const queryStep = route.query.step as string;
  if (queryStep && ['home', 'planning', 'txt', 'streamTitle', 'incentives', 'bluesky'].includes(queryStep)) {
    step.value = queryStep;
    activeTab.value = queryStep;
  }
  fetchIncentives();
  if (dashboardAutoRefresh.value) startAutoRefresh();
  loadCurrentRunData();
});

onUnmounted(() => stopAutoRefresh());
</script>

<style scoped>
/* Make selected tab more visible */
:deep(.v-tab--selected) {
  background-color: rgba(255, 255, 255, 0.2);
}

:deep(.v-tab--selected .v-icon),
:deep(.v-tab--selected .font-weight-medium) {
  color: white !important;
}

:deep(.v-tab__slider) {
  background-color: white;
  height: 3px;
}
</style>