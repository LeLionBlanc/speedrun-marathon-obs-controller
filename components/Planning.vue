<template>
  <v-container>
    <v-row>
      <v-col cols="12">
        <v-card>
          <v-card-title class="text-h5">
            <v-icon start color="primary">mdi-calendar</v-icon>
            Planning
          </v-card-title>
          
          <v-card-text>
            <v-sheet class="pa-4 mb-4" rounded color="grey-lighten-4">
              <h3 class="text-h6 mb-2">Planning Input</h3>
              <v-textarea
                v-model="planning"
                label="Enter JSON planning data"
                hint="Enter your planning data in JSON format"
                persistent-hint
                auto-grow
                variant="outlined"
                rows="5"
              ></v-textarea>
            </v-sheet>

            <v-divider class="my-4"></v-divider>

            <v-sheet v-if="runs.length" class="pa-4" rounded color="grey-lighten-4">
              <h3 class="text-h6 mb-2">Controls</h3>
              
              <v-alert
                color="info"
                variant="tonal"
                icon="mdi-information"
                class="mb-4"
              >
                <p class="mb-1">Current Run #{{ currentStep + 1 }}/{{ runs.length }}:</p>
                <p class="font-weight-bold">{{ `${runs[currentStep].gamename} ${runs[currentStep].gamecategory} (${runs[currentStep].gamesupport})` }}</p>
                <p>Start time: {{ new Date(runs[currentStep].startat).toLocaleTimeString() }}</p>
                <p>Next run in: {{ up_next_time }}</p>
                
                <v-chip
                  v-if="props.autoPostEnabled"
                  color="primary"
                  size="small"
                  class="mt-2"
                >
                  <v-icon start size="small">mdi-send</v-icon>
                  Bluesky Auto-Post Enabled
                </v-chip>
                
                <v-divider class="my-3"></v-divider>
                
                <h4 class="text-subtitle-1 mb-2">Custom Message for Bluesky</h4>
                <v-textarea
                  v-model="currentCustomMessage"
                  label="Custom message for this run"
                  hint="This message will be included in the Bluesky post when this run starts"
                  persistent-hint
                  auto-grow
                  variant="outlined"
                  rows="3"
                  class="mt-2"
                ></v-textarea>
              </v-alert>
              
              <v-card-actions class="justify-center">
                <v-btn
                  :disabled="currentStep <= 0"
                  @click="addIndex(-1)"
                  prepend-icon="mdi-arrow-left"
                  color="primary"
                  variant="tonal"
                >
                  Previous
                </v-btn>
                
                <v-btn
                  @click="update()"
                  prepend-icon="mdi-check"
                  color="success"
                  class="mx-2"
                >
                  Apply
                </v-btn>
                
                <v-tooltip v-if="blueskyPostResult" :text="blueskyPostResult">
                  <template v-slot:activator="{ props }">
                    <v-btn
                      v-bind="props"
                      :color="blueskyPostResult && blueskyPostResult.includes('Error') ? 'error' : 'success'"
                      :loading="postingToBluesky"
                      icon="mdi-send"
                      variant="text"
                      class="mx-1"
                    ></v-btn>
                  </template>
                </v-tooltip>
                
                <v-btn
                  :disabled="currentStep >= runs.length - 1"
                  @click="addIndex(1)"
                  append-icon="mdi-arrow-right"
                  color="primary"
                  variant="tonal"
                >
                  Next
                </v-btn>
              </v-card-actions>
            </v-sheet>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-row class="mt-4">
      <v-col cols="12">
        <v-card>
          <v-card-title class="d-flex align-center">
            <span class="text-h5">Schedule Overview</span>
            <v-spacer></v-spacer>
            <v-btn
              @click="switchPlanning()"
              :icon="showPlanning ? 'mdi-eye-off' : 'mdi-eye'"
              variant="text"
              color="primary"
            ></v-btn>
          </v-card-title>
          
          <v-expand-transition>
            <div v-if="showPlanning">
              <v-divider></v-divider>
              
              <v-table>
                <thead>
                  <tr>
                    <th>Game</th>
                    <th>Estimate</th>
                    <th>Category</th>
                    <th>Platform</th>
                    <th>Runner</th>
                    <th>Commentator</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(run, index) in runs" :key="index" :class="{ 'bg-primary-lighten-5': index === currentStep }">
                    <td>{{ run.gamename }}</td>
                    <td>{{ run.gameestimate }}</td>
                    <td>{{ run.gamecategory }}</td>
                    <td>{{ run.gamesupport }}</td>
                    <td>{{ run.runner }} {{ run.runner2 }} {{ run.runner3 }} {{ run.runner4 }}</td>
                    <td>{{ run.commentator }}</td>
                  </tr>
                </tbody>
              </v-table>
            </div>
          </v-expand-transition>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
