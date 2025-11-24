import { reactive, ref } from 'vue';
import { OBSWebSocket } from 'obs-websocket-js';

interface ObsState {
  scenes: Scene[];
  currentScene: string | null;
}

interface Scene {
  name: string;
  isCurrentScene?: boolean;
}

export const useObsWebsocket = () => {
  const obs = new OBSWebSocket();
  const connectionStatus = ref(false);
  const connectionError = ref(null);
  const obsScenes = ref<string[]>([])
  const currentScene = ref('')
  // Connexion à OBS
  const connect = async (address = 'localhost:4455', password = 'By71uSukxC9wzx2k') => {
    try {
      await obs.connect(`ws://${address}`, password);
      connectionStatus.value = true;
      connectionError.value = null;
      console.log('Connected to OBS WebSocket');
      await fetchScenes(); // Récupérer les scènes après connexion
    } catch (error: any) {
      connectionStatus.value = false;
      connectionError.value = error.message;
      console.error('Failed to connect to OBS:', error);
    }
  };

  // Déconnexion
  const disconnect = async () => {
    await obs.disconnect();
    connectionStatus.value = false;
    console.log('Disconnected from OBS WebSocket');
  };

  // Récupérer la liste des scènes
  const fetchScenes = async () => {
    try {
      const { scenes } = await obs.call('GetSceneList');
      scenes.map((scene) => {
        obsScenes.value.push(scene.sceneName as string)
      });
      obsScenes.value = obsScenes.value.reverse()

    } catch (error) {
      console.error('Failed to fetch scenes:', error);
    }
  };

  // Changer de scène
  const switchScene = async (sceneName: string) => {
    try {
      await obs.call('SetCurrentProgramScene', { sceneName });
      currentScene.value = sceneName;
    } catch (error) {
      console.error('Failed to switch scene:', error);
    }
  };

  const getSceneSources = async (sceneName: string) => {
    try {
      // Récupérer la liste des éléments de la scène
      const response = await obs.call('GetSceneItemList', { sceneName });
  
      // Optionnel : extraire seulement les noms des sources
      const sourceNames = response.sceneItems.map(item => item.sourceName);
      return sourceNames;
    } catch (error) {
      console.error('Erreur lors de la récupération des sources :', error);
    } 
  }

  const changeText = async (sourceName: string, newText: string) => {
    try {
      const sourceSettings = await obs.call('GetInputSettings', {
        inputName: sourceName,
      });

      await obs.call('SetInputSettings', {
        inputName: sourceName,
        inputSettings: {
          ...sourceSettings.inputSettings, // Conserver les autres propriétés
          text: newText, // Changer le texte
        },
        overlay: false, // Ne pas écraser complètement les paramètres
      });

      console.log(`Texte de la source "${sourceName}" mis à jour avec succès !`);
    } catch (error) {
      console.error('Erreur avec OBS WebSocket :', error);
    }
  }

  const getText = async (sourceName: string) => {
    try {
      const sourceSettings = await obs.call('GetInputSettings', {
        inputName: sourceName,
      });
      return sourceSettings.inputSettings.text
    } catch (error) {
      console.error('Erreur avec OBS WebSocket :', error);
    }
  }

  return {
    connect,
    disconnect,
    fetchScenes,
    switchScene,
    changeText,
    getSceneSources,
    getText,
    connectionStatus,
    connectionError,
    obsScenes,
    currentScene
  };
};
