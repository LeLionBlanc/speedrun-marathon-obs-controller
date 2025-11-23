<template>
  <v-container>
    <v-row>
      <v-col cols="12">
        <v-card>
          <v-card-title class="text-h5">
            <v-icon start color="primary">mdi-text</v-icon>
            Text Sources Manager
          </v-card-title>
          
          <v-card-text>
            <v-alert
              v-if="!Object.keys(fileContents).length"
              type="info"
              variant="tonal"
              icon="mdi-information"
              class="mb-4"
            >
              No text sources found. Click the refresh button to load text sources from OBS.
            </v-alert>
            
            <div class="d-flex justify-end mb-4">
              <v-btn
                @click="loadFiles()"
                prepend-icon="mdi-refresh"
                color="primary"
                variant="tonal"
              >
                Refresh Sources
              </v-btn>
            </div>
            
            <v-expansion-panels v-if="Object.keys(fileContents).length">
              <v-expansion-panel
                v-for="file in Object.values(fileContents)"
                :key="file.name"
              >
                <v-expansion-panel-title>
                  <v-icon start color="primary" icon="mdi-text-box"></v-icon>
                  {{ file.name }}
                </v-expansion-panel-title>
                <v-expansion-panel-text>
                  <v-row>
                    <v-col cols="12">
                      <v-text-field
                        v-model="file.data"
                        :label="`Content for ${file.name}`"
                        variant="outlined"
                        hide-details
                      ></v-text-field>
                    </v-col>
                    <v-col cols="12" class="d-flex justify-end">
                      <v-btn
                        @click="updateFile(file)"
                        color="success"
                        prepend-icon="mdi-content-save"
                      >
                        Update
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
            <v-icon start color="primary">mdi-table</v-icon>
            All Text Sources
          </v-card-title>
          
          <v-card-text>
            <v-table v-if="Object.keys(fileContents).length" class="elevation-1">
              <thead>
                <tr>
                  <th>Source Name</th>
                  <th>Content</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in tableItems" :key="item.name">
                  <td>{{ item.name }}</td>
                  <td>{{ item.content }}</td>
                  <td>
                    <v-btn
                      size="small"
                      color="primary"
                      variant="text"
                      icon="mdi-pencil"
                      @click="quickEdit(item.raw)"
                    ></v-btn>
                  </td>
                </tr>
              </tbody>
            </v-table>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
    
    <!-- Quick Edit Dialog -->
    <v-dialog v-model="editDialog" max-width="500px">
      <v-card v-if="currentEditItem">
        <v-card-title>
          Edit {{ currentEditItem.name }}
        </v-card-title>
        <v-card-text>
          <v-text-field
            v-model="currentEditItem.data"
            label="Content"
            variant="outlined"
          ></v-text-field>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="error" variant="text" @click="editDialog = false">Cancel</v-btn>
          <v-btn 
            color="success" 
            @click="updateAndCloseDialog"
          >
            Save
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useObsWebsocket } from '../composable/useObsWebsocket';

interface FileContent {
  name: string;
  data: string;
}

interface TableItem {
  name: string;
  content: string;
  raw: FileContent;
}

// Dialog for quick editing
const editDialog = ref(false);
const currentEditItem = ref<FileContent | null>(null);

// File contents
const fileContents = ref<Record<string, FileContent>>({});
const obs = useObsWebsocket();
await obs.connect();

// Table items computed property
const tableItems = computed<TableItem[]>(() => {
  return Object.values(fileContents.value).map(file => ({
    name: file.name,
    content: file.data,
    raw: file
  }));
});

// Quick edit function
const quickEdit = (item: FileContent) => {
  currentEditItem.value = item;
  editDialog.value = true;
};

// Update and close dialog
const updateAndCloseDialog = async () => {
  if (currentEditItem.value) {
    await updateFile(currentEditItem.value);
    editDialog.value = false;
  }
};

// Load files from OBS
const loadFiles = async () => {
  try {
    const texts = await obs.getSceneSources("__txt");
    
    if (!texts) {
      console.error("No text sources found");
      return;
    }
    
    const newFileContents: Record<string, FileContent> = {};
    
    for (const txt of texts) {
      if (typeof txt === 'string') {
        const textContent = await obs.getText(txt);
        newFileContents[txt] = {
          name: txt,
          data: typeof textContent === 'string' ? textContent : ''
        };
      }
    }
    
    fileContents.value = newFileContents;
  } catch (error) {
    console.error("Error loading files:", error);
  }
};

// Update a file in OBS
const updateFile = async (file: FileContent) => {
  try {
    await obs.changeText(file.name, file.data);
  } catch (error) {
    console.error("Error updating file:", error);
  }
};

// Load files on component mount
onMounted(() => {
  loadFiles();
});
</script>