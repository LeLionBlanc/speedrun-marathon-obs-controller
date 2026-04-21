<template>
  <div class="incentive-list">
    <v-card>
      <v-card-title class="d-flex flex-wrap align-center">
        <div class="d-flex align-center">
          <v-icon icon="mdi-trophy-award" class="mr-2" />
          {{ title }}
        </div>
        <v-spacer></v-spacer>
        <div class="d-flex align-center">
          <v-chip
            v-if="incentives.length > 0"
            color="primary"
            size="small"
            class="mr-2"
          >
            {{ incentives.length }}
          </v-chip>
          <v-btn
            v-if="showRefreshButton"
            icon="mdi-refresh"
            variant="text"
            size="small"
            @click="handleRefresh"
            :loading="loading"
          ></v-btn>
        </div>
      </v-card-title>
      
      <v-card-text v-if="loading">
        <div class="d-flex justify-center align-center pa-4">
          <v-progress-circular indeterminate color="primary"></v-progress-circular>
          <span class="ml-2">Loading incentives...</span>
        </div>
      </v-card-text>
      
      <template v-else>
        <v-list v-if="displayedIncentives.length > 0">
          <template v-for="(incentive, index) in displayedIncentives" :key="incentive.id">
            <v-list-item @click="handleIncentiveClick(incentive)" class="incentive-list-item">
              <template v-slot:prepend>
                <v-avatar color="primary" variant="tonal" size="small">
                  <span class="text-caption">{{ index + 1 }}</span>
                </v-avatar>
              </template>
              
              <v-list-item-title class="text-truncate">{{ incentive.name }}</v-list-item-title>
              
              <v-list-item-subtitle>
                <v-progress-linear
                  :model-value="calculateProgress(incentive)"
                  height="5"
                  color="primary"
                  class="mt-1"
                ></v-progress-linear>
                <div class="d-flex justify-space-between mt-1">
                  <span class="text-caption">{{ formatAmount(incentive.current_amount) }}</span>
                  <span class="text-caption">{{ Math.ceil(calculateProgress(incentive)) }}%</span>
                </div>
              </v-list-item-subtitle>
            </v-list-item>
            
            <v-divider v-if="index < displayedIncentives.length - 1"></v-divider>
          </template>
        </v-list>
        
        <v-card-text v-else class="text-center pa-4">
          <v-icon icon="mdi-information-outline" size="large" color="grey"></v-icon>
          <p class="text-body-1 mt-2">{{ emptyMessage }}</p>
        </v-card-text>
      </template>
      
      <v-card-actions v-if="showViewAll && incentives.length > limit && limit > 0">
        <v-spacer></v-spacer>
        <v-btn
          variant="text"
          color="primary"
          @click="$emit('view-all')"
        >
          View All ({{ incentives.length }})
          <v-icon icon="mdi-chevron-right" end></v-icon>
        </v-btn>
      </v-card-actions>
    </v-card>
  </div>
</template>

<script setup lang="ts">
import { computed, watch, onMounted, onUnmounted } from 'vue';
import type { Incentive } from '~/server/database/types';

const props = defineProps({
  incentives: { type: Array as () => Incentive[], required: true },
  loading: { type: Boolean, default: false },
  title: { type: String, default: 'Active Incentives' },
  emptyMessage: { type: String, default: 'No active incentives found' },
  showViewAll: { type: Boolean, default: false },
  limit: { type: Number, default: 0 },
  refreshInterval: { type: Number, default: 60000 },
  autoRefresh: { type: Boolean, default: false },
  showRefreshButton: { type: Boolean, default: true }
});

const emit = defineEmits(['click', 'view-all', 'refresh']);

const displayedIncentives = computed(() =>
  props.limit > 0 ? props.incentives.slice(0, props.limit) : props.incentives
);

const calculateProgress = (incentive: Incentive): number =>
  (incentive.current_amount / incentive.target_amount) * 100;

const formatAmount = (amount: number): string => `${Number(amount).toLocaleString('fr-FR')} €`;
const handleIncentiveClick = (incentive: Incentive) => emit('click', incentive);
const handleRefresh = () => emit('refresh');

let refreshTimer: number | null = null;

const startAutoRefresh = () => {
  if (props.autoRefresh && props.refreshInterval > 0) {
    refreshTimer = window.setInterval(() => emit('refresh'), props.refreshInterval);
  }
};

const stopAutoRefresh = () => {
  if (refreshTimer !== null) {
    clearInterval(refreshTimer);
    refreshTimer = null;
  }
};

watch(() => props.autoRefresh, (newValue) => {
  newValue ? startAutoRefresh() : stopAutoRefresh();
});

onMounted(() => { if (props.autoRefresh) startAutoRefresh(); });
onUnmounted(() => stopAutoRefresh());
</script>

<style scoped>
.incentive-list {
  transition: all 0.3s ease;
}

.incentive-list-item {
  cursor: pointer;
  transition: background-color 0.2s;
}

.incentive-list-item:hover {
  background-color: rgba(var(--v-theme-primary), 0.05);
}

.text-truncate {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

@media (max-width: 600px) {
  .incentive-list :deep(.v-list-item) {
    padding: 8px 12px;
  }
  
  .incentive-list :deep(.v-card-title) {
    padding: 12px;
    font-size: 1.1rem;
  }
}
</style>