const props = defineProps({
  autoPostEnabled: {
    type: Boolean,
    default: false
  }
});
import { useObsWebsocket } from '../composable/useObsWebsocket';
import { useBluesky } from '../composable/useBluesky';

interface Run {
  gamename: string;
  gameestimate: string;
  gamecategory: string;
  gamesupport: string;
  runner: string;
  runner2?: string;
  runner3?: string;
  runner4?: string;
  isRace: boolean;
  commentator: string;
  startat: string;
  customMessage?: string; // Added custom message field
  [key: string]: string | boolean | undefined; // Add index signature
}

interface ObsTextMapping {
  [key: string]: string; // Add index signature
}

const obs = useObsWebsocket();
const bluesky = useBluesky();
await obs.connect();

// Bluesky posting state
const postingToBluesky = ref(false);
const blueskyPostResult = ref<string | null>(null);

const planning = ref("");
const currentStep = ref(0);
const showPlanning = ref(false);
const currentCustomMessage = ref("");

// Check if any run is a race
const hasRaces = computed(() => {
  return runs.value.some(run => run.isRace);
});

// Load data from localStorage if available
if (typeof window !== "undefined" && window.localStorage) {
  const planningData = localStorage.getItem("planningData");
  const idData = localStorage.getItem("idData");
  if (planningData) {
    planning.value = planningData;
  }
  if (idData) {
    currentStep.value = +idData;
  }
  
  // Load custom message for current run
  if (planning.value && currentStep.value >= 0) {
    try {
      const parsedRuns = JSON.parse(planning.value);
      if (parsedRuns && parsedRuns[currentStep.value]) {
        currentCustomMessage.value = parsedRuns[currentStep.value].customMessage || "";
      }
    } catch (e) {
      console.error("Error loading custom message:", e);
    }
  }
}

const runs = computed(() => {
  if (!planning.value) {
    return [] as Run[];
  }
  try {
    return JSON.parse(planning.value) as Run[];
  } catch (e) {
    console.error("Error parsing planning JSON:", e);
    return [] as Run[];
  }
});

const addIndex = (nbr: number) => {
  // Save current custom message to the current run
  if (runs.value.length > 0 && currentStep.value < runs.value.length) {
    runs.value[currentStep.value].customMessage = currentCustomMessage.value;
  }
  
  // Update current step
  currentStep.value += nbr;
  
  // Load custom message from the new current run
  if (runs.value.length > 0 && currentStep.value < runs.value.length) {
    currentCustomMessage.value = runs.value[currentStep.value].customMessage || "";
  }
};

const switchPlanning = () => {
  return (showPlanning.value = !showPlanning.value);
};

const upNext = (newStep: number) => {
  if (newStep < runs.value.length) {
    let msg = `${runs.value[newStep].gamename} \n(${runs.value[newStep].gamecategory}) by ${runs.value[newStep].runner}`;
    if (runs.value[newStep].runner2) {
      msg += ` with ${runs.value[newStep].runner2}`;
    }
    return msg;
  }
  return "";
};

const upTime = (newStep: number) => {
  if (newStep < runs.value.length) {
    return runs.value[newStep].startat;
  }
  return "";
};

const up_next_nl = computed(() => upNext(currentStep.value));
const up_next = computed(() => "UP NEXT ⏩ " + up_next_nl.value.replace(/\n/g, ""));
const up_next_next_nl = computed(() => upNext(currentStep.value + 1));
const up_next_next = computed(() => "UP NEXT ⏩ " + up_next_next_nl.value.replace(/\n/g, ""));
const up_next_next_next = computed(() => upNext(currentStep.value + 2));

const up_next_time = computed(() => upTime(currentStep.value));
const up_next_next_time = computed(() => upTime(currentStep.value + 1));
const up_next_next_next_time = computed(() => upTime(currentStep.value + 2));

