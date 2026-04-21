import { ref, computed, onMounted, onUnmounted } from 'vue';
import type { Incentive, IncentiveUpdate, BidWarOption } from '~/server/database/types';
import { useLocalCache } from '~/composable/useLocalCache';

export function useIncentives() {
  const incentives = ref<Incentive[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const lastFetch = ref<number>(0);
  const cache = useLocalCache();

  const activeIncentives = computed(() => incentives.value.filter(i => i.is_active));

  const CACHE_KEYS = {
    INCENTIVES: 'incentives',
    INCENTIVE_PREFIX: 'incentive_',
    UPDATES_PREFIX: 'incentive_updates_',
    BID_WAR_PREFIX: 'bid_war_options_'
  };

  if (process.client) {
    const cachedIncentives = cache.getItem<Incentive[]>(CACHE_KEYS.INCENTIVES, []);
    if (Array.isArray(cachedIncentives) && cachedIncentives.length > 0) {
      incentives.value = cachedIncentives;
    }
  }

  async function fetchIncentives(force = false): Promise<Incentive[]> {
    const now = Date.now();
    if (!force && now - lastFetch.value < 30000 && incentives.value.length > 0) {
      return incentives.value;
    }

    loading.value = true;
    error.value = null;

    try {
      const data = await $fetch<Incentive[]>('/api/incentives');
      incentives.value = Array.isArray(data) ? data : [];
      lastFetch.value = now;

      if (process.client) {
        cache.setItem(CACHE_KEYS.INCENTIVES, incentives.value, 60 * 5 * 1000);
      }

      return incentives.value;
    } catch (err: any) {
      error.value = err.message || 'Failed to load incentives';
      return incentives.value;
    } finally {
      loading.value = false;
    }
  }

  async function getIncentive(id: number): Promise<Incentive | null> {
    if (process.client) {
      const cached = cache.getItem<Incentive | null>(`${CACHE_KEYS.INCENTIVE_PREFIX}${id}`, null);
      if (cached) return cached;
    }

    const existing = incentives.value.find(i => i.id === id);
    if (existing) return existing;

    try {
      const incentive = await $fetch<Incentive>(`/api/incentives/${id}`);
      if (process.client && incentive) {
        cache.setItem(`${CACHE_KEYS.INCENTIVE_PREFIX}${id}`, incentive, 60 * 5 * 1000);
      }
      return incentive;
    } catch (err: any) {
      error.value = err.message || 'Failed to load incentive';
      return null;
    }
  }

  async function createIncentive(incentive: Omit<Incentive, 'id' | 'created_at' | 'updated_at'>): Promise<Incentive | null> {
    try {
      const newIncentive = await $fetch<Incentive>('/api/incentives', {
        method: 'POST',
        body: incentive
      });
      await fetchIncentives(true);
      return newIncentive;
    } catch (err: any) {
      error.value = err.message || 'Failed to create incentive';
      return null;
    }
  }

  async function updateIncentive(
    id: number,
    updates: Partial<Omit<Incentive, 'id' | 'created_at' | 'updated_at'>>
  ): Promise<Incentive | null> {
    try {
      const updatedIncentive = await $fetch<Incentive>(`/api/incentives/${id}`, {
        method: 'PUT',
        body: updates
      });
      await fetchIncentives(true);
      if (process.client && updatedIncentive) {
        cache.setItem(`${CACHE_KEYS.INCENTIVE_PREFIX}${id}`, updatedIncentive, 60 * 5 * 1000);
      }
      return updatedIncentive;
    } catch (err: any) {
      error.value = err.message || 'Failed to update incentive';
      return null;
    }
  }

  async function deleteIncentive(id: number): Promise<boolean> {
    try {
      await $fetch(`/api/incentives/${id}`, { method: 'DELETE' });
      await fetchIncentives(true);
      if (process.client) {
        cache.removeItem(`${CACHE_KEYS.INCENTIVE_PREFIX}${id}`);
        cache.removeItem(`${CACHE_KEYS.UPDATES_PREFIX}${id}`);
        cache.removeItem(`${CACHE_KEYS.BID_WAR_PREFIX}${id}`);
      }
      return true;
    } catch (err: any) {
      error.value = err.message || 'Failed to delete incentive';
      return false;
    }
  }

  async function updateIncentiveAmount(id: number, amount: number, notes?: string): Promise<Incentive | null> {
    try {
      const updatedIncentive = await $fetch<Incentive>(`/api/incentives/${id}/amount`, {
        method: 'POST',
        body: { amount, notes }
      });
      await fetchIncentives(true);
      if (process.client && updatedIncentive) {
        cache.setItem(`${CACHE_KEYS.INCENTIVE_PREFIX}${id}`, updatedIncentive, 60 * 5 * 1000);
        cache.removeItem(`${CACHE_KEYS.UPDATES_PREFIX}${id}`);
      }
      return updatedIncentive;
    } catch (err: any) {
      error.value = err.message || 'Failed to update incentive amount';
      return null;
    }
  }

  async function getIncentiveUpdates(id: number, force = false): Promise<IncentiveUpdate[]> {
    if (process.client && !force) {
      const cached = cache.getItem<IncentiveUpdate[]>(`${CACHE_KEYS.UPDATES_PREFIX}${id}`, []);
      if (cached.length > 0) return cached;
    }
    try {
      const updates = await $fetch<IncentiveUpdate[]>(`/api/incentives/${id}/updates`);
      const result = updates || [];
      if (process.client) {
        cache.setItem(`${CACHE_KEYS.UPDATES_PREFIX}${id}`, result, 60 * 5 * 1000);
      }
      return result;
    } catch (err: any) {
      error.value = err.message || 'Failed to load incentive updates';
      return [];
    }
  }

  async function toggleActive(id: number): Promise<Incentive | null> {
    try {
      const updated = await $fetch<Incentive>(`/api/incentives/${id}`, { method: 'PATCH' });
      const idx = incentives.value.findIndex(i => i.id === id);
      if (idx !== -1 && updated) incentives.value[idx] = updated;
      if (process.client && updated) {
        cache.setItem(`${CACHE_KEYS.INCENTIVE_PREFIX}${id}`, updated, 60 * 5 * 1000);
        cache.setItem(CACHE_KEYS.INCENTIVES, incentives.value, 60 * 5 * 1000);
      }
      return updated;
    } catch (err: any) {
      error.value = err.message || 'Failed to toggle incentive';
      return null;
    }
  }

  // ─── Bid War ──────────────────────────────────────────────────────────────

  async function getBidWarOptions(id: number, force = false): Promise<BidWarOption[]> {
    if (process.client && !force) {
      const cached = cache.getItem<BidWarOption[]>(`${CACHE_KEYS.BID_WAR_PREFIX}${id}`, []);
      if (cached.length > 0) return cached;
    }
    try {
      const options = await $fetch<BidWarOption[]>(`/api/incentives/${id}/bid-war`);
      const result = options || [];
      if (process.client) {
        cache.setItem(`${CACHE_KEYS.BID_WAR_PREFIX}${id}`, result, 60 * 2 * 1000);
      }
      return result;
    } catch (err: any) {
      error.value = err.message || 'Failed to load bid war options';
      return [];
    }
  }

  async function addBidWarOption(incentiveId: number, name: string, hashtag?: string): Promise<BidWarOption | null> {
    try {
      const opt = await $fetch<BidWarOption>(`/api/incentives/${incentiveId}/bid-war`, {
        method: 'POST',
        body: { name, hashtag: hashtag || undefined }
      });
      if (process.client) cache.removeItem(`${CACHE_KEYS.BID_WAR_PREFIX}${incentiveId}`);
      return opt;
    } catch (err: any) {
      error.value = err.message || 'Failed to add bid war option';
      return null;
    }
  }

  async function removeBidWarOption(incentiveId: number, optionId: number): Promise<boolean> {
    try {
      await $fetch(`/api/incentives/${incentiveId}/bid-war?option_id=${optionId}`, { method: 'DELETE' });
      if (process.client) cache.removeItem(`${CACHE_KEYS.BID_WAR_PREFIX}${incentiveId}`);
      return true;
    } catch (err: any) {
      error.value = err.message || 'Failed to remove bid war option';
      return false;
    }
  }

  async function castBidWarVote(
    incentiveId: number,
    optionId: number,
    amount: number,
    notes?: string
  ): Promise<{ incentive: Incentive; options: BidWarOption[] } | null> {
    try {
      const result = await $fetch<{ incentive: Incentive; options: BidWarOption[] }>(
        `/api/incentives/${incentiveId}/bid-war`,
        { method: 'POST', body: { option_id: optionId, amount, notes } }
      );
      const idx = incentives.value.findIndex(i => i.id === incentiveId);
      if (idx !== -1 && result?.incentive) incentives.value[idx] = result.incentive;
      if (process.client) {
        cache.removeItem(`${CACHE_KEYS.BID_WAR_PREFIX}${incentiveId}`);
        cache.removeItem(`${CACHE_KEYS.UPDATES_PREFIX}${incentiveId}`);
        if (result?.incentive) {
          cache.setItem(`${CACHE_KEYS.INCENTIVE_PREFIX}${incentiveId}`, result.incentive, 60 * 5 * 1000);
        }
      }
      return result;
    } catch (err: any) {
      error.value = err.message || 'Failed to cast bid war vote';
      return null;
    }
  }

  function clearCache(): void {
    if (process.client) {
      cache.removeItem(CACHE_KEYS.INCENTIVES);
    }
  }

  if (process.client) {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') fetchIncentives(true);
    };
    onMounted(() => document.addEventListener('visibilitychange', handleVisibilityChange));
    onUnmounted(() => document.removeEventListener('visibilitychange', handleVisibilityChange));
  }

  return {
    incentives,
    activeIncentives,
    loading,
    error,
    fetchIncentives,
    getIncentive,
    createIncentive,
    updateIncentive,
    deleteIncentive,
    updateIncentiveAmount,
    getIncentiveUpdates,
    toggleActive,
    clearCache,
    // bid war
    getBidWarOptions,
    addBidWarOption,
    removeBidWarOption,
    castBidWarVote
  };
}
