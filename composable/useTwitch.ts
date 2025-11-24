import { ref, reactive, computed } from 'vue';

interface TwitchCredentials {
  clientId: string;
  clientSecret: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  channelId: string;
}

// Client ID and redirect URI
const TWITCH_CLIENT_ID = 'vpi6vzxesiraez5w9c6x9hqk5a6hmj';
const TWITCH_CLIENT_SECRET = 'uzd4le2tl31vnjoyih10in09so55ym';
const TWITCH_REDIRECT_URI = 'http://localhost:3000/auth/twitch/callback';

export const useTwitch = () => {
  const isConnected = ref(false);
  const connectionError = ref<string | null>(null);
  const isUpdating = ref(false);
  const updateStatus = ref<string | null>(null);
  
  // Credentials for Twitch API
  const credentials = reactive<TwitchCredentials>({
    clientId: '',
    clientSecret: '',
    accessToken: '',
    refreshToken: '',
    expiresAt: 0,
    channelId: ''
  });
  
  // Load saved credentials from localStorage if available
  if (typeof window !== 'undefined' && window.localStorage) {
    const storedCredentials = localStorage.getItem('twitchCredentials');
    
    if (storedCredentials) {
      try {
        const parsed = JSON.parse(storedCredentials);
        credentials.clientId = parsed.clientId || '';
        credentials.clientSecret = parsed.clientSecret || '';
        credentials.accessToken = parsed.accessToken || '';
        credentials.refreshToken = parsed.refreshToken || '';
        credentials.expiresAt = parsed.expiresAt || 0;
        credentials.channelId = parsed.channelId || '';
        
        // Check if token is still valid
        if (credentials.accessToken && credentials.expiresAt > Date.now()) {
          isConnected.value = true;
        }
      } catch (error) {
        console.error('Error loading Twitch credentials:', error);
      }
    }
  }
  
  // Save credentials to localStorage
  const saveCredentials = () => {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem('twitchCredentials', JSON.stringify(credentials));
    }
  };
  
  // Get the OAuth URL for Twitch authorization (implicit flow)
  const getAuthUrl = () => {
    const scopes = ['channel:manage:broadcast', 'user:read:email'];
    const state = Math.random().toString(36).substring(2, 15);
    
    // Store the state in localStorage to verify it when the user returns
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem('twitchAuthState', state);
    }
    
    const params = new URLSearchParams({
      client_id: TWITCH_CLIENT_ID,
      redirect_uri: TWITCH_REDIRECT_URI,
      response_type: 'token', // Use token for implicit flow
      scope: scopes.join(' '),
      state,
      force_verify: 'true' // Force the user to re-authorize to avoid issues
    });
    
    return `https://id.twitch.tv/oauth2/authorize?${params.toString()}`;
  };
  
  // Start the OAuth flow
  const startAuth = () => {
    const authUrl = getAuthUrl();
    
    // Check if we're in a browser environment
    if (typeof window !== 'undefined') {
      // Store the current URL to return to after authentication
      localStorage.setItem('twitchAuthReturnUrl', window.location.href);
      
      // Redirect to the auth URL
      window.location.href = authUrl;
    }
  };
  
  // This function is used to handle the access token from the OAuth flow
  const handleAuthCode = async (accessToken: string): Promise<boolean> => {
    try {
      // Validate the token first
      const validateResponse = await fetch('https://id.twitch.tv/oauth2/validate', {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      
      if (!validateResponse.ok) {
        throw new Error('Invalid access token');
      }
      
      const validateData = await validateResponse.json();
      const clientId = validateData.client_id;
      const expiresIn = validateData.expires_in;
      
      // Get user info to get channel ID using the access token
      const userResponse = await fetch('https://api.twitch.tv/helix/users', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Client-Id': TWITCH_CLIENT_ID
        }
      });
      
      if (!userResponse.ok) {
        throw new Error('Failed to get user info. Invalid access token.');
      }
      
      const userData = await userResponse.json();
      const userId = userData.data[0]?.id;
      const userName = userData.data[0]?.login;
      
      if (!userId) {
        throw new Error('Could not retrieve user ID');
      }
      
      console.log(`Authenticated as Twitch user: ${userName}`);
      
      // Update credentials
      credentials.clientId = TWITCH_CLIENT_ID;
      credentials.accessToken = accessToken;
      // No refresh token in implicit flow
      credentials.expiresAt = Date.now() + (expiresIn * 1000);
      credentials.channelId = userId;
      
      // Save updated credentials
      saveCredentials();
      
      isConnected.value = true;
      connectionError.value = null;
      
      return true;
    } catch (error: any) {
      connectionError.value = `Error during authentication: ${error.message}`;
      console.error('Failed to authenticate with Twitch:', error);
      return false;
    }
  };
  
  // Refresh the access token
  const refreshAccessToken = async (): Promise<boolean> => {
    if (!credentials.refreshToken) {
      connectionError.value = 'Missing refresh token for Twitch';
      return false;
    }
    
    try {
      const response = await fetch('https://id.twitch.tv/oauth2/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: TWITCH_CLIENT_ID,
          client_secret: credentials.clientSecret,
          grant_type: 'refresh_token',
          refresh_token: credentials.refreshToken
        })
      });
      
      if (!response.ok) {
        throw new Error(`Failed to refresh token: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Update credentials
      credentials.accessToken = data.access_token;
      credentials.refreshToken = data.refresh_token || credentials.refreshToken;
      credentials.expiresAt = Date.now() + (data.expires_in * 1000);
      
      // Save updated credentials
      saveCredentials();
      
      isConnected.value = true;
      connectionError.value = null;
      
      return true;
    } catch (error: any) {
      connectionError.value = `Error refreshing token: ${error.message}`;
      console.error('Failed to refresh Twitch token:', error);
      isConnected.value = false;
      return false;
    }
  };
  
  // Set credentials manually
  const setCredentials = async (newCredentials: Partial<TwitchCredentials>): Promise<boolean> => {
    // Update credentials
    if (newCredentials.clientId !== undefined) credentials.clientId = newCredentials.clientId;
    if (newCredentials.clientSecret !== undefined) credentials.clientSecret = newCredentials.clientSecret;
    if (newCredentials.accessToken !== undefined) credentials.accessToken = newCredentials.accessToken;
    if (newCredentials.refreshToken !== undefined) credentials.refreshToken = newCredentials.refreshToken;
    if (newCredentials.expiresAt !== undefined) credentials.expiresAt = newCredentials.expiresAt;
    if (newCredentials.channelId !== undefined) credentials.channelId = newCredentials.channelId;
    
    // Save credentials
    saveCredentials();
    
    // Check if we have valid credentials
    if (credentials.accessToken) {
      if (credentials.expiresAt <= Date.now()) {
        // Token expired, try to refresh
        return await refreshAccessToken();
      } else {
        // Token still valid
        isConnected.value = true;
        connectionError.value = null;
        return true;
      }
    }
    
    return false;
  };
  
  // Update stream title
  const updateStreamTitle = async (title: string, gameName?: string): Promise<boolean> => {
    isUpdating.value = true;
    updateStatus.value = null;
    
    try {
      // Check if connected and token is valid
      if (!isConnected.value || credentials.expiresAt <= Date.now()) {
        // Try to refresh token
        const refreshed = await refreshAccessToken();
        if (!refreshed) {
          throw new Error('Not connected to Twitch API');
        }
      }
      
      // Prepare request body
      const body: Record<string, string> = { title };
      
      // If game name is provided, search for the game ID
      if (gameName) {
        try {
          const gameResponse = await fetch(`https://api.twitch.tv/helix/games?name=${encodeURIComponent(gameName)}`, {
            headers: {
              'Client-ID': TWITCH_CLIENT_ID,
              'Authorization': `Bearer ${credentials.accessToken}`
            }
          });
          
          if (gameResponse.ok) {
            const gameData = await gameResponse.json();
            if (gameData.data && gameData.data.length > 0) {
              body.game_id = gameData.data[0].id;
            }
          }
        } catch (gameError) {
          console.warn('Failed to get game ID, continuing with title update only:', gameError);
        }
      }
      
      // Make API request to update channel information
      const response = await fetch(`https://api.twitch.tv/helix/channels?broadcaster_id=${credentials.channelId}`, {
        method: 'PATCH',
        headers: {
          'Client-ID': TWITCH_CLIENT_ID,
          'Authorization': `Bearer ${credentials.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });
      
      if (!response.ok) {
        throw new Error(`Failed to update stream title: ${response.statusText}`);
      }
      
      updateStatus.value = 'Stream title updated successfully';
      return true;
    } catch (error: any) {
      updateStatus.value = `Error updating stream title: ${error.message}`;
      console.error('Failed to update Twitch stream title:', error);
      return false;
    } finally {
      isUpdating.value = false;
    }
  };
  
  // Get channel information
  const getChannelInfo = async (): Promise<any> => {
    try {
      // Check if connected and token is valid
      if (!isConnected.value || credentials.expiresAt <= Date.now()) {
        // Try to refresh token
        const refreshed = await refreshAccessToken();
        if (!refreshed) {
          throw new Error('Not connected to Twitch API');
        }
      }
      
      // Make API request to get channel information
      const response = await fetch(`https://api.twitch.tv/helix/channels?broadcaster_id=${credentials.channelId}`, {
        headers: {
          'Client-ID': credentials.clientId,
          'Authorization': `Bearer ${credentials.accessToken}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to get channel info: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data.data[0];
    } catch (error: any) {
      console.error('Failed to get Twitch channel info:', error);
      throw error;
    }
  };
  
  // Check if we have the necessary credentials
  const hasCredentials = computed(() => {
    return !!credentials.accessToken && !!credentials.refreshToken && !!credentials.channelId;
  });
  
  return {
    isConnected,
    connectionError,
    isUpdating,
    updateStatus,
    credentials,
    hasCredentials,
    setCredentials,
    startAuth,
    handleAuthCode,
    refreshAccessToken,
    updateStreamTitle,
    getChannelInfo
  };
};