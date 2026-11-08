# Çok dilli mimari

İlk sürüm: **Türkçe ⇄ İngilizce**. Yapı, yeni bir dil eklemenin **kod değil veri** işi olacağı şekilde kurulur (ör. Almanca: `de` klasörü + kurs tanımı + font kontrolü).

## Üç ayrı kavram

| Kavram | Ne | Örnek |
|---|---|---|
| **Arayüz dili** (UI) | Menü, buton, yönerge metinleri | Türk ebeveyn arayüzü Türkçe görür |
| **Ana dil** (`nativeLang`) | Profilin bildiği dil | `tr` |
| **Hedef dil** (`targetLang`) | Profilin öğrendiği dil | `en` |

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

## Dil kaydı (`src/features/languages/registry.ts`)

Her dil tek bir kayıtla tanımlanır:

```ts
type LanguageDef = {
  code: 'tr' | 'en';            // yeni dil = yeni kod
  nativeName: string;           // "Türkçe", "English"
  locale: string;               // 'tr-TR' — büyük/küçük harf ve sıralama
  ttsVoice: string;             // expo-speech dil kodu
  direction: 'ltr' | 'rtl';     // ileride Arapça vb.
  charset: string;              // fontların kapsaması gereken özel harfler: "çğıİöşüÇĞÖŞÜ"
  normalize: (s: string) => string;      // cevap karşılaştırma için
  nearMiss?: (a: string, b: string) => boolean; // ı/i, ş/s gibi "neredeyse doğru"
};
```

## Kurallar

- **Kodda dil sabit yazılmaz.** `'tr'` / `'en'` karşılaştırması yerine registry ve kurs kullanılır.
- **Arayüz metinleri kodda yazılmaz.** `src/i18n/{tr,en}.json` + `expo-localization` + `i18next`. Eksik anahtarı test yakalar.
- **Büyük/küçük harf** her zaman dilin `locale`'i ile (`toLocaleUpperCase(lang.locale)`). Türkçede `i → İ`, `ı → I`.
- **Fontlar** desteklenen tüm dillerin `charset`'ini kapsamalı. Bunu bir test doğrular (`scripts/check-font-glyphs`). Örnek: Lilita One ve Fredoka'da `ğ ş İ` yok, bu yüzden elendiler.
- **Sağdan sola** diller için düzen `I18nManager` ile çevrilir; şimdilik yalnızca alan bırakılıyor.
- Profil ilerlemesi ve seviye tespiti **kurs başına** tutulur: `progress[courseId]`.
