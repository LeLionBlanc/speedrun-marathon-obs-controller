# OBS Controller

A web-based dashboard for controlling OBS Studio during livestreams, with integrated Bluesky social media posting capabilities.

## Features

- **OBS Integration**: Connect to OBS Studio via WebSocket to control scenes and text sources
- **Planning Management**: Organize your stream schedule with a comprehensive planning tool
- **Text Source Management**: Edit OBS text sources directly from the dashboard
- **Bluesky Integration**: Automatically post updates to Bluesky when switching between runs
- **Responsive UI**: Built with Vuetify for a clean, responsive interface

## Tech Stack

- **Frontend**: Vue.js 3 with Composition API
- **Framework**: Nuxt 3
- **UI Library**: Vuetify 3
- **State Management**: Vue Reactive
- **OBS Connection**: obs-websocket-js
- **Social Media**: Bluesky API (@atproto/api)

## Getting Started

### Prerequisites

- Node.js (v16 or later)
- OBS Studio with obs-websocket plugin installed
- Bluesky account (optional, for social media integration)

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/obs-controller.git
cd obs-controller
```

2. Install dependencies
```bash
npm install
```

3. Run the development server
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:3000`

### Building for Production

```bash
npm run build
```

## Usage

### Dashboard

The dashboard provides four main tabs:

1. **Home**: Overview of the application
2. **Planning**: Manage your stream schedule and runs
3. **Text Sources**: Edit OBS text sources directly
4. **Bluesky**: Configure Bluesky integration for social media posting

### OBS Connection

The application connects to OBS Studio via WebSocket. By default, it attempts to connect to `localhost:4455`. You can modify the connection settings in the code if needed.

### Planning

1. Enter your schedule in JSON format
2. Navigate between runs using the Previous/Next buttons
3. Click "Apply" to update OBS text sources with the current run information
4. If Bluesky integration is enabled, posts will be created automatically when switching runs

### Text Sources

1. Click "Refresh Sources" to load text sources from OBS
2. Edit text content directly in the interface
3. Click "Update" to apply changes to OBS

### Bluesky Integration

1. Enter your Bluesky credentials
2. Configure your post template with placeholders like `{gamename}`, `{runner}`, etc.
3. Enable auto-posting to automatically create posts when switching runs
4. Test posts before going live

## Customization

### Post Templates

You can customize the Bluesky post template with the following placeholders:

- `{gamename}`: Name of the game
- `{gamecategory}`: Category/type of run
- `{gamesupport}`: Platform the game is running on
- `{runner}`: Primary runner's name
- `{runner2}`, `{runner3}`, `{runner4}`: Additional runners for co-op/races
- `{commentator}`: Commentator's name
- `{customMessage}`: Custom message for the specific run

## License

[MIT License](LICENSE)

## Acknowledgements

- [OBS Studio](https://obsproject.com/)
- [obs-websocket](https://github.com/obsproject/obs-websocket)
- [Bluesky](https://bsky.app)
