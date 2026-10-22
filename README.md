# RunWise 🏃‍♂️🌤️

**RunWise** is an intelligent, weather-optimized running companion app built with React Native and Expo. It evaluates hourly forecasts against optimal running physiology metrics to pinpoint the best time to run each day.

---

## ✨ Features

- **🎯 Optimal Run Window Recommendations**  
  Calculates the highest-scoring hour for running every day based on temperature, humidity, precipitation probability, and wind speed.
- **📅 7-Day Weekly Overview**  
  A bird's-eye view of optimal running windows across the week with an interactive trend chart and one-tap deep navigation to any day's forecast.
- **📈 Interactive Weather Graphs**  
  Scrubbable SVG charts built with Gesture Handler and Reanimated displaying hourly feels-like temperature, humidity, wind, and rain probabilities with live tooltips.
- **⏱️ Personalized Run Windows**  
  Filter recommendations by preferred running times. Choose from convenient presets (*Early Morning*, *Morning*, *Midday*, *Afternoon*, *Evening*, *Night*) or build custom time windows.
- **📍 Smart Location & Geocoding**  
  Automatic GPS location with reverse geocoding to city and region, with offline caching via AsyncStorage.
- **🌐 Open Weather Integration**  
  Reliable, real-time forecast data powered by [Open-Meteo](https://open-meteo.com/) (no third-party API key required).

---

## 🧠 The Scoring Engine

RunWise avoids simplistic threshold checks and instead scores every hour on a continuous scale $[0, 1]$ using a mathematical utility model:

- **Temperature Utility:** Gaussian distribution centered at an ideal 58°F ($\sigma = 12^\circ\text{F}$).
- **Wind Utility:** Gaussian distribution centered around 6 mph ($\sigma = 5\text{ mph}$).
- **Humidity Utility:** Logistic curve reflecting cardiovascular strain as relative humidity climbs above 75%.
- **Precipitation Penalty:** Quadratic penalty on rain probability: $(1 - \text{rainChance} / 100)^2$.
- **Heat-Humidity Interaction:** Joint penalty applied when elevated temperatures and high humidity compound perceived exertion.

Weighting parameters can be adjusted in [`src/services/weatherScoring/constants.ts`](file:///c:/Users/kyleg/Documents/Projects/RunWise/src/services/weatherScoring/constants.ts).

---

## 🛠️ Tech Stack

- **Framework:** [Expo](https://expo.dev) SDK 56 (Expo Router, typed routes enabled)
- **Runtime:** [React Native](https://reactnative.dev) 0.85 & [React](https://react.dev) 19
- **Graphics & Gestures:** [`react-native-svg`](https://github.com/software-mansion/react-native-svg), [`react-native-reanimated`](https://docs.swmansion.com/react-native-reanimated/), and [`react-native-gesture-handler`](https://docs.swmansion.com/react-native-gesture-handler/)
- **Sensors & Storage:** `expo-location` and `@react-native-async-storage/async-storage`
- **Data Source:** [Open-Meteo Forecast API](https://open-meteo.com/)
- **Language:** TypeScript 6

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (LTS recommended)
- [Expo Go](https://expo.dev/go) on your physical device, or an iOS Simulator / Android Emulator

### Installation

1. Clone the repository and navigate to the project root:
   ```bash
   git clone https://github.com/your-username/RunWise.git
   cd RunWise
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

### Running the App

Start the Expo development server:

```bash
npx expo start
```

From the terminal interface, you can press:
- `i` to open in an **iOS Simulator**
- `a` to open in an **Android Emulator**
- `w` to run on the **Web**
- Scan the displayed QR code with the **Expo Go** mobile app (Android) or the Camera app (iOS)

### Available Scripts

| Command | Description |
| :--- | :--- |
| `npm run start` | Start the Expo bundler / dev server |
| `npm run ios` | Start Expo targeting iOS Simulator |
| `npm run android` | Start Expo targeting Android Emulator |
| `npm run web` | Start Expo targeting web browser |
| `npm run lint` | Run Expo linting checks |

---

## 📁 Project Structure

```
RunWise/
├── assets/                  # App icons, splash screens, and images
├── src/
│   ├── app/                 # Expo Router file-based screens
│   │   ├── _layout.tsx      # Root provider layout
│   │   └── (tabs)/          # Bottom tab navigation
│   │       ├── _layout.tsx  # Tab configuration
│   │       ├── index.tsx    # Home screen (Best time, Day selector, Hourly graph)
│   │       ├── weekly.tsx   # 7-day overview & weekly trend chart
│   │       └── preferences.tsx # Run schedule and window preferences
│   ├── components/          # Reusable UI components & SVG charts
│   │   ├── BestTimeCard.tsx
│   │   ├── DaySelector.tsx
│   │   ├── HourStepper.tsx
│   │   ├── WeatherDetailsCard.tsx
│   │   ├── WeatherGraphCard.tsx
│   │   └── weekly-best-times-chart.tsx
│   ├── constants/           # App presets and theme definitions
│   ├── context/             # React context (e.g., RunPreferencesContext)
│   ├── hooks/               # Custom hooks (useLocation, useWeatherData, etc.)
│   ├── services/
│   │   ├── weatherApi/      # Open-Meteo client and condition mappings
│   │   └── weatherScoring/  # Utility equations and window filter logic
│   ├── types/               # TypeScript interfaces (weather, location, settings)
│   └── utils/               # Date and time formatting helpers
├── app.json                 # Expo app configuration
├── package.json             # Project dependencies and npm scripts
└── tsconfig.json            # TypeScript configuration
```

---

## 📄 License

This project is licensed under the [MIT License](file:///c:/Users/kyleg/Documents/Projects/RunWise/LICENSE).
