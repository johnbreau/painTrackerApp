# Pain Tracker App

A React Native application that helps users track pain events using their Apple Watch. The app detects watch taps and logs pain events, with the ability to sync with Apple Health.

## Features

- Detect watch taps to log pain events
- Manual pain logging
- View pain event history
- Sync with Apple Health (iOS)
- Haptic feedback on event logging

## Prerequisites

- Node.js (v16 or later)
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- iOS Simulator or Android Emulator (or a physical device with Expo Go)
- For watch functionality, an Apple Watch is recommended

## Getting Started

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd PainTrackerApp
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npx expo start
   ```

4. **Run on your device**
   - Scan the QR code with your iPhone's camera (iOS) or the Expo Go app (Android)
   - Or press `i` for iOS simulator or `a` for Android emulator

## Using the App

1. **Watch Mode**
   - Tap "Start Watch Mode" to enable tap detection
   - Tap your watch to log a pain event
   - The app will vibrate to confirm the event was logged

2. **Manual Logging**
   - Tap "Log Pain Manually" to add a pain event without using the watch

3. **Viewing History**
   - Scroll through your recent pain events
   - Each event shows the timestamp and intensity

## Apple Health Integration (iOS only)

To enable Apple Health integration:

1. Open the Health app on your iPhone
2. Go to "Sources" > "PainTracker"
3. Enable all the data types you want to track

## Development

### Project Structure

- `App.js` - Main application component
- `app.json` - Expo configuration
- `components/` - Reusable UI components
- `services/` - Business logic and API calls
- `utils/` - Utility functions

### Available Scripts

- `npm start` - Start the development server
- `npm run ios` - Run on iOS simulator
- `npm run android` - Run on Android emulator
- `npm test` - Run tests

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Built with [Expo](https://expo.dev/)
- Uses [expo-sensors](https://docs.expo.dev/versions/latest/sdk/sensors/) for motion detection
- Health data integration with [expo-health-connect](https://docs.expo.dev/versions/latest/sdk/health-connect/)
