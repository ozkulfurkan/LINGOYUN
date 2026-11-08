---
name: art-direction
description: LINGOYUN'un görsel dili — hazır şablon gibi görünmeyen, kendine has tasarım kuralları, aday sanat yönleri, tipografi, renk, doku, şekil ve hareket imzası. Herhangi bir ekran, bileşen, illüstrasyon, ikon, tema token'ı veya mağaza görseli tasarlamadan ya da kodlamadan ÖNCE oku.
---

# LINGOYUN sanat yönü

Hedef: Ekran görüntüsü logosuz paylaşıldığında bile "bu LINGOYUN" dedirtmek. Hazır UI kiti, varsayılan Material/iOS görünümü veya "yapay zekâ yapmış" hissi istenmiyor.

## 1. Onaylı yönler

| Profil | Tema | Durum |
|---|---|---|
| `mini` (2–7), `kid` (7–12) | **C — Oyun Hamuru**, görsel öncelikli | ✅ Onaylı |
| `adult` | Yetişkinlere yönelik ayrı tema | ⏳ Seçim bekliyor (LNG-39) — tahmin etme, aday hazırla |

`docs/art-direction.md` her şeyin üstündedir. Aşağıdaki A ve B yalnızca çocuk teması için elendi; yetişkin teması için ilham olarak kullanılabilir.

### Çocuk teması: Oyun Hamuru + görsel öncelik
- **Görsel her ekranın kahramanıdır.** Kelime kartında resim ekranın en büyük öğesi (7–12'de ~190 pt, 2–7'de seçeneklerin kendisi resim). Metin resmin altında.
- 2–7 yaşta seçenekler **resim kartları**; metin yok, soru karakterin ağzından sesli gelir.
- 7–12 yaşta soru kartı = büyük resim + kelime; seçenekler metin.
- İllüstrasyonlar kil stilinde: radyal gradyan gövde, sol üstte beyaz parlama, altta yumuşak gölge, tombul ve yuvarlak formlar. Tüm kelime resimleri aynı ışık yönü (sol üst) ve aynı gölgeyle.
- Fontlar: başlık **DynaPuff** (700), gövde **Baloo 2** (600–800). ⚠️ Lilita One ve Fredoka'da `ğ ş İ` yok — kullanma.
- Örnekler ve kaynak: `docs/art-direction/c-mini-2-7.png`, `c-kid-7-12.png`, `docs/art-direction/src/`.

### Aday A — "Kâğıt Nehir"
- Katmanlı **kâğıt kesik** kolaj: elle kesilmiş gibi hafif düzensiz kenarlar, katmanlar arası yumuşak gölge, ince kâğıt dokusu (grain).
- Palet: krem kâğıt zemin, nehir turkuazı, zerdeçal sarısı, kiremit, mürekkep laciverti.
- Hareket: parçalar kâğıt gibi hafif sallanarak yerine oturur.

### Aday B — "Ebru"
- Nehir = su = **ebru**. Ekran geçişleri ve arka planlar ebru desenleriyle akar (Skia shader). Modern, sade çini motifleri rozet ve çerçevelerde.
- Palet: derin çivit, turkuaz, mercan, safran, altın vurgular; zemin açık fildişi.
- Hareket: akışkan, dalgalanan geçişler; doğru cevapta renk damlası yayılır.

### Aday C — "Oyun Hamuru"
- Yumuşak, tombul, **hamur/kil** görünümlü 2.5D şekiller (iç gölge + parlak üst ışık), kalın ve oyuncaklı tipografi.
- Palet: doygun ama sıcak şeker renkleri; her yaş grubunun kendi ana rengi.
- Hareket: esneyen-sıkışan (squash & stretch), zıplayan butonlar.

## 2. Her yön için geçerli kurallar

**Yasak (jenerik görünüm işaretleri):**
- Sistem fontu ile başlık; Inter/Roboto/SF'yi başlıkta kullanma.
- Saf `#FFFFFF` zemin veya saf `#000000` metin.
- Mor-mavi jenerik gradyanlar, "glassmorphism" kartlar, varsayılan gölgeli beyaz kart listeleri.
- Emoji'yi illüstrasyon yerine kullanmak; hazır ikon setini hiç değiştirmeden kullanmak.
- Her şeye aynı `borderRadius`; ortalanmış, simetrik, boş "hero + buton" ekranlar.

**Zorunlu:**
- **Tipografi**: karakterli bir başlık fontu + okunaklı gövde fontu. Türkçe karakterleri (ç ğ ı İ ö ş ü, özellikle `İ` ve `ı`) içerdiği **doğrulanmış** olmalı. Türkçe harfleri doğrulanmış: Baloo 2, DynaPuff, Nunito, Bricolage Grotesque, Rubik, Paytone One, Coiny, Grandstander. Eksik olanlar: Lilita One, Fredoka, Sniglet, Chango, Bagel Fat One, Titan One (`İ` yok). 2–7 yaşta tek katlı "a" ve "g" olan font tercih edilir.
- **Doku**: en az bir katmanda ince doku (kâğıt, grain, ebru) — düz dijital yüzey yok.
- **Şekil dili**: tek bir imza şekil seç (ör. düzensiz damla, kesik kâğıt kenarı) ve buton, kart, rozet, maske olarak tekrar kullan.
- **Özel ikonlar**: aynı çizgi kalınlığı ve köşe mantığıyla, sanat yönüne uygun çizilmiş.
- **Her ekranda bir "an"**: bir karakter, bir animasyon veya bir illüstrasyon; tamamen metinden oluşan ekran yok.
- **Renk anlamı**: doğru = nehir turkuazı/yeşili ailesi, yanlış = sıcak ama yumuşak (asla alarm kırmızısı), ödül = altın/safran. Renk tek başına anlam taşımaz; şekil veya ikon eşlik eder.
- **Yaş grubu ayrımı**: `mini` en oyuncaklı ve büyük; `kid` oyunlu ama okunaklı; `adult` ayrı tema — sakin, yoğun, olgun; ama yine jenerik değil.

## 3. Token'lar

Her şey `src/theme` içinden: `colors`, `typography`, `space`, `radii` (imza şekil dahil), `shadows`, `textures`, `motion` (süreler + spring ayarları). Bileşende hex, px font boyutu veya sabit süre yazma.

## 4. Karakterler: Zeynep, Nehir, Kerem

- Üçü **siluetten** ayırt edilebilmeli (saç şekli, boy, aksesuar).
- Her birinin kendi rengi, kişiliği ve imza hareketi olur (ör. biri zıplar, biri döner, biri el çırpar).
- Gerçekçi değil, sanat yönüne uygun stilize; büyük baş, okunur ifadeler.
- Ayrıntılar `docs/characters.md`'de; görsel üretimi için yazılan prompt'lar orada saklanır ki her çizim tutarlı olsun.

## 5. Kendi işini kontrol et

SVG veya ekran ürettiğinde Chromium/Playwright ile PNG'ye render et ve bak:
- Logoyu kapat: hâlâ LINGOYUN'a mı benziyor, yoksa herhangi bir uygulamaya mı?
- Gri tonlamada hiyerarşi ve doğru/yanlış ayrımı okunuyor mu?
- Küçük telefonda (360×640) taşma var mı?
Yanıt "jenerik" ise yeniden tasarla.
