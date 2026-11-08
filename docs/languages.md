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
  concepts/                    # dilden bağımsız
    fruits.json                # [{ "id": "fruit.apple", "topic": "fruits", "image": "fruit.apple", "kind": "noun", "tags": ["concrete"] }]
  languages/
    en/
      words.json               # { "fruit.apple": { "text": "apple", "alt": [], "article": "an" } }
      sentences.json
      audio/                   # fruit.apple.m4a
    tr/
      words.json               # { "fruit.apple": { "text": "elma", "alt": [] } }
      sentences.json
      audio/
  courses/
    tr-en.json                 # hedef dil için sıralı üniteler ve seviyeler: kavram id'leri
```

- **Seviye kursa aittir**, kavrama değil. Bir kelime İngilizcede kolay, Almancada zor olabilir.
- Cümleler birebir çevrilmez; her dilde **kabul edilen cevaplar listesi** tutulur (`accepted: []`).
- Bir kavramın bir dilde metni yoksa o kavram o kursta kullanılamaz. Bunu içerik doğrulama testi yakalar.

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
};
```

- `normalize.ts`: `normalizeAnswer` (küçük harf, noktalama ve fazla boşluk yok), `foldAnswer`, `isNearMiss` ("kisi" ↔ "kişi" → neredeyse doğru).
- `courses.ts`: `CourseDef` (`tr-en`), seviye ölçekleri profil tipine göre: `kid` L1–L10, `adult` A1–C1.
- Arayüz dili: `src/i18n/pickUiLanguage.ts` — cihazın tercih ettiği ilk desteklenen dil; hiçbiri desteklenmiyorsa **İngilizce**.

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
