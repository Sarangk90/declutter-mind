# 5 Whys Problem Solver

An AI-powered React application for conducting 5 Whys root cause analysis with automated solution generation and action planning.

## Features

- **Interactive 5 Whys Analysis**: AI-guided questioning to identify root causes
- **AI-Generated Solutions**: Automated solution recommendations based on analysis
- **Action Planning**: Detailed implementation plans with timelines and resources
- **Modern UI**: Clean, responsive design with Tailwind CSS
- **Real-time Progress Tracking**: Visual progress indicators throughout the process

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Anthropic API key

## Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure API Key
1. Get an API key from [Anthropic Console](https://console.anthropic.com/)
2. The API key is already configured in the backend server

### 3. Start Development Servers
You need to run both the backend and frontend servers:

**Option A: Run both servers separately**
```bash
# Terminal 1 - Start backend server
ANTHROPIC_API_KEY=your_api_key_here node server.js

# Terminal 2 - Start frontend
npm start
```

**Option B: Run both servers together** (coming soon)
```bash
npm run dev
```

The application will open at:
- **Frontend**: `http://localhost:3000`
- **Backend**: `http://localhost:3001`

## Usage

1. **Define Problem**: Enter the problem you want to analyze
2. **5 Whys Analysis**: Answer AI-generated "Why" questions to dig deeper
3. **Review Solutions**: Examine AI-generated solution recommendations
4. **Action Plan**: Get a detailed implementation plan

## Project Structure

```
src/
├── CompleteActionPlanningTool.js  # Main application component
├── App.js                         # App wrapper
├── index.js                       # React entry point
├── index.css                      # Tailwind CSS styles
└── setupProxy.js                  # CORS proxy configuration
```

## API Integration

The app uses Anthropic's Claude API through a proxy configuration to handle CORS issues. The proxy is automatically configured when running in development mode.

## Security Notes

- Never commit your API key to version control
- The `.env` file is included in `.gitignore`
- For production deployment, use environment variables on your hosting platform

## Available Scripts

- `npm start` - Start development server
- `npm build` - Create production build
- `npm test` - Run tests
- `npm run eject` - Eject from Create React App (irreversible)

## Technologies Used

- React 19.1
- Tailwind CSS 3.4
- Lucide React (icons)
- Anthropic Claude API
- Create React App

## Troubleshooting

If you encounter CORS issues:
1. Ensure the proxy configuration in `src/setupProxy.js` is correct
2. Restart the development server after making proxy changes
3. Check that your API key is properly set in the `.env` file