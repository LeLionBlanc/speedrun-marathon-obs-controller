<template>
  <v-container>
    <v-row>
      <v-col cols="12">
        <v-card>
          <v-card-title class="text-h5">
            <v-icon start color="primary">mdi-send</v-icon>
            Bluesky Integration
          </v-card-title>
          
          <v-card-text>
            <v-alert
              v-if="bluesky.isConnected"
              type="success"
              variant="tonal"
              icon="mdi-check-circle"
              class="mb-4"
            >
              Connected to Bluesky as {{ bluesky.savedCredentials.identifier }}
            </v-alert>
            
            <v-alert
              v-if="bluesky.connectionError && bluesky.connectionError.length > 0"
              type="error"
              variant="tonal"
              icon="mdi-alert-circle"
              class="mb-4"
            >
              {{ bluesky.connectionError }}
            </v-alert>
            
            <v-expansion-panels>
              <v-expansion-panel>
                <v-expansion-panel-title>
                  <v-icon start color="primary" icon="mdi-account"></v-icon>
                  Bluesky Account Settings
                </v-expansion-panel-title>
                <v-expansion-panel-text>
                  <v-form @submit.prevent="connectToBluesky">
                    <v-row>
                      <v-col cols="12" md="6">
                        <v-text-field
                          v-model="credentials.identifier"
                          label="Bluesky Handle or Email"
                          variant="outlined"
                          :disabled="bluesky.isConnected.value"
                          required
                        ></v-text-field>
                      </v-col>
                      <v-col cols="12" md="6">
                        <v-text-field
                          v-model="credentials.password"
                          label="Password"
                          variant="outlined"
                          type="password"
                          :disabled="bluesky.isConnected.value"
                          required
                        ></v-text-field>
                      </v-col>
                      <v-col cols="12" class="d-flex justify-end">
                        <v-btn
                          v-if="!bluesky.isConnected.value"
                          type="submit"
                          color="primary"
                          prepend-icon="mdi-login"
                          :loading="connecting"
                        >
                          Connect
                        </v-btn>
                        <v-btn
                          v-else
                          @click="disconnectFromBluesky"
                          color="error"
                          prepend-icon="mdi-logout"
                        >
                          Disconnect
                        </v-btn>
                      </v-col>
                    </v-row>
                  </v-form>
                </v-expansion-panel-text>
              </v-expansion-panel>
              
              <v-expansion-panel>
                <v-expansion-panel-title>
                  <v-icon start color="primary" icon="mdi-message-text"></v-icon>
                  Post Template
                </v-expansion-panel-title>
                <v-expansion-panel-text>
                  <v-row>
                    <v-col cols="12">
                      <v-textarea
                        v-model="postTemplate.text"
                        label="Post Template"
                        hint="Use {gamename}, {gamecategory}, {gamesupport}, {runner}, {customMessage}, etc. as placeholders"
                        persistent-hint
                        auto-grow
                        variant="outlined"
                        rows="5"
                      ></v-textarea>
                    </v-col>
                    <v-col cols="12">
                      <v-text-field
                        v-model="postTemplate.gifUrl"
                        label="Image (optional)"
                        hint="URL to an image to include in the post"
                        placeholder="image_url from planning"
                        persistent-hint
                        variant="outlined"
                      ></v-text-field>
                    </v-col>
                    <v-col cols="12" class="d-flex justify-end">
                      <v-btn
                        @click="saveTemplate"
                        color="success"
                        prepend-icon="mdi-content-save"
                      >
                        Save Template
                      </v-btn>
                    </v-col>
                  </v-row>
                </v-expansion-panel-text>
              </v-expansion-panel>
              
              <v-expansion-panel>
                <v-expansion-panel-title>
                  <v-icon start color="primary" icon="mdi-cog"></v-icon>
                  Auto-Post Settings
                </v-expansion-panel-title>
                <v-expansion-panel-text>
                  <v-row>
                    <v-col cols="12">
                      <v-switch
                        v-model="autoPostEnabled"
                        label="Automatically post to Bluesky when a run starts"
                        color="primary"
                      ></v-switch>
                    </v-col>
                    <v-col cols="12" class="d-flex justify-end">
                      <v-btn
                        @click="saveSettings"
                        color="success"
                        prepend-icon="mdi-content-save"
                      >
                        Save Settings
                      </v-btn>
                    </v-col>
                  </v-row>
                </v-expansion-panel-text>
              </v-expansion-panel>
            </v-expansion-panels>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
    
    <v-row class="mt-4">
      <v-col cols="12">
        <v-card>
          <v-card-title class="text-h5">
            <v-icon start color="primary">mdi-message-text-outline</v-icon>
            Preview Post
          </v-card-title>
          
          <v-card-text>
            <v-alert
              v-if="!currentRun"
              type="info"
              variant="tonal"
              icon="mdi-information"
              class="mb-4"
            >
              No current run selected. Select a run to preview the post.
            </v-alert>
            
            <div v-else class="pa-4 rounded bg-grey-lighten-4">
              <h3 class="text-h6 mb-2">Post Preview</h3>
              <p class="text-body-1 mb-4">{{ previewText }}</p>
              
              <v-card-actions class="justify-end">
                <v-btn
                  @click="testPost"
                  color="primary"
                  prepend-icon="mdi-send"
                  :disabled="!bluesky.isConnected.value"
                  :loading="posting"
                >
                  Test Post
                </v-btn>
              </v-card-actions>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
    
    <!-- Snackbar for notifications -->
    <v-snackbar
      v-model="snackbar.show"
      :color="snackbar.color"
      :timeout="3000"
    >
      {{ snackbar.text }}
      <template v-slot:actions>
        <v-btn
          variant="text"
          @click="snackbar.show = false"
        >
          Close
        </v-btn>
      </template>
    </v-snackbar>
  </v-container>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue';
