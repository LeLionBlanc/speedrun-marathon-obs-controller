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

          <v-window-item value="bluesky">
            <BlueskyConfig ref="blueskyConfig" @update:auto-post-enabled="updateBlueskyAutoPost" />
          </v-window-item>
        </v-window>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue';
import { useRoute } from 'vue-router';
import BlueskyConfig from '../components/BlueskyConfig.vue';
import StreamTitleConfig from '../components/StreamTitleConfig.vue';

const route = useRoute();
const step = ref('home');
const activeTab = ref<string | null>('home');
const blueskyAutoPostEnabled = ref(false);
const currentRunData = ref(null);

// Load Bluesky auto-post setting from localStorage
if (typeof window !== "undefined" && window.localStorage) {
  const autoPostSetting = localStorage.getItem('blueskyAutoPost');
  if (autoPostSetting) {
    blueskyAutoPostEnabled.value = JSON.parse(autoPostSetting);
  }
}

// Update Bluesky auto-post setting
const updateBlueskyAutoPost = (enabled: boolean) => {
  blueskyAutoPostEnabled.value = enabled;
};

onMounted(() => {
  // Get step from URL query parameter if available
    const queryStep = route.query.step as string;
    if (queryStep && ['home', 'planning', 'txt', 'streamTitle', 'bluesky'].includes(queryStep)) {
    step.value = queryStep;
    activeTab.value = queryStep;
  }
});

// Watch for step changes to update the active tab
watch(step, (newStep) => {
  activeTab.value = newStep;
  
  // If we're on the planning tab, try to get the current run data
  if (newStep === 'planning' || newStep === 'streamTitle') {
    loadCurrentRunData();
  }
});

// Load current run data from localStorage
const loadCurrentRunData = () => {
  if (typeof window !== "undefined" && window.localStorage) {
    const planningData = localStorage.getItem("planningData");
    const idData = localStorage.getItem("idData");
    
    if (planningData && idData) {
      try {
        const runs = JSON.parse(planningData);
        const currentStep = parseInt(idData, 10);
        
        if (runs && runs[currentStep]) {
          currentRunData.value = runs[currentStep];
        }
      } catch (e) {
        console.error("Error loading current run data:", e);
      }
    }
  }
};

// Load current run data on component mount
onMounted(() => {
  loadCurrentRunData();
});
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