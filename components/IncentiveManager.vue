<template>
  <v-container>
    <v-row>
      <v-col cols="12">
        <v-card>
          <v-card-title class="d-flex align-center">
            Incentives Manager
          </v-card-title>
          <v-card-text>
            <v-row>
              <!-- ── Left column: form ── -->
              <v-col cols="12" md="6">
                <v-card variant="outlined" class="mb-4">
                  <v-card-title>{{ isEditing ? 'Edit Incentive' : 'Create New Incentive' }}</v-card-title>
                  <v-card-text>
                    <v-form @submit.prevent="handleFormSubmit" ref="form">
                      <v-text-field
                        v-model="newIncentive.name"
                        label="Incentive Name"
                        :rules="[v => !!v || 'Name is required', v => v.length <= 100 || 'Max 100 chars']"
                        counter="100"
                        required
                      />
                      <v-textarea
                        v-model="newIncentive.description"
                        label="Description"
                        rows="2"
                        :rules="[v => !v || v.length <= 500 || 'Max 500 chars']"
                        counter="500"
                      />
                      <v-text-field
                        v-if="newIncentive.type === 'goal'"
                        v-model="newIncentive.hashtag"
                        label="Hashtag (ex: #MonIncentive)"
                        :rules="[v => !v || v.length <= 50 || 'Max 50 chars']"
                        hint="Mot-clé que les viewers mettent dans leur don"
                        persistent-hint
                      />

                      <!-- Type selector (only on create) -->
                      <v-select
                        v-if="!isEditing"
                        v-model="newIncentive.type"
                        :items="[{ title: 'Goal (progress bar)', value: 'goal' }, { title: 'Bid War (choices)', value: 'bid_war' }]"
                        item-title="title"
                        item-value="value"
                        label="Type"
                      />

                      <v-text-field
                        v-if="newIncentive.type === 'goal'"
                        v-model.number="newIncentive.target_amount"
                        label="Target Amount"
                        type="number"
                        :rules="[v => !!v || 'Required', v => v > 0 || 'Must be > 0']"
                        required
                      />
                      <v-text-field
                        v-if="isEditing"
                        v-model.number="newIncentive.current_amount"
                        label="Current Amount"
                        type="number"
                        :rules="[v => v >= 0 || 'Must be ≥ 0']"
                      />

                      <div class="d-flex gap-2">
                        <v-btn type="submit" color="primary" block :loading="submitting" :disabled="submitting">
                          <v-icon start>{{ isEditing ? 'mdi-content-save' : 'mdi-plus' }}</v-icon>
                          {{ isEditing ? 'Update Incentive' : 'Create Incentive' }}
                        </v-btn>
                        <v-btn v-if="isEditing" color="secondary" variant="outlined" @click="cancelEdit" :disabled="submitting">
                          Cancel
                        </v-btn>
                      </div>
                    </v-form>
                  </v-card-text>
                </v-card>

                <!-- Update amount (goal only) -->
                <v-card v-if="selectedIncentive && selectedIncentive.type === 'goal'" variant="outlined" class="mb-4">
                  <v-card-title>Update Amount</v-card-title>
                  <v-card-text>
                    <v-form @submit.prevent="updateAmount" ref="updateForm">
                      <v-text-field
                        v-model.number="updateData.amount"
                        label="Amount to Add/Subtract"
                        type="number"
                        :rules="[v => !!v || 'Required', v => v !== 0 || 'Cannot be zero']"
                        required
                      />
                      <v-textarea
                        v-model="updateData.notes"
                        label="Notes"
                        rows="2"
                        :rules="[v => !v || v.length <= 200 || 'Max 200 chars']"
                        counter="200"
                      />
                      <v-btn type="submit" color="success" block :loading="updatingAmount" :disabled="updatingAmount">
                        <v-icon start>mdi-cash-plus</v-icon>
                        Update Amount
                      </v-btn>
                    </v-form>
                  </v-card-text>
                </v-card>

                <!-- Bid war vote panel -->
                <v-card v-if="selectedIncentive && selectedIncentive.type === 'bid_war'" variant="outlined" class="mb-4">
                  <v-card-title class="d-flex align-center">
                    Bid War Options
                    <v-spacer />
                    <v-btn icon="mdi-refresh" variant="text" size="small" @click="reloadBidWarOptions" :loading="loadingOptions" />
                  </v-card-title>
                  <v-card-text>
                    <!-- Add option -->
                    <div class="d-flex gap-2 mb-4">
                      <v-text-field
                        v-model="newOptionName"
                        label="Nom de l'option"
                        density="compact"
                        hide-details
                      />
                      <v-text-field
                        v-model="newOptionHashtag"
                        label="#hashtag"
                        density="compact"
                        hide-details
                        style="max-width:130px"
                      />
                      <v-btn color="primary" variant="tonal" @click="handleAddOption" :loading="addingOption" :disabled="!newOptionName.trim()">
                        <v-icon>mdi-plus</v-icon>
                      </v-btn>
                    </div>

                    <div v-if="loadingOptions" class="d-flex justify-center my-2">
                      <v-progress-circular indeterminate size="24" />
                    </div>

                    <div v-else-if="bidWarOptions.length === 0" class="text-center text-grey py-2">
                      No options yet. Add at least 2.
                    </div>

                    <v-list v-else density="compact">
                      <v-list-item
                        v-for="opt in bidWarOptions"
                        :key="opt.id"
                        :title="opt.name"
                        :subtitle="formatAmount(opt.amount)"
                      >
                        <template #prepend>
                          <v-icon color="amber">mdi-sword-cross</v-icon>
                        </template>
                        <template #title>
                          <span>{{ opt.name }}</span>
                          <v-chip v-if="opt.hashtag" color="blue" variant="tonal" size="x-small" class="ml-2">{{ opt.hashtag }}</v-chip>
                        </template>
                        <template #append>
                          <div class="d-flex align-center gap-2">
                            <v-text-field
                              v-model.number="voteAmounts[opt.id!]"
                              type="number"
                              density="compact"
                              hide-details
                              style="width:80px"
                              placeholder="Amt"
                            />
                            <v-btn
                              color="success"
                              size="small"
                              variant="tonal"
                              @click="handleVote(opt)"
                              :loading="votingOptionId === opt.id"
                              :disabled="!voteAmounts[opt.id!] || voteAmounts[opt.id!] === 0"
                            >
                              Vote
                            </v-btn>
                            <v-btn
                              icon="mdi-delete"
                              variant="text"
                              color="error"
                              size="small"
                              @click="handleRemoveOption(opt)"
                            />
                          </div>
                        </template>
                      </v-list-item>
                    </v-list>

                    <!-- Progress bars per option -->
                    <div v-if="bidWarOptions.length > 0" class="mt-4">
                      <div v-for="opt in bidWarOptions" :key="`bar-${opt.id}`" class="mb-2">
                        <div class="d-flex justify-space-between text-caption mb-1">
                          <span>{{ opt.name }}</span>
                          <span>{{ optionPct(opt) }}%</span>
                        </div>
                        <v-progress-linear
                          :model-value="optionPct(opt)"
                          height="10"
                          rounded
                          :color="optionColor(opt)"
                        />
                      </div>
                    </div>
                  </v-card-text>
                </v-card>
              </v-col>

              <!-- ── Right column: list + details ── -->
              <v-col cols="12" md="6">
                <v-card variant="outlined" class="mb-4">
                  <v-card-title class="d-flex align-center">
                    Incentives
                    <v-spacer />
                    <v-btn icon="mdi-refresh" variant="text" size="small" @click="refreshIncentives" :loading="loading" :disabled="loading" />
                  </v-card-title>
                  <v-card-text v-if="loading">
                    <v-progress-circular indeterminate /> Loading…
                  </v-card-text>
                  <v-list v-else-if="incentives.length > 0">
                    <v-list-item
                      v-for="incentive in incentives"
                      :key="incentive.id"
                      :title="incentive.name"
                      :subtitle="incentive.type === 'bid_war' ? 'Bid War' : `${formatAmount(incentive.current_amount)} / ${formatAmount(incentive.target_amount)}${incentive.hashtag ? ' · ' + incentive.hashtag : ''}`"
                      @click="selectIncentive(incentive)"
                      :active="selectedIncentive?.id === incentive.id"
                      :class="{ 'opacity-50': !incentive.is_active }"
                    >
                      <template #prepend>
                        <v-icon :color="incentive.is_active ? 'success' : 'grey'">
                          {{ incentive.type === 'bid_war' ? 'mdi-sword-cross' : (incentive.is_active ? 'mdi-check-circle' : 'mdi-pause-circle') }}
                        </v-icon>
                      </template>
                      <template #append>
                        <div class="d-flex gap-1">
                          <v-tooltip :text="incentive.is_active ? 'Deactivate' : 'Activate'" location="top">
                            <template #activator="{ props }">
                              <v-btn
                                v-bind="props"
                                :icon="incentive.is_active ? 'mdi-toggle-switch' : 'mdi-toggle-switch-off'"
                                variant="text"
                                :color="incentive.is_active ? 'success' : 'grey'"
                                @click.stop="handleToggleActive(incentive)"
                              />
                            </template>
                          </v-tooltip>
                          <v-btn icon="mdi-pencil" variant="text" color="primary" @click.stop="editIncentive(incentive)" />
                          <v-btn icon="mdi-delete" variant="text" color="error" @click.stop="confirmDelete(incentive)" />
                        </div>
                      </template>
                    </v-list-item>
                  </v-list>
                  <v-card-text v-else>No incentives found. Create one to get started.</v-card-text>
                </v-card>

                <!-- Selected incentive details -->
                <v-card v-if="selectedIncentive" variant="outlined">
                <v-card-title>{{ selectedIncentive.name }}</v-card-title>
                <v-card-text>
                  <p v-if="selectedIncentive.description">{{ selectedIncentive.description }}</p>

                  <!-- Hashtag (goal only) -->
                  <v-chip v-if="selectedIncentive.hashtag && selectedIncentive.type === 'goal'" color="blue" variant="tonal" size="small" class="mb-2">
                    <v-icon start size="14">mdi-pound</v-icon>
                    {{ selectedIncentive.hashtag }}
                  </v-chip>

                  <!-- Goal progress -->
                  <template v-if="selectedIncentive.type === 'goal'">
                    <v-progress-linear :model-value="progressPercentage" height="25" color="primary">
                      <template #default="{ value }">
                        <strong>{{ Math.ceil(value) }}%</strong>
                      </template>
                    </v-progress-linear>
                    <p class="mt-2">{{ formatAmount(selectedIncentive.current_amount) }} / {{ formatAmount(selectedIncentive.target_amount) }}</p>
                  </template>

                  <!-- Bid war summary -->
                  <template v-else>
                    <v-chip color="amber" variant="tonal" class="mb-2">
                      <v-icon start>mdi-sword-cross</v-icon>
                      Bid War · Total: {{ formatAmount(selectedIncentive.current_amount) }}
                    </v-chip>
                  </template>

                    <!-- Update history -->
                    <v-expansion-panels class="mt-4">
                      <v-expansion-panel>
                        <v-expansion-panel-title>View Update History</v-expansion-panel-title>
                        <v-expansion-panel-text>
                          <div v-if="loadingUpdates" class="d-flex justify-center my-2">
                            <v-progress-circular indeterminate size="24" />
                          </div>
                          <div v-else-if="incentiveUpdates.length === 0" class="text-center py-2">No updates recorded yet</div>
                          <v-timeline v-else density="compact" align="start">
                            <v-timeline-item
                              v-for="update in incentiveUpdates"
                              :key="update.id"
                              :dot-color="update.amount > 0 ? 'success' : 'error'"
                              size="small"
                            >
                              <div class="d-flex align-center">
                                <strong class="mr-2">{{ update.amount > 0 ? '+' : '' }}{{ update.amount }}</strong>
                                <span class="text-caption text-grey">{{ formatDate(update.timestamp) }}</span>
                              </div>
                              <div v-if="update.notes" class="text-body-2 mt-1">{{ update.notes }}</div>
                            </v-timeline-item>
                          </v-timeline>
                        </v-expansion-panel-text>
                      </v-expansion-panel>
                    </v-expansion-panels>
                  </v-card-text>
                </v-card>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Update confirmation dialog -->
    <v-dialog v-model="updateDialog" max-width="500px">
      <v-card>
        <v-card-title>Update Incentive</v-card-title>
        <v-card-text>Are you sure you want to update this incentive?</v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn color="primary" variant="text" @click="updateDialog = false">Cancel</v-btn>
          <v-btn color="success" variant="text" @click="confirmUpdate" :loading="submitting" :disabled="submitting">Update</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete confirmation dialog -->
    <v-dialog v-model="deleteDialog" max-width="500px">
      <v-card>
        <v-card-title>Delete Incentive</v-card-title>
        <v-card-text>Are you sure you want to delete this incentive? This action cannot be undone.</v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn color="primary" variant="text" @click="deleteDialog = false">Cancel</v-btn>
          <v-btn color="error" variant="text" @click="deleteIncentiveConfirmed" :loading="deleting" :disabled="deleting">Delete</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snackbar.show" :color="snackbar.color" :timeout="3000">
      {{ snackbar.text }}
      <template #actions>
        <v-btn variant="text" @click="snackbar.show = false">Close</v-btn>
      </template>
    </v-snackbar>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import type { Incentive, IncentiveUpdate, BidWarOption } from '~/server/database/types';
