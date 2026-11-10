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
- [x] **LNG-17** CİHAZ — Seviye tespit ekranları (20 soru, ilerleme çubuğu, "Bilmiyorum", sesli okuma) + sonuç ekranı. iPhone'da test edildi (Furkan); Android denemesi LNG-3'teki ilk Android derlemesiyle yapılacak. Önkoşul: LNG-10, LNG-16.
- [x] **LNG-18** CİHAZ — Oyun: Çoktan seçmeli (EN→TR / TR→EN). iPhone'da test edildi (Furkan); Android denemesi LNG-3'teki ilk Android derlemesiyle yapılacak. Önkoşul: LNG-7.
- [~] **LNG-19** CİHAZ — Oyun: Harf dizme. Önkoşul: LNG-7.
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
- [~] **LNG-20** CİHAZ — Oyun: Cümle kurma (kelime blokları sürükle-bırak). Önkoşul: LNG-7.
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
- [~] **LNG-21** CİHAZ — Nehir boyunca bölüm haritası (Skia). Önkoşul: LNG-11.
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
- [~] **LNG-22** CİHAZ — Oyun hissi paketi: doğru/yanlış animasyonları, haptics, ses efektleri (`game-feel` skill). Önkoşul: LNG-18.
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

- [ ] **LNG-23** FURKAN — App Store Connect + Play Console ürünleri: `family_monthly`, `family_yearly`, iOS `trial_7_days` (0 TL non-consumable); RevenueCat hesabı ve anahtarları; fiyatlar.
- [x] **LNG-24** BULUT — Deneme/entitlement mantığı (saf fonksiyon + test): deneme başlangıcı, kalan gün, süre doldu, abone. Önkoşul: LNG-1.
  - `src/features/subscription/access.ts`: `accessState` → `subscribed` / `trial` (kalan gün, bitmek üzere uyarısı ≤ 2 gün) / `trialEnded` / `notStarted`; `canPlay`. Deneme tam 7×24 saat; abonelik her durumda önce gelir. Saat geri alınarak deneme uzatılamaz (`lastSeenAt`). Deneme bir kez başlar. iOS'ta başlangıç App Store'daki 0 TL ürünün satın alma tarihi, Android'de yerel kayıt (`resolveTrialStart`). Kayıt: `src/storage/trial.ts` (`trial.v1`, cihaz geneli).
- [ ] **LNG-25** CİHAZ — RevenueCat entegrasyonu, paywall ekranı, satın al / geri yükle, kilit. Önkoşul: LNG-23, LNG-24.
- [~] **LNG-26** CİHAZ — Ebeveyn kapısı (satın alma + ayarlar önünde). Önkoşul: LNG-1.
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

- [~] **LNG-27** CİHAZ — Serbest yazma oyunu (cümle çevirisi). Önkoşul: LNG-8.
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
- [~] **LNG-28** CİHAZ — Deyimler ve yanıltıcı benzer kelimeler modu.
  - ✅ Yetişkin ana ekranında "Deyimler ve tuzaklar": çoktan seçmeli oyun, kursun bütün deyimleri (30) ve yanıltıcı benzer kelimeleri (15) İngilizce → Türkçe sorar; her yanıltıcı kelimede "tuzak" şık (ör. magazine → **mağaza**) her zaman seçeneklerdedir, cevaptan sonra kısa açıklama gösterilir.
  - ✅ İçerik: 15 yanıltıcı benzer kelime (`src/content/concepts/false_friends.json`, A2 ünitesi) — sympathetic, actual, sensible, pathetic, fabric, library, magazine, agenda, pension, smoking, parole, nervous, realize, recipe, billion. İçerik şemasına `trap` ve `note` alanları eklendi (doğrulayıcı: tuzak doğru cevaplardan biri olamaz).
  - Kararlar (gece çalışması, **Furkan kontrol etmeli**): liste ve açıklamalar benim; "pathetic → patetik" ve "realize → gerçekleştirmek" `review: true` (ince anlam farkı). Yanıltıcı kelimeler A2'ye kondu (A2 seviye atlaması için öğrenilmesi gereken kelime sayısı biraz arttı). Bu mod seviyeden bağımsız: bütün deyimler açık.
  - Derleme: yeni yerel paket yok.
  - Cihazda nasıl test edilir:
    1. Yetişkin profiliyle "Deyimler ve tuzaklar" → İngilizce deyim/kelime, Türkçe şıklar.
    2. "magazine", "library" gibi bir soru gelince şıklarda tuzak (mağaza, kitapçı) var mı?
    3. Cevapladıktan sonra geri bildirim kutusunda açıklama ikinci satırda görünüyor mu, uzun açıklama taşmadan sığıyor mu?
    4. Normal "Oyna" turunda da A2 seviyesindeysen yanıltıcı kelimeler çıkabilir; Türkçe → İngilizce sorulduğunda açıklama yine görünmeli.
- [~] **LNG-29** CİHAZ — Günlük tekrar ekranı (SRS kuyruğu). Önkoşul: LNG-9.
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
- [ ] **LNG-46** BULUT — Cevap kontrolü inceliği ve içerik kararları (Furkan'ın kararları, LNG-45 denetimlerinden).
  - Yazarak çevirmede başka bir kavramın doğru cevabı (ör. "hiç" için "never" yerine "ever") can götürmez: "Doğru bir kelime, ama aranan: X" der, `hard` sayılır.
  - Cümle kurma ve yazmada virgül ve "and" ile ayrılmış liste öğelerinin her sırası doğru sayılır.
  - İçerik: Nehir ile Zeynep'i ikiz kuzen yapan cümle değişir; "Thank you, teacher." gibi hitaplar ABD'ye uygun olur. `ceviri-editoru` denetler.
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
- [ ] **LNG-31** FURKAN — Karakter görsellerinin üretimi/onayı (illüstratör veya yapay zekâ + seçim) ve Rive animasyonları.
- [ ] **LNG-32** FURKAN — Ses kayıtları (300 kelime × EN + TR) — kayıt mı TTS mi kararı.
- [ ] **LNG-33** CİHAZ — Mini oyunlar: sesi duy → resmi bul, sürükle-bırak sepet, hafıza kartları. Önkoşul: LNG-13, LNG-31.
- [ ] **LNG-34** CİHAZ — Çıkartma albümü (ödül). Önkoşul: LNG-33.

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
