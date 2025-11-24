import { defineEventHandler, getQuery, sendRedirect } from 'h3';

// This endpoint handles the initial redirect to Twitch for authentication
export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  
  // If there's an error parameter, it means Twitch returned an error
  if (query.error) {
    // Redirect to the callback page with the error information
    return sendRedirect(event, `/auth/twitch/callback?error=${query.error}&error_description=${query.error_description || ''}`);
  }
  
  // If there's a code parameter, it means Twitch returned an authorization code
  // In our case, we're using implicit flow, so we don't expect a code here
  // But we'll handle it just in case the flow changes in the future
  if (query.code) {
    return sendRedirect(event, `/auth/twitch/callback?code=${query.code}`);
  }
  
  // If there are no parameters, this is likely a direct access to the endpoint
  return {
    message: 'This is the Twitch authentication endpoint. Please use the "Connect to Twitch" button in the application.'
  };
});