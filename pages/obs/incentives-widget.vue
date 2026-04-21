<template>
  <div class="obs-widget">
    <!-- Loading -->
    <div v-if="loading" class="widget-card d-flex align-center justify-center">
      <v-progress-circular indeterminate color="white" size="32" />
    </div>

    <!-- No active incentives -->
    <div v-else-if="activeIncentives.length === 0" class="widget-card d-flex align-center justify-center">
      <span class="no-incentive-text">No active incentives</span>
    </div>

    <!-- Carousel -->
    <transition v-else name="slide-fade" mode="out-in">
      <div :key="currentIndex" class="widget-card">

        <!-- Header -->
        <div class="widget-header">
          <v-icon :color="current.type === 'bid_war' ? 'orange' : 'amber'" size="20" class="mr-1">
            {{ current.type === 'bid_war' ? 'mdi-sword-cross' : 'mdi-star-circle' }}
          </v-icon>
          <span class="widget-label">{{ current.type === 'bid_war' ? 'BID WAR' : 'INCENTIVE' }}</span>
          <span class="widget-counter">{{ currentIndex + 1 }}/{{ activeIncentives.length }}</span>
        </div>

        <div class="widget-name-wrap">
          <template v-if="current.name.length > 22">
            <span class="widget-name widget-name--scroll">
              {{ current.name }}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{{ current.name }}
            </span>
          </template>
          <template v-else>
            <span class="widget-name">{{ current.name }}</span>
          </template>
        </div>
        <div v-if="current.description" class="widget-description">{{ current.description }}</div>
        <div v-if="current.hashtag && current.type !== 'bid_war'" class="widget-hashtag">{{ current.hashtag }}</div>

        <!-- Goal mode -->
        <template v-if="current.type !== 'bid_war'">
          <div class="widget-progress-row">
            <div class="widget-amounts">
              <span class="amount-current">{{ formatAmount(current.current_amount) }}</span>
              <span class="amount-sep"> / </span>
              <span class="amount-target">{{ formatAmount(current.target_amount) }}</span>
            </div>
            <span class="amount-pct">{{ progressPct }}%</span>
          </div>
          <div class="widget-bar-bg">
            <div class="widget-bar-fill" :style="{ width: progressPct + '%' }" />
          </div>
        </template>

        <!-- Bid war mode -->
        <template v-else>
          <div class="bw-total">Total: {{ formatAmount(current.current_amount) }}</div>
          <div v-if="loadingBidOptions" class="d-flex justify-center mt-2">
            <v-progress-circular indeterminate color="white" size="18" />
          </div>
          <div v-else class="bw-options">
            <div
                v-for="(opt, i) in currentBidOptions"
                :key="opt.id"
                class="bw-option"
              >
                <div class="bw-option-row">
                  <span class="bw-option-name">
                    {{ opt.name }}
                    <span v-if="opt.hashtag" class="bw-option-hashtag">{{ opt.hashtag }}</span>
                  </span>
                  <span class="bw-meta">
                    <span class="bw-option-amount">{{ formatAmount(opt.amount) }}</span>
                    <span class="bw-option-pct">{{ optionPct(opt) }}%</span>
                  </span>
                </div>
                <div class="bw-bar-bg">
                  <div
                    class="bw-bar-fill"
                    :style="{ width: optionPct(opt) + '%', background: BW_COLORS[i % BW_COLORS.length] }"
                  />
                </div>
              </div>
          </div>
        </template>

      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useIncentives } from '~/composable/useIncentives';
import type { BidWarOption } from '~/server/database/types';

definePageMeta({ layout: false });

const { activeIncentives, loading, fetchIncentives, getBidWarOptions } = useIncentives();

const currentIndex = ref(0);
const ROTATION_INTERVAL = 8000;
const BW_COLORS = ['#26c6da', '#ef5350', '#66bb6a', '#ffa726', '#ab47bc', '#26a69a'];

let timer: ReturnType<typeof setInterval> | null = null;
let pollTimer: ReturnType<typeof setInterval> | null = null;

const current = computed(() => activeIncentives.value[currentIndex.value] ?? null);

// Bid war options cache per incentive id
const bidWarOptionsMap = ref<Record<number, BidWarOption[]>>({});
const loadingBidOptions = ref(false);

const currentBidOptions = computed<BidWarOption[]>(() => {
  if (!current.value || current.value.type !== 'bid_war') return [];
  return bidWarOptionsMap.value[current.value.id!] ?? [];
});

const bidWarTotal = computed(() =>
  currentBidOptions.value.reduce((s, o) => s + Number(o.amount), 0)
);

function optionPct(opt: BidWarOption): number {
  if (!bidWarTotal.value) return 0;
  return Math.round((Number(opt.amount) / bidWarTotal.value) * 100);
}

const progressPct = computed(() => {
  if (!current.value) return 0;
  const pct = (Number(current.value.current_amount) / Number(current.value.target_amount)) * 100;
  return Math.min(Math.round(pct), 100);
});

function formatAmount(val: number | string): string {
  return `${Number(val).toLocaleString('fr-FR')} €`;
}