import { useIncentives } from '~/composable/useIncentives';
import { useAuth } from '~/composable/useAuth';
import { useRouter } from 'vue-router';

const { isAuthenticated } = useAuth();
const router = useRouter();

if (process.client && !isAuthenticated.value) {
  router.push('/login');
}

const {
  incentives, loading, error,
  fetchIncentives, createIncentive, updateIncentive, updateIncentiveAmount,
  deleteIncentive, getIncentiveUpdates, toggleActive,
  getBidWarOptions, addBidWarOption, removeBidWarOption, castBidWarVote
} = useIncentives();

// ── State ──────────────────────────────────────────────────────────────────
const selectedIncentive = ref<Incentive | null>(null);
const updateDialog = ref(false);
const deleteDialog = ref(false);
const incentiveToDelete = ref<Incentive | null>(null);
const isEditing = ref(false);
const submitting = ref(false);
const updatingAmount = ref(false);
const deleting = ref(false);
const loadingUpdates = ref(false);
const incentiveUpdates = ref<IncentiveUpdate[]>([]);
const form = ref<any>(null);
const updateForm = ref<any>(null);

const snackbar = ref({ show: false, text: '', color: 'success' });

const newIncentive = ref({
  id: null as number | null,
  name: '',
  description: '',
  type: 'goal' as 'goal' | 'bid_war',
  target_amount: 100,
  current_amount: 0,
  hashtag: ''
});

