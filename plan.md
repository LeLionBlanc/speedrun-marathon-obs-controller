# Implementation Plan: Custom Messages for Marathon Runs

## Overview
This plan outlines the steps to implement custom messages for each marathon run that will be posted to Bluesky when a run starts.

## Detailed Implementation Plan

### 1. Modify the Run interface to include a customMessage field

We need to update the Run interface in both the Planning.vue and BlueskyConfig.vue components to include the new customMessage field. This will ensure TypeScript properly recognizes this field throughout the application.

### 2. Update the Planning component to display and edit custom messages for each run

We'll need to:
- Add a text area or input field in the Planning.vue component to edit the custom message for the current run
- Update the UI to display this field in a user-friendly way
- Ensure the custom message is saved with the rest of the planning data in localStorage

### 3. Update the Bluesky post template to include the {customMessage} placeholder

We'll modify the default post template in BlueskyConfig.vue to include the {customMessage} placeholder, and ensure the UI explains this new placeholder to users.

### 4. Modify the createPost function in useBluesky.ts to handle the customMessage field

We'll update the createPost function to:
- Check for the customMessage field in the run information
- Replace the {customMessage} placeholder in the post template with the actual custom message
- Handle cases where the customMessage might be empty

### 5. Update the post preview in BlueskyConfig to show the custom message

We'll modify the preview functionality in BlueskyConfig.vue to:
- Display the custom message in the preview
- Ensure the preview accurately reflects what will be posted to Bluesky

### 6. Test the implementation with sample data

We'll need to:
- Create sample planning data that includes custom messages
- Test the editing functionality
- Test the Bluesky posting with custom messages
- Verify that the custom messages appear correctly in posts

## Architecture Diagram

```mermaid
flowchart TD
    A[Planning JSON Data] -->|Includes customMessage field| B[Planning.vue]
    B -->|Edit customMessage| C[localStorage]
    C -->|Load planning data| B
    B -->|Current run with customMessage| D[useBluesky.ts]
    E[BlueskyConfig.vue] -->|Template with {customMessage}| D
    D -->|Post with customMessage| F[Bluesky API]
    E -->|Preview with customMessage| G[User Preview]