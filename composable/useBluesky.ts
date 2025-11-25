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

interface ImageDimensions {
  width: number;
  height: number;
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

  // Helper function to fetch an image and get its dimensions
  const fetchImageAndGetDimensions = async (url: string): Promise<{ buffer: ArrayBuffer, dimensions: ImageDimensions }> => {
    try {
      // Fetch the image
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.statusText}`);
      }
      
      const buffer = await response.arrayBuffer();
      
      // For simplicity, we'll use default dimensions
      // In a production app, you would want to actually determine the dimensions
      const dimensions = {
        width: 1920,
        height: 1080
      };
      
      return { buffer, dimensions };
    } catch (error) {
      console.error('Error fetching image:', error);
      throw error;
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
        // // Add formatted game, category, runner, and commentator info before the custom message
        // const gameInfo = `🎮 ${runInfo.gamename || ''} - ${runInfo.gamecategory || ''}\n`;
        // const runnerInfo = `🏃 ${runInfo.runner || ''}\n`;
        // const commentatorInfo = `🎙️ ${runInfo.commentator || ''}\n\n`;
        
        // // Add the formatted prefix to the custom message if it exists
        // if (runInfo.customMessage) {
        //   runInfo.customMessage = gameInfo + runnerInfo + commentatorInfo + runInfo.customMessage;
        // }
        
        postText = postText.replace(/{gamename}/g, runInfo.gamename || '')
                           .replace(/{gamecategory}/g, runInfo.gamecategory || '')
                           .replace(/{gamesupport}/g, runInfo.gamesupport || '')
                           .replace(/{runner}/g, runInfo.runner || '')
                           .replace(/{runner2}/g, runInfo.runner2 || '')
                           .replace(/{runner3}/g, runInfo.runner3 || '')
                           .replace(/{runner4}/g, runInfo.runner4 || '')
                           .replace(/{commentator}/g, runInfo.commentator || '')
                           .replace(/{customMessage}/g, runInfo.customMessage || '');
      }
      
      // Use RichText to handle links and mentions
      const rt = new RichText({ text: postText });
      await rt.detectFacets(agent);
      
      let postOptions: any = {
        text: rt.text,
        facets: rt.facets,
        createdAt: new Date().toISOString()
      };
      
      // Use image_url from planning data if available, otherwise use the saved gifUrl
      const imageUrl = runInfo?.image_url || savedPost.gifUrl;
      
      // If an image URL is provided, try to upload it as an image
      if (imageUrl) {
        try {
          const { buffer, dimensions } = await fetchImageAndGetDimensions(imageUrl);
          
          // Determine the MIME type based on the URL
          const isGif = imageUrl.toLowerCase().endsWith('.gif');
          const encoding = isGif ? 'image/gif' : 'image/jpeg';
          
          // Upload the image to Bluesky's blob storage
          const uploadResponse = await agent.uploadBlob(new Uint8Array(buffer), { encoding });
          
          // Add the image to the post
          postOptions.embed = {
            $type: 'app.bsky.embed.images',
            images: [{
              alt: `Image for ${runInfo?.gamename || 'current run'}`,
              image: uploadResponse.data.blob,
              aspectRatio: {
                width: dimensions.width,
                height: dimensions.height
              }
            }]
          };
        } catch (imageError) {
          console.error('Failed to upload image, falling back to URL in text:', imageError);
          // If image upload fails, fall back to including the URL in the text
          postOptions.text += `\n\n${imageUrl}`;
        }
      }
      
      // Create the post
      const response = await agent.post(postOptions);
      
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