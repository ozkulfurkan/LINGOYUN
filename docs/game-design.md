# Oyun tasarımı

Kod ile bu belge birlikte değişir. Sayıların tek kaynağı `src/features/progress/economy.ts`.

## İlkeler

- **Ceza yok, can var.** Yanlış cevap da 1 XP kazandırır; kazanılan XP ve taş hiç geri alınmaz. İstisna, basamaklardaki **3 can** (Furkan'ın kararı, LNG-43): canlar bitince basamak durur ve yalnızca hataları tekrar ederek geri kazanılır; bekleme ve reklam yok. 2–7 yaşta can yoktur.
- **Kayıp korkusu yok.** Seri, dondurma haklarıyla korunur; 2–7 yaşta seri gösterilmeyebilir (ekran tasarımında karar).
- **Doğru yazılış her zaman gösterilir** ("neredeyse doğru" ve "yazım hatası" dahil).

## Cevap sonuçları (`src/features/answer-check`)

| Sonuç           | Ne zaman                                                                      | Tekrar kutusu | XP  |
| --------------- | ----------------------------------------------------------------------------- | ------------- | --- |
| Doğru           | Kabul edilen cevaplardan biri (büyük/küçük harf, noktalama, a/an/the önemsiz) | +1 kutu       | 10  |
| Neredeyse doğru | Yalnız özel harf farkı: kisi ↔ kişi                                           | aynı kutu     | 5   |
| Yazım hatası    | 5–8 harfte 1, 9+ harfte 2 hata; bilinen başka bir kelime değilse              | aynı kutu     | 5   |
| Yanlış          | Diğer her şey                                                                 | kutu 0, bugün | 1   |

## Ödül ekonomisi (`economy.ts`)

| Ne                        | XP             | Taş |
| ------------------------- | -------------- | --- |
| Doğru cevap               | 10             | 1   |
| Neredeyse doğru / yazım   | 5              | —   |
| Yanlış cevap              | 1              | —   |
| 3 / 5 / 10 doğru üst üste | +5 / +10 / +20 | —   |
| Oturum tamamlandı         | +20            | +5  |
| Hatasız oturum            | +10            | —   |
| Seviye atlama             | —              | +10 |

**Tipik oturum** (10 soru, 8 doğru, 1 yazım hatası, 1 yanlış, bir kez 5'li seri): ≈ 80 + 5 + 1 + 15 + 20 = **~120 XP**, **~13 taş**.
Taşlar çıkartma albümü / kozmetik için harcanır (`spendGems`); fiyatlar o özellikle (LNG-34) belirlenecek.

## Günlük seri (`streak.ts`)

- Bir gün, en az bir oturum tamamlanınca "aktif" sayılır (yerel takvim günü).
- Her **7** seri gününde 1 **dondurma hakkı** kazanılır, en fazla **2** birikir.
- Kaçırılan günler, yeterli hak varsa otomatik kapanır; yoksa seri 1'den başlar (en iyi seri saklanır).
- Saat geri alınırsa hiçbir şey değişmez.

## Rozetler (`badges.ts`)

İlk oturum · Hatasız oturum · 3 / 7 / 30 gün seri · 10 / 50 / 100 / 300 kelime öğrenildi (tekrar kutusu 3+) · 100 / 1000 doğru cevap · Seviye atlama.
Rozet kimlikleri kayda geçer; asla yeniden adlandırılmaz.

## Aralıklı tekrar (`src/features/srs`)

5 kutu, aralıklar **0 / 1 / 3 / 7 / 14 gün**. Doğru → üst kutu, neredeyse/yazım → aynı kutu, yanlış → kutu 0 (aynı gün tekrar). Günlük liste: önce vadesi gelen tekrarlar (en geciken önce), sonra kurs sırasıyla yeni kelimeler.

## Öğrenme yolu (`src/features/path`, LNG-43)

Ekranda seviye adı (A1, L2…) hiç görünmez. Yol **1'den başlayan numaralı temalardır**: Selamlaşma, Kişiler ve aile, Sayılar… (yetişkin 27, 7–12 yaş 14 tema). Sıra `src/content/courses/tr-en.json` içindeki `paths` alanındadır. Her temanın gizli bir **bandı** (A1…C1 / L1…L10) vardır; yalnızca seviye testi ve içerik planlaması için kullanılır.

**Her tema 5 basamak (18 soru, Furkan'ın kararı, LNG-45):**

| Basamak  | Ne sorulur                                                                                                                                                                                                         |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1–4      | Önceki basamağın hataları önce · 10 yeni kelime (çoktan seçmeli) · 3 yazma (aynı kelimelerden, Türkçe → İngilizce; 7–12 yaşta harf dizme) · 3 dinleme (yazı gizli, normal ve 0,5× ses) · 2 cümle (bloklarla kurma) |
| 5: Sınav | Öğretilen kelimelerden, en zayıflar önce: 7 kelime (3'ü harf dizme) · 5 yazma · 3 dinleme · 3 cümle                                                                                                                |

- Önceki basamaktan kalan hatalı kelimeler dinleme sorularının, hatalı cümleler cümle sorularının yerini alır; basamak 18 soruda kalır.
- Yazmada "neredeyse doğru" ve yazım hatası can götürmez, doğru yazılış gösterilir; yanlış ya da "Bilmiyorum" 1 can götürür.
- **Can:** her basamakta 3 can. Her hata 1 can; aynı sorudaki ikinci deneme can götürmez. 3. hatada "Canların bitti" ekranı gelir.
- **Can kazanma:** canlar bitince hatalar tekrar sorulur. Her doğru 1 can verir, yanlış soru kuyruğun sonuna gider. 3 can dolunca basamak baştan ve yeni sorularla başlar.
- Tamamlanmış basamaklar ve temalar yeniden oynanabilir; ilerletmezler ama XP ve taş verirler.
- Bir temada 40'tan az kelime varsa eksik yeni kelimeler temanın önceki kelimeleriyle doldurulur. Temada yeterli cümle yoksa aynı banttaki temaların cümleleri kullanılır.

**Zorluk derecesi (1 kolay · 2 orta · 3 zor):** temanın cümleleri katmanlıdır (`sentences: { "1", "2", "3" }`); katman yoksa bir alttaki kullanılır.

- Seviye testi başlangıç temasını (sonuç bandının ilk teması) ve dereceyi belirler: 20 sorunun %75'i doğruysa 3, %40'ı doğruysa 2, değilse 1. Testi atlayan 1'den başlar.
- Üst üste 2 basamak can kaybetmeden geçilirse derece +1, canlar biterse −1.
- Ayarlardan (ebeveyn kapısının arkasında) elle seçilebilir.

## Seviye tespiti (`src/features/placement`)

Kendi beyanı → başlangıç (yetişkin: A1/A2/B1/B2; 7–12: L1/L3/L6/L8) → 5 blok × 4 soru → blokta 3–4 doğru yukarı, 2 aynı, 0–1 aşağı → sonuç: 3/4 ile geçilen en yüksek seviye. 1000 sanal oyuncu simülasyonunda ±1 seviye isabeti %99.

"Hiç bilmiyorum" diyen kullanıcı teste girmez, doğrudan en alt seviyeden başlar (Furkan'ın kararı).

Test yalnızca en az 20 kavramı olan seviyeleri kullanır (`placeableLevels`), çünkü boş bir seviyeyi alttaki kelimelerle sormak kullanıcıyı olduğundan yüksek gösterir. Şu an üst sınır yetişkinde A2, 7–12'de L3; içerik eklendikçe ölçek kendiliğinden genişler. Testte doğru/yanlış gösterilmez, yarıda bırakılan test baştan başlar. İki dilde aynı yazılan kelimeler ("film") sorulmaz.

## Çoktan seçmeli oyun (`src/features/games/multiple-choice`)

Bir tur **10 soru**, iki yön karışık. Sıra: vadesi gelen tekrarlar (en fazla 5), sonra seviyenin yeni kelimeleri (kurs sırasıyla), sonra kalan tekrarlar; seviye bitince en zayıf kelimeler çalışılır. Cevap tekrar kutusuna **hemen** yazılır, turdan çıkınca kaybolmaz. XP, taş ve seri **yalnızca tur bitince** verilir. Çoktan seçmelide "neredeyse doğru" yoktur: doğru → üst kutu, yanlış → kutu 0. Yanlışta doğru cevap gösterilir ve oyuncu "Devam"a basana kadar beklenir.

## Durum temaları (`src/content/query.ts`: `themeUnits`, `themeConcepts`)

İçerik gerçek hayat durumlarına göre kurulur (ilk deneme: Restoranda). Bir tema, her zorlukta bir ünitedir: `theme` alanı taşır ve seviye merdiveninin dışında durur, yani `unitsFor`, seviye testi ve seviye atlama onu saymaz. Toplu üretimde (LNG-42) bu ayrım kaldırılır.

| Zorluk | Cümle uzunluğu               |
| ------ | ---------------------------- |
| A1     | ~5 kelime                    |
| A2     | ~8 kelime                    |
| B1     | ~11 kelime (mevcudun 2 katı) |
| B2     | ~17 kelime (3 katı)          |
| C1     | ~23 kelime (4 katı)          |

**Seviye atlama:** bir sonraki seviyede en az 20 kavram olmalı (`MIN_LEVEL_CONCEPTS`). "Öğrenildi" için farklı gün şartı yoktur, 3 doğru yeterlidir (Furkan'ın kararı).

Her yeni içerik partisi `ceviri-editoru` agent'ından geçer; raporlar `docs/content/reviews/` altındadır.

## Soru üretici (`src/features/quiz`)

Yanlış şıklar aynı türden (kelime/cümle), önce aynı konudan ve benzer uzunlukta; ikinci bir doğru cevap (eş anlamlı dahil) asla şık olmaz. Aynı kelime arka arkaya sorulmaz. Rastgelelik tohumlanabilir.

## Harf dizme (`src/features/games/letter-order`)

- Ana dildeki kelime gösterilir, hedef dildeki karşılığı karışık harf taşlarından dizilir. Boşluk, tire ve kesme işareti sabit kutudadır. Harfler küçük harfle (dilin kurallarıyla).
- Yalnızca kelime ve kalıplar; 2–10 harf (cümle ve deyim yok). Taşlar hiçbir zaman doğru sırada başlamaz.
- Kutular dolunca otomatik kontrol. Yanlışta doğru yerdeki harfler kalır, yanlışlar geri döner.
- 2 yanlış denemeden sonra sıradaki doğru harf parlar (kids-ux). 1 yanlıştan sonra "Göster" belirir.
- Puan: ilk denemede doğru → `good` (+1 taş), denemeyle doğru → `hard`, "Göster" → `again`.
- Tur 8 kelime; kelime seçimi çoktan seçmeliyle aynı (önce vadesi gelen tekrarlar, sonra yeni kelimeler).

## Cümle kurma (`src/features/games/sentence-builder`)

- Ana dildeki cümle gösterilir; hedef dildeki cümle kelime bloklarından kurulur. Son noktalama (. ! ?) sabittir, virgüller kelimeyle gelir.
- Blok dokunarak ya da sürükleyerek eklenir; cevap alanının `touchTarget.mini / 2` yakınına bırakılan blok da yerine oturur (mıknatıs, kids-ux). Cümledeki bloğa dokunmak onu çıkarır.
- Yetişkin: 2 şaşırtmaca kelime (aynı seviyenin başka cümlelerinden, cümlede olmayan) + "Kontrol et". 7–12: şaşırtmaca yok, cümle tamamlanınca otomatik kontrol.
- Eşdeğer söylenişler (`alt`) doğru kabul edilir. Yanlışta yalnızca baştan doğru olan kısım kalır.
- İpucu (2 yanlıştan sonra), "Göster" (1 yanlıştan sonra) ve puanlama harf dizmeyle aynı. Tur 6 cümle; 2–9 kelimelik cümleler.

## Bölüm haritası ve seviye ilerlemesi (`src/features/map`)

- Kursun her seviyesi nehir boyunca bir taş: şu anki seviyenin altındakiler tamamlandı, üstündekiler kilitli; içeriği yazılmamış seviyeler "yakında".
- Şu anki seviyenin halkası, o seviyenin kelimelerinin ne kadarının öğrenildiğini (tekrar kutusu 3+) gösterir.
- **Seviye atlama:** bir tur bittiğinde şu anki seviyenin kelimelerinin **%80**'i öğrenilmişse ve sonraki seviyenin içeriği varsa profil bir üst seviyeye geçer (+10 taş, "Seviye atlama" rozeti). Eşik `LEVEL_DONE_MASTERY`.

## Oyun hissi (LNG-22)

| An                  | Görsel              | Ses (`assets/audio/sfx`)      | Titreşim |
| ------------------- | ------------------- | ----------------------------- | -------- |
| Butona dokunma      | 0,94'e sıkışma      | `tap` (yalnız çocuk teması)   | seçim    |
| Doğru               | zıplama             | `correct` (yükselen iki nota) | başarı   |
| Yanlış              | 3 salınım sallanma  | `wrong` (yumuşak, alçalan)    | hafif    |
| 3 / 5 / 10 üst üste | "N doğru üst üste!" | `combo3/5/10` (arpej)         | orta     |
| Tur sonu            | (hatasızsa) konfeti | `complete`                    | başarı   |
| Seviye atlama       | konfeti             | `levelUp`                     | başarı   |

Sesler `scripts/generate-sounds.mjs` ile sentezlenir. iOS'ta sessiz mod sesi kapatır. "Hareketi azalt" açıkken sallanma, zıplama ve konfeti yoktur. Ses ve titreşim `settings.v1`'den kapatılabilir.

## Yazarak çevir (`src/features/games/free-typing`, yalnız yetişkin)

- Ana dildeki kelime/cümle gösterilir; hedef dilde yazılır. Cevap kontrolü `src/features/answer-check` (yukarıdaki tablo).
- "Bilmiyorum" = yanlış; doğru cevap gösterilir ve okunur. Tur 8 madde.
