# EditPro — Professional Mobile & Studio Video Editor

EditPro is a real, high-performance, offline-first video and photo editing application built for mobile creators (YouTube Shorts, Instagram Reels, and Facebook video).

## ✨ Key Features
- **Multi-Track Timeline**: Main video/photo, overlay (PIP), animated text, stickers, royalty-free audio, and voiceover.
- **Speed Curves**: Bezier curves with Montage, Bullet, Jump, and Flash presets.
- **Keyframes**: Position, Scale, Rotation, Opacity, and Easing interpolation.
- **Chroma Key**: Green screen removal with similarity and despill controls.
- **Masking**: Linear, Mirror, Radial, Rectangle, Heart, and Star clipping masks.
- **News Creator Tools**: Lower thirds, Breaking News banners with live tags, scrolling news ticker, reporter tags, and location badges.
- **100% Offline & Private**: Zero cloud uploads required. Local persistent storage via IndexedDB & Room database.
- **Export**: 480p, 720p, 1080p, 2K/4K with custom frame rates (24, 30, 60 FPS).

---

## 🚀 How to Run the Web / PWA App
```bash
# 1. Install dependencies
npm install

# 2. Run local development server
npm run dev

# 3. Open in browser:
http://localhost:3000
```

---

## 📱 How to Build the Native Android APK
The complete Android project is included in the `/android` directory:

1. Open **Android Studio**.
2. Select **Open an Existing Project** and choose the `android` folder.
3. Wait for Gradle sync to complete (JDK 17 required).
4. Run on a connected Android device or emulator, or build APK:
```bash
cd android
./gradlew assembleDebug
```
The APK will be generated at:
`android/app/build/outputs/apk/debug/app-debug.apk`

---

## 📦 Download ZIP
You can download the entire source code & Android project directly from the running app by tapping **"Download ZIP"** on the home screen or visiting:
`/api/download-zip`
