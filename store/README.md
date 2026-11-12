# Mağaza dosyaları

- `listings.json` — App Store ve Play metinleri (TR, EN). Karakter sınırlarını `listings.test.ts` denetler.
- `privacy-labels.md` — App Store "App Privacy" cevapları.
- `data-safety.md` — Play "Veri güvenliği" ve Aileler politikası cevapları.
- Gizlilik politikası: `docs/privacy/index.html` (EN), `docs/privacy/tr.html` (TR). Geliştirici Furkan Özkul, iletişim ozkulfurkann@gmail.com, yürürlük 11 Kasım 2026. Adres: `https://ozkulfurkan.github.io/LINGOYUN/privacy/` (Türkçe: `…/privacy/tr.html`); uygulamadaki bağlantı `src/lib/links.ts`.

GitHub Pages (Furkan): repo → Settings → Pages → Source: `main` dalı, `/docs` klasörü. Politika değişirse yürürlük tarihini de güncelle.

Destek sayfası (App Store "Support URL", Play "Web sitesi"): `https://ozkulfurkan.github.io/LINGOYUN/support/` (`docs/support/index.html`, TR + EN: iletişim e-postası, deneme, iptal, geri yükleme, veriler, ebeveyn sorusu). Uygulamadaki menü adları değişirse bu sayfayı da güncelle.

## İkon

Kaynak: `assets/source/glyph.svg` (nehri geçen üç hamur basamak taşı: bir dilden öbürüne). Düzenledikten sonra bütün boyutları üret:

```bash
node scripts/generate-icons.mjs
```

Çıktılar: `assets/icon.png` (iOS, 1024), Android uyarlanabilir ikon (`android-icon-foreground/background/monochrome.png`), `assets/splash-icon.png` (açılış ekranı), `assets/favicon.png`, `store/graphics/play-icon-512.png` (Play listesi). Yerelde: `NODE_PATH=$(npm root -g) node scripts/generate-icons.mjs` (Playwright + Chromium gerekir).

## Ekran görüntüleri

> Karar (Furkan, 2026-11-13): yalnızca **Türkçe** görüntüler yüklenir (`store/screenshots/tr-TR/`). İngilizce mağaza sayfasına ayrı görüntü yüklenmez; App Store ana dilin (Türkçe) görüntülerini kullanır. `listings.json`'daki İngilizce başlıklar ileride gerekirse diye duruyor.

1. Telefonda (geliştirici ya da önizleme derlemesi) **telefon dili Türkçe** iken 6 ekran görüntüsü al. Sıra `listings.json` → `screenshotCaptions` ile aynı:

   | No  | Ekran                                                 | İpucu                      |
   | --- | ----------------------------------------------------- | -------------------------- |
   | 01  | Nehir haritası: tema yolu (7–12 ya da yetişkin)       | Birkaç tema geçilmiş olsun |
   | 02  | 2–7 yaş, resmi bul: Nehir üstte, 4 resim              | Doğru resim yeşilken       |
   | 03  | 2–7 yaş, kelimeyi bul: resim + 4 kelime               | Bir kelime işaretliyken    |
   | 04  | Basamak sorusu, doğru cevap anı (7–12)                | Kalpler görünsün           |
   | 05  | Cümle kurma, cümle yarı kurulmuş (yetişkin, koyu mod) |                            |
   | 06  | Çıkartma albümü, birkaç çıkartma kazanılmış           |                            |

2. Dosyaları koy: `store/screenshots/raw/tr-TR/01.png … 06.png` (`.jpg` de olur; repoya girmez).
3. Çalıştır:

   ```bash
   node scripts/frame-screenshots.mjs
   ```

4. Çıktı: `store/screenshots/<dil>/app-store/*.png` (1290×2796) ve `store/screenshots/<dil>/play/*.png` (1080×1920). Başlık DynaPuff fontuyla, hamur temasında.

> App Store için ekranlar iPhone'dan alınmalı (Apple ekranların iOS görünümünü yansıtmasını ister).
