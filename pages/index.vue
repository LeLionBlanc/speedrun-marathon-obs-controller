<template>
  <v-container>
    <v-row>
      <v-col cols="12">
        <v-card class="mb-4">
          <v-card-title class="text-h4">
            Welcome to OBS Controller
          </v-card-title>
          <v-card-text>
            <p>This application helps you manage your OBS streaming setup with ease.</p>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12" md="4">
        <v-card height="100%">
          <v-card-title class="text-h5">
            <v-icon start icon="mdi-calendar" color="primary"></v-icon>
            Planning
          </v-card-title>
          <v-card-text>
            Manage your stream schedule and planning. Set up games, categories, and runners.
          </v-card-text>
          <v-card-actions>
            <v-btn color="primary" to="/dashboard?step=planning" variant="tonal">
              Go to Planning
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>

      <v-col cols="12" md="4">
        <v-card height="100%">
          <v-card-title class="text-h5">
            <v-icon start icon="mdi-text" color="primary"></v-icon>
            Text Sources
          </v-card-title>
          <v-card-text>
            Update text sources in OBS directly from this application.
          </v-card-text>
          <v-card-actions>
            <v-btn color="primary" to="/dashboard?step=txt" variant="tonal">
              Manage Text Sources
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>

      <v-col cols="12" md="4">
        <v-card height="100%">
          <v-card-title class="text-h5">
            <v-icon start icon="mdi-connection" color="primary"></v-icon>
            Connection Status
          </v-card-title>
          <v-card-text>
            <v-alert
              :type="connectionStatus ? 'success' : 'error'"
              :icon="connectionStatus ? 'mdi-check-circle' : 'mdi-alert-circle'"
              variant="tonal"
              class="mb-2"
            >
              {{ connectionStatus ? 'Connected to OBS' : 'Not connected to OBS' }}
            </v-alert>
          </v-card-text>
          <v-card-actions>
            <v-btn color="primary" @click="toggleConnection" variant="tonal">
              {{ connectionStatus ? 'Disconnect' : 'Connect' }}
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { useObsWebsocket } from '../composable/useObsWebsocket';

const obs = useObsWebsocket();
const connectionStatus = ref(false);

// Try to connect on page load
onMounted(async () => {
  try {
    await obs.connect();
    connectionStatus.value = obs.connectionStatus.value;
  } catch (error) {
    console.error('Failed to connect to OBS:', error);
  }
});

// Toggle connection
const toggleConnection = async () => {
  if (connectionStatus.value) {
    await obs.disconnect();
  } else {
    await obs.connect();
  }
  connectionStatus.value = obs.connectionStatus.value;
};
</script>