const updateData = ref({ amount: 0, notes: '' });

// Incentive being staged for update confirmation
const incentiveToUpdate = ref<any>(null);

// ── Bid war state ──────────────────────────────────────────────────────────
const bidWarOptions = ref<BidWarOption[]>([]);
const loadingOptions = ref(false);
const addingOption = ref(false);
const newOptionName = ref('');
const newOptionHashtag = ref('');
const voteAmounts = ref<Record<number, number>>({});
const votingOptionId = ref<number | null>(null);

const OPTION_COLORS = ['blue', 'red', 'green', 'orange', 'purple', 'teal'];

// ── Computed ───────────────────────────────────────────────────────────────
const progressPercentage = computed(() => {
  if (!selectedIncentive.value) return 0;
  return (selectedIncentive.value.current_amount / selectedIncentive.value.target_amount) * 100;
});

const bidWarTotal = computed(() =>
  bidWarOptions.value.reduce((s, o) => s + Number(o.amount), 0)
);

function optionPct(opt: BidWarOption): number {
  if (!bidWarTotal.value) return 0;
  return Math.round((Number(opt.amount) / bidWarTotal.value) * 100);
}

function optionColor(opt: BidWarOption): string {
  const idx = bidWarOptions.value.findIndex(o => o.id === opt.id);
  return OPTION_COLORS[idx % OPTION_COLORS.length];
}

