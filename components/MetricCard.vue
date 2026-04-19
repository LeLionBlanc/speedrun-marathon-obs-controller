<template>
  <v-card class="metric-card">
    <v-card-text>
      <div class="d-flex align-center">
        <v-icon :icon="icon" size="large" class="mr-3" :color="color" />
        <div>
          <div class="text-subtitle-2 text-medium-emphasis">{{ title }}</div>
          <div class="text-h6">{{ value }}</div>
        </div>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
defineProps({
  title: {
    type: String,
    required: true
  },
  value: {
    type: String,
    required: true
  },
  icon: {
    type: String,
    default: 'mdi-chart-line'
  },
  color: {
    type: String,
    default: 'primary'
  }
});
</script>

<style scoped>
.metric-card {
  height: 100%;
}
</style>