async function loadBidWarOptions(incentiveId: number) {
  loadingBidOptions.value = true;
  try {
    const opts = await getBidWarOptions(incentiveId, true);
    bidWarOptionsMap.value[incentiveId] = opts;
  } finally {
    loadingBidOptions.value = false;
  }
}

// When current incentive changes, load bid war options if needed
watch(current, async (inc) => {
  if (inc && inc.type === 'bid_war' && inc.id !== undefined) {
    await loadBidWarOptions(inc.id);
  }
}, { immediate: true });

function startCarousel() {
  stopCarousel();
  if (activeIncentives.value.length <= 1) return;
  timer = setInterval(() => {
    currentIndex.value = (currentIndex.value + 1) % activeIncentives.value.length;
  }, ROTATION_INTERVAL);
}

function stopCarousel() {
  if (timer) { clearInterval(timer); timer = null; }
}

watch(activeIncentives, (list) => {
  if (currentIndex.value >= list.length) currentIndex.value = 0;
  startCarousel();
}, { immediate: false });

onMounted(async () => {
  await fetchIncentives(true);
  startCarousel();
  pollTimer = setInterval(async () => {
    await fetchIncentives(true);
    // Refresh bid war options for current if applicable
    if (current.value?.type === 'bid_war' && current.value.id !== undefined) {
      await loadBidWarOptions(current.value.id);
    }
  }, 30_000);
});

onUnmounted(() => {
  stopCarousel();
  if (pollTimer) clearInterval(pollTimer);
});
</script>

<style scoped>
html, body { background: transparent !important; }

.obs-widget {
  width: 420px;
  min-height: 110px;
  font-family: 'Roboto', sans-serif;
}

.widget-card {
  background: linear-gradient(135deg, rgba(30,30,46,0.92) 0%, rgba(20,20,35,0.95) 100%);
  border: 1px solid rgba(255,255,255,0.12);
  border-radius: 12px;
  padding: 14px 18px 16px;
  box-shadow: 0 4px 24px rgba(0,0,0,0.5);
  backdrop-filter: blur(8px);
  min-height: 110px;
}

.widget-header {
  display: flex;
  align-items: center;
  margin-bottom: 6px;
}

.widget-label {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 1.5px;
  color: #ffd54f;
  text-transform: uppercase;
  flex: 1;
}

.widget-counter {
  font-size: 11px;
  color: rgba(255,255,255,0.4);
}

.widget-name-wrap {
  overflow: hidden;
  margin-bottom: 4px;
}

.widget-name {
  display: inline-block;
  font-size: 20px;
  font-weight: 700;
  color: #ffffff;
  line-height: 1.2;
  white-space: nowrap;
}

.widget-name--scroll {
  animation: marquee 12s linear infinite;
}

@keyframes marquee {
  0%   { transform: translateX(0); }
  100% { transform: translateX(-50%); }
}

.widget-description {
  font-size: 12px;
  color: rgba(255,255,255,0.55);
  margin-bottom: 4px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.widget-hashtag {
  font-size: 11px;
  font-weight: 600;
  color: #64b5f6;
  margin-bottom: 8px;
  letter-spacing: 0.5px;
}

.bw-option-hashtag {
  font-size: 10px;
  font-weight: 600;
  color: #64b5f6;
  margin-left: 5px;
  opacity: 0.85;
}

/* Goal */
.widget-progress-row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 6px;
}

.amount-current { font-size: 18px; font-weight: 700; color: #80cbc4; }
.amount-sep { color: rgba(255,255,255,0.4); }
.amount-target { color: rgba(255,255,255,0.6); }
.amount-pct { font-size: 13px; font-weight: 600; color: rgba(255,255,255,0.5); }

.widget-bar-bg {
  width: 100%;
  height: 8px;
  background: rgba(255,255,255,0.12);
  border-radius: 4px;
  overflow: hidden;
}

.widget-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #26c6da, #80cbc4);
  border-radius: 4px;
  transition: width 0.8s cubic-bezier(0.4,0,0.2,1);
}

/* Bid war */
.bw-total {
  font-size: 12px;
  color: rgba(255,255,255,0.5);
  margin-bottom: 8px;
}

.bw-options { display: flex; flex-direction: column; gap: 6px; }

.bw-option-row {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  margin-bottom: 3px;
}

.bw-option-name {
  font-size: 13px;
  font-weight: 600;
  color: #fff;
  flex: 1;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  word-break: break-word;
}

.bw-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  flex-shrink: 0;
  gap: 1px;
}

.bw-option-amount { font-size: 13px; font-weight: 700; color: #ffd54f; white-space: nowrap; }
.bw-option-pct { font-size: 11px; color: rgba(255,255,255,0.45); white-space: nowrap; }

.bw-bar-bg {
  width: 100%;
  height: 6px;
  background: rgba(255,255,255,0.1);
  border-radius: 3px;
  overflow: hidden;
}

.bw-bar-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.8s cubic-bezier(0.4,0,0.2,1);
}

.no-incentive-text { font-size: 14px; color: rgba(255,255,255,0.4); }

.slide-fade-enter-active { transition: all 0.5s ease-out; }
.slide-fade-leave-active { transition: all 0.35s ease-in; }
.slide-fade-enter-from { opacity: 0; transform: translateX(30px); }
.slide-fade-leave-to { opacity: 0; transform: translateX(-30px); }
</style>
