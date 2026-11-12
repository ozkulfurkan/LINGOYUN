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
  - ✅ Sentry projesi ve EAS ortam değişkenleri (`EXPO_PUBLIC_SENTRY_DSN`, `SENTRY_AUTH_TOKEN`) eklendi (Furkan, 2026-11-11). iOS geliştirici derlemesi cihazda çalışıyor.
  - Kalan (Furkan): Google Play hesabı var; Android cihaz olmadığı için Android derlemesi sonraya kaldı.
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
- [x] **LNG-17** CİHAZ — Seviye tespit ekranları (20 soru, ilerleme çubuğu, "Bilmiyorum", sesli okuma) + sonuç ekranı. iPhone'da test edildi (Furkan); Android denemesi LNG-3'teki ilk Android derlemesiyle yapılacak. Önkoşul: LNG-10, LNG-16.
- [x] **LNG-18** CİHAZ — Oyun: Çoktan seçmeli (EN→TR / TR→EN). iPhone'da test edildi (Furkan); Android denemesi LNG-3'teki ilk Android derlemesiyle yapılacak. Önkoşul: LNG-7.
- [x] **LNG-19** CİHAZ — Oyun: Harf dizme. Önkoşul: LNG-7.
  - ✅ Ana ekranda "Harf dizme" (7–12 ve yetişkin). Türkçe kelime gösterilir, İngilizcesi karışık harflerden dizilir; boşluk ve tire sabit. 8 kelimelik tur, tekrar kutularına ve XP/taş/seriye bağlı, tur özetiyle. Mantık `src/features/games/letter-order/`, kurallar `docs/game-design.md`.
  - Kararlar (Furkan'a sorulmadan, gece çalışması): kutular dolunca otomatik kontrol; yanlışta doğru yerdeki harfler kalır; 2 yanlıştan sonra sıradaki harf parlar; 1 yanlıştan sonra "Göster" çıkar. İlk denemede doğru = tam puan, denemeyle doğru = kutuda kalır, "Göster" = yanlış. Harfler küçük harf. 2–10 harfli kelimeler (cümle ve deyim yok).
  - Derleme: yeni yerel paket yok; Metro'yu `--clear` ile yeniden başlatman yeterli.
  - Cihazda nasıl test edilir:
    1. 7–12 profiliyle ana ekranda "Harf dizme"ye bas → Türkçe kelime görünür ve sesli okunur; altında boş kutular ve karışık harfler.
    2. Harflere sırayla dokun → ilk boş kutuya gider; dolu kutuya dokununca harf geri döner.
    3. Doğru dizince kutular yeşillenir, "Aferin!" yazar, İngilizce kelime okunur, telefon titrer, taş artar.
    4. Yanlış dizince "Tekrar dene!" çıkar, yanlış yerdeki harfler geri döner, doğrular kalır, "Göster" butonu belirir.
    5. İki kez yanlış dizince sıradaki doğru harf sarı çerçeveyle parlar.
    6. "Göster" → cevap kutulara dolar, "Cevap: …" yazar.
    7. 8 kelimeyi bitir → özet ekranı (XP, taş, seri). "Bir tur daha" yeni tur başlatır.
    8. Uzun kelimelerde (ör. "watermelon") kutular iki satıra sığıyor mu, küçük telefonda taşma var mı?
    9. Yetişkin profilinde koyu moda al: kutular ve harfler okunur kalır.
- [x] **LNG-20** CİHAZ — Oyun: Cümle kurma (kelime blokları sürükle-bırak). Önkoşul: LNG-7.
  - ✅ Ana ekranda "Cümle kurma" (7–12 ve yetişkin). Türkçe cümle gösterilir, İngilizcesi kelime bloklarından kurulur: blok sürüklenir ya da dokunulur. Cevap alanının yakınına bırakılan blok yerine oturur. 6 cümlelik tur, tekrar kutularına ve XP/taş/seriye bağlı. Mantık `src/features/games/sentence-builder/`, sürükleme `src/components/DraggableBlock.tsx`.
  - Kararlar (gece çalışması, Furkan'a sorulmadan): sürükleme React Native'in kendi PanResponder'ı ile (yeni yerel paket yok → yeni derleme gerekmez; gesture-handler package.json'da değil). Yetişkine 2 şaşırtmaca kelime + "Kontrol et"; çocukta şaşırtmaca yok, cümle tamamlanınca otomatik kontrol. Eşdeğer söylenişler (`alt`) doğru sayılır. Yanlışta doğru başlangıç kalır; 2 yanlıştan sonra sıradaki kelime parlar; 1 yanlıştan sonra "Göster". Puan harf dizmeyle aynı.
  - Derleme: yeni yerel paket yok; Metro'yu `--clear` ile yeniden başlat.
  - Cihazda nasıl test edilir:
    1. 7–12 profiliyle "Cümle kurma" → Türkçe cümle okunur; altında kesikli çizgili boş alan ve karışık kelimeler.
    2. Bir kelimeyi **parmakla sürükleyip** boş alana bırak → yerine oturur. Alanın biraz dışına bırak → yine oturur. Uzağa bırak → yaylanarak geri döner.
    3. Kelimelere dokunarak da ekle; cümledeki bir kelimeye dokununca geri çıkar.
    4. Cümleyi doğru kur → alan yeşillenir, "Aferin!", İngilizce cümle sesli okunur, telefon titrer.
    5. Yanlış sırayla kur → "Tekrar dene!", doğru başlangıç kalır, "Göster" çıkar. İki yanlıştan sonra sıradaki kelime sarı çerçeveyle parlar.
    6. Yetişkin profilinde: 2 fazla kelime var, cümle dolunca "Kontrol et"e basman gerekir.
    7. 6 cümleyi bitir → özet ekranı.
    8. Sürüklerken ekran kayıyor mu, blok parmağı takip ediyor mu (iOS ve Android)? Uzun cümlede bloklar iki satıra sığıyor mu?
- [x] **LNG-21** CİHAZ — Nehir boyunca bölüm haritası (Skia). Önkoşul: LNG-11.
  - ✅ 7–12 ve yetişkin profillerinde ana ekran artık nehir haritası: seviyeler nehir boyunca taşlar (tamamlanan yeşil ve tikli, şu anki büyük ve öğrenme halkalı, kilitliler silik, içeriği henüz yazılmamışlar kesikli çizgili). Üstte taş ve seri; altta üç oyun butonu. Taslak görsel: `docs/art-direction/river-map-preview.png`.
  - ✅ Seviye ilerlemesi: şu anki seviyenin kelimelerinin %80'i tekrar kutusu 3+'ya ulaşınca tur sonunda bir sonraki seviye açılır (+10 taş, "Seviye atlama" rozeti, özet ekranında "Yeni seviye açıldı"). Üç oyun ortak `src/features/games/finishRound.ts`'i kullanıyor.
  - Düzeltme: bir seviyeye geçmek (ve haritada açık görünmesi) için seviye testiyle aynı ölçüt: en az 20 kavram (`MIN_LEVEL_CONCEPTS`). Önceden 1 kavram yetiyordu ve B1'deki 2 örnek kavram yüzünden A2'yi bitiren yetişkin neredeyse boş bir B1'e geçerdi.
  - Kararlar (gece çalışması): Skia yerine kurulu olan `react-native-svg` (Skia yeni yerel paket ve yeni derleme isterdi). Eşik %80 (`LEVEL_DONE_MASTERY`). Tamamlanan seviyeler tekrar oynanmıyor (kelimeleri aralıklı tekrarla zaten geri geliyor). 2–7 yaş ana ekranı değişmedi (LNG-33).
  - Derleme: yeni yerel paket yok.
  - Cihazda nasıl test edilir:
    1. 7–12 profiliyle aç → "Merhaba …", altında taş ve seri, ortada kıvrımlı nehir ve 10 taş; şu anki seviye pembe ve halkalı, öncekiler yeşil tikli, 4–10 silik ve kesikli (içerik yok).
    2. Harita uzunsa aşağı kaydır; alttaki üç buton sabit kalıyor mu?
    3. Bir tur oyna ve dön → halka ve taş sayısı güncellenmiş olmalı.
    4. Yetişkin profilinde koyu moda al → harita koyu temada okunur kalıyor mu?
    5. VoiceOver/TalkBack açıkken taşlara dokun → "L2: şu anki seviye, %35 öğrenildi" gibi okunmalı.
    6. (Uzun) Bir seviyenin kelimelerini öğrenince tur sonunda "Yeni seviye açıldı" çıkmalı ve haritada bir sonraki taş pembe olmalı.
- [x] **LNG-22** CİHAZ — Oyun hissi paketi: doğru/yanlış animasyonları, haptics, ses efektleri (`game-feel` skill). Önkoşul: LNG-18.
  - ✅ Ses efektleri (doğru, yanlış, 3/5/10'lu seri, tur sonu, seviye atlama, çocuk temasında dokunma "tık"ı) `scripts/generate-sounds.mjs` ile sentezlendi → `assets/audio/sfx/` (lisans derdi yok, ~150 KB). Çalma `src/lib/sound.ts` (expo-audio), titreşim + ses tek yerden `src/lib/feedback.ts`.
  - ✅ Animasyonlar (`src/components/Motion.tsx`): yanlışta 3 salınımlı sallanma, doğruda zıplama, taş sayacı artınca sıçrama; hatasız turda ve seviye atlamada konfeti (`Confetti.tsx`, 24 parça). "Hareketi azalt" açıkken hepsi kapalı.
  - ✅ 3, 5 ve 10 doğru üst üste: geri bildirimde "3 doğru üst üste!" + yükselen arpej + orta titreşim. Ses ve titreşim ayarı `settings.v1`'de (varsayılan açık; ayar ekranı yok, LNG-26 ile birlikte).
  - Kararlar (gece çalışması): iOS'ta sessiz moddayken ses çalmaz; yetişkin temasında dokunma sesi yok, yalnızca titreşim. expo-audio yalnızca ses çalmak için, mikrofon izni eklenmedi.
  - ⚠️ **Derleme: YENİ yerel paket var (`expo-audio`) → sesleri duymak için yeni geliştirici derlemesi gerekir** (`npx eas-cli@latest build --profile development --platform ios` / `android`). Eski derlemede uygulama çökmez; yalnızca ses çıkmaz, titreşim ve animasyonlar çalışır.
  - Cihazda nasıl test edilir (yeni derlemeyle):
    1. Çoktan seçmelide doğru şık: kart zıplar, yükselen iki nota, başarı titreşimi, taş ikonu sıçrar.
    2. Yanlış şık: senin kartın sağa sola sallanır, yumuşak alçalan ton, hafif titreşim (alarm gibi değil).
    3. Üst üste 3 doğru: "Aferin! 3 doğru üst üste!" + üç notalık arpej; 5 ve 10'da daha parlak.
    4. Harf dizme/cümle kurma: yanlışta kutular/cümle alanı sallanır, doğruda zıplar.
    5. Hatasız tur sonu: konfeti yağar + kısa fanfar. Seviye atlamada daha uzun fanfar.
    6. 7–12 profilinde butonlara dokununca hafif "tık" sesi; yetişkinde ses yok.
    7. iPhone sessiz moddayken hiç ses çıkmamalı; titreşim olmalı.
    8. Ayarlar → Erişilebilirlik → Hareketi Azalt açık: sallanma, zıplama ve konfeti olmamalı.
    9. Düşük seviye bir Android'de konfeti sırasında takılma var mı?

## Faz 4 — Abonelik

- [x] **LNG-23** FURKAN — App Store Connect + Play Console ürünleri; RevenueCat hesabı ve anahtarları; fiyatlar.
  - ✅ iOS (2026-11-11): App Store Connect'te uygulama kaydı, Paid Apps sözleşmesi + banka + vergi, abonelik grubu "LINGOYUN Aile" içinde `lingoyun.family_monthly` (1 ay) ve `lingoyun.family_yearly` (1 yıl), 0 TL tüketilemez `lingoyun.trial_7_days`. Aile Paylaşımı kapalı. AB (DSA tacir beyanı) şimdilik yok.
  - ✅ RevenueCat: proje LINGOYUN, uygulama `LINGOYUN iOS` (In-App Purchase Key bağlı), entitlement `family` = aylık + yıllık (deneme ürünü bağlı DEĞİL), offering `default` = `$rc_monthly` + `$rc_annual`. Sandbox test hesabı açıldı.
  - Kalan: Android ürünleri ve RevenueCat Android anahtarı (Android cihaz olunca). Fiyatlar App Store Connect'te.
- [x] **LNG-24** BULUT — Deneme/entitlement mantığı (saf fonksiyon + test): deneme başlangıcı, kalan gün, süre doldu, abone. Önkoşul: LNG-1.
  - `src/features/subscription/access.ts`: `accessState` → `subscribed` / `trial` (kalan gün, bitmek üzere uyarısı ≤ 2 gün) / `trialEnded` / `notStarted`; `canPlay`. Deneme tam 7×24 saat; abonelik her durumda önce gelir. Saat geri alınarak deneme uzatılamaz (`lastSeenAt`). Deneme bir kez başlar. iOS'ta başlangıç App Store'daki 0 TL ürünün satın alma tarihi, Android'de yerel kayıt (`resolveTrialStart`). Kayıt: `src/storage/trial.ts` (`trial.v1`, cihaz geneli).
- [x] **LNG-25** CİHAZ — RevenueCat entegrasyonu, paywall ekranı, satın al / geri yükle, kilit. Önkoşul: LNG-23, LNG-24.
  - ✅ Furkan cihazda onayladı (2026-11-13): sandbox ile deneme ve abonelik, paywall fiyatları. LNG-32, 33, 34 ve ebeveyn kapısı değişikliği de cihazda onaylandı; hepsi main'e alındı.
  - ✅ `react-native-purchases` (yerel paket: **yeni derleme gerekir**). Bağlantı `src/lib/purchases.ts` (iOS anahtarı kodda; Android anahtarı yok, Android'de deneme yerel tutulur). Mağazanın son cevabı cihazda saklanır (`subscription.v1`): internetsiz açılışta bilinen durum kullanılır, süresi geçmiş abonelik güvenilmez. Saf mantık `src/features/subscription/store.ts`.
  - ✅ Paywall (`/paywall`, ebeveyn kapısının arkasında): 7 gün ücretsiz deneme (iOS'ta 0 TL ürün satın alınır), yıllık / aylık paket (fiyat mağazadan, yıllıkta "%X tasarruf"), satın alımları geri yükle, yenileme metni (iOS ve Android ayrı), Kullanım Koşulları (Apple standart EULA) ve Gizlilik Politikası bağlantısı.
  - ✅ Seviye sonucundan sonra deneme/abonelik yoksa paywall açılır. Ana ekran kilitlenir: çocuğa "bir yetişkinden yardım iste", yetişkine "Paketleri gör". Denemenin son 2 gününde ana ekranda uyarı. Ayarlarda abonelik durumu, "Paketleri gör" / "Aboneliği yönet". 2–7 yaş ana ekranı henüz "yakında" olduğu için kilitlenmiyor.
  - Furkan: Gizlilik bağlantısı GitHub Pages'te yayımlanınca çalışır (`store/README.md`); App Review bu bağlantıyı açar.
  - Cihazda nasıl test edilir (yeni iOS geliştirici derlemesiyle):
    1. iPhone → Ayarlar → App Store → en altta **Sandbox Hesabı** → LNG-23'te açılan test hesabıyla giriş yap (gerçek Apple ID'den çıkmak gerekmez).
    2. Uygulamayı silip yeniden kur (ya da yeni bir yetişkin profiliyle) → seviye testini bitir → "Başla" → ebeveyn kapısı → paywall: yıllık ve aylık fiyatlar TL görünüyor mu, yıllıkta "%X tasarruf" doğru mu?
    3. "Ücretsiz denemeyi başlat" → Apple'ın satın alma penceresi 0 TL ile açılır ("Sandbox" yazar) → onayla → harita açılır. Ayarlar → Abonelik: "Ücretsiz deneme: 7 gün kaldı".
    4. Uygulamayı silip yeniden kur, aynı profili oluştur: deneme sıfırlanmamalı (Apple hesabına bağlı) — ayarlarda yine kalan gün görünmeli.
    5. Ayarlar → "Paketleri gör" → yıllık seç → "Abone ol" → sandbox onayı → ana ekran. Ayarlar: "Aile aboneliği etkin", yenileme tarihi (sandbox'ta 1 yıl ≈ 1 saat sürer).
    6. "Aboneliği yönet" → Apple'ın abonelik sayfası açılır.
    7. Satın alma penceresinde "İptal" → paywall'da kalır, hata yazmaz. "Satın alımları geri yükle" → abonelik varsa ana ekrana döner.
    8. Uçak modunda uygulamayı aç: abone/deneme durumu korunur, kilit düşmez.
    9. 7–12 yaş profilinde kilit ekranı: "Ebeveyn: paketleri gör" → çarpma sorusu çıkmadan paket görünmemeli.
- [x] **LNG-26** CİHAZ — Ebeveyn kapısı (satın alma + ayarlar önünde). Önkoşul: LNG-1.
  - Furkan'ın kararı (2026-11-13): kapı yalnızca çocuk profili (2–7, 7–12) oynarken. Yetişkin profilinde ayarlar, "Çocuğum için profil oluştur" ve paketler doğrudan açılır (`needsParentGate`, `src/lib/useGateAllowed.ts`). Bilinen sınır: "Kim oynuyor?" kapısız olduğundan çocuk yetişkin profilini seçerse ayarlara girebilir.
  - Cihazda: yetişkin profilinde ayarlar ve "Paketleri gör" sorusuz açılmalı; 7–12 ve 2–7 profillerinde çarpma sorusu çıkmalı.
  - ✅ Ana ekranda sağ üstte ayar butonu → ebeveyn kapısı: çarpma işlemi **yazıyla** sorulur ("yedi çarpı sekiz", çarpanlar 3–9, her seferinde rastgele), cevap ekrandaki rakam tuşlarıyla girilir; yanlışta yeni soru. Geçince 1 dakika açık kalır (yalnızca bellekte), Ayarlar adresine doğrudan gidilirse kapıya yönlendirilir. Mantık `src/features/parental-gate/`.
  - ✅ Yeni **Ayarlar** ekranı (kapının arkasında): ses efektleri ve titreşim anahtarları; profiller arasında geçiş ve iki adımlı onaylı profil silme (ilerlemesiyle birlikte).
  - Kararlar (gece çalışması): satın alma ekranı (LNG-25) henüz yok; o geldiğinde aynı kapı kullanılacak (`/parent-gate`, geçince `isGateOpen()`). Profil ekleme ayarlara konmadı (onboarding'den).
  - Derleme: yeni yerel paket yok.
  - Cihazda nasıl test edilir:
    1. Ana ekranda sağ üstteki kaydırıcı ikonuna dokun → "Ebeveyn kontrolü", yazıyla çarpma sorusu ve rakam tuşları.
    2. Yanlış sonucu yaz → ekran sallanır, "Olmadı. Yeni bir soru geldi.", soru değişir.
    3. Doğru sonucu yaz → Ayarlar açılır.
    4. "Ses efektleri"ni kapat → oyunda ses çıkmaz; "Titreşim"i kapat → titreşim olmaz. Uygulamayı kapatıp aç: ayar kalıcı.
    5. İki profil varken "Bu profile geç" → ana ekran o profile göre (tema dahil) değişir.
    6. "Sil: …" → onay sorusu; "Vazgeç" bir şey silmez; "Evet, sil" profili ve ilerlemesini siler.
    7. 2–7 profilinde de sağ üstte ayar butonu var.

## Faz 5 — Yetişkin

- [x] **LNG-27** CİHAZ — Serbest yazma oyunu (cümle çevirisi). Önkoşul: LNG-8.
  - ✅ Yetişkin ana ekranında "Yazarak çevir": Türkçe kelime ya da cümle gösterilir, İngilizcesi klavyeyle yazılır. LNG-8 cevap kontrolü: doğru / neredeyse doğru (özel harf) / yazım hatası / yanlış; eş anlamlılar ve a/an/the kabul; içerikte bilinen başka bir kelime asla yazım hatası sayılmaz. "Bilmiyorum" butonu. 8 maddelik tur, tekrar kutuları, XP/taş/seri, seviye atlama. Mantık `src/features/games/free-typing/`.
  - Kararlar (gece çalışması): yalnızca yetişkin (7–12 için klavyeyle cümle yazmak ağır). Yön her zaman Türkçe → İngilizce (üretim pratiği). Puan: doğru = tam, neredeyse/yazım hatası = `hard` (kutuda kalır, 5 XP), yanlış/bilmiyorum = `again`. Doğru yazılış her durumda gösterilir ve sesli okunur.
  - Derleme: yeni yerel paket yok.
  - Cihazda nasıl test edilir:
    1. Yetişkin profiliyle "Yazarak çevir" → Türkçe kelime/cümle, altında klavye açık bir yazı kutusu.
    2. Doğru yaz (büyük harf, nokta önemsiz) → kutu yeşil, "Doğru", İngilizce sesli okunur.
    3. Bir harf eksik yaz (ör. "watermelom") → "Küçük bir yazım hatası. Doğrusu: watermelon".
    4. Saçma bir şey yaz → kutu sallanır, "Doğrusu: …".
    5. "Bilmiyorum" → cevap gösterilir.
    6. Cümlelerde kutu çok satırlı; klavyedeki "Bitti" tuşu kontrol eder.
    7. Klavye açıkken alttaki butonlar klavyenin üstünde kalıyor mu (iOS ve Android)?
    8. 7–12 profilinde bu buton görünmez.
- [x] **LNG-28** CİHAZ — Deyimler ve yanıltıcı benzer kelimeler modu.
  - ✅ Yetişkin ana ekranında "Deyimler ve tuzaklar": çoktan seçmeli oyun, kursun bütün deyimleri (30) ve yanıltıcı benzer kelimeleri (15) İngilizce → Türkçe sorar; her yanıltıcı kelimede "tuzak" şık (ör. magazine → **mağaza**) her zaman seçeneklerdedir, cevaptan sonra kısa açıklama gösterilir.
  - ✅ İçerik: 15 yanıltıcı benzer kelime (`src/content/concepts/false_friends.json`, A2 ünitesi) — sympathetic, actual, sensible, pathetic, fabric, library, magazine, agenda, pension, smoking, parole, nervous, realize, recipe, billion. İçerik şemasına `trap` ve `note` alanları eklendi (doğrulayıcı: tuzak doğru cevaplardan biri olamaz).
  - Kararlar (gece çalışması, **Furkan kontrol etmeli**): liste ve açıklamalar benim; "pathetic → patetik" ve "realize → gerçekleştirmek" `review: true` (ince anlam farkı). Yanıltıcı kelimeler A2'ye kondu (A2 seviye atlaması için öğrenilmesi gereken kelime sayısı biraz arttı). Bu mod seviyeden bağımsız: bütün deyimler açık.
  - Derleme: yeni yerel paket yok.
  - Cihazda nasıl test edilir:
    1. Yetişkin profiliyle "Deyimler ve tuzaklar" → İngilizce deyim/kelime, Türkçe şıklar.
    2. "magazine", "library" gibi bir soru gelince şıklarda tuzak (mağaza, kitapçı) var mı?
    3. Cevapladıktan sonra geri bildirim kutusunda açıklama ikinci satırda görünüyor mu, uzun açıklama taşmadan sığıyor mu?
    4. Normal "Oyna" turunda da A2 seviyesindeysen yanıltıcı kelimeler çıkabilir; Türkçe → İngilizce sorulduğunda açıklama yine görünmeli.
- [x] **LNG-29** CİHAZ — Günlük tekrar ekranı (SRS kuyruğu). Önkoşul: LNG-9.
  - ✅ Haritada (7–12 ve yetişkin) tekrar kartı: "Bugün N kelime tekrar bekliyor" + "Tekrar et"; yoksa "Bugün tekrar yok, harika!". "Tekrar et" yalnızca bugün vadesi gelen kelimeleri (bütün seviyelerden, en çok geciken önce, en fazla 10) çoktan seçmeliyle sorar; şıklar az ise mevcut seviyeden tamamlanır. Mantık `dailyReviewConcepts` (`src/features/games/multiple-choice/round.ts`).
  - Derleme: yeni yerel paket yok.
  - Cihazda nasıl test edilir:
    1. Birkaç kelimeyi yanlış cevapla, ana ekrana dön → "Bugün N kelime tekrar bekliyor".
    2. "Tekrar et" → yalnızca o kelimeler sorulur (soru sayısı N, en fazla 10).
    3. Hepsini doğru cevapla, ana ekrana dön → sayı azalır ya da "Bugün tekrar yok, harika!".
    4. Ertesi gün aç → bir gün önce doğru cevapladığın yeni kelimeler (1 günlük kutu) tekrar listesinde.
- [x] **LNG-40** BULUT — İçeriği kolayca genişletme: her tema tek bir metin dosyası (`content-src/themes/<tür>/NN-<ad>.txt`, `id|en|enAlts|tr|trAlts` satırları, `@words` ve `@sentences 1|2|3` bölümleri), `npm run content` hepsini JSON'lara dağıtır ve içerik testlerini çalıştırır. Biçim dosyanın başında açıklanmıştır (`scripts/content.mjs`). LNG-45 ile yapıldı.
- [x] **LNG-41** BULUT — Durum temalı içerik denemesi ("Restoranda"), `ceviri-editoru` agent'ı, B1'e içeriksiz geçiş hatası. Furkan telefonda gördükten sonra yapı LNG-43'e dönüştü: restoran artık yoldaki iki temadan biri (9. ve 26. tema, katmanlı cümleler).
- [x] **LNG-43** CİHAZ — Öğrenme yolu: 1'den başlayan numaralı temalar, her temada 5 basamak (4 öğretim + sınav), 15 soru (10 kelime, 3 dinleme, 2 cümle), 3 can ve "Hatalarını tekrar et" ile can kazanma, 0,5× yavaş dinleme, uyarlamalı zorluk (ayarlardan da seçilebilir). Seviye testi temaya yerleştirir. Ayrıntı: `docs/game-design.md` › Öğrenme yolu.
  - ✅ Mevcut içerik temalara gruplandı (yetişkin 27, 7–12 yaş 14 tema). Ana ekran sadeleşti: harita + günlük tekrar + "Devam et". Harf dizme ve cümle kurma basamakların içinde; eski oyun ekranları ana ekrandan kaldırıldı ama dosyaları duruyor.
  - Eksik (LNG-42): temaların çoğunda 40 kelime ve 8 kolay cümle yok, bazılarında hiç cümle yok. Basamaklar eksiği aynı banttaki cümlelerle dolduruyor, yani cümleler her zaman temaya uymayabilir. Orta ve zor cümle katmanı yalnızca restoran temalarında var.
  - Derleme: yeni yerel paket yok, son derleme yeterli. Metro'yu `--clear` ile yeniden başlat.
  - Cihazda nasıl test edilir:
    1. Ana ekranda harita 1, 2, 3… diye numaralı; hiçbir yerde A1/L1 yazmıyor. Bir taşa dokun → altta temanın adı çıkar ("2. Kişiler ve aile"); kilitliyse "henüz gelmedin" der.
    2. "Devam et" → basamak açılır: sağ üstte 3 kalp, "Soru 1 / 15".
    3. 3 dinleme sorusunda kelime yazılmaz, kendiliğinden okunur. Kaplumbağa düğmesi yarı hızda okur.
    4. Son 2 soru cümle kurma; bloklarla kur (yetişkinde "Kontrol et").
    5. Yanlış cevapta kalp sallanıp boşalır. 3. hatada "Canların bitti" ekranı gelir → "Hatalarını tekrar et" → her doğru cevap bir kalp doldurur → 3 kalpte basamak baştan başlar.
    6. 2 veya daha az hatayla 15 soruyu bitir → "Geçtin" ekranı; "Sonraki basamak" → 2. basamak önce önceki hatalarını sorar.
    7. Haritadaki açık bir temayı aç → 5 basamak; tamamlananlarda tik var, sıradaki vurgulu, ilerisi kilitli. 5. basamak "Sınav"; geçince sonraki tema açılır.
    8. Ayarlar (ebeveyn kapısı) → "Zorluk": Kolay / Orta / Zor. Restoran temasında zor seçilince cümleler uzar.
    9. Yeni profil + seviye testi → sonuç ekranında "N. temadan başlıyorsun: …".
    10. 7–12 yaş profiliyle aynı akış (sorular kendiliğinden okunur, cümle dolunca otomatik kontrol).
- [x] **LNG-44** CİHAZ — Ebeveyn kontrolünden çocuk profili oluşturma ve "Kim oynuyor?" (Furkan'ın isteği). Ayarlar (kapının arkasında) → "Çocuğum için profil oluştur" → 2–7 veya 7–12 yaş → takma ad → "Şimdi … ile oyna" ya da "Ayarlara dön". Ebeveyn kendi profilinde kalır. 7–12 profili ilk açılışta kendi beyanı ve seviye testinden geçer. Birden fazla profil varsa her açılışta kapısız "Kim oynuyor?" ekranı çıkar; ayarlarda (kapının arkasında) "Profil değiştir" düğmesi var. Sınır 3 profil.
  - Derleme: yeni yerel paket yok. Metro'yu `--clear` ile yeniden başlat.
  - Cihazda nasıl test edilir:
    1. Ana ekranda ayarlar düğmesi → çarpma sorusu → Ayarlar → "Çocuğum için profil oluştur".
    2. "7–12 yaş" seç → takma ad yaz → "Profili oluştur" → "<ad> hazır!" ekranı. "Ayarlara dön" → profil listede, sen hâlâ kendi profilindesin.
    3. Uygulamayı tamamen kapatıp aç → "Kim oynuyor?" çıkar. Çocuğu seç → "Ne kadar İngilizce biliyorsun?" ve seviye testi gelir.
    4. Ayarlar → "Profil değiştir" → "Kim oynuyor?" → kendi profiline geri dön. Ana ekranda profil düğmesi yok.
    5. Bir 2–7 yaş profili ekle ve "Şimdi … ile oyna" de → resimli ana ekran. 3 profil olunca ayarlarda oluştur düğmesi yerine sınır yazısı çıkar.
    6. Kartlar küçük bir çocuğun rahatça dokunabileceği büyüklükte mi?
- [x] **LNG-45** CİHAZ — Tekrarsız, bol içerik ve yazarak cevap (Furkan'ın isteği).
  - ✅ Basamak 18 soru: 10 kelime + 3 yazma (7–12 yaşta harf dizme) + 3 dinleme + 2 cümle; sınavda 5 yazma ve 3 cümle. Yazım hatası can götürmez.
  - ✅ İçerik aracı (LNG-40).
  - ✅ İçerik: yetişkin 27 tema, 7–12 yaş 20 tema (L13'te onaylanan kelimelerle 6 yeni tema). Her temada 40 kelime ve her zorlukta en az 8 cümle; hiçbir kavram iki temada değil. Doğrulayıcı bunları artık hata sayar; bir test hiçbir basamağın önceki basamağın kelimesini sormadığını denetler.
  - ✅ Her parti `ceviri-editoru` denetiminden geçti, HATA ve DÜZELT bulguları uygulandı. Raporlar `docs/content/reviews/`.
  - ✅ Furkan cihazda onayladı (2026-11-10), main'e alındı.
  - Furkan'ın kararları: karakter adları çocuk cümlelerinde kalır (ikiz kuzen cümlesi düzeltilir); "teacher" hitabı ABD'ye uygun hitapla değişir; "cake/pasta" tuzağı ve seviye üstü cümleler olduğu gibi kalır; başka kavramın cevabı ve liste sırası LNG-46'da.
- [x] **LNG-46** BULUT — Cevap kontrolü inceliği ve içerik kararları (Furkan'ın kararları, LNG-45 denetimlerinden).
  - ✅ Yazarak çevirmede, aynı Türkçeyi paylaşan başka bir kavramın cevabı (ör. "hiç" sorusuna "ever" yerine "never") can götürmez: "Bu da doğru bir kelime, ama aranan: X" der, `hard` sayılır (`otherWord`). Adım ekranı ve serbest yazma aynı kontrolü kullanır.
  - ✅ Sırası serbest listeler: tema dosyasında cümle satırına isteğe bağlı 6. alan (`…|eggs;milk;bread;cheese`). Cümle kurma ve yazmada öğelerin her sırası doğru sayılır. Otomatik değil, çünkü bazı listeler bir sıra anlatır ("kalkarım, duş alırım, giyinirim"). 8 cümle işaretlendi; doğrulayıcı öğelerin metinde geçtiğini denetler.
  - ✅ İçerik: ikiz kuzen cümlesi Elif ve Deniz oldu; "teacher" hitabı "Ms. Brown" (Türkçesi "Brown Öğretmen").
  - Cihazda nasıl test edilir (isteğe bağlı): yetişkin "Zaman ve bağlaçlar" temasında "hiç" sorusuna "never" yaz → kalp gitmez, "aranan: ever" yazar. "Yiyecek ve içecek" temasında alışveriş listesi cümlesini farklı sırayla kur → doğru sayılır.
  - Derleme: yeni yerel paket yok. Metro'yu `--clear` ile yeniden başlat.
  - Cihazda nasıl test edilir:
    1. Bir temayı aç, 1'den 4'e basamakları oyna: her basamakta 10 yeni kelime, öncekilerin tekrarı yok (yalnızca önceki hataların).
    2. "Soru 1 / 18"; 10 kelimeden sonra 3 yazma sorusu: klavye açıkken "Kontrol et" / "Devam" görünür kalıyor mu?
    3. Küçük bir yazım hatası (ör. "restorant") kalp götürmez, doğru yazılışı gösterir; yanlış cevap ve "Bilmiyorum" 1 kalp götürür.
    4. 7–12 yaş profilinde yazma soruları harf dizme olarak gelir.
    5. Ayarlar → Zorluk "Zor": cümleler uzar (her temada).
    6. Zorluk yeterli mi, içerik doğal mı? Garip bulduğun cümleyi not et.
- [x] **LNG-42** BULUT — İçerik üretimi yeni yapıya göre. LNG-45 ile birleşti ve onunla yapıldı.

## Faz 6 — 2–7 yaş (Zeynep, Nehir, Kerem)

- [x] **LNG-30** BULUT — Karakter tasarım dokümanı (`docs/characters.md`): kişilik, renk, siluet, ifade sayfası tarifi. Önkoşul: LNG-4.
  - Zeynep (7, uzun dalgalı saç + çiçekli toka, limon sarısı; soruları sorar), Nehir (5–6, iki topuz, nane yeşili tulum; haritada rehber ve kutlama), Kerem (4, ters kep + gözlük, ahududu; yanlışta cesaret verir). İfade listesi, Rive durum makinesi, görsel üretim istemleri, siluet taslağı (`docs/art-direction/characters-lineup.png`). Gece çalışmasında Furkan'a sorulmadan yazıldı; LNG-31'den önce gözden geçirilmeli.
- [x] **LNG-31** BULUT + FURKAN — Karakterler ve 300 kelime resmi. Furkan'ın kararı (2026-11-12): hepsi **kodla SVG**, kil (Oyun Hamuru) stilinde; karakter hareketleri Reanimated ile (Rive kullanılmıyor). Grafiker agent partiler hâlinde çizer, Furkan PNG önizlemelerden onaylar. 2–7 yaş ilk sürümle birlikte çıkacak.
  - ✅ Pilot onaylandı (Furkan, 2026-11-12): 3 karakter × 4 ifade (`src/components/art/characters/`), kil yapı taşları (`src/components/art/clay.tsx`), resim paleti (`src/theme/artPalette.ts`), kayıt `wordArt(imageId)` (`src/components/art/words/index.ts`).
  - ✅ **300 / 300 kelime resmi çizildi ve kayda bağlandı** (2026-11-12). Önizlemeler `docs/art-direction/mini-batch-1…11.png`: 1–8 önceki partiler, 9 taşıtlar (23), 10 renkler (11) ve şekiller (7), 10b sayılar 1–20, 11 vücut (25). Kalıcı test: 2–7 yaşın her kelimesinin resmi olmalı (`src/components/art/words/index.test.tsx`), aynı resim iki partide tanımlanamaz.
  - Kararlar: vücut = Nehir üzerinde ahududu vurgu halkası (yüz parçaları portre çerçevede); karakter üzerinde seçilemeyen ya da görünmeyen parmak, ayak parmağı, diş, dil ve sırt yakın plan ayrı çizildi (sırt: arkadan Nehir, çapraz tulum askıları). Kaşlar çizimde yalnızca üzgün ifadede olduğu için kaş resminde sakin kaşlar halka katmanında çiziliyor. Sayılar = kil rakam + o kadar boncuk (10'dan sonra onluk çubuk); zıt anlamlılar = ikisi yan yana, sorulan renkli, karşıtı soluk.
  - Önizleme aracı (geçici, repoda yok): `react-native-svg` düz SVG etiketlerine eşlenip `react-dom/server` ile SVG'ye çevrilir, Chromium ile resme dönüştürülür.
  - ✅ Furkan onayladı (2026-11-12): 9–11. partiler ve varsayılan küçük seçimler (biber, peynir, et, deve, ay, şapka, çanta, mayo) olduğu gibi; tekne değişmiyor.
- [x] **LNG-32** BULUT + FURKAN — Sesler: 300 kelime × EN + TR ve karakter yönergeleri. Furkan'ın kararı: kaliteli bir TTS servisiyle bir kez üretilip uygulamaya gömülür (internetsiz çalışır). Servis hesabını ve anahtarı Furkan açar; anahtar yalnızca `.env`'de durur, uygulamaya girmez.
  - ✅ Azure Speech (Free F0, East US; West Europe yeni müşteri almıyor) Furkan'ın hesabında; anahtar yalnızca `.env`'de.
  - ✅ Sesler Furkan'ın seçimi (2026-11-13): Türkçe **Emel**, İngilizce **Jenny**, %10 yavaş. `npm run voices` eksik sesleri kaydeder (`--force` hepsini yeniden): 300 kelimenin İngilizcesi + 2–7 ekranlarının yönergeleri (TR ve EN: Hangisi?, Sepete koy:, Eşlerini bul!, Aferin!, Hadi bir daha!, Harika! Yarın görüşürüz., dünya adları, albüm, "2/3 yeni çıkartma!"). Dosyalar `assets/audio/voice/<dil>/`, dizin `src/lib/voiceClips.ts` (üretilir).
  - ✅ `speak` / `speakSequence` önce kayıtlı sesi çalar (expo-audio, sırayla), kaydı olmayan metni telefonun sesi okur. Karşılama sesli olarak adsız ("Merhaba! Hangi dünyaya gidelim?"); ad ekranda yazar.
  - Türkçe kelime sesleri üretilmedi: 2–7 modunda kelimeler yalnızca İngilizce söyleniyor.
  - Cihazda nasıl test edilir (yeni derleme gerekmez; ses dosyaları JS paketiyle gelir):
    1. Sessiz mod kapalı, 2–7 profili → ana ekranda Emel'in sesiyle "Merhaba! Hangi dünyaya gidelim?".
    2. Bir dünya → "Hangisi?" (Emel) ardından kelime (Jenny); doğruda "Aferin!" + kelime; yanlışta "Hadi bir daha!" + kelime. Parçalar üst üste binmemeli, arada uzun boşluk olmamalı.
    3. "Tekrar dinle" ve hafıza kartları: kelime Jenny'nin sesiyle.
    4. Hızlı hızlı farklı kartlara dokun → önceki ses kesilip yenisi başlamalı.
    5. Tur sonu ve albüm: "Harika! Yarın görüşürüz.", "3 yeni çıkartma!", dünya adları Emel'in sesiyle.
    6. Telefon dili İngilizce: yönergeler Jenny'nin sesiyle İngilizce.
- [x] **LNG-33** CİHAZ — Mini oyunlar: sesi duy → resmi bul, sürükle-bırak sepet, hafıza kartları. Önkoşul: LNG-13, LNG-31.
  - ✅ 2–7 yaş ana ekranı: Nehir selam verir ve sesli sorar ("Merhaba …! Hangi dünyaya gidelim?"); 6 büyük dünya kartı (hayvanlar, yiyecekler, renkler ve şekiller, vücudum, evim, doğa), kapak = dünyanın ilk kelimesinin resmi. Okuma gerekmez.
  - ✅ Oturum = 8 etkinlik (`src/features/games/mini/session.ts`): resmi bul ×3 (4 resim, 2×2), **kelimeyi bul ×2**, sepet ×2 (3 resim; sürükle-bırak ya da dokun), hafıza ×1 (3 çift, 6 kart; açılan kartın kelimesi seslendirilir). Kelimeler aralıklı tekrar destesinden seçilir (önce vadesi gelenler).
  - ✅ Furkan'ın cihaz geri bildirimi (2026-11-13):
    - Oyun açılınca ilk soru sessiz kalıyordu (ana ekran odağı kaybedince oyunun sesini de kesiyordu). Artık her ekran yalnızca kendi sesini durdurur (`speakSequence` iptal fonksiyonu döndürür).
    - Yönergeler ("Hangisi?", "Sepete koy:", "Resmin adını bul!") oturumda yalnızca o türün ilk etkinliğinde; sonrakilerde yalnızca kelime.
    - Yeni oyun **kelimeyi bul**: üstte resim, altta 4 yazılı İngilizce kelime. İlk dokunuş kelimeyi okur ve işaretler, aynı kelimeye ikinci dokunuş cevap verir. Yanlışta "Hadi bir daha!" (kelime söylenmez, cevap olurdu); 2 yanlıştan sonra doğru kelime parlar.
  - ✅ Yönerge arayüz dilinde, ardından İngilizce kelime seslendirilir; "Tekrar dinle" butonu. Yanlışta ceza yok: kart sallanır ve solar, Kerem "Hadi bir daha!" der, kelime tekrar edilir; 2 yanlıştan sonra doğru resim limon rengiyle parlar. Doğruda "Aferin!" + kelime, zıplama, büyük "Devam" butonu (çocuk hızı belirler). Can, süre yok.
  - ✅ Çıkış basılı tutarak (0,7 sn): tek dokunuş bir şey yapmaz. Tur sonu: üç karakter sevinir, "Harika! Yarın görüşürüz." seslendirilir, hatasız turda konfeti; ilerleme, taş ve deste kaydedilir (hafıza kartları desteye yazılmaz, yalnızca tekrar).
  - ✅ İlk oturum ücretsiz (CLAUDE.md: mini'de paywall ilk oyundan sonra). Deneme/abonelik yoksa tur sonunda "Ebeveyn: paketleri gör" (ebeveyn kapısı arkasında), ana ekranda kilit ekranı.
  - Kararlar: Seslendirme şimdilik cihazın TTS'i (`expo-speech`); kayıtlı sesler LNG-32 ile gelecek (Azure anahtarı bekleniyor). Karakterler sesli konuşmuyor, yalnızca ifadeleri değişiyor. Sepet ve hafıza kartı çizimleri kodla (SVG).
  - Derleme: yeni yerel paket yok; mevcut geliştirici derlemesi yeterli (`npx expo start` ile JS güncellemesi).
  - Cihazda nasıl test edilir:
    1. 2–7 yaş profiliyle aç → Nehir görünür, selamı sesli duyulur; altında 6 resimli kart. Ses kapalıysa (iPhone sessiz modu) TTS duyulmayabilir: sessiz modu kapat.
    2. Hayvanlar'a dokun → hiçbir şeye basmadan "Hangisi?" + İngilizce kelime duyulur; 4 resimden doğruya dokun → "Aferin!" + kelime, kart yeşil ve zıplar, "Devam" çıkar. Sonraki "resmi bul" sorularında yalnız kelime söylenir.
       2b. Kelimeyi bul: ilk seferde "Resmin adını bul!" duyulur. Bir kelimeye dokun → okunur ve kalın kenarla işaretlenir, cevap sayılmaz; başka kelimeye dokun → o okunur ve işaretlenir. İşaretli kelimeye tekrar dokun → cevap: doğruysa "Aferin!" + kelime; yanlışsa kart sallanır, "Hadi bir daha!" (doğru kelime söylenmez). Uzun kelimeler ("hot air balloon") kartta okunuyor mu?
       2c. Ana ekran ↔ dünya arasında hızlı git gel: sesler birbirini kesmemeli, karışmamalı.
    3. Yanlış resme dokun → kart sallanır ve solar, "Hadi bir daha!" duyulur; ikinci yanlıştan sonra doğru resim sarı parlar.
    4. Sepet etkinliğinde resmi parmakla sepete sürükle → sepete girer; sepetin dışına bırakınca yerine döner; dokunmak da işe yarar.
    5. Hafıza kartlarında iki farklı kart açınca ~1 sn sonra kapanır; eşleşen çift yeşil kalır; her açılışta kelime söylenir.
    6. 2–3 yaşındaki bir çocukla dene: kartlar parmağa yetecek kadar büyük mü, sürükleme zor mu, oturum (~5 dk) uzun mu?
    7. Çarpıya bir kez dokun → hiçbir şey olmamalı; basılı tut → ana ekrana döner.
    8. Deneme başlatılmamış yeni bir profille bir oturum bitir → tur sonunda "Ebeveyn: paketleri gör"; ana ekrana dönünce kilit ekranı. Butona basınca önce ebeveyn kapısı sorulmalı.
    9. VoiceOver/TalkBack açıkken resim kartları Türkçe adıyla, kapalı kartlar "Kapalı kart 1…6" diye okunmalı.
    10. Küçük ekranlı telefonda (iPhone SE) 2×2 resim ızgarası ve "Devam" butonu kaydırmadan sığıyor mu?
- [x] **LNG-34** CİHAZ — Çıkartma albümü (ödül). Önkoşul: LNG-33.
  - Not: LNG-33 cihazda onaylanmadan Furkan'ın isteğiyle başlandı (2026-11-12); `lng-33-mini-games` dalının üzerine `lng-34-sticker-album`.
  - ✅ Her kelime resmi bir çıkartma: 6 dünya = 6 sayfa × 50 yer. Biten her oturum **2 çıkartma**, hiç yanlışsız oturum **3** verir; önce o turda oynanan kelimeler, sonra aynı dünyanın eksikleri. Aynı çıkartma iki kez gelmez, hiçbir şey geri alınmaz. Mantık `src/features/games/mini/stickers.ts`, kayıt `stickers.v1.<profil>` (profil silinince silinir).
  - ✅ Tur sonu: yeni çıkartmalar zıplayarak görünür, "3 yeni çıkartma!" ve İngilizce kelimeleri seslendirilir.
  - ✅ Albüm ekranı (`/album`): ana ekranın sol üstündeki albüm düğmesi (ebeveyn kapısı yok; yalnızca kazanılanı gösterir). Üstte 6 dünya sekmesi (kapak resmi), altta 4'lü ızgara: kazanılan çıkartma yuvarlak, beyaz kenarlı, hafif eğik; boş yer kesikli daire. Çıkartmaya dokununca İngilizce kelime söylenir. Sayfa dolunca Nehir sevinir: "Sayfa doldu! Aferin!".
  - Kararlar (Furkan'a sorulmadan, değiştirilebilir): oturum başına 2 (+1) çıkartma → bir dünya yaklaşık 17–25 oturumda dolar; boş yerler gösteriliyor (koleksiyon hissi); çıkartmalar sürükleyip serbest yapıştırılmıyor, yerleri sabit.
  - Derleme: yeni yerel paket yok.
  - Cihazda nasıl test edilir:
    1. 2–7 yaş profiliyle bir oturum bitir → tur sonunda 2 ya da 3 çıkartma zıplayarak çıkmalı, "… yeni çıkartma!" ve kelimeler duyulmalı.
    2. Ana ekranda sol üstteki albüm düğmesine dokun → "Çıkartmalarına bakalım!" duyulmalı, oynadığın dünyanın sayfası açılmalı; kazandıkların yerinde, gerisi kesikli daire.
    3. Bir çıkartmaya dokun → İngilizce kelimesi söylenmeli.
    4. Üstteki dünya sekmelerine dokun → sayfa değişmeli, dünyanın adı söylenmeli; seçili sekme sarı ve kalın kenarlı.
    5. Aynı dünyayı tekrar oyna → yeni çıkartmalar öncekilerle aynı olmamalı.
    6. Uygulamayı kapatıp aç → çıkartmalar duruyor mu? Profili sil → yeni profilde albüm boş olmalı.
    7. Çocuk gözüyle: çıkartmalar yeterince büyük ve "kazanılmış" hissi veriyor mu? 50 yerli sayfa kaydırması sorun mu?
    8. Koyu ve açık sistem modunda çıkartmaların beyaz kenarı ve boş yerler görünüyor mu?

## Faz 7 — Yayın

- [x] **LNG-35** BULUT — Gizlilik politikası taslağı (KVKK, COPPA, GDPR-K), mağaza metinleri TR + EN.
  - Gizlilik politikası TR/EN: `docs/privacy/tr.html`, `docs/privacy/index.html` (hesap/reklam/izleme yok; profiller ve ilerleme cihazda; yalnız kişisel veri içermeyen Sentry çökme raporları ve RevenueCat abonelik doğrulaması çıkar; COPPA, GDPR madde 8, KVKK hakları). Mağaza metinleri `store/listings.json` (App Store + Play, TR/EN; karakter sınırları `store/listings.test.ts`). App Store gizlilik etiketleri `store/privacy-labels.md`, Play veri güvenliği + Aileler `store/data-safety.md`.
  - Furkan dolduracak (`store/README.md`): geliştirici adı, iletişim e-postası, yürürlük tarihi, GitHub Pages'i açıp gizlilik adresini metne yazmak. Gönderimden önce (LNG-37): iOS gizlilik manifesti ve Play'in Families SDK listesi kontrolü.
- [~] **LNG-36** BULUT — Mağaza ekran görüntüleri ve uygulama ikonu (grafiker agent).
  - ✅ Uygulama ikonu: nehri geçen üç hamur basamak taşı (limon, ahududu, gök mavisi) — bir dilden öbürüne geçiş; yazı yok, 29 px'de de okunur. Kaynak `assets/source/glyph.svg`, bütün boyutlar `scripts/generate-icons.mjs` ile (iOS 1024, Android uyarlanabilir + Android 13 tek renkli, açılış ekranı, favicon, Play 512). Açılış ekranı hamur rengi zeminle (`expo-splash-screen`).
  - ✅ Mağaza ekran görüntüsü çerçeveleme: `scripts/frame-screenshots.mjs` (App Store 1290×2796, Play 1080×1920; başlıklar `store/listings.json`'dan, DynaPuff). Başlık sınırı testte.
  - Kalan (cihaz): 6 ekran görüntüsünü TR ve EN telefonda almak — liste ve adımlar `store/README.md`. Play "feature graphic" (1024×500) henüz yok.
  - Cihazda nasıl test edilir: yeni derlemede ana ekrandaki ikon ve açılış ekranı yeni görselle mi; Android'de uzun basınca uyarlanabilir ikon dairede kesilmeden görünüyor mu; Android 13'te temalı ikon açıkken tek renkli ikon okunuyor mu.
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
- Karar (Furkan, LNG-41): içerik, durum temalarına göre yeniden kurulacak ve 10 katına çıkacak. Zorluklara göre A2 → C1 yayılacak. A1 şimdilik olduğu gibi kalıyor (Furkan onaylamalı: A1 de temalara taşınsın mı?). 7–12 yaşın payı henüz belirlenmedi.
- Çeviri denetimi (LNG-41, `ceviri-editoru`): rapor `docs/content/reviews/`. Anlamı tamamen yanlış çeviri çıkmadı; HATA ve DÜZELT önerileri uygulandı. Bu, yapay zekâ denetimidir; yayından önce bir insan editöre göstermek yine önerilir, `review: true` işaretleri bu yüzden duruyor.
- Kararlar (Furkan, çeviri denetiminden): `family.wife` ana metni "eş". `false_friend.library` listeden çıkarıldı. `restaurant.starter` ana metni "başlangıç", "meze" de kabul. İngilizce varsayılanı ABD. Ağır A2 deyimleri (4) ve yanıltıcı kelimeler (6) B1'e taşındı; B1 henüz oynanabilir sayılmıyor, ama "Deyimler ve tuzaklar" modunda çıkmaya devam ediyorlar.
- Kararlar (Furkan): `money.bill` şimdilik `bill` kalır, LNG-42'de "hesap" ve "fatura" diye iki kavrama ayrılır. `restaurant.starter` Türkçesi "başlangıç (yemek)".
- Karar (Furkan): kelimenin "öğrenildi" sayılması için farklı günlerde doğru bilinmesi şartı yok; 3 doğru yeterli.
- Seviye testi üst sınırı (LNG-17): içerik olmadığı için test şimdilik yetişkini en fazla A2, çocuğu en fazla L3 olarak yerleştirir. İleri seviye bir kullanıcı da A2'den başlar. B1+ ve L4+ içeriği eklenince sınır kendiliğinden kalkar (seviye başına en az 20 kavram).
- İçerik kontrolü (LNG-14, LNG-15): çeviriler henüz bir insan tarafından gözden geçirilmedi ve `review: true` işareti de konmadı. En riskli kısım deyimlerin Türkçe karşılıkları (`docs/content/adult-words.md`). Yayından önce kontrol edilmeli.
- Font bulgusu: Lilita One ve Fredoka'da `ğ ş İ Ğ Ş` yok; Titan One'da `İ` yok. Çocuk teması DynaPuff + Baloo 2'ye geçirildi.
