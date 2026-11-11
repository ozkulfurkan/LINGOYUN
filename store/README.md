# Mağaza dosyaları

- `listings.json` — App Store ve Play metinleri (TR, EN). Karakter sınırlarını `listings.test.ts` denetler.
- `privacy-labels.md` — App Store "App Privacy" cevapları.
- `data-safety.md` — Play "Veri güvenliği" ve Aileler politikası cevapları.
- Gizlilik politikası: `docs/privacy/index.html` (EN), `docs/privacy/tr.html` (TR). Geliştirici Furkan Özkul, iletişim ozkulfurkann@gmail.com, yürürlük 11 Kasım 2026. Adres: `https://ozkulfurkan.github.io/LINGOYUN/privacy/` (Türkçe: `…/privacy/tr.html`); uygulamadaki bağlantı `src/lib/links.ts`.

GitHub Pages (Furkan): repo → Settings → Pages → Source: `main` dalı, `/docs` klasörü. Politika değişirse yürürlük tarihini de güncelle.

## İkon

Kaynak: `assets/source/glyph.svg` (nehri geçen üç hamur basamak taşı: bir dilden öbürüne). Düzenledikten sonra bütün boyutları üret:

```bash
node scripts/generate-icons.mjs
```

Çıktılar: `assets/icon.png` (iOS, 1024), Android uyarlanabilir ikon (`android-icon-foreground/background/monochrome.png`), `assets/splash-icon.png` (açılış ekranı), `assets/favicon.png`, `store/graphics/play-icon-512.png` (Play listesi). Yerelde: `NODE_PATH=$(npm root -g) node scripts/generate-icons.mjs` (Playwright + Chromium gerekir).

## Ekran görüntüleri

1. Telefonda (geliştirici ya da önizleme derlemesi) **telefon dili Türkçe** iken 6 ekran görüntüsü al, sonra telefon dilini İngilizce yapıp aynı 6'sını tekrar al. Sıra `listings.json` → `screenshotCaptions` ile aynı:

   | No  | Ekran                                                       | İpucu                         |
   | --- | ----------------------------------------------------------- | ----------------------------- |
   | 01  | Nehir haritası (7–12 profili, 2–3 seviye tamamlanmış)       | Taş ve seri sayısı dolu olsun |
   | 02  | Çoktan seçmeli, doğru cevap anı ("Aferin!")                 |                               |
   | 03  | Harf dizme, kelime yarı dizilmiş                            |                               |
   | 04  | Cümle kurma, cümle yarı kurulmuş                            |                               |
   | 05  | Deyimler ve tuzaklar (yetişkin, koyu mod), açıklamalı cevap | "magazine" sorusu ideal       |
   | 06  | Tur özeti, hatasız tur (konfeti)                            | Konfeti ekrandayken çek       |

2. Dosyaları koy: `store/screenshots/raw/tr-TR/01.png … 06.png` ve `store/screenshots/raw/en-US/01.png … 06.png` (`.jpg` de olur; repoya girmez).
3. Çalıştır:

   ```bash
   node scripts/frame-screenshots.mjs
   ```

4. Çıktı: `store/screenshots/<dil>/app-store/*.png` (1290×2796) ve `store/screenshots/<dil>/play/*.png` (1080×1920). Başlık DynaPuff fontuyla, hamur temasında.

> App Store için ekranlar iPhone'dan alınmalı (Apple ekranların iOS görünümünü yansıtmasını ister).
