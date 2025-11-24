<template>
  <v-container>
    <v-row justify="center">
      <v-col cols="12" md="8">
        <v-card>
          <v-card-title class="text-h5">
            <v-icon start color="primary">mdi-twitch</v-icon>
            Twitch Authentication
          </v-card-title>
          
          <v-card-text>
            <v-alert
              :color="status.color"
              variant="tonal"
              :icon="status.icon"
              class="mb-4"
            >
              {{ status.message }}
            </v-alert>
            
            <div v-if="status.success" class="text-center mt-4">
              <v-btn
                color="primary"
                to="/dashboard"
                prepend-icon="mdi-view-dashboard"
              >
                Return to Dashboard
              </v-btn>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { useTwitch } from '../../../composable/useTwitch';
import { useRouter } from 'vue-router';

const router = useRouter();
const twitch = useTwitch();

const status = reactive({
  message: 'Processing authentication...',
  color: 'info',
  icon: 'mdi-loading',
  success: false
});

onMounted(async () => {
  try {
    // Check for access token in URL hash
    if (window.location.hash) {
      const params = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = params.get('access_token');
      const scope = params.get('scope');
      const state = params.get('state');
      
      // Verify state if it exists
      const storedState = localStorage.getItem('twitchAuthState');
      if (state && storedState && state !== storedState) {
        throw new Error('State mismatch. Possible CSRF attack.');
      }
      
      // Clear the stored state
      localStorage.removeItem('twitchAuthState');
      
      if (accessToken) {
        // Handle the authentication with the access token
        const success = await twitch.handleAuthCode(accessToken);
        
        if (success) {
          status.message = 'Successfully authenticated with Twitch!';
          status.color = 'success';
          status.icon = 'mdi-check-circle';
          status.success = true;
          
          // Get the return URL from localStorage or default to dashboard
          const returnUrl = localStorage.getItem('twitchAuthReturnUrl') || '/dashboard';
          
          // Redirect to the return URL after a short delay
          setTimeout(() => {
            router.push(returnUrl);
            // Clear the return URL from localStorage
            localStorage.removeItem('twitchAuthReturnUrl');
          }, 2000);
        } else {
          status.message = 'Failed to authenticate with Twitch. Please try again.';
          status.color = 'error';
          status.icon = 'mdi-alert-circle';
        }
      } else {
        // No access token found
        status.message = 'No access token found in the URL. Please try authenticating again.';
        status.color = 'error';
        status.icon = 'mdi-alert-circle';
      }
    } else if (window.location.search) {
      // Check for error in query parameters
      const params = new URLSearchParams(window.location.search);
      const error = params.get('error');
      const errorDescription = params.get('error_description');
      
      if (error) {
        status.message = `Authentication error: ${error}${errorDescription ? ` - ${errorDescription}` : ''}`;
        status.color = 'error';
        status.icon = 'mdi-alert-circle';
      }
    } else {
      // No hash or query parameters
      status.message = 'No authentication data found. Please try authenticating again.';
      status.color = 'error';
      status.icon = 'mdi-alert-circle';
    }
  } catch (error: any) {
    status.message = `Error processing authentication: ${error.message}`;
    status.color = 'error';
    status.icon = 'mdi-alert-circle';
  }
});
</script>