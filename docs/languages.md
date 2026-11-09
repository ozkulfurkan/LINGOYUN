# Çok dilli mimari

İlk sürüm: **Türkçe ⇄ İngilizce**. Yapı, yeni bir dil eklemenin **kod değil veri** işi olacağı şekilde kurulur (ör. Almanca: `de` klasörü + kurs tanımı + font kontrolü).

## Üç ayrı kavram

| Kavram                       | Ne                             | Örnek                             |
| ---------------------------- | ------------------------------ | --------------------------------- |
| **Arayüz dili** (UI)         | Menü, buton, yönerge metinleri | Türk ebeveyn arayüzü Türkçe görür |
| **Ana dil** (`nativeLang`)   | Profilin bildiği dil           | `tr`                              |
| **Hedef dil** (`targetLang`) | Profilin öğrendiği dil         | `en`                              |

Bir **kurs** = `(nativeLang, targetLang)` çifti. İlk kurs `tr→en`; sorular her iki yönde de sorulur (EN→TR ve TR→EN). İleride `en→tr` (Türkçe öğrenen İngilizce konuşanlar) veya `tr→de` eklenebilir.

## İçerik: kavram tabanlı

Kelimeler dile göre değil **kavrama** göre tutulur. Resim, konu ve ses dosyası kavrama bağlıdır; her dil kendi metnini ekler.

```
src/content/
  concepts/                    # dilden bağımsız, konu başına bir dosya
    fruits.json                # [{ "id": "fruit.apple", "topic": "fruits", "kind": "word",
                               #    "ageGroups": ["mini","kid","adult"], "image": "fruit.apple", "tags": ["noun"] }]
  languages/
    en/
      words.json               # { "fruit.apple": { "text": "apple", "article": "an", "alt": [] } }
      sentences.json           # kind = "sentence" olan kavramlar
    tr/
      words.json               # { "fruit.apple": { "text": "elma" } }
      sentences.json
  courses/
    tr-en.json                 # { "id": "tr-en", "units": [{ "id": "kid.l1.fruits", "profileType": "kid",
                               #    "level": "L1", "concepts": ["fruit.apple", ...] }] }
  bundle.ts                    # bütün dosyaları içe aktarır (yeni dosya = buraya bir satır)
  validate.ts                  # içerik doğrulayıcı — validate.test.ts her `npm test`te çalıştırır
  query.ts                     # getEntry, unitsFor, conceptsOf
```

- Kavram türleri (`kind`): `word`, `phrase`, `idiom`, `sentence`.
- `ageGroups`: kavramı görebilecek profil tipleri. `mini` içeren her kavramın **resmi olmalı**.
- `alt`: doğru kabul edilen diğer cevaplar (eş anlamlı, farklı söyleyiş).
- `review: true`: çeviri henüz bir insan tarafından kontrol edilmedi — uyarı verir, hata vermez.
- **Ünite**: `mini` üniteleri tema dünyasıdır (seviye yok); `kid` ve `adult` üniteleri kursun bir seviyesine aittir.
- Doğrulayıcının yakaladıkları: tekrar eden id, bozuk id, eksik çeviri, bilinmeyen kavram, yanlış dosyadaki cümle, boş/fazla boşluklu metin, yaş grubuna uymayan kavram, geçersiz seviye, boş ünite.

- **Seviye kursa aittir**, kavrama değil. Bir kelime İngilizcede kolay, Almancada zor olabilir.
- Cümleler birebir çevrilmez; her dilde **kabul edilen cevaplar listesi** tutulur (`accepted: []`).
- Bir kavramın bir dilde metni yoksa o kavram o kursta kullanılamaz. Bunu içerik doğrulama testi yakalar.

- **İngilizce varsayılanı ABD yazımı ve söz varlığıdır** (`vacation`, `movie`, `fall`, `soccer`); İngiltere biçimi `alt` içinde kabul edilir (Furkan'ın kararı).

## Dil kaydı (`src/features/languages/`)

Her dil tek bir kayıtla tanımlanır (`types.ts`, `registry.ts`):

```ts
type LanguageDef = {
  code: LanguageCode; // LANGUAGE_CODES içinde; yeni dil = yeni kod
  nativeName: string; // "Türkçe", "English"
  locale: string; // 'tr-TR' — sıralama, sayı biçimi
  ttsVoice: string; // expo-speech dil kodu
  direction: 'ltr' | 'rtl'; // ileride Arapça vb.
  charset: string; // fontların kapsaması gereken özel harfler: "çğıİöşüÇĞÖŞÜ"
  toLower: (s: string) => string; // dile doğru büyük/küçük harf (cihaz ayarına güvenmez)
  toUpper: (s: string) => string;
  foldMap: Record<string, string>; // klavyede özel harf yoksa: ş → s, ı → i
  articles: string[]; // cevapta yazılsa da yazılmasa da olur: en → a, an, the
};
```

- Cevap kontrolü (`src/features/answer-check`): `correct` / `nearMiss` (yalnız özel harf farkı) / `typo` (5+ harfte 1, 9+ harfte 2 hata; içerikte bilinen başka bir kelime asla typo sayılmaz) / `wrong`. Puan verip vermemek oyunun kararı.
- `normalize.ts`: `normalizeAnswer` (küçük harf, noktalama ve fazla boşluk yok), `foldAnswer`, `isNearMiss` ("kisi" ↔ "kişi" → neredeyse doğru).
- `courses.ts`: `CourseDef` (`tr-en`), seviye ölçekleri profil tipine göre: `kid` L1–L10, `adult` A1–C1.
- Arayüz dili (`src/i18n/pickUiLanguage.ts`): **telefonun ana dili** destekleniyorsa o dil, değilse **İngilizce**. Telefonun ikinci/üçüncü dilleri dikkate alınmaz. Yeni dil eklenince o dildeki telefonlarda uygulama kendiliğinden o dilde açılır (Furkan'ın kararı).

## Yeni dil ekleme kontrol listesi

1. `LANGUAGE_CODES`'a kodu ekle, `registry.ts`'e `LanguageDef` yaz (büyük/küçük harf kuralları, `foldMap`, `charset`).
2. `src/i18n/<kod>.json` — testler eksik anahtarı yakalar.
3. `src/content/languages/<kod>/` — kelime ve cümleler; içerik testi eksik çeviriyi yakalar.
4. Kurs(lar)ı `courses.ts`'e ekle.
5. Fontlar yeni `charset`'i kapsıyor mu? (`src/theme/fonts.test.ts`, `npm test` içinde)

## Kurallar

- **Kodda dil sabit yazılmaz.** `'tr'` / `'en'` karşılaştırması yerine registry ve kurs kullanılır.
- **Arayüz metinleri kodda yazılmaz.** `src/i18n/{tr,en}.json` + `expo-localization` + `i18next`. Eksik anahtarı test yakalar.
- **Büyük/küçük harf** her zaman dil kaydındaki `toLower` / `toUpper` ile; `toLocaleUpperCase` kullanma (cihazın ICU verisine bağlı). Türkçede `i → İ`, `ı → I`.
- **Fontlar** desteklenen tüm dillerin `charset`'ini kapsamalı. Bunu bir test doğrular (`src/theme/fonts.test.ts`, `npm test` içinde). Örnek: Lilita One ve Fredoka'da `ğ ş İ` yok, bu yüzden elendiler.
- **Sağdan sola** diller için düzen `I18nManager` ile çevrilir; şimdilik yalnızca alan bırakılıyor.
- Profil ilerlemesi ve seviye tespiti **kurs başına** tutulur: `progress[courseId]`.
