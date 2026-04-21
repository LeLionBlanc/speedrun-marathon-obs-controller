<template>
  <v-card class="incentive-display" :class="{ 'mb-4': marginBottom }">
    <v-card-text>
      <div class="d-flex flex-column">
        <div class="d-flex flex-wrap align-center mb-2">
          <v-icon icon="mdi-trophy" size="large" class="mr-3" :color="color" />
          <div class="flex-grow-1 min-width-0">
            <div class="text-h6 text-truncate">{{ incentive.name }}</div>
            <div class="text-body-2 text-medium-emphasis text-truncate">{{ incentive.description }}</div>
          </div>
        </div>
        
        <v-progress-linear
          :model-value="progressPercentage"
          height="20"
          :color="color"
          class="my-2"
        >
          <template v-slot:default="{ value }">
            <strong>{{ Math.ceil(value) }}%</strong>
          </template>
        </v-progress-linear>
        
        <div class="d-flex flex-wrap justify-space-between align-center mt-1">
          <span class="text-body-2">
            {{ formatAmount(incentive.current_amount) }} / {{ formatAmount(incentive.target_amount) }}
          </span>
          <v-chip
            :color="color"
            size="small"
            variant="outlined"
            class="mt-1 mt-sm-0"
          >
            {{ Math.ceil(progressPercentage) }}% Complete
          </v-chip>
        </div>
      </div>
    </v-card-text>
    <v-card-actions v-if="showDetails">
      <v-spacer></v-spacer>
      <v-btn
        variant="text"
        color="primary"
        @click="$emit('click', incentive)"
      >
        View Details
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script setup lang="ts">
import { computed, watch, onMounted, onUnmounted } from 'vue';
import type { Incentive } from '~/server/database/types';

const props = defineProps({
  incentive: { type: Object as () => Incentive, required: true },
  color: { type: String, default: 'primary' },
  showDetails: { type: Boolean, default: true },
  marginBottom: { type: Boolean, default: true },
  refreshInterval: { type: Number, default: 30000 },
  autoRefresh: { type: Boolean, default: false }
});

const emit = defineEmits(['click', 'refresh']);

const progressPercentage = computed(() =>
  (props.incentive.current_amount / props.incentive.target_amount) * 100
);

const formatAmount = (amount: number): string => `${Number(amount).toLocaleString('fr-FR')} €`;

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
.incentive-display {
  transition: transform 0.2s;
}

.incentive-display:hover {
  transform: translateY(-2px);
}

/* Ensure text doesn't overflow on small screens */
.min-width-0 {
  min-width: 0;
}

.text-truncate {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

@media (max-width: 600px) {
  .incentive-display :deep(.v-card-text) {
    padding: 12px;
  }
}
</style>