// ── Methods ────────────────────────────────────────────────────────────────
const refreshIncentives = () => fetchIncentives();

const handleFormSubmit = async () => {
  if (isEditing.value) await updateExistingIncentive();
  else await createNewIncentive();
};

const createNewIncentive = async () => {
  const { valid } = await form.value.validate();
  if (!valid) return;
  submitting.value = true;
  try {
    await createIncentive({
      name: newIncentive.value.name,
      description: newIncentive.value.description,
      type: newIncentive.value.type,
      target_amount: newIncentive.value.type === 'bid_war' ? 0 : newIncentive.value.target_amount,
      current_amount: 0,
      is_active: true,
      hashtag: newIncentive.value.hashtag || undefined
    });
    newIncentive.value = { id: null, name: '', description: '', type: 'goal', target_amount: 100, current_amount: 0, hashtag: '' };
    form.value.reset();
    showNotification('Incentive created successfully', 'success');
  } catch {
    showNotification('Failed to create incentive', 'error');
  } finally {
    submitting.value = false;
  }
};

const editIncentive = (incentive: Incentive) => {
  isEditing.value = true;
  newIncentive.value = {
    id: incentive.id as number,
    name: incentive.name,
    description: incentive.description || '',
    type: incentive.type,
    target_amount: incentive.target_amount,
    current_amount: incentive.current_amount,
    hashtag: incentive.hashtag || ''
  };
  selectIncentive(incentive);
};

