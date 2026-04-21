import { ref, computed } from 'vue';

interface User {
  id: string;
  username: string;
  role: 'admin' | 'user';
}

export function useAuth() {
  const user = ref<User | null>(null);
  const isAuthenticated = computed(() => !!user.value);
  const isAdmin = computed(() => user.value?.role === 'admin');
  const authError = ref<string | null>(null);

  if (process.client) {
    try {
      const storedUser = localStorage.getItem('user');
      if (storedUser) user.value = JSON.parse(storedUser);
    } catch (error) {
      console.error('Error loading auth state:', error);
    }
  }

  const login = async (username: string, password: string): Promise<boolean> => {
    authError.value = null;
    try {
      if (username === 'admin' && password === 'admin123') {
        user.value = { id: '1', username: 'admin', role: 'admin' };
      } else if (username === 'user' && password === 'user123') {
        user.value = { id: '2', username: 'user', role: 'user' };
      } else {
        authError.value = 'Invalid username or password';
        return false;
      }
      if (process.client) localStorage.setItem('user', JSON.stringify(user.value));
      return true;
    } catch (error: any) {
      authError.value = error.message || 'Authentication failed';
      return false;
    }
  };

  const logout = () => {
    user.value = null;
    if (process.client) localStorage.removeItem('user');
  };

  return { user, isAuthenticated, isAdmin, authError, login, logout };
}