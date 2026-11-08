# LINGOYUN — BACKLOG

Durumlar: `[ ]` yapılacak · `[~]` cihazda test bekliyor · `[x]` bitti · `[!]` takıldı
Etiketler: **BULUT** (bulutta doğrulanabilir) · **CİHAZ** (gerçek cihaz testi gerekir) · **FURKAN** (Furkan'dan bilgi/karar/hesap gerekir)

---

## Faz 0 — Kurulum

- [x] **LNG-0** BULUT — Proje rehberi, backlog, agent'lar ve tasarım skill'leri.
- [ ] **LNG-1** BULUT — Expo projesi (TypeScript strict, Expo Router), ESLint + Prettier, jest-expo, klasör yapısı, `npm run lint/test` script'leri.
  - Kabul: boş ana ekran açılıyor; `tsc`, `lint`, `test` temiz.
- [ ] **LNG-2** BULUT — Tema sistemi (`src/theme`): `kids` (Oyun Hamuru) ve `adult` temaları, profil tipine göre seçim; renk, tipografi (DynaPuff + Baloo 2), aralık, köşe, gölge, hareket token'ları. Font glif kontrol script'i (`scripts/check-font-glyphs`). Adult teması LNG-39 gelene kadar geçici token'larla. Önkoşul: LNG-1, LNG-4.
- [ ] **LNG-3** FURKAN — EAS hesabı, bundle id (`com.<...>.lingoyun`), Apple Developer ve Google Play hesapları, Sentry projesi.
- [x] **LNG-4** FURKAN — Çocuk teması onayı: C — Oyun Hamuru, görsel öncelikli. Yetişkin teması ayrı (LNG-39).
- [ ] **LNG-38** BULUT — Çok dil altyapısı: dil kaydı (`src/features/languages`), kurs tanımı (`tr-en`), arayüz i18n (`expo-localization` + `i18next`, `src/i18n/{tr,en}.json`), eksik çeviri anahtarı testi. `docs/languages.md`'ye uygun. Önkoşul: LNG-1.
- [ ] **LNG-39** FURKAN — Yetişkin teması: grafiker 3 aday ekran hazırlar, Furkan seçer.

## Faz 1 — Çekirdek mantık (UI'sız, tamamen testli)

- [ ] **LNG-5** BULUT — Kavram tabanlı içerik şeması (`docs/languages.md`): `concepts/`, `languages/<kod>/words.json`, `courses/tr-en.json` + doğrulayıcı + test (eksik çeviri, tekrar eden id, kursta olmayan kavram). Önkoşul: LNG-38.
- [ ] **LNG-6** BULUT — Profiller: `mini | kid | adult`, `nativeLang` + `targetLang` (kurs), oluşturma/silme/seçme, ilerleme kurs başına, MMKV'de saklama. Önkoşul: LNG-38.
- [ ] **LNG-7** BULUT — Soru üretici: yön seçimi, aynı konu/seviyeden mantıklı yanlış şıklar, tekrar etmeyen sıra. Önkoşul: LNG-5.
- [ ] **LNG-8** BULUT — Cevap kontrolü: dil başına normalizer (registry'den), büyük/küçük harf (locale ile), TR karakter toleransı (ı/i, ş/s → "neredeyse doğru"), noktalama, eş anlamlılar. Önkoşul: LNG-5.
- [ ] **LNG-9** BULUT — Aralıklı tekrar (Leitner, 5 kutu: 0/1/3/7/14 gün). Önkoşul: LNG-5.
- [ ] **LNG-10** BULUT — Seviye tespit algoritması (CLAUDE.md'deki kurallar) + kapsamlı test. Önkoşul: LNG-7.
- [ ] **LNG-11** BULUT — İlerleme: XP, günlük seri, taş (ödül birimi), rozetler. Önkoşul: LNG-6.

## Faz 2 — İçerik

- [ ] **LNG-12** BULUT — 2–7 yaş 300 kelime taslağı (6 tema × 50), EN + TR, resimlenebilir somut kelimeler. Furkan onayına sunulur.
- [ ] **LNG-13** FURKAN — LNG-12 listesinin onayı.
- [ ] **LNG-14** BULUT — 7–12 yaş Seviye 1–3 içeriği (~250 kelime + 60 basit cümle).
- [ ] **LNG-15** BULUT — Yetişkin A1–A2 içeriği (~600 kelime + 150 cümle + 30 deyim).

## Faz 3 — 7–12 yaş, ilk oynanabilir sürüm

- [ ] **LNG-16** CİHAZ — Onboarding: profil oluştur → yaş grubu → (kid/adult) kendi beyanı. Önkoşul: LNG-6, LNG-2.
- [ ] **LNG-17** CİHAZ — Seviye tespit ekranları (20 soru, ilerleme çubuğu, "Bilmiyorum", sesli okuma) + sonuç ekranı. Önkoşul: LNG-10, LNG-16.
- [ ] **LNG-18** CİHAZ — Oyun: Çoktan seçmeli (EN→TR / TR→EN). Önkoşul: LNG-7.
- [ ] **LNG-19** CİHAZ — Oyun: Harf dizme. Önkoşul: LNG-7.
- [ ] **LNG-20** CİHAZ — Oyun: Cümle kurma (kelime blokları sürükle-bırak). Önkoşul: LNG-7.
- [ ] **LNG-21** CİHAZ — Nehir boyunca bölüm haritası (Skia). Önkoşul: LNG-11.
- [ ] **LNG-22** CİHAZ — Oyun hissi paketi: doğru/yanlış animasyonları, haptics, ses efektleri (`game-feel` skill). Önkoşul: LNG-18.

## Faz 4 — Abonelik

- [ ] **LNG-23** FURKAN — App Store Connect + Play Console ürünleri: `family_monthly`, `family_yearly`, iOS `trial_7_days` (0 TL non-consumable); RevenueCat hesabı ve anahtarları; fiyatlar.
- [ ] **LNG-24** BULUT — Deneme/entitlement mantığı (saf fonksiyon + test): deneme başlangıcı, kalan gün, süre doldu, abone. Önkoşul: LNG-1.
- [ ] **LNG-25** CİHAZ — RevenueCat entegrasyonu, paywall ekranı, satın al / geri yükle, kilit. Önkoşul: LNG-23, LNG-24.
- [ ] **LNG-26** CİHAZ — Ebeveyn kapısı (satın alma + ayarlar önünde). Önkoşul: LNG-1.

## Faz 5 — Yetişkin

- [ ] **LNG-27** CİHAZ — Serbest yazma oyunu (cümle çevirisi). Önkoşul: LNG-8.
- [ ] **LNG-28** CİHAZ — Deyimler ve yanıltıcı benzer kelimeler modu.
- [ ] **LNG-29** CİHAZ — Günlük tekrar ekranı (SRS kuyruğu). Önkoşul: LNG-9.

## Faz 6 — 2–7 yaş (Zeynep, Nehir, Kerem)

- [ ] **LNG-30** BULUT — Karakter tasarım dokümanı (`docs/characters.md`): kişilik, renk, siluet, ifade sayfası tarifi. Önkoşul: LNG-4.
- [ ] **LNG-31** FURKAN — Karakter görsellerinin üretimi/onayı (illüstratör veya yapay zekâ + seçim) ve Rive animasyonları.
- [ ] **LNG-32** FURKAN — Ses kayıtları (300 kelime × EN + TR) — kayıt mı TTS mi kararı.
- [ ] **LNG-33** CİHAZ — Mini oyunlar: sesi duy → resmi bul, sürükle-bırak sepet, hafıza kartları. Önkoşul: LNG-13, LNG-31.
- [ ] **LNG-34** CİHAZ — Çıkartma albümü (ödül). Önkoşul: LNG-33.

## Faz 7 — Yayın

- [ ] **LNG-35** BULUT — Gizlilik politikası taslağı (KVKK, COPPA, GDPR-K), mağaza metinleri TR + EN.
- [ ] **LNG-36** BULUT — Mağaza ekran görüntüleri ve uygulama ikonu (grafiker agent).
- [ ] **LNG-37** FURKAN — TestFlight + Play iç test, gönderim.

---

## Notlar / bulgular

- Commit öneki `LNG` olarak seçildi; değiştirmek istersen söyle.
- Font bulgusu: Lilita One ve Fredoka'da `ğ ş İ Ğ Ş` yok; Titan One'da `İ` yok. Çocuk teması DynaPuff + Baloo 2'ye geçirildi.
