# LINGOYUN — proje rehberi (Claude için)

iOS ve Android için İngilizce ⇄ Türkçe çeviri oyunu. Üç yaş grubu, tek aile aboneliği. İleride başka diller eklenecek: mimari çok dilli (`docs/languages.md`).

Kullanıcıyla **Türkçe** konuş. Kod, değişken adları ve commit mesajları **İngilizce**.

## Ürün özeti

| Grup     | Profil tipi | Seviye                                  | Seviye testi |
| -------- | ----------- | --------------------------------------- | ------------ |
| 2–7 yaş  | `mini`      | 6 tema dünyası, 300 kelime, resim + ses | **Yok**      |
| 7–12 yaş | `kid`       | Numaralı temalar (iç bant L1–L10)       | Var          |
| Yetişkin | `adult`     | Numaralı temalar (iç bant A1–C1)        | Var          |

- **Temalar:** Çocuk profilleri (`mini`, `kid`) **Oyun Hamuru** temasını kullanır, görseller ön planda. Yetişkin profili (`adult`) **Sözlük** temasını kullanır: açık mod + Gece Nehri renkleriyle koyu mod (sistem ayarını izler). Tema profil tipinden seçilir; bileşenler yalnızca aktif temanın token'larını okur.
- **Karakterler (2–7 modu):** Zeynep, Nehir, Kerem — üç çocuk karakter. Görünüşleri `docs/characters.md` içinde tanımlanır; tutarlılık zorunlu.
- **Abonelik:** Tek aile aboneliği (tüm profiller). **7 gün ücretsiz, kartsız**; sonra aylık veya yıllık paket.
- **Mağaza kategorisi:** Eğitim (Kids kategorisi DEĞİL). Satın alma ve ayarlar, çocuk profili (`mini`, `kid`) oynarken **ebeveyn kapısı** arkasında; yetişkin profilinde kapı yok (Furkan, 2026-11-13).
- **Seviye tespiti (kid + adult):** Profil oluşturulunca kendi beyanı (4 seçenek) → 20 soruluk uyarlamalı test (5 blok × 4 soru). Algoritma `src/features/placement/` içinde saf fonksiyon.
  - Blokta 3–4 doğru → bir üst seviye · 2 doğru → aynı · 0–1 doğru → bir alt.
  - Sonuç: 3/4 ile geçilen en yüksek seviye; hiç geçilmediyse en düşük seviye.
  - Her soruda "Bilmiyorum" butonu (yanlış sayılır, tahmini engeller).
- **Paywall'ın yeri:** İlk profilin seviye sonucundan hemen sonra (mini profilde ilk oyundan sonra).

## Ücretsiz deneme (kartsız) — platform farkı

- **iOS:** App Store kartsız abonelik denemesi sunmuyor. Apple'ın izin verdiği yol: **0 TL'lik "7 Günlük Deneme" non-consumable ürünü** (App Review 3.1.1). Satın alma tarihi Apple ID'ye bağlı → uygulama silinip kurulsa da deneme sıfırlanmaz.
- **Android:** Google Play'de 0 TL ürün yok. Deneme başlangıcı uygulama tarafından tutulur (MMKV + ileride hesap tabanlı). Yeniden kurulumla sıfırlanma riski kabul edildi; ileride Google ile giriş eklenerek kapatılabilir.
- Abonelikler **RevenueCat** (`react-native-purchases`) ile; entitlement adı `family`.
- Deneme durumunu hesaplayan mantık saf fonksiyon olmalı (`src/features/subscription/`) ve test edilmeli.

## Teknoloji yığını

