<template>
  <v-app>
    <v-app-bar app elevation="1">
      <v-app-bar-title>OBS Controller</v-app-bar-title>
      <v-spacer></v-spacer>
      <v-btn icon="mdi-cog" variant="text"></v-btn>
    </v-app-bar>

    <v-navigation-drawer
      v-model="drawer"
      app
      temporary
      :rail="rail"
      @click="rail = false"
    >
      <v-list>
        <v-list-item
          prepend-icon="mdi-home"
          title="Home"
          value="home"
          to="/"
        ></v-list-item>
        <v-list-item
          prepend-icon="mdi-calendar"
          title="Planning"
          value="planning"
          to="/dashboard?step=planning"
        ></v-list-item>
        <v-list-item
          prepend-icon="mdi-text"
          title="Text Sources"
          value="txt"
          to="/dashboard?step=txt"
        ></v-list-item>
      </v-list>
      
      <template v-slot:append>
        <div class="pa-2">
          <v-btn block color="primary" @click="toggleRail">
            <v-icon :icon="rail ? 'mdi-chevron-right' : 'mdi-chevron-left'"></v-icon>
          </v-btn>
        </div>
      </template>
    </v-navigation-drawer>

    <v-main>
      <v-container fluid>
        <slot />
      </v-container>
    </v-main>

    <v-footer app class="d-flex flex-column">
      <div class="text-center">
        <span>&copy; {{ new Date().getFullYear() }} - OBS Controller</span>
      </div>
    </v-footer>
  </v-app>
</template>

<script setup>
const drawer = ref(false);
const rail = ref(true);

const toggleRail = () => {
  rail.value = !rail.value;
};
</script>