import { useBluesky } from '../composable/useBluesky';

const emit = defineEmits(['update:auto-post-enabled']);

const bluesky = useBluesky();
const connecting = ref(false);
const posting = ref(false);

// Credentials form
const credentials = reactive({
  identifier: bluesky.savedCredentials.identifier,
  password: bluesky.savedCredentials.password
});

// Post template
const postTemplate = reactive({
  text: bluesky.savedPost.text || 'Now playing: {gamename} {gamecategory} on {gamesupport} by {runner}\n\n{customMessage}',
  gifUrl: bluesky.savedPost.gifUrl || ''
});

// Auto-post settings
const autoPostEnabled = ref(false);

// Snackbar for notifications
const snackbar = reactive({
  show: false,
  text: '',
  color: 'success'
});

// Define Run interface
interface Run {
  gamename: string;
  gameestimate: string;
  gamecategory: string;
  gamesupport: string;
  runner: string;
  runner2?: string;
  runner3?: string;
  runner4?: string;
  commentator: string;
  startat: string;
  customMessage?: string; // Added custom message field
  [key: string]: string | undefined;
}

// Current run for preview
const currentRun = ref<Run | null>(null);

// Load settings from localStorage
onMounted(() => {
  if (typeof window !== 'undefined' && window.localStorage) {
    const autoPostSetting = localStorage.getItem('blueskyAutoPost');
    if (autoPostSetting) {
      autoPostEnabled.value = JSON.parse(autoPostSetting);
    }
    
    // Try to connect with saved credentials
    if (bluesky.savedCredentials.identifier && bluesky.savedCredentials.password) {
      connectToBluesky();
    }
    
    // Try to get current run from localStorage
    const currentRunData = localStorage.getItem('idData');
    const planningData = localStorage.getItem('planningData');
    
    if (currentRunData && planningData) {
      try {
        const runs = JSON.parse(planningData);
        const currentIndex = parseInt(currentRunData);
        if (runs && runs[currentIndex]) {
          currentRun.value = runs[currentIndex];
        }
      } catch (e) {
        console.error('Error loading current run data:', e);
      }
    }
  }
});

// Connect to Bluesky
const connectToBluesky = async () => {
  connecting.value = true;
  try {
    const success = await bluesky.connect({
      identifier: credentials.identifier,
      password: credentials.password
    });
    
    if (success) {
      showSnackbar('Connected to Bluesky successfully', 'success');
    } else {
      showSnackbar('Failed to connect to Bluesky', 'error');
    }
  } catch (error: any) {
    showSnackbar(`Error: ${error.message}`, 'error');
  } finally {
    connecting.value = false;
  }
};

// Disconnect from Bluesky
const disconnectFromBluesky = () => {
  // Reset connection state
  bluesky.isConnected.value = false;
  bluesky.connectionError.value = null; // Clear any previous connection error
  showSnackbar('Disconnected from Bluesky', 'info');
};

// Save post template
const saveTemplate = () => {
  bluesky.savePostTemplate({
    text: postTemplate.text,
    gifUrl: postTemplate.gifUrl
  });
  showSnackbar('Post template saved', 'success');
};

// Save settings
const saveSettings = () => {
  if (typeof window !== 'undefined' && window.localStorage) {
    localStorage.setItem('blueskyAutoPost', JSON.stringify(autoPostEnabled.value));
  }
  emit('update:auto-post-enabled', autoPostEnabled.value);
  showSnackbar('Settings saved', 'success');
};

// Watch for changes in autoPostEnabled
watch(autoPostEnabled, (newValue) => {
  emit('update:auto-post-enabled', newValue);
});

// Preview post text
const previewText = computed(() => {
  if (!currentRun.value) return '';
  
  let text = postTemplate.text;
  const run = currentRun.value;
  
  if (!run) return '';
  
  return text.replace(/{gamename}/g, run.gamename || '')
            .replace(/{gamecategory}/g, run.gamecategory || '')
            .replace(/{gamesupport}/g, run.gamesupport || '')
            .replace(/{runner}/g, run.runner || '')
            .replace(/{runner2}/g, run.runner2 || '')
            .replace(/{runner3}/g, run.runner3 || '')
            .replace(/{runner4}/g, run.runner4 || '')
            .replace(/{commentator}/g, run.commentator || '')
            .replace(/{customMessage}/g, run.customMessage || '');
});

// Test post
const testPost = async () => {
  if (!currentRun.value) {
    showSnackbar('No run selected', 'error');
    return;
  }
  
  posting.value = true;
  try {
    await bluesky.createPost(currentRun.value);
    showSnackbar('Test post created successfully', 'success');
  } catch (error: any) {
    showSnackbar(`Error creating post: ${error.message}`, 'error');
  } finally {
    posting.value = false;
  }
};

// Show snackbar
const showSnackbar = (text: string, color: string) => {
  snackbar.text = text;
  snackbar.color = color;
  snackbar.show = true;
};

// Expose for parent components
defineExpose({
  autoPostEnabled
});
</script>