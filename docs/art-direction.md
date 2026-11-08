# Sanat yönü

**Durum:**
- Çocuk profilleri (2–7, 7–12): **C — Oyun Hamuru**, görsel öncelikli ✅ (Furkan, LNG-4)
- Yetişkin profili: ayrı, yetişkinlere yönelik tema — 3 aday hazır, seçim bekliyor (LNG-39)

## Onaylı çocuk teması

| 2–7 yaş | 7–12 yaş |
|---|---|
| ![2–7](art-direction/c-mini-2-7.png) | ![7–12](art-direction/c-kid-7-12.png) |

- Görsel öncelik: 2–7'de seçenekler resim kartı, soru Zeynep'in sesinden; 7–12'de soru kartının en büyük öğesi resim.
- Fontlar: **DynaPuff** (başlık) + **Baloo 2** (gövde). İlk örnekteki Lilita One ve Fredoka'da `ğ ş İ` olmadığı için değiştirildi.
- Kaynak HTML/SVG: `art-direction/src/`.

## Yetişkin teması adayları (LNG-39)

Aynı ekran: B1 kelime, örnek cümle, doğru cevap, aralıklı tekrar bilgisi.

![Yetişkin adayları](art-direction/adult-karsilastirma.png)

| | 1 — Sözlük | 2 — Gece Nehri | 3 — Ebru Sade |
|---|---|---|---|
| His | Güzel basılmış bir sözlük / dergi | Odaklanma, gece çalışması | Çocuk temasıyla aynı aileden, olgun |
| Zemin | Açık kâğıt, siyah mürekkep | Koyu lacivert | Fildişi + beyaz kart |
| Fontlar | Fraunces (serif) + Inter Tight | Space Grotesk + JetBrains Mono | DM Serif Display + Manrope |
| Vurgu | Tek renk: vermilyon + fosforlu kalem altı çizgi | Parlayan nehir turkuazı; ilerleme çubuğu akan bir nehir | Kartın üstünde ebru şeridi, doğru cevapta ebru |
| Güçlü yanı | En kendine has ve "ciddi"; yetişkinin güveni | Gece kullanımı rahat; modern | Marka bütünlüğü (Nehir ↔ ebru) |
| Riski | Açık zemin gece göz yorabilir (koyu varyant gerekir) | Koyu tema çocuk temasından en uzak | Ebru performansı cihazda test edilmeli |

Kaynak HTML: `art-direction/src/ad*.html` (`FONTS` = `@fontsource` paket klasörü).

## İlk karşılaştırma (üç yön)

Üç yön de aynı ekranla gösterildi: 7–12 yaş, çoktan seçmeli soru, doğru cevap anı, Nehir karakteri.

![Karşılaştırma](art-direction/karsilastirma.png)

| | A — Kâğıt Nehir | B — Ebru | C — Oyun Hamuru |
|---|---|---|---|
| Doku | Kâğıt grain, düzensiz kesik kenarlar | Ebru akışları (Skia shader) | Kil: iç gölge + üst parlama |
| Palet | Krem, nehir turkuazı, zerdeçal, kiremit, mürekkep laciverti | Çivit, turkuaz, mercan, safran, altın | Şeftali zemin, nane, ahududu, limon, gök mavisi |
| Başlık fontu | Bricolage Grotesque | Baloo 2 | Lilita One + Fredoka |
| Ödül birimi | Kâğıt taş | Ebru damlası | Hamur boncuğu |
| Güçlü yanı | El yapımı, sıcak, yetişkine de yakışır | En özgün; Türk kültürü + "nehir" adıyla anlam bağı | En oyuncaklı; 2–7 yaşa en çekici |
| Riski | Animasyonda düzensiz kenarlar ek iş | Ebru shader performansı düşük Android'de test edilmeli | Yetişkin modunda fazla çocuksu kalabilir |

Görseller: `art-direction/a-kagit-nehir.png`, `b-ebru.png`, `c-oyun-hamuru.png` (390×844 @2x).
Karakter çizimleri yalnızca stil örneğidir; Zeynep, Nehir ve Kerem'in son tasarımı LNG-30/31'de yapılır.
