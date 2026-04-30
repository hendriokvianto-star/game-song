# 🃏 Song: The Ultimate Indonesian Card Game Experience

[![Expo](https://img.shields.io/badge/Expo-000020?style=for-the-badge&logo=expo&logoColor=white)](https://expo.dev/)
[![React Native](https://img.shields.io/badge/React_Native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactnative.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Zustand](https://img.shields.io/badge/Zustand-orange?style=for-the-badge)](https://github.com/pmndrs/zustand)

**Song** adalah adaptasi digital modern dari permainan kartu tradisional populer di Indonesia. Dikembangkan dengan fokus pada estetika premium dan performa tinggi, proyek ini membawa mekanisme strategi kartu yang kompleks ke dalam genggaman Anda dengan dukungan AI yang cerdas dan pengalaman visual yang memukau.

---

## ✨ Key Features

### 🧠 Smart AI Engine
Lawan 4 kepribadian bot yang berbeda:
- **Easy**: Pemain santai yang kadang ragu-ragu.
- **Normal**: Gaya bermain standar dan seimbang.
- **Expert**: Pemain strategis yang memprioritaskan pengurangan poin penalti dan memburu kemenangan *Song*.

### 🎭 Premium Visuals & Themes
Pilih suasana meja favorit Anda:
- **Classic Green**: Meja kasino tradisional.
- **Luxury Maroon**: Nuansa eksklusif dan mewah.
- **Ocean Blue**: Tenang dan modern.
- **Midnight Gray**: Mode gelap yang elegan.

### 📱 Native Experience
- **Immersive Haptics**: Getaran fisik untuk setiap tarikan kartu, jalan, dan kemenangan.
- **High-Performance Animations**: Animasi 60FPS menggunakan `react-native-reanimated`.
- **Localization**: Dukungan penuh Bahasa Indonesia dan English.
- **Interactive Tutorial**: Panduan langkah-demi-langkah bagi pemain baru.

---

## 🛠️ Tech Stack

- **Framework**: [Expo](https://expo.dev/) (SDK 54)
- **Library**: React Native
- **State Management**: [Zustand](https://github.com/pmndrs/zustand)
- **Animation**: React Native Reanimated
- **Audio**: Expo-AV
- **Icons & UI**: Lucide React Native, Expo Symbols

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- Expo Go di HP Anda atau Emulator Android/iOS.

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/game-song.git
   cd game-song
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the project**
   ```bash
   npx expo start
   ```

4. **Scan the QR Code** menggunakan aplikasi Expo Go di HP Anda.

### Build APK Lokal (Offline)

```bash
# Bundle JS terlebih dahulu
npx react-native bundle --platform android --dev false --entry-file index.js --bundle-output android/app/src/main/assets/index.android.bundle --assets-dest android/app/src/main/res/

# Build APK release
cd android
./gradlew app:assembleRelease -x lint -x test -PreactNativeArchitectures=arm64-v8a
```

APK hasil build ada di: `android/app/build/outputs/apk/release/app-release.apk`

---

## ☁️ Cloud Build (EAS)

Dengan **Expo Application Services (EAS)**, Anda bisa build APK/AAB di cloud tanpa perlu setup Android SDK lokal.

### Prerequisites
- Akun [Expo](https://expo.dev/) (gratis).
- EAS CLI terinstal secara global.

### Setup

1. **Install EAS CLI**
   ```bash
   npm install -g eas-cli
   ```

2. **Login ke akun Expo**
   ```bash
   eas login
   ```

3. **Konfigurasi EAS** (sudah tersedia `eas.json` di project ini)

   File `eas.json` saat ini memiliki 2 profil build:

   | Profil | Output | Kegunaan |
   |--------|--------|----------|
   | `preview` | `.apk` | Testing di perangkat langsung |
   | `production` | `.aab` | Upload ke Google Play Store |

### Build APK (Preview)

```bash
eas build --platform android --profile preview
```

> ⏱️ Build pertama biasanya memakan waktu **10-20 menit**. Build berikutnya akan lebih cepat berkat caching.

Setelah selesai, Anda akan mendapat **link download APK** langsung dari terminal atau dari dashboard [expo.dev](https://expo.dev/).

### Build AAB (Production / Play Store)

```bash
eas build --platform android --profile production
```

> File `.aab` (Android App Bundle) dibutuhkan untuk upload ke Google Play Console.

### Build iOS (Opsional)

```bash
eas build --platform ios --profile production
```

> ⚠️ Build iOS memerlukan akun **Apple Developer Program** ($99/tahun).

### Download & Install

Setelah build selesai:

1. **Via Terminal**: Link download akan muncul otomatis.
2. **Via Dashboard**: Buka [expo.dev](https://expo.dev/) → Project → Builds.
3. **Via QR Code**: Scan QR code yang ditampilkan di terminal untuk install langsung ke HP.

### Troubleshooting Cloud Build

| Masalah | Solusi |
|---------|--------|
| `eas: command not found` | Jalankan `npm install -g eas-cli` |
| Build gagal: credentials | Jalankan `eas credentials` untuk setup ulang |
| Build queue lama | Akun gratis memiliki antrian. Upgrade ke EAS Priority untuk build lebih cepat |
| APK tidak bisa diinstall | Pastikan **"Install from Unknown Sources"** aktif di HP Anda |

---

## 📜 Ringkasan Aturan Game

Game ini menggunakan **2 dek kartu standar** (108 kartu, termasuk 4 Joker). 
- Setiap pemain mendapatkan **20 kartu**.
- Tujuan utama adalah menyusun **Sequence (Seri)** atau **Set (Kembar)**.
- **As Sekop** dan **Joker** bertindak sebagai *Wildcard*.
- **Dead Set**: Meletakkan Joker pada Set akan mematikan kombinasi tersebut.
- **Song**: Kondisi di mana pemain berhasil menghabiskan semua kartu di tangan.

*Untuk detail lengkap, silakan baca [GAME_RULES.md](./GAME_RULES.md).*

---

## 🤝 Contribution

Kontribusi sangat disambut baik! Jika Anda memiliki ide fitur baru atau menemukan bug:
1. Fork proyek ini.
2. Buat branch fitur baru (`git checkout -b feature/AmazingFeature`).
3. Commit perubahan Anda (`git commit -m 'Add some AmazingFeature'`).
4. Push ke branch tersebut (`git push origin feature/AmazingFeature`).
5. Buka Pull Request.

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---

Developed with ❤️ by **hendriokvianto-star**