const updateExistingIncentive = async () => {
  const { valid } = await form.value.validate();
  if (!valid) return;
  incentiveToUpdate.value = { ...newIncentive.value };
  updateDialog.value = true;
};

const confirmUpdate = async () => {
  submitting.value = true;
  if (!incentiveToUpdate.value?.id) {
    showNotification('No incentive ID', 'error');
    submitting.value = false;
    return;
  }
  try {
    const updated = await updateIncentive(incentiveToUpdate.value.id, {
      name: incentiveToUpdate.value.name,
      description: incentiveToUpdate.value.description,
      target_amount: incentiveToUpdate.value.target_amount,
      current_amount: incentiveToUpdate.value.current_amount,
      hashtag: incentiveToUpdate.value.hashtag || undefined
    });
    if (updated && selectedIncentive.value?.id === updated.id) selectedIncentive.value = updated;
    cancelEdit();
    updateDialog.value = false;
    showNotification('Incentive updated successfully', 'success');
  } catch {
    showNotification('Failed to update incentive', 'error');
  } finally {
    submitting.value = false;
    updateDialog.value = false;
  }
};

const cancelEdit = () => {
  isEditing.value = false;
  newIncentive.value = { id: null, name: '', description: '', type: 'goal', target_amount: 100, current_amount: 0, hashtag: '' };
  form.value?.reset();
};

const handleToggleActive = async (incentive: Incentive) => {
  const updated = await toggleActive(incentive.id as number);
  if (updated) {
    showNotification(`Incentive "${updated.name}" ${updated.is_active ? 'activated' : 'deactivated'}`, 'success');
    if (selectedIncentive.value?.id === updated.id) selectedIncentive.value = updated;
  } else {
    showNotification('Failed to toggle incentive status', 'error');
  }
};

const selectIncentive = async (incentive: Incentive) => {
  selectedIncentive.value = incentive;
  loadingUpdates.value = true;
  try {
    incentiveUpdates.value = await getIncentiveUpdates(incentive.id as number);
  } finally {
    loadingUpdates.value = false;
  }
  if (incentive.type === 'bid_war') {
    await reloadBidWarOptions();
  }
};

