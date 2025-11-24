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
      <v-col cols="12">
        <v-card class="mb-4">
          <v-card-title class="text-h5">
            <v-icon start icon="mdi-connection" color="primary"></v-icon>
            Connection Status
          </v-card-title>
          <v-card-text>
            <v-row>
              <!-- OBS Connection -->
              <v-col cols="12" md="4">
                <v-list-item>
                  <template v-slot:prepend>
                    <v-icon
                      :color="connectionStatus ? 'success' : 'error'"
                      :icon="connectionStatus ? 'mdi-check-circle' : 'mdi-alert-circle'"
                    ></v-icon>
                  </template>
                  <v-list-item-title>OBS</v-list-item-title>
                  <v-list-item-subtitle>
                    {{ connectionStatus ? 'Connected' : 'Not connected' }}
                  </v-list-item-subtitle>
                  <template v-slot:append>
                    <v-btn size="small" color="primary" @click="toggleConnection" variant="tonal">
                      {{ connectionStatus ? 'Disconnect' : 'Connect' }}
                    </v-btn>
                  </template>
                </v-list-item>
              </v-col>
              
              <!-- Bluesky Connection -->
              <v-col cols="12" md="4">
                <v-list-item>
                  <template v-slot:prepend>
                    <v-icon
                      :color="blueskyConnected ? 'success' : 'error'"
                      :icon="blueskyConnected ? 'mdi-check-circle' : 'mdi-alert-circle'"
                    ></v-icon>
                  </template>
                  <v-list-item-title>Bluesky</v-list-item-title>
                  <v-list-item-subtitle>
                    {{ blueskyConnected ? `Connected as ${bluesky.savedCredentials.identifier}` : 'Not connected' }}
                  </v-list-item-subtitle>
                  <template v-slot:append>
                    <v-btn size="small" color="primary" to="/dashboard?step=bluesky" variant="tonal">
                      Configure
                    </v-btn>
                  </template>
                </v-list-item>
              </v-col>
              
              <!-- Twitch Connection -->
              <v-col cols="12" md="4">
                <v-list-item>
                  <template v-slot:prepend>
                    <v-icon
                      :color="twitchConnected ? 'success' : 'error'"
                      :icon="twitchConnected ? 'mdi-check-circle' : 'mdi-alert-circle'"
                    ></v-icon>
                  </template>
                  <v-list-item-title>Twitch</v-list-item-title>
                  <v-list-item-subtitle>
                    {{ twitchConnected ? (twitch.credentials.channelId ? `Connected (Channel ID: ${twitch.credentials.channelId})` : 'Connected') : 'Not connected' }}
                  </v-list-item-subtitle>
                  <template v-slot:append>
                    <v-btn size="small" color="primary" to="/dashboard?step=twitch" variant="tonal">
                      Configure
                    </v-btn>
                  </template>
                </v-list-item>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
    
    <v-row>
      <v-col cols="12" md="6">
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

      <v-col cols="12" md="6">
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
    </v-row>
  </v-container>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue';
import { useObsWebsocket } from '../composable/useObsWebsocket';
import { useBluesky } from '../composable/useBluesky';
import { useTwitch } from '../composable/useTwitch';

const obs = useObsWebsocket();
const bluesky = useBluesky();
const twitch = useTwitch();

const connectionStatus = ref(false);
const blueskyConnected = ref(false);
const twitchConnected = ref(false);

// Watch for changes in connection status
watch(() => obs.connectionStatus.value, (newValue) => {
  connectionStatus.value = newValue;
});

watch(() => bluesky.isConnected.value, (newValue) => {
  blueskyConnected.value = newValue;
});

watch(() => twitch.isConnected.value, (newValue) => {
  twitchConnected.value = newValue;
});

// Try to connect on page load
onMounted(async () => {
  try {
    // Connect to OBS
    await obs.connect();
    connectionStatus.value = obs.connectionStatus.value;
    
    // Try to connect to Bluesky if we have saved credentials
    if (bluesky.savedCredentials.identifier && bluesky.savedCredentials.password) {
      try {
        await bluesky.connect();
      } catch (blueskyError) {
        console.error('Failed to connect to Bluesky:', blueskyError);
      }
    }
    
    // Try to connect to Twitch if we have a valid access token
    if (twitch.credentials.accessToken && twitch.credentials.expiresAt > Date.now()) {
      try {
        // Validate the token
        await twitch.refreshAccessToken();
      } catch (twitchError) {
        console.error('Failed to connect to Twitch:', twitchError);
      }
    }
    
    // Check Bluesky connection status
    blueskyConnected.value = bluesky.isConnected.value;
    
    // Check Twitch connection status
    twitchConnected.value = twitch.isConnected.value;
  } catch (error) {
    console.error('Failed to connect to OBS:', error);
  }
});

// Toggle OBS connection
const toggleConnection = async () => {
  if (connectionStatus.value) {
    await obs.disconnect();
  } else {
    await obs.connect();
  }
  connectionStatus.value = obs.connectionStatus.value;
};
</script>