<template>
  <v-container>
    <v-row>
      <v-col cols="12">
        <v-card>
          <v-card-title class="text-h5">
            <v-icon start color="primary">mdi-format-title</v-icon>
            Stream Title Configuration
          </v-card-title>
          
          <v-card-text>
            <v-alert
              v-if="updateStatus"
              :color="updateStatus.includes('Error') ? 'error' : 'success'"
              variant="tonal"
              :icon="updateStatus.includes('Error') ? 'mdi-alert-circle' : 'mdi-check-circle'"
              class="mb-4"
            >
              {{ updateStatus }}
            </v-alert>
            
            <v-alert
              v-if="!twitchConnected"
              type="warning"
              variant="tonal"
              icon="mdi-alert"
              class="mb-4"
            >
              Not connected to Twitch. Please click the "Connect to Twitch" button below to authenticate.
              
              <div class="mt-4">
                <v-btn
                  color="primary"
                  @click="startTwitchAuth"
                  prepend-icon="mdi-twitch"
                  class="mb-3"
                >
                  Connect to Twitch
                </v-btn>
              </div>
            </v-alert>
            
            <v-alert
              v-if="twitchConnected"
              type="success"
              variant="tonal"
              icon="mdi-check-circle"
              class="mb-4"
            >
              Connected to Twitch! You can now update your stream title.
            </v-alert>
            
            <v-form @submit.prevent="saveSettings">
              <v-row>
                <v-col cols="12">
                  <v-switch
                    v-model="localConfig.updateGame"
                    label="Also update game name on Twitch"
                    color="primary"
                    hide-details
                  ></v-switch>
                </v-col>
                
                <v-col cols="12">
                  <v-textarea
                    v-model="localConfig.template"
                    label="Title Template"
                    hint="Use placeholders like {gamename}, {gamecategory}, {runners}, etc."
                    persistent-hint
                    auto-grow
                    variant="outlined"
                    rows="3"
                  ></v-textarea>
                </v-col>
                
                <v-col cols="12">
                  <v-card variant="outlined" class="pa-3 mb-4">
                    <div class="text-subtitle-1 mb-2">Available Placeholders:</div>
                    <v-chip-group>
                      <v-chip
                        v-for="placeholder in availablePlaceholders"
                        :key="placeholder"
                        color="primary"
                        variant="outlined"
                        @click="insertPlaceholder(placeholder)"
                        class="ma-1"
                      >
                        {{ placeholder }}
                      </v-chip>
                    </v-chip-group>
                  </v-card>
                </v-col>
                
                <v-col cols="12" v-if="currentRun">
                  <v-card variant="outlined" class="pa-3 mb-4">
                    <div class="text-subtitle-1 mb-2">Preview:</div>
                    <div class="text-body-1 pa-2 bg-grey-lighten-4 rounded">
                      {{ previewTitle }}
                    </div>
                  </v-card>
                </v-col>
              </v-row>
              
              <v-card-actions class="justify-end">
                <v-btn
                  type="submit"
                  color="primary"
                  :loading="isUpdating"
                  prepend-icon="mdi-content-save"
                >
                  Save Settings
                </v-btn>
                
                <v-btn
                  @click="updateTitleNow"
                  color="success"
                  :loading="isUpdating"
                  :disabled="!currentRun"
                  class="ml-2"
                  prepend-icon="mdi-update"
                >
                  Update Title Now
                </v-btn>
              </v-card-actions>
            </v-form>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { reactive, computed, watch, defineProps } from 'vue';
import { useStreamTitle } from '../composable/useStreamTitle';
import { useTwitch } from '../composable/useTwitch';
const props = defineProps({
  currentRun: {
    type: Object,
    default: null
  }
});

const streamTitle = useStreamTitle();
const twitch = useTwitch();
const { config, saveConfig, generateTitle, updateTitle, updateStatus, isUpdating } = streamTitle;
const twitchConnected = computed(() => twitch.isConnected.value);

// Local copy of config for editing
const localConfig = reactive({
  template: config.template,
  updateGame: config.updateGame
});

// Available placeholders
const availablePlaceholders = [
  '{gamename}',
  '{gamecategory}',
  '{gamesupport}',
  '{runner}',
  '{runner2}',
  '{runner3}',
  '{runner4}',
  '{runners}',
  '{commentator}'
];

// Preview the title with current run data
const previewTitle = computed(() => {
  if (!props.currentRun) return 'No current run data available';
  return generateTitle(props.currentRun);
});

// Insert placeholder at cursor position
const insertPlaceholder = (placeholder: string) => {
  localConfig.template += placeholder;
};

// Save settings
const saveSettings = async () => {
  // Save stream title config
  saveConfig({
    template: localConfig.template,
    updateGame: localConfig.updateGame
  });
};

// Start Twitch authentication
const startTwitchAuth = () => {
  twitch.startAuth();
};

// Update title immediately
const updateTitleNow = async () => {
  if (!props.currentRun) return;
  
  // Save settings first
  saveSettings();
  
  // Update the title
  await updateTitle(props.currentRun);
};

// Initialize local config from saved config
watch(() => config, (newConfig) => {
  localConfig.template = newConfig.template;
  localConfig.updateGame = newConfig.updateGame;
}, { immediate: true, deep: true });

// Watch for changes in Twitch connection status
watch(() => twitch.isConnected.value, (connected) => {
  if (connected) {
    updateStatus.value = 'Connected to Twitch';
  }
});

// No additional code needed - authentication is now handled in the callback page
</script>