const updateAmount = async () => {
  const { valid } = await updateForm.value.validate();
  if (!valid || !selectedIncentive.value) return;
  updatingAmount.value = true;
  try {
    const updated = await updateIncentiveAmount(
      selectedIncentive.value.id as number,
      updateData.value.amount,
      updateData.value.notes
    );
    if (updated) {
      selectedIncentive.value = updated;
      incentiveUpdates.value = await getIncentiveUpdates(updated.id as number, true);
      updateData.value = { amount: 0, notes: '' };
      updateForm.value.reset();
      showNotification('Amount updated successfully', 'success');
    }
  } catch {
    showNotification('Failed to update amount', 'error');
  } finally {
    updatingAmount.value = false;
  }
};

const confirmDelete = (incentive: Incentive) => {
  incentiveToDelete.value = incentive;
  deleteDialog.value = true;
};

const deleteIncentiveConfirmed = async () => {
  if (!incentiveToDelete.value) return;
  deleting.value = true;
  try {
    const success = await deleteIncentive(incentiveToDelete.value.id as number);
    if (success) {
      if (selectedIncentive.value?.id === incentiveToDelete.value.id) selectedIncentive.value = null;
      deleteDialog.value = false;
      incentiveToDelete.value = null;
      showNotification('Incentive deleted successfully', 'success');
    }
  } catch {
    showNotification('Failed to delete incentive', 'error');
  } finally {
    deleting.value = false;
  }
};

// ── Bid war handlers ───────────────────────────────────────────────────────
const reloadBidWarOptions = async () => {
  if (!selectedIncentive.value) return;
  loadingOptions.value = true;
  try {
    bidWarOptions.value = await getBidWarOptions(selectedIncentive.value.id as number, true);
    // Init vote amount inputs
    bidWarOptions.value.forEach(o => {
      if (o.id !== undefined && voteAmounts.value[o.id] === undefined) {
        voteAmounts.value[o.id] = 0;
      }
    });
  } finally {
    loadingOptions.value = false;
  }
};

const handleAddOption = async () => {
  if (!selectedIncentive.value || !newOptionName.value.trim()) return;
  addingOption.value = true;
  try {
    const opt = await addBidWarOption(
      selectedIncentive.value.id as number,
      newOptionName.value.trim(),
      newOptionHashtag.value.trim() || undefined
    );
    if (opt) {
      newOptionName.value = '';
      newOptionHashtag.value = '';
      await reloadBidWarOptions();
      showNotification('Option added', 'success');
    }
  } catch {
    showNotification('Failed to add option', 'error');
  } finally {
    addingOption.value = false;
  }
};

const handleRemoveOption = async (opt: BidWarOption) => {
  if (!selectedIncentive.value) return;
  await removeBidWarOption(selectedIncentive.value.id as number, opt.id as number);
  await reloadBidWarOptions();
  showNotification('Option removed', 'success');
};

const handleVote = async (opt: BidWarOption) => {
  if (!selectedIncentive.value || !opt.id) return;
  const amount = voteAmounts.value[opt.id];
  if (!amount || amount === 0) return;
  votingOptionId.value = opt.id;
  try {
    const result = await castBidWarVote(
      selectedIncentive.value.id as number,
      opt.id,
      amount
    );
    if (result) {
      selectedIncentive.value = result.incentive;
      bidWarOptions.value = result.options;
      voteAmounts.value[opt.id] = 0;
      incentiveUpdates.value = await getIncentiveUpdates(selectedIncentive.value.id as number, true);
      showNotification(`+${amount} for "${opt.name}"`, 'success');
    }
  } catch {
    showNotification('Failed to cast vote', 'error');
  } finally {
    votingOptionId.value = null;
  }
};

// ── Helpers ────────────────────────────────────────────────────────────────
const showNotification = (text: string, color: 'success' | 'error' | 'info' = 'success') => {
  snackbar.value = { show: true, text, color };
};

const formatDate = (timestamp?: string) => timestamp ? new Date(timestamp).toLocaleString() : '';
const formatAmount = (val: number | string) => `${Number(val).toLocaleString('fr-FR')} €`;

onMounted(() => fetchIncentives());

watch(incentives, (list) => {
  if (selectedIncentive.value) {
    const updated = list.find(i => i.id === selectedIncentive.value?.id);
    if (updated) selectedIncentive.value = updated;
  }
});
</script>
