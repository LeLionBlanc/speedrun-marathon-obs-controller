<template>
  <v-container fluid>
    <v-card>
      <v-tabs
        v-model="activeTab"
        bg-color="primary"
        align-tabs="center"
      >
        <v-tab value="home" to="/">
          <v-icon start>mdi-home</v-icon>
          Home
        </v-tab>
        <v-tab value="planning" @click="step = 'planning'">
          <v-icon start>mdi-calendar</v-icon>
          Planning
        </v-tab>
        <v-tab value="txt" @click="step = 'txt'">
          <v-icon start>mdi-text</v-icon>
          Text Sources
        </v-tab>
        <v-tab value="bluesky" @click="step = 'bluesky'">
          <v-icon start>mdi-send</v-icon>
          Bluesky
        </v-tab>
      </v-tabs>
    </v-card>

    <v-card class="mt-4" flat>
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

          <v-window-item value="bluesky">
            <BlueskyConfig ref="blueskyConfig" @update:auto-post-enabled="updateBlueskyAutoPost" />
          </v-window-item>
        </v-window>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import BlueskyConfig from '../components/BlueskyConfig.vue';

const route = useRoute();
const step = ref('home');
const activeTab = ref<string | null>('home');
const blueskyAutoPostEnabled = ref(false);

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
  if (queryStep && ['home', 'planning', 'txt', 'bluesky'].includes(queryStep)) {
    step.value = queryStep;
    activeTab.value = queryStep;
  }
});

// Watch for step changes to update the active tab
watch(step, (newStep) => {
  activeTab.value = newStep;
});
</script>