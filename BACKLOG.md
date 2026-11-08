# LINGOYUN — BACKLOG

Durumlar: `[ ]` yapılacak · `[~]` cihazda test bekliyor · `[x]` bitti · `[!]` takıldı
Etiketler: **BULUT** (bulutta doğrulanabilir) · **CİHAZ** (gerçek cihaz testi gerekir) · **FURKAN** (Furkan'dan bilgi/karar/hesap gerekir)

---

## Faz 0 — Kurulum

- [x] **LNG-0** BULUT — Proje rehberi, backlog, agent'lar ve tasarım skill'leri.
- [x] **LNG-1** BULUT — Expo projesi (TypeScript strict, Expo Router), ESLint + Prettier, jest-expo, klasör yapısı, `npm run lint/test` script'leri.
  - Kabul: boş ana ekran açılıyor; `tsc`, `lint`, `test` temiz.
- [x] **LNG-2** BULUT — Tema sistemi (`src/theme`): `kids` (Oyun Hamuru, DynaPuff + Baloo 2) ve `adult` (Sözlük açık + Gece Nehri koyu, Fraunces + Inter Tight) temaları; profil tipine ve sistem moduna göre seçim; renk, tipografi, aralık, köşe, gölge, hareket token'ları. Font glif kontrol script'i (`src/theme/fonts.test.ts`, `npm test` içinde). Önkoşul: LNG-1, LNG-4, LNG-39.
- [~] **LNG-3** FURKAN — EAS hesabı, bundle id, Apple Developer ve Google Play hesapları, Sentry projesi.
  - ✅ Bundle id `com.ozkulfurkan.lingoyun`, EAS projesi `@ozkulfurkan/lingoyun` (`3fa95618-…`), `eas.json` (development / preview / production + Play gönderim profilleri), Sentry bağlantısı (DSN yoksa kapalı; kişisel veri, ekran görüntüsü, kullanıcı bilgisi gönderilmez).
  - ✅ Apple Developer üyeliği var (Furkan).
  - Kalan (Furkan): expo.dev → lingoyun → Environment variables'a `EXPO_PUBLIC_SENTRY_DSN` ve `SENTRY_AUTH_TOKEN`; ilk Android ve iOS geliştirici derlemelerini cihazda açmak.
  - Cihazda nasıl test edilir (Android): bilgisayarda `npx eas-cli@latest build --profile development --platform android` → çıkan APK'yı telefona kur → uygulama açılıyor, "LINGOYUN / Yakında" görünüyor, Türkçe telefonda "Yakında", İngilizce telefonda "Coming soon".
  - Cihazda nasıl test edilir (iOS): `npx eas-cli@latest device:create` → çıkan bağlantıyı iPhone'da aç, profili yükle → iPhone'da Ayarlar → Gizlilik ve Güvenlik → Geliştirici Modu'nu aç → `npx eas-cli@latest build --profile development --platform ios` (Apple ID ile giriş ister; sertifikaları EAS oluşturur) → derleme bitince gelen bağlantıdan kur → aynı kontroller.
- [x] **LNG-4** FURKAN — Çocuk teması onayı: C — Oyun Hamuru, görsel öncelikli. Yetişkin teması ayrı (LNG-39).
- [x] **LNG-38** BULUT — Çok dil altyapısı: dil kaydı (`src/features/languages`), kurs tanımı (`tr-en`), arayüz i18n (`expo-localization` + `i18next`, `src/i18n/{tr,en}.json`), eksik çeviri anahtarı testi. `docs/languages.md`'ye uygun. Önkoşul: LNG-1.
- [x] **LNG-39** FURKAN — Yetişkin teması: Sözlük (açık) + Gece Nehri renkleriyle koyu mod.

## Faz 1 — Çekirdek mantık (UI'sız, tamamen testli)

- [x] **LNG-5** BULUT — Kavram tabanlı içerik şeması (`docs/languages.md`): `concepts/`, `languages/<kod>/words.json`, `courses/tr-en.json` + doğrulayıcı + test (eksik çeviri, tekrar eden id, kursta olmayan kavram). Önkoşul: LNG-38.
- [x] **LNG-6** BULUT — Profiller: `mini | kid | adult`, `nativeLang` + `targetLang` (kurs), oluşturma/silme/seçme, ilerleme kurs başına, MMKV'de saklama. Önkoşul: LNG-38.
- [x] **LNG-7** BULUT — Soru üretici: yön seçimi, aynı konu/seviyeden mantıklı yanlış şıklar, tekrar etmeyen sıra. Önkoşul: LNG-5.
- [x] **LNG-8** BULUT — Cevap kontrolü: dil başına normalizer (registry'den), büyük/küçük harf (locale ile), TR karakter toleransı (ı/i, ş/s → "neredeyse doğru"), noktalama, eş anlamlılar. Önkoşul: LNG-5.
- [x] **LNG-9** BULUT — Aralıklı tekrar (Leitner, 5 kutu: 0/1/3/7/14 gün). Önkoşul: LNG-5.
- [x] **LNG-10** BULUT — Seviye tespit algoritması (CLAUDE.md'deki kurallar) + kapsamlı test. Önkoşul: LNG-7.
- [x] **LNG-11** BULUT — İlerleme: XP, günlük seri, taş (ödül birimi), rozetler. Önkoşul: LNG-6.

## Faz 2 — İçerik

- [x] **LNG-12** BULUT — 2–7 yaş 300 kelime taslağı (6 tema × 50), EN + TR, resimlenebilir somut kelimeler. Furkan onayına sunulur.
- [x] **LNG-13** FURKAN — LNG-12 listesinin onayı (`docs/content/mini-words.md`). Kararlar: rice → pilav, cake → pasta, coat → mont, sofa → kanepe, crayon → boya kalemi, blocks → oyuncak küpler, bubbles → baloncuk, grass → çimen (ot da kabul).
- [x] **LNG-14** BULUT — 7–12 yaş Seviye 1–3 içeriği (~250 kelime + 60 basit cümle). Liste: `docs/content/kid-words.md`.
- [x] **LNG-15** BULUT — Yetişkin A1–A2 içeriği (685 kelime + 150 cümle + 30 deyim). Liste: `docs/content/adult-words.md`.

## Faz 3 — 7–12 yaş, ilk oynanabilir sürüm

- [x] **LNG-16** CİHAZ — Onboarding: profil oluştur → yaş grubu → (kid/adult) kendi beyanı. iPhone'da test edildi (Furkan); Android denemesi LNG-3'teki ilk Android derlemesiyle yapılacak. Önkoşul: LNG-6, LNG-2.
- [~] **LNG-17** CİHAZ — Seviye tespit ekranları (20 soru, ilerleme çubuğu, "Bilmiyorum", sesli okuma) + sonuç ekranı. Önkoşul: LNG-10, LNG-16.
  - ✅ Kendi beyanından sonra test, ardından sonuç ekranı. "Hiç bilmiyorum" testi atlar. Seviye yalnızca test bitince kaydedilir. 7–12 profilinde sorular otomatik okunur, yetişkinde butonla. Soru kartında henüz resim yok: kelime çizimleri hazır değil.
  - Önce yeni derleme gerekir (yeni yerel paket: `expo-speech`): `npx eas-cli@latest build --profile development --platform ios`, ardından `npx expo start --dev-client --lan --clear`.
  - Cihazda nasıl test edilir:
    1. Uygulamayı silip yeniden kur, "Yetişkin" → "Hiç bilmiyorum" → "Devam" → test açılmadan ana ekran gelir.
    2. Yeniden kur, "7–12 yaş" → "Çok iyi biliyorum" → "Devam" → soru ekranı açılır, soru **kendiliğinden sesli okunur**. Bir sonraki soruya geçince önceki ses kesilir.
    3. Hoparlör düğmesine bas → soru tekrar okunur. İngilizce soruda İngilizce, Türkçe soruda Türkçe ses duyulur. Telefon sessizdeyken ne olduğunu not et.
    4. Şıkka basınca hemen sonraki soru gelir, doğru/yanlış gösterilmez. Sayaç "1 / 20"den ilerler, çubuk 5 bölüm halinde dolar.
    5. Uzun cümleli sorularda (özellikle küçük ekranda) şıklar kayarak görünür, "Bilmiyorum" altta kalır.
    6. Testin ortasında uygulamayı tamamen kapatıp aç → seviye seçim ekranı gelir, test baştan başlar.
    7. 20 soruyu bitir → madalya zıplayarak gelir, telefon titrer, seviye yazılır ("Seviye 2" gibi). "Başla" → ana ekran. Uygulamayı kapatıp aç → yine ana ekran.
    8. Yeniden kur, "Yetişkin" → "Rahatça konuşabiliyorum" → testi tamamla: Sözlük temasıyla sonuç "A1" veya "A2" çıkar. Telefonu koyu moda al: madalyanın yıldızı açık renk kalır.
    9. Ayarlardan "Hareketi Azalt"ı aç → madalya zıplamadan görünür.
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
- [ ] **LNG-40** BULUT + FURKAN — Yetişkin içeriğini kolayca genişletme (Furkan'ın isteği: yetişkin içeriği LNG-15'teki listeyle sınırlı kalmayacak). Furkan kod ve birden çok JSON dosyasıyla uğraşmadan yeni kelime, cümle ve deyim ekleyebilmeli; tek bir kaynak dosya + komut, içeriği doğru yerlere dağıtır ve doğrular. Önkoşul: LNG-15.
  - Sorulacak: düzenleme biçimi ne olsun (Excel/Google Sheets'ten CSV mi, düz metin mi)?
  - Yapılacak: `src/content/adultContent.test.ts`'teki sabit sayı sınırları (en fazla 700 kelime, tam 150 cümle, tam 30 deyim) gevşetilmeli, yoksa yeni içerik testi kırar. Taban sınırlar kalır.
  - Çıkış noktası: LNG-15'te kullanılan satır biçimi `id|en|enAlts|tr|trAlts` (tek kullanımlık script'ti, repoda yok).

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
- Cihazda doğrulanacak (LNG-38): Hermes'te `\p{P}` düzenli ifadesi ve `String.normalize` çalışıyor mu? İlk cihaz derlemesinde, Türkçe ve İngilizce telefonda arayüz dilinin doğru seçildiği de kontrol edilecek.
- Cihazda doğrulanacak (LNG-2): fontlar, kil gölgeleri ve koyu moda geçiş iPhone'da LNG-16 testiyle görüldü; Android'de bakılacak.
- Kontrast bulgusu (LNG-2): örnek ekranlardaki bazı renkler WCAG altında kaldı ve ayarlandı — çocuk butonu `#FF6B8B → #E64570`, doğru cevap yazısı beyaz → koyu yeşil `#174536`, silik metin `#8A6A62 → #765850`; yetişkin vurgu `#D9481F → #C2401A`, silik metin `#7A7266 → #6A6255`. `src/theme/themes.test.ts` her temayı denetler.
- Profil sınırı (LNG-6): aile başına en fazla **3** profil, takma ad en fazla 20 karakter (Furkan'ın kararı, `src/features/profiles/profiles.ts`).
- Cihazda doğrulanacak (LNG-6): profillerin kapatıp açınca durması (MMKV) iPhone'da LNG-16 testiyle görüldü; Android'de bakılacak.
- Seviye tespiti simülasyonu (LNG-10, 1000 sanal oyuncu): yetişkin %70 tam / %99 ±1 / %1 fazla yüksek; 7–12 %69 / %99 / %0,6. `src/features/placement/placement.test.ts`.
- Karar (Furkan, LNG-17): kendi beyanında "Hiç bilmiyorum" diyen kullanıcı seviye testine girmez, doğrudan en alt seviyeden başlar (7–12: L1, yetişkin: A1). Diğer üç seçenek teste girer.
- Seviye testi üst sınırı (LNG-17): içerik olmadığı için test şimdilik yetişkini en fazla A2, çocuğu en fazla L3 olarak yerleştirir. İleri seviye bir kullanıcı da A2'den başlar. B1+ ve L4+ içeriği eklenince sınır kendiliğinden kalkar (seviye başına en az 20 kavram).
- İçerik kontrolü (LNG-14, LNG-15): çeviriler henüz bir insan tarafından gözden geçirilmedi ve `review: true` işareti de konmadı. En riskli kısım deyimlerin Türkçe karşılıkları (`docs/content/adult-words.md`). Yayından önce kontrol edilmeli.
- Font bulgusu: Lilita One ve Fredoka'da `ğ ş İ Ğ Ş` yok; Titan One'da `İ` yok. Çocuk teması DynaPuff + Baloo 2'ye geçirildi.
