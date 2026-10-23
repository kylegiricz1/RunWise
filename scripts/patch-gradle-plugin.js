const fs = require('fs');
const path = require('path');

// 1. Fix Foojay resolver version in React Native Gradle Plugin for Gradle 9+
const rnGradleSettings = path.join(
  __dirname,
  '..',
  'node_modules',
  '@react-native',
  'gradle-plugin',
  'settings.gradle.kts'
);

if (fs.existsSync(rnGradleSettings)) {
  let content = fs.readFileSync(rnGradleSettings, 'utf8');
  if (content.includes('version("0.5.0")')) {
    content = content.replace('version("0.5.0")', 'version("1.0.0")');
    fs.writeFileSync(rnGradleSettings, content, 'utf8');
    console.log('[RunWise] Patched @react-native/gradle-plugin Foojay resolver to 1.0.0 for Gradle 9+ compatibility.');
  }
}

// 2. Ensure android/local.properties exists if Android SDK is detected
const androidDir = path.join(__dirname, '..', 'android');
const localProps = path.join(androidDir, 'local.properties');
const defaultSdkPath = path.join(
  process.env.LOCALAPPDATA || (process.env.USERPROFILE + '\\AppData\\Local'),
  'Android',
  'Sdk'
);

if (fs.existsSync(androidDir) && !fs.existsSync(localProps) && fs.existsSync(defaultSdkPath)) {
  const escaped = defaultSdkPath.replace(/\\/g, '\\\\');
  fs.writeFileSync(localProps, `sdk.dir=${escaped}\n`, 'utf8');
  console.log('[RunWise] Created android/local.properties pointing to Android SDK.');
}
