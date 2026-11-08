---
name: game-feel
description: LINGOYUN'da oyun hissi (juice) — doğru/yanlış geri bildirimi, animasyon süreleri, Reanimated/Skia kalıpları, haptics ve ses eşlemesi, kombo ve ödül anları. Bir oyun ekranı, buton, geçiş veya ödül animasyonu yazarken oku.
---

# Oyun hissi

Bir quiz uygulaması ile bir oyun arasındaki fark buradadır. Her etkileşim **görsel + hareket + ses + dokunma** ile cevap verir.

## Geri bildirim tablosu

| An | Görsel / hareket | Haptics (expo-haptics) | Ses |
|---|---|---|---|
| Butona basma | 0.94'e sıkış, spring ile geri | `selectionAsync` | hafif "tık" |
| Doğru cevap | şık büyür + parıltı, taş seçenekten skora uçar | `notificationAsync(Success)` | yükselen iki nota |
| Yanlış cevap | şık yumuşakça sağa-sola sallanır (3 salınım), doğru şık vurgulanır | `impactAsync(Light)` | yumuşak, cezalandırmayan ton |
| Kombo (3, 5, 10 doğru) | kombo rozeti, ekran kenarında hafif ışık | `impactAsync(Medium)` | perdesi her komboda yükselen nota |
| Bölüm sonu | yıldız/taş sayımı tek tek, karakter sevinci | sayım başına `selectionAsync` | kutlama |
| Seviye atlama | tam ekran an (≤ 2,5 sn, dokununca geçilebilir) | `notificationAsync(Success)` | fanfar |

## Süreler ve hareket

- Süreler ve spring ayarları `src/theme/motion` içinde. Başlangıç değerleri:
  - `tap`: 90 ms · `feedback`: 250–350 ms · `celebrate`: 600–900 ms · `screen`: 300 ms
  - spring: `{ damping: 14, stiffness: 180 }` (oyunlu), `{ damping: 20, stiffness: 220 }` (sakin/yetişkin)
- Geri bildirim **100 ms içinde** başlamalı; ağır iş (ses yükleme vb.) önceden yapılır.
- Tüm animasyonlar Reanimated worklet'i veya Skia ile UI thread'de. `runOnJS` yalnızca bittiğinde durumu güncellemek için.
- Parçacık efektleri (taş, konfeti, su damlası) Skia ile; aynı anda en fazla ~40 parçacık.
- **Azaltılmış hareket** (`AccessibilityInfo.isReduceMotionEnabled` / Reanimated `useReducedMotion`) açıksa: sallanma ve parçacıklar yerine yalnızca renk ve opaklık değişimi.

## Kurallar

- Yanlış cevap asla "kaybettin" ekranı değildir: doğruyu göster, kısa bir an bekle, devam et.
- Yetişkin modunda aynı sistem, daha kısa ve daha az gösterişli (`adult` motion profili).
- Ses ve titreşim ayarlardan kapatılabilir; sessiz modda ses çalma (iOS'ta `playsInSilentMode: false`).
- Bir sonraki soru, önceki geri bildirim bitmeden **otomatik** gelmez; çocuk ritmi kendisi belirler (2–7 yaşta "devam" karakter dokunuşuyla).

## Test

Animasyon zamanlaması ve haptics bulutta doğrulanamaz. Her oyun işinin sonunda cihaz listesi: düşük seviye Android'de 60 fps korunuyor mu, ses gecikmesi hissediliyor mu, titreşim iOS ve Android'de ayırt edilebiliyor mu.