- React Native + **Expo** (en güncel kararlı SDK), **TypeScript strict**, development build (Expo Go değil)
- Navigasyon: **Expo Router** (`src/app/`)
- Animasyon: **react-native-reanimated** (UI thread) + **react-native-gesture-handler**
- Özel grafik / efekt: **@shopify/react-native-skia**
- Karakter animasyonu: katmanlı **SVG + Reanimated** (Furkan'ın kararı, LNG-31; Rive kullanılmıyor) — durumlar: idle / sevinç / üzgün / konuşma
- Ses: **expo-audio** (kaydedilmiş sesler), **expo-speech** (yedek TTS), **expo-haptics**
- Yerel depolama: **react-native-mmkv**
- Abonelik: **react-native-purchases** (RevenueCat)
- Çökme raporlama: **@sentry/react-native** (kişisel veri göndermeden; çocuk profilinde isim/yaş gönderme)
- Derleme ve mağaza: **EAS Build / EAS Submit**
- Test: **jest-expo** + **@testing-library/react-native**

## Klasör yapısı

```
src/
  app/                   # Expo Router ekranları — YALNIZCA ekran ve _layout dosyaları (test veya yardımcı dosya koyma: her dosya bir rota olur)
  components/            # Ortak UI bileşenleri
  features/
    languages/           # dil kaydı (registry), normalizer'lar, kurs tanımları
    profiles/            # profil oluşturma, profil tipleri
    placement/           # seviye tespiti algoritması
    quiz/                # soru üretici, yanlış şık seçimi, yön (EN→TR / TR→EN)
    answer-check/        # serbest cevap karşılaştırma (TR karakter, eş anlamlı)
    srs/                 # aralıklı tekrar (Leitner)
    progress/            # XP, seri, taşlar, rozetler
    games/               # oyun türleri (her biri kendi klasöründe)
    subscription/        # deneme + entitlement mantığı, paywall
    parental-gate/
  content/               # concepts/ (dilden bağımsız), languages/<kod>/, courses/ + şema + doğrulayıcı
  i18n/                  # arayüz metinleri: tr.json, en.json
  theme/                 # kids/ (Oyun Hamuru) ve adult/ temaları; token'lar tek kaynak
  storage/               # MMKV sarmalayıcıları
  lib/
assets/
  audio/en, audio/tr     # TTS ile üretilmiş kelime ve yönerge sesleri (LNG-32)
# Karakterler ve kelime resimleri kodla çizilir (SVG bileşenleri, src/ altında; LNG-31)
docs/                    # art-direction.md, characters.md, game-design.md, languages.md
__tests__/               # ekran testleri; mantık testleri ilgili dosyanın yanında (*.test.ts)
```

## Kurallar

- Her değişiklikten sonra: `npx tsc --noEmit` · `npm run lint` · `npm test` hatasız olmalı.
- Mantık içeren her yeni kod için test yaz; mantığı `features/*/` içinde saf fonksiyonlara ayır.
- Renk, yazı, aralık, köşe, gölge ve animasyon süreleri `src/theme` içinden gelir; doğrudan değer yazma.
- **Görsel dil standart olmayacak.** UI veya grafik işinden önce `.claude/skills/art-direction` skill'ini oku; oyun hissi için `game-feel`, çocuk ekranları için `kids-ux`.
- **Çok dil:** `docs/languages.md` kurallarına uy. Kodda `'tr'`/`'en'` sabiti yok (registry ve kurs kullan); arayüz metni kodda yazılmaz (`src/i18n`); büyük/küçük harf dönüşümü dil kaydındaki `toLower`/`toUpper` ile (`toLocaleUpperCase` değil).
- İçerik JSON'ları şema doğrulamasından geçmeli (test olarak).
- **Fontlar** desteklenen tüm dillerin özel harflerini kapsamalı (ör. Türkçe `ğ ş İ ı`); `src/theme/fonts.test.ts` denetler. Yeni font = `src/theme/fonts.ts`'e ekle.
- **Tema:** bileşenler `useTheme()` ile token okur; `fontWeight` kullanma (ağırlık font dosyasıyla seçilir). Renk çiftleri WCAG AA'yı geçmeli (`src/theme/themes.test.ts`).
- `Platform.OS` farkı olan yerlerde iki platformu da ele al ve yorumla açıkla.
- Yeni paket: önce Expo uyumluluğunu kontrol et, `npx expo install` kullan. Bulut ortamında api.expo.dev kapalıysa `EXPO_OFFLINE=1 npx expo install` (SDK'nın kendi sürüm listesini kullanır).
- `AGENTS.md` Expo'nun kendi rehberidir; Expo API'lerinde hafızana değil, SDK sürümüne uygun dokümana güven.
- Commit formatı: `LNG-<no>: kısa açıklama`. Küçük, odaklı commit'ler.
- Ses, dokunma hissi, animasyon akıcılığı, satın alma simülatörde/bulutta doğrulanamaz → iş bitince kullanıcıya **gerçek cihazda nasıl test edeceğini** madde madde yaz.
- Emin olmadığın bir şeyde tahmin etme; kullanıcıya sor.

## Agent'lar (`.claude/agents/`)

| Agent            | Ne zaman                                                                                |
| ---------------- | --------------------------------------------------------------------------------------- |
| `yazilimci`      | Uygulama kodu, altyapı, abonelik, depolama, ekranlar                                    |
| `grafiker`       | Görsel dil, illüstrasyon (SVG/Skia), karakter tasarım dokümanı, ikon, mağaza görselleri |
| `oyun-muhendisi` | Oyun türleri, zorluk eğrisi, seviye tespiti, aralıklı tekrar, ödül ekonomisi, içerik    |
| `testci`         | Test yazma, hata avı, kabul kriteri kontrolü, cihaz test listeleri                      |
| `ceviri-editoru` | Türkçe–İngilizce çeviri denetimi: her yeni içerik partisinde ve yayından önce           |

## İş takibi — BACKLOG.md

Kullanıcı "sıradaki işi yap" dediğinde:

1. `BACKLOG.md`'de yukarıdan aşağıya ilk `[ ]` maddeyi bul.
2. **FURKAN** etiketliyse ve gereken bilgi yoksa önce sor. Gözetimsiz çalışıyorsan atla ve raporla.
3. **CİHAZ** etiketliyse: kodu yaz, testleri geçir, `[~]` yap ve "Cihazda nasıl test edilir" adımlarını ekle.
4. **BULUT** etiketliyse: typecheck + lint + test geçince `[x]` yap.
5. Önkoşulu `[x]` olmayan maddeye başlama.
6. Durumu `BACKLOG.md`'de güncelle, aynı commit'e dahil et.
7. Bitince kısa özet: ne yapıldı, kabul kriterleri tek tek, kullanıcıdan ne bekleniyor.

Gözetimsiz çalışmada: ayrı branch (`lng-<no>-kisa-ad`) + pull request, oturum başına en fazla 2 madde, `[~]` maddeyi `[x]` yapma, çözülemeyen hatada `[!]` + sebep.

Kullanıcı cihaz testinde hata bildirirse: `BACKLOG.md` "Notlar / bulgular" bölümüne `BUG-<no>` olarak ekle ve önce onu düzelt.
