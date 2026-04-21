<template>
  <v-container class="fill-height">
    <v-row justify="center" align="center">
      <v-col cols="12" sm="8" md="6" lg="4">
        <v-card>
          <v-card-title class="text-center text-h5 py-4">
            Admin Login
          </v-card-title>
          
          <v-card-text>
            <v-alert
              v-if="authError"
              type="error"
              variant="tonal"
              class="mb-4"
              closable
              @click:close="authError = null"
            >
              {{ authError }}
            </v-alert>
            
            <v-form @submit.prevent="login" ref="form">
              <v-text-field
                v-model="username"
                label="Username"
                :rules="[v => !!v || 'Username is required']"
                prepend-icon="mdi-account"
                variant="outlined"
                required
              ></v-text-field>
              
              <v-text-field
                v-model="password"
                label="Password"
                :rules="[v => !!v || 'Password is required']"
                prepend-icon="mdi-lock"
                :append-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'"
                @click:append="showPassword = !showPassword"
                :type="showPassword ? 'text' : 'password'"
                variant="outlined"
                required
              ></v-text-field>
              
              <div class="d-flex flex-column gap-4 mt-4">
                <v-btn
                  type="submit"
                  color="primary"
                  block
                  :loading="loading"
                  :disabled="loading"
                >
                  Login
                </v-btn>
                
                <v-btn
                  variant="text"
                  color="primary"
                  block
                  to="/"
                >
                  Back to Home
                </v-btn>
              </div>
            </v-form>
          </v-card-text>
          
          <v-card-text class="text-center text-caption">
            <p>Demo credentials:</p>
            <p>Admin: username: <strong>admin</strong>, password: <strong>admin123</strong></p>
            <p>User: username: <strong>user</strong>, password: <strong>user123</strong></p>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useAuth } from '~/composable/useAuth';
import { useRouter } from 'vue-router';

const router = useRouter();
const { login: authLogin, authError: error } = useAuth();

const username = ref('');
const password = ref('');
const showPassword = ref(false);
const loading = ref(false);
const form = ref<any>(null);
const authError = ref<string | null>(null);

const login = async () => {
  // Validate form
  const { valid } = await form.value.validate();
  if (!valid) return;
  
  loading.value = true;
  authError.value = null;
  
  try {
    const success = await authLogin(username.value, password.value);
    
    if (success) {
      // Redirect to the incentives page or the page they were trying to access
      const returnUrl = localStorage.getItem('returnUrl') || '/incentives';
      localStorage.removeItem('returnUrl');
      router.push(returnUrl);
    } else {
      authError.value = error.value || 'Login failed';
    }
  } catch (err: any) {
    authError.value = err.message || 'An unexpected error occurred';
  } finally {
    loading.value = false;
  }
};
</script>