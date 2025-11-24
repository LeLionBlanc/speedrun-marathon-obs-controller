import { ref, reactive } from 'vue';
import { useTwitch } from './useTwitch';

interface StreamTitleConfig {
  template: string;
  updateGame: boolean;
}

export const useStreamTitle = () => {
  const twitch = useTwitch();
  
  // Default configuration
  const config = reactive<StreamTitleConfig>({
    template: '{gamename} - {gamecategory} by {runner}',
    updateGame: true
  });
  
  // Status
  const updateStatus = ref<string | null>(null);
  const isUpdating = ref(false);
  
  // Load saved configuration from localStorage if available
  if (typeof window !== 'undefined' && window.localStorage) {
    const storedConfig = localStorage.getItem('streamTitleConfig');
    
    if (storedConfig) {
      const parsed = JSON.parse(storedConfig);
      config.template = parsed.template || config.template;
      config.obsSourceName = parsed.obsSourceName || config.obsSourceName;
    }
  }
  
  // Save configuration
  const saveConfig = (newConfig: Partial<StreamTitleConfig>) => {
    if (newConfig.template !== undefined) {
      config.template = newConfig.template;
    }
    
    if (newConfig.obsSourceName !== undefined) {
      config.obsSourceName = newConfig.obsSourceName;
    }
    
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem('streamTitleConfig', JSON.stringify(config));
    }
  };
  
  // Generate title from template and run information
  const generateTitle = (runInfo: any): string => {
    let title = config.template;
    
    // Replace placeholders with run information
    if (runInfo) {
      title = title.replace(/{gamename}/g, runInfo.gamename || '')
                   .replace(/{gamecategory}/g, runInfo.gamecategory || '')
                   .replace(/{gamesupport}/g, runInfo.gamesupport || '')
                   .replace(/{runner}/g, runInfo.runner || '')
                   .replace(/{runner2}/g, runInfo.runner2 || '')
                   .replace(/{runner3}/g, runInfo.runner3 || '')
                   .replace(/{runner4}/g, runInfo.runner4 || '');
      
      // Handle multiple runners
      const runners = [runInfo.runner, runInfo.runner2, runInfo.runner3, runInfo.runner4]
        .filter(Boolean)
        .join(', ');
      
      title = title.replace(/{runners}/g, runners);
    }
    
    return title;
  };
  
  // Update the stream title on Twitch
  const updateTitle = async (runInfo: any): Promise<boolean> => {
    isUpdating.value = true;
    updateStatus.value = null;
    
    try {
      // Generate the title from the template
      const title = generateTitle(runInfo);
      
      // Update the Twitch stream title
      // If updateGame is true, also update the game name
      if (config.updateGame && runInfo.gamename) {
        // Note: In a real implementation, you would need to search for the game ID
        // using the Twitch API's search endpoint before updating
        await twitch.updateStreamTitle(title, runInfo.gamename);
      } else {
        await twitch.updateStreamTitle(title);
      }
      
      updateStatus.value = 'Twitch stream title updated successfully';
      return true;
    } catch (error: any) {
      updateStatus.value = `Error updating Twitch title: ${error.message}`;
      console.error('Failed to update Twitch stream title:', error);
      return false;
    } finally {
      isUpdating.value = false;
    }
  };
  
  return {
    config,
    saveConfig,
    generateTitle,
    updateTitle,
    updateStatus,
    isUpdating
  };
};