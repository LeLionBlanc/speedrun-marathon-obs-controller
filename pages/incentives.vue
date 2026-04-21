<template>
  <div>
    <v-tabs v-model="activeTab" bg-color="primary">
      <v-tab value="public">Public View</v-tab>
      <v-tab value="management">Management</v-tab>
      <v-spacer></v-spacer>
      <ClientOnly>
        <v-btn
          v-if="isAuthenticated"
          variant="text"
          size="small"
          @click="logout"
        >
          Logout
        </v-btn>
        <v-btn
          v-else
          variant="text"
          size="small"
          to="/login"
        >
          Login
        </v-btn>
      </ClientOnly>
    </v-tabs>

    <v-window v-model="activeTab" class="mt-4">
      <v-window-item value="public">
        <v-container>
          <div class="d-flex flex-wrap align-center mb-4">
            <h1 class="text-h4 mr-auto">Current Incentives</h1>
            <v-btn
              icon="mdi-refresh"
              variant="text"
              @click="refreshIncentives"
              :loading="loading"
              :disabled="loading"
              class="ml-2"
            ></v-btn>
          </div>
          
          <v-row>
            <v-col cols="12" lg="8" :order="isMobile ? 2 : 1">
              <p class="text-body-1 mb-6">
                Support our goals by contributing to these incentives. Watch our progress in real-time!
              </p>
              
              <div v-if="loading" class="d-flex justify-center my-8">
                <v-progress-circular indeterminate color="primary"></v-progress-circular>
              </div>
              
              <div v-else-if="incentives.length === 0" class="text-center my-8">
                <v-icon icon="mdi-information-outline" size="x-large" color="grey"></v-icon>
                <p class="text-h6 mt-2">No active incentives at the moment</p>
                <p class="text-body-2">Check back soon for new goals!</p>
              </div>
              
              <template v-else>
                <v-row>
                  <v-col
                    v-for="incentive in incentives"
                    :key="incentive.id"
                    cols="12"
                    sm="6"
                    lg="4"
                  >
                    <IncentiveDisplay
                      :incentive="incentive"
                      @click="selectedIncentive = incentive"
                      :auto-refresh="autoRefresh"
                      :refresh-interval="refreshInterval"
                      @refresh="refreshIncentives"
                    />
                  </v-col>
                </v-row>
              </template>
            </v-col>
            
            <v-col cols="12" lg="4" :order="isMobile ? 1 : 2">
              <v-card v-if="selectedIncentive" class="mb-4 sticky-top">
                <v-card-title class="d-flex align-center">
                  {{ selectedIncentive.name }}
                  <v-spacer></v-spacer>
                  <v-btn
                    v-if="isMobile"
                    icon="mdi-close"
                    variant="text"
                    size="small"
                    @click="selectedIncentive = null"
                  ></v-btn>
                </v-card-title>
                <v-card-text>
                  <p class="mb-4">{{ selectedIncentive.description }}</p>
                  
                  <IncentiveDisplay
                    :incentive="selectedIncentive"
                    :show-details="false"
                    :margin-bottom="false"
                    :auto-refresh="autoRefresh"
                    :refresh-interval="refreshInterval"
                    @refresh="refreshIncentives"
                  />
                  
                  <v-divider class="my-4"></v-divider>
                  
                  <div class="d-flex flex-wrap justify-space-between align-center">
                    <div class="mb-2 mb-sm-0">
                      <div class="text-subtitle-2">Target</div>
                      <div class="text-h6">{{ selectedIncentive.target_amount.toLocaleString() }}</div>
                    </div>
                    <div class="mb-2 mb-sm-0">
                      <div class="text-subtitle-2">Current</div>
                      <div class="text-h6">{{ selectedIncentive.current_amount.toLocaleString() }}</div>
                    </div>
                    <div>
                      <div class="text-subtitle-2">Remaining</div>
                      <div class="text-h6">{{ (selectedIncentive.target_amount - selectedIncentive.current_amount).toLocaleString() }}</div>
                    </div>
                  </div>
                </v-card-text>
              </v-card>
              
              <v-card v-else class="sticky-top">
                <v-card-title>Incentive Details</v-card-title>
                <v-card-text class="text-center pa-4">
                  <v-icon icon="mdi-hand-pointing-left" size="large" color="grey"></v-icon>
                  <p class="text-body-1 mt-2">Select an incentive to view details</p>
                </v-card-text>
              </v-card>
              
              <v-card class="mt-4">
                <v-card-title>Auto-Refresh</v-card-title>
                <v-card-text>
                  <v-switch
                    v-model="autoRefresh"
                    label="Auto-refresh incentives"
                    color="primary"
                    hide-details
                  ></v-switch>
                  
                  <v-slider
                    v-if="autoRefresh"
                    v-model="refreshInterval"
                    :min="10000"
                    :max="120000"
                    :step="10000"
                    thumb-label
                    :label="`Refresh every ${refreshInterval / 1000} seconds`"
                    class="mt-4"
                  ></v-slider>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>
        </v-container>
      </v-window-item>
      
      <v-window-item value="management">
        <v-container>
          <h1 class="text-h4 mb-4">Incentive Management</h1>
          <IncentiveManager />
        </v-container>
      </v-window-item>
    </v-window>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useIncentives } from '~/composable/useIncentives';
import { useAuth } from '~/composable/useAuth';
import { useDisplay } from 'vuetify';
import { useRouter, useRoute } from 'vue-router';
import type { Incentive } from '~/server/database/types';

definePageMeta({ middleware: [] });

const router = useRouter();
const route = useRoute();
const activeTab = ref('public');
const selectedIncentive = ref<Incentive | null>(null);
const autoRefresh = ref(true);
const refreshInterval = ref(30000);
let refreshTimer: number | null = null;

const { user, isAuthenticated, isAdmin, logout: authLogout } = useAuth();
const { incentives, loading, error, fetchIncentives } = useIncentives();
const { mobile } = useDisplay();

const isMobile = computed(() => mobile.value);

const logout = () => {
  authLogout();
  activeTab.value = 'public';
};

const refreshIncentives = async () => {
  await fetchIncentives();
};

const startAutoRefresh = () => {
  if (autoRefresh.value) {
    stopAutoRefresh();
    refreshTimer = window.setInterval(refreshIncentives, refreshInterval.value);
  }
};

const stopAutoRefresh = () => {
  if (refreshTimer !== null) {
    clearInterval(refreshTimer);
    refreshTimer = null;
  }
};

watch([autoRefresh, refreshInterval], () => {
  autoRefresh.value ? startAutoRefresh() : stopAutoRefresh();
});

onMounted(async () => {
  await fetchIncentives();
  if (autoRefresh.value) startAutoRefresh();

  if (route.hash === '#management' && !isAuthenticated.value) {
    localStorage.setItem('returnUrl', '/incentives#management');
    router.push('/login');
  }
});

onUnmounted(() => stopAutoRefresh());
</script>

<style scoped>
.sticky-top {
  position: sticky;
  top: 20px;
}

@media (max-width: 1264px) {
  .sticky-top {
    position: static;
  }
}
</style>