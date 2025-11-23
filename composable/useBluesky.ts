import { ref, reactive } from 'vue';
import { BskyAgent, RichText } from '@atproto/api';

interface BlueskyCredentials {
  identifier: string;
  password: string;
}

interface BlueskyPost {
  text: string;
  gifUrl?: string;
}

export const useBluesky = () => {
  const agent = new BskyAgent({
    service: 'https://bsky.social'
  });

  const isConnected = ref(false);
  const connectionError = ref<string | null>(null);
  const savedCredentials = reactive<BlueskyCredentials>({
    identifier: '',
    password: ''
  });
  const savedPost = reactive<BlueskyPost>({
    text: '',
    gifUrl: ''
  });

  // Load saved credentials and post template from localStorage if available
  if (typeof window !== 'undefined' && window.localStorage) {
    const storedCredentials = localStorage.getItem('blueskyCredentials');
    const storedPost = localStorage.getItem('blueskyPost');
    
    if (storedCredentials) {
      const parsed = JSON.parse(storedCredentials);
      savedCredentials.identifier = parsed.identifier || '';
      savedCredentials.password = parsed.password || '';
    }
    
    if (storedPost) {
      const parsed = JSON.parse(storedPost);
      savedPost.text = parsed.text || '';
      savedPost.gifUrl = parsed.gifUrl || '';
    }
  }

  // Connect to Bluesky
  const connect = async (credentials?: BlueskyCredentials) => {
    try {
      const creds = credentials || savedCredentials;
      
      if (!creds.identifier || !creds.password) {
        throw new Error('Missing Bluesky credentials');
      }
      
      await agent.login({
        identifier: creds.identifier,
        password: creds.password
      });
      
      isConnected.value = true;
      connectionError.value = null;
      
      // Save credentials if successful
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem('blueskyCredentials', JSON.stringify({
          identifier: creds.identifier,
          password: creds.password
        }));
      }
      
      return true;
    } catch (error: any) {
      isConnected.value = false;
      connectionError.value = error.message || 'Failed to connect to Bluesky';
      console.error('Failed to connect to Bluesky:', error);
      return false;
    }
  };

  // Save post template
  const savePostTemplate = (post: BlueskyPost) => {
    savedPost.text = post.text;
    savedPost.gifUrl = post.gifUrl;
    
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem('blueskyPost', JSON.stringify({
        text: post.text,
        gifUrl: post.gifUrl
      }));
    }
  };

  // Create a post with run information
  const createPost = async (runInfo: any, customText?: string) => {
    try {
      if (!isConnected.value) {
        const connected = await connect();
        if (!connected) {
          throw new Error('Not connected to Bluesky');
        }
      }
      
      // Replace placeholders in the template with actual run information
      let postText = customText || savedPost.text;
      
      if (runInfo) {
        postText = postText.replace(/{gamename}/g, runInfo.gamename || '')
                           .replace(/{gamecategory}/g, runInfo.gamecategory || '')
                           .replace(/{gamesupport}/g, runInfo.gamesupport || '')
                           .replace(/{runner}/g, runInfo.runner || '')
                           .replace(/{runner2}/g, runInfo.runner2 || '')
                           .replace(/{runner3}/g, runInfo.runner3 || '')
                           .replace(/{runner4}/g, runInfo.runner4 || '')
                           .replace(/{commentator}/g, runInfo.commentator || '');
      }
      
      // Add GIF URL to the post if available
      if (savedPost.gifUrl) {
        postText += `\n\n${savedPost.gifUrl}`;
      }
      
      // Use RichText to handle links and mentions
      const rt = new RichText({ text: postText });
      await rt.detectFacets(agent);
      
      // Create the post with rich text support
      const response = await agent.post({
        text: rt.text,
        facets: rt.facets,
        createdAt: new Date().toISOString()
      });
      
      return response;
    } catch (error: any) {
      console.error('Failed to create Bluesky post:', error);
      throw error;
    }
  };

  return {
    connect,
    createPost,
    savePostTemplate,
    isConnected,
    connectionError,
    savedCredentials,
    savedPost
  };
};