const obs_txt: ObsTextMapping = {
  gamename: "game_title",
  gameestimate: "game_estimate",
  gamecategory: "game_category",
  gamesupport: "game_plateform",
  runner: "runner",
  runner2: "runner2",
  runner3: "runner3",
  runner4: "runner4",
  commentator: "commentator",
  upNext: "up_next",
  upNext_nl: "up_next_nl",
  upNext_time: "up_next_time",
  upNextNext: "up_next_next",
  upNextNext_time: "up_next_next_time",
  upNextNext_nl: "up_next_next_nl",
  upNextNextNext: "up_next_next_next",
  upNextNextNext_time: "up_next_next_next_time"
};

const update = async () => {
  if (runs.value.length === 0 || currentStep.value >= runs.value.length) {
    return;
  }
  
  // Save current custom message to the current run
  runs.value[currentStep.value].customMessage = currentCustomMessage.value;
  
  const currentRun = runs.value[currentStep.value];
  // Update run-specific fields
  if (currentRun.gamename) await obs.changeText(obs_txt.gamename, currentRun.gamename);
  if (currentRun.gameestimate) await obs.changeText(obs_txt.gameestimate, currentRun.gameestimate);
  if (currentRun.gamecategory) await obs.changeText(obs_txt.gamecategory, currentRun.gamecategory);
  if (currentRun.gamesupport) await obs.changeText(obs_txt.gamesupport, currentRun.gamesupport);
  if (currentRun.runner) await obs.changeText(obs_txt.runner, currentRun.runner);
  if (currentRun.commentator) await obs.changeText(obs_txt.commentator, currentRun.commentator);
  
  // Handle runner2 field
  if (currentRun.runner2) {
    await obs.changeText(obs_txt.runner2, currentRun.runner2);
  } else {
    await obs.changeText(obs_txt.runner2, "");
  }

  if (currentRun.runner3) {
    await obs.changeText(obs_txt.runner3, currentRun.runner3);
  } else {
    await obs.changeText(obs_txt.runner3, "");
  }

  if (currentRun.runner4) {
    await obs.changeText(obs_txt.runner4, currentRun.runner4);
  } else {
    await obs.changeText(obs_txt.runner4, "");
  }

  // Update next run information
  await obs.changeText(obs_txt.upNext, up_next.value);
  await obs.changeText(obs_txt.upNext_nl, up_next_nl.value);
  await obs.changeText(obs_txt.upNextNext, up_next_next.value);
  await obs.changeText(obs_txt.upNextNext_nl, up_next_next_nl.value);
  await obs.changeText(obs_txt.upNextNextNext, up_next_next_next.value);
  await obs.changeText(obs_txt.upNext_time, up_next_time.value);
  await obs.changeText(obs_txt.upNextNext_time, up_next_next_time.value);
  await obs.changeText(obs_txt.upNextNextNext_time, up_next_next_next_time.value);
  
  // Post to Bluesky if auto-post is enabled
  if (props.autoPostEnabled) {
    await postToBluesky(currentRun);
  }
};

watch(planning, (newVal) => {
  if (typeof window !== "undefined" && window.localStorage) {
    localStorage.setItem("planningData", newVal);
  }
});

watch(currentStep, (newVal) => {
  if (typeof window !== "undefined" && window.localStorage) {
    localStorage.setItem("idData", newVal.toString());
  }
  
  // Update custom message when current step changes
  if (runs.value.length > 0 && newVal < runs.value.length) {
    currentCustomMessage.value = runs.value[newVal].customMessage || "";
  }
});

// Watch for changes in runs to update the custom message
watch(runs, (newRuns) => {
  if (newRuns.length > 0 && currentStep.value < newRuns.length) {
    currentCustomMessage.value = newRuns[currentStep.value].customMessage || "";
  }
}, { deep: true });

// Post to Bluesky
const postToBluesky = async (run: Run) => {
  postingToBluesky.value = true;
  blueskyPostResult.value = null;
  
  try {
    await bluesky.createPost(run);
    blueskyPostResult.value = "Successfully posted to Bluesky!";
  } catch (error: any) {
    console.error("Error posting to Bluesky:", error);
    blueskyPostResult.value = `Error posting to Bluesky: ${error.message}`;
  } finally {
    postingToBluesky.value = false;
  }
};
</script>