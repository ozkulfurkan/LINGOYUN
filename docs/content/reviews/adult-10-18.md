# Çeviri denetimi: yetişkin temaları 10–18

Kapsam: `content-src/themes/adult/10-city_directions.txt` … `18-home_life.txt` içindeki yeni/değişen (`kimlik|English|enAlts|Türkçe|trAlts`) satırlar. Yalnız kimlikten oluşan, daha önce denetlenmiş satırlar atlandı.

Cevap denetiminin işleyişi `src/features/languages/normalize.ts` ve `src/features/answer-check/check.ts` üzerinden doğrulandı: noktalama ve kesme işareti silinir (`I'm` → `im`, `I am` ile eşleşmez), tire boşluksuz silinir (`round-trip` → `roundtrip`), baştaki `a/an/the/to` atılır. Yazarak çevirmede istem yalnız kavramın kendi Türkçe metni, kabul listesi yalnız kendi İngilizce metni + `enAlts` (`src/features/games/free-typing/round.ts`). Çoktan seçmelide aynı metinli veya istemi çakışan şıklar üretici tarafından eleniyor (`src/features/quiz/generate.ts`).

## 1. Sonuç

- Kontrol edilen satır: **236** (88 kelime + 148 cümle; 10: 19, 11: 18, 12: 38, 13: 20, 14: 38, 15: 20, 16: 27, 17: 28, 18: 28).
- Bulgular: **HATA 2 · DÜZELT 20 · SOR 1**.
- Karar: **DÜZELTMEYLE GEÇER**. İki HATA (anlamı bozan Türkçe cümle, yanlış kabul edilen Türkçe karşılık) düzeltilmeden yayına çıkmamalı; DÜZELT'lerin çoğu, Türkçe cümleyi doğal biçimde çeviren oyuncunun yanlış sayılmasını önleyen eksik `enAlts`.

## 2. Bulgular

Önerilen satırlar tabloda `|` karakteri yüzünden bozulacağı için tablonun altında, numarasıyla, kopyalanabilir blok olarak verildi. Her blok tema dosyasındaki satırın **tamamının** yerine geçer.

| # | Şiddet | Kimlik | Dil | Mevcut (sorunlu kısım) | Gerekçe |
|---|---|---|---|---|---|
| H1 | HATA | `health.s3_bandage` | TR | «Hemşire eve gitmeden önce parmağımdaki kesiği temizleyip…» | Yan cümlenin öznesi yazılmadığı için ana cümlenin öznesi alınır: «eve giden» hemşire olur. İngilizcede eve giden «I». Anlam yanlış. |
| H2 | HATA | `shopping.bargain` | TR alt | `kapış` | «Kapış» kelepir demek değil («kapış kapış gitti» = hızla tükendi). Yanlış karşılık kabul listesinde. Ayrıca «kelepir» istemine verilen doğal İngilizce `good deal` / `deal` eksik. |
| D1 | DÜZELT | `work_school.s3_where_when` | EN+TR | «Can you tell me where and when …, because I missed the last one?» / «…söyleyebilir misin, çünkü sonuncusunu kaçırdım?» | Soru sonuna eklenen «because» iki dilde de çeviri kokuyor; doğal sıra önce gerekçe, sonra rica. Yeniden kuruldu (18 kelime). |
| D2 | DÜZELT | `city_directions.s3_walk_bridge` | TR+EN alt | «Bu caddede düz yürüyün» | Yol tarifinde güzergâh ayrılma hâliyle söylenir: «caddeden düz yürüyün». ABD'de en yaygın kalıp olan `go/walk straight down this street` kabul edilmiyor. |
| D3 | DÜZELT | `city_directions.s3_lost_hotel` | EN alt | Tüm seçeneklerde «…lost, so could you…» | Türkçede «bu yüzden» yok; oyuncu doğal olarak `so` olmadan yazar («I think I'm lost. Could you…») ve yanlış sayılır. |
| D4 | DÜZELT | `city_directions.s3_bus_stop_corner` | EN alt | `the buses to the airport` | Türkçe ana metin «havalimanı otobüsleri»; doğrudan karşılığı `the airport buses` kabul edilmiyor. |
| D5 | DÜZELT | `city_directions.s3_village_market` | EN alt | yalnız `drive (into) the city` | Türkçe «arabayla şehre gidiyoruz» → oyuncunun büyük olasılıkla yazacağı `go to the city by car` kabul edilmiyor. (Anlam sorusu için S1'e bakın.) |
| D6 | DÜZELT | `city_directions.s2_pharmacy_near` | EN alt | `near here` / `nearby` | Türkçe «Buralarda»nın tam karşılığı `around here` eksik. |
| D7 | DÜZELT | `work_school.s2_english_job` | TR | «işim için ona ihtiyacım var» | Bir dil için «ona ihtiyacım var» çeviri kokuyor; Türkçede zamir düşer: «işim için gerekli / lazım». |
| D8 | DÜZELT | `describing.s2_answer_perfect` | EN alt | `…but it is not perfect.` | Türkçede «mükemmel **de** değil» var; oyuncu `either` ekler ve yanlış sayılır. |
| D9 | DÜZELT | `daily_actions.s2_shower_breakfast` | EN alt | `have breakfast` yalnız «and then» ile | Türkçe «Duş alıyorum, sonra kahvaltı ediyorum» → en olası çeviri `I take a shower, then I have breakfast` kabul edilmiyor. |
| D10 | DÜZELT | `daily_actions.s2_music_drive` | TR+EN alt | «İşe araba sürerken» | «Araba sürmek» yönelme almaz («işe araba sürmek» kurulmaz); doğal biçim «İşe arabayla giderken» (zaten trAlt). `while I drive` ve `by car` çevirileri eksik. |
| D11 | DÜZELT | `daily_actions.s3_call_later` | EN alt | Tüm seçeneklerde «…, so I will call you…» | Türkçede «bu yüzden» yok; `so` olmadan yazan ve «Şu an»ı `right now` diye çeviren oyuncu yanlış sayılır. |
| D12 | DÜZELT | `daily_actions.s3_open_window` | EN alt | Tüm seçeneklerde «…, so could you…» | Türkçede «bu yüzden» yok ve özne «Bu oda»; `This room is very hot, could you…` kabul edilmiyor. |
| D13 | DÜZELT | `shopping.s2_clothes_online` | TR alt + EN alt | trAlt «Kıyafetleri **genellikle** internetten alırım» | «often» = «sık sık», «genellikle» = «usually»: alternatif anlamı değiştiriyor. `on the internet` eksik. |
| D14 | DÜZELT | `work_tech.s3_meeting_thursday` | TR + EN alt | «Müşteriyle toplantı artık perşembe» | «artık perşembe» İngilizce «now on Thursday»nın kelime kelime çevirisi; doğal Türkçe «perşembeye alındı». Ona göre `has been moved to Thursday` eklendi. Eski trAlt «perşembeye kaldı» «ertelendi» anlamı taşıyor, çıkarıldı. |
| D15 | DÜZELT | `travel.s2_flight_delay` | EN alt | yalnız `Our flight has…/is…` | Türkçe «uçuşumuzda iki saatlik rötar var» → `There is a two-hour delay on our flight` ve `delayed by two hours` kabul edilmiyor. |
| D16 | DÜZELT | `travel.s3_round_trip` | TR + EN alt | «İnternetten ayırtırsan gidiş-dönüş bilet, iki tek yön biletten çok daha ucuz.» | Akış kopuk: koşullu cümle çıplak «ucuz» ile bitiyor. Doğal biçim «…çok daha ucuza gelir». İnternetten bilet «alınır»; buna göre `buy it online` de kabul edilmeli. |
| D17 | DÜZELT | `health.checkup` | TR | «kontrol (sağlık)» | Doğal ve tek anlamlı bir karşılık var: «sağlık kontrolü» (şu an alt). Ayraç ancak başka çare yoksa kullanılmalı (`health.patient` gibi). «kontrol» başka bir yetişkin kavramın ana metni değil, alt olarak kalabilir. |
| D18 | DÜZELT | `home_life.heating` | EN alt | yalnız `heating` | Türkiye'de «kalorifer» hem sistem hem petek için kullanılır; `central heating` ve `radiator` doğru çeviriler, kabul edilmiyor. |
| D19 | DÜZELT | `home_life.s1_heating` | EN alt | yalnız `The heating…` | D18 ile aynı gerekçe: «Kalorifer çalışmıyor» → `The radiator isn't working` doğru, kabul edilmiyor. |
| D20 | DÜZELT | `city_directions.mosque` | TR alt | `camii` | «camii» yalnız tamlamada geçer (Sultanahmet Camii); tek başına yazım yanlış. Kabul listesinden çıkmalı. |
| S1 | SOR | `city_directions.s3_village_market` | TR | «her cumartesi **markete** gitmek için» | Türkiye'de «market» süpermarket; köyden haftada bir şehre gidilen yer genelde **pazar**dır, İngilizce `the market` de daha çok pazar/açık çarşı çağrıştırır. Kastedilen pazarsa ana metin «pazara gitmek için» olmalı. Furkan karar vermeli; D5'teki blokta «markete» korundu. |

### Önerilen satırlar

H1
```
health.s3_bandage|The nurse cleaned the cut on my finger and put a bandage on it before I went home.|Before I went home, the nurse cleaned the cut on my finger and put a bandage on it.;The nurse cleaned the cut on my finger and put a bandage on it before I left.;Before I left, the nurse cleaned the cut on my finger and put a bandage on it.|Ben eve gitmeden önce hemşire parmağımdaki kesiği temizleyip üstüne bandaj sardı.|Hemşire, ben eve gitmeden önce parmağımdaki kesiği temizleyip sardı.;Ben eve gitmeden önce hemşire parmağımdaki kesiği temizledi ve üstüne yara bandı yapıştırdı.
```

H2
```
shopping.bargain|bargain|good deal;deal|kelepir|
```

D1
```
work_school.s3_where_when|I missed the last English lesson, so can you tell me where and when the next one is?|I missed the last English lesson, so can you tell me when and where the next one is?;I missed the last English lesson, so could you tell me where and when the next one is?;I missed the last English lesson, so could you tell me when and where the next one is?;I missed the last English lesson. Can you tell me where and when the next one is?;I missed the last English lesson. Could you tell me where and when the next one is?;I missed the last English class, so can you tell me where and when the next one is?|Son İngilizce dersini kaçırdım, bir sonraki dersin nerede ve ne zaman olduğunu söyler misin?|Son İngilizce dersini kaçırdım, bir sonraki dersin nerede ve ne zaman olduğunu söyleyebilir misin?;Geçen İngilizce dersini kaçırdım, bir sonraki ders nerede ve ne zaman, söyler misin?
```

D2
```
city_directions.s3_walk_bridge|Walk straight along this street, cross the bridge, and the museum will be on your left.|Walk straight along this street, cross the bridge, and the museum is on your left.;Go straight along this street, cross the bridge, and the museum will be on your left.;Go straight along this street, cross the bridge, and the museum is on your left.;Walk straight along this street, cross the bridge, and the museum will be on the left.;Walk straight down this street, cross the bridge, and the museum will be on your left.;Go straight down this street, cross the bridge, and the museum will be on your left.;Go straight down this street, cross the bridge, and the museum is on your left.|Bu caddeden düz yürüyün, köprüyü geçin, müze solunuzda olacak.|Bu sokaktan düz yürüyün, köprüyü geçin, müze solunuzda kalacak.;Bu caddeden düz yürü, köprüyü geç, müze solunda olacak.
```

D3
```
city_directions.s3_lost_hotel|Excuse me, I think I am lost, so could you show me the way to my hotel on this map?|Excuse me, I think I'm lost, so could you show me the way to my hotel on this map?;Excuse me, I think I am lost, so could you show me on this map the way to my hotel?;Excuse me, I think I'm lost, so could you show me on this map the way to my hotel?;Excuse me, I think I am lost, so can you show me the way to my hotel on this map?;Excuse me, I think I'm lost, so can you show me the way to my hotel on this map?;Excuse me, I think I am lost. Could you show me the way to my hotel on this map?;Excuse me, I think I'm lost. Could you show me the way to my hotel on this map?;Excuse me, I think I am lost. Can you show me the way to my hotel on this map?;Excuse me, I think I'm lost. Can you show me the way to my hotel on this map?|Affedersiniz, sanırım kayboldum, bana bu haritada otelimin yolunu gösterebilir misiniz?|Affedersiniz, galiba kayboldum, bana bu haritada otelimin yolunu gösterebilir misiniz?;Pardon, sanırım kayboldum, bu haritada bana otelimin yolunu gösterebilir misiniz?
```

D4
```
city_directions.s3_bus_stop_corner|The bus stop is on the next corner, but the buses to the airport only come every thirty minutes.|The bus stop is on the next corner, but the buses to the airport come only every thirty minutes.;The bus stop is at the next corner, but the buses to the airport only come every thirty minutes.;The bus stop is on the next corner, but the buses to the airport only come every half hour.;The bus stop is on the next corner, but the airport buses only come every thirty minutes.;The bus stop is on the next corner, but the airport buses come only every thirty minutes.;The bus stop is at the next corner, but the airport buses only come every thirty minutes.|Otobüs durağı bir sonraki köşede ama havalimanı otobüsleri yalnızca otuz dakikada bir geliyor.|Otobüs durağı sonraki köşede ama havalimanına giden otobüsler sadece yarım saatte bir geliyor.
```

D5
```
city_directions.s3_village_market|We live in a small village, but we drive to the city every Saturday to go to the market.|We live in a small village, but every Saturday we drive to the city to go to the market.;We live in a small village, but we drive to the city to go to the market every Saturday.;We live in a small village, but we drive into the city every Saturday to go to the market.;We live in a small village, but every Saturday we go to the city by car to go to the market.;We live in a small village, but we go to the city by car every Saturday to go to the market.|Küçük bir köyde yaşıyoruz ama her cumartesi markete gitmek için arabayla şehre gidiyoruz.|Küçük bir köyde yaşıyoruz ama her cumartesi alışveriş için arabayla şehre gidiyoruz.;Küçük bir köyde oturuyoruz ama her cumartesi markete gitmek için arabayla şehre iniyoruz.
```

D6
```
city_directions.s2_pharmacy_near|Is there a pharmacy or a supermarket near here?|Is there a supermarket or a pharmacy near here?;Is there a pharmacy or a supermarket nearby?;Is there a pharmacy or supermarket near here?;Is there a drugstore or a supermarket near here?;Is there a pharmacy or a supermarket around here?;Is there a pharmacy or supermarket around here?;Is there a pharmacy or supermarket nearby?|Buralarda bir eczane ya da süpermarket var mı?|Yakında bir eczane veya süpermarket var mı?;Buraya yakın bir eczane ya da süpermarket var mı?
```

D7
```
work_school.s2_english_job|I am learning English because I need it for my job.|I'm learning English because I need it for my job.;I am learning English because I need it for work.;I'm learning English because I need it for work.;I learn English because I need it for my job.;I am learning English because I need it at work.;I'm learning English because I need it at work.;I am learning English because it is necessary for my job.;I'm learning English because it's necessary for my job.|İngilizce öğreniyorum çünkü işim için gerekli.|İngilizce öğreniyorum çünkü işimde lazım.;İşim için gerektiğinden İngilizce öğreniyorum.;İngilizce öğreniyorum çünkü işim için ihtiyacım var.
```

D8
```
describing.s2_answer_perfect|Your answer is not wrong, but it is not perfect.|Your answer isn't wrong, but it isn't perfect.;Your answer is not wrong, but it's not perfect.;Your answer isn't wrong, but it's not perfect.;Your answer is not wrong, but it is not perfect either.;Your answer isn't wrong, but it isn't perfect either.;Your answer is not wrong, but it's not perfect either.;Your answer isn't wrong, but it's not perfect either.|Cevabın yanlış değil ama mükemmel de değil.|Cevabınız yanlış değil ama mükemmel de değil.
```

D9
```
daily_actions.s2_shower_breakfast|I take a shower and then I eat breakfast.|I take a shower and then eat breakfast.;I take a shower, then I eat breakfast.;I have a shower and then I have breakfast.;I take a shower and then I have breakfast.;I take a shower, then I have breakfast.;I have a shower, then I have breakfast.;I take a shower and then have breakfast.;I have a shower and then I eat breakfast.|Duş alıyorum, sonra kahvaltı ediyorum.|Duş alırım, sonra kahvaltı ederim.;Önce duş alıyorum, sonra kahvaltı yapıyorum.
```

D10
```
daily_actions.s2_music_drive|I listen to music when I drive to work.|When I drive to work, I listen to music.;I listen to music when I am driving to work.;I listen to music when I'm driving to work.;I listen to music while I drive to work.;I listen to music while I am driving to work.;I listen to music while I'm driving to work.;I listen to music while driving to work.;I listen to music when I go to work by car.|İşe arabayla giderken müzik dinlerim.|Arabayla işe giderken müzik dinlerim.;İşe arabayla giderken müzik dinliyorum.
```

D11
```
daily_actions.s3_call_later|I cannot talk now because I am driving, so I will call you when I get home.|I can't talk now because I'm driving, so I'll call you when I get home.;I cannot talk now because I am driving, so I will call you back when I get home.;I can't talk now because I'm driving, so I'll call you back when I get home.;I cannot speak now because I am driving, so I will call you when I get home.;I cannot talk now because I am driving. I will call you when I get home.;I can't talk now because I'm driving. I'll call you when I get home.;I can't talk now because I'm driving. I'll call you back when I get home.;I can't talk right now because I'm driving, so I'll call you when I get home.;I can't talk right now because I'm driving. I'll call you when I get home.|Şu an konuşamam çünkü araba kullanıyorum, eve varınca seni ararım.|Şimdi konuşamam, araba sürüyorum, eve gidince seni ararım.
```

D12
```
daily_actions.s3_open_window|It is very hot in this room, so could you open the window and close the door?|It's very hot in this room, so could you open the window and close the door?;It is very hot in this room, so could you close the door and open the window?;It is very hot in this room, so can you open the window and close the door?;It's very hot in this room, so can you open the window and close the door?;It is very hot in this room. Could you open the window and close the door?;It's very hot in this room. Could you open the window and close the door?;It's very hot in this room. Can you open the window and close the door?;This room is very hot, so could you open the window and close the door?;This room is very hot. Could you open the window and close the door?;This room is very hot. Can you open the window and close the door?|Bu oda çok sıcak, pencereyi açıp kapıyı kapatabilir misin?|Bu odada çok sıcak var, pencereyi açıp kapıyı kapatır mısın?
```

D13
```
shopping.s2_clothes_online|I often buy clothes online because it is cheaper.|I often buy clothes online because it's cheaper.;Because it is cheaper, I often buy clothes online.;Because it's cheaper, I often buy clothes online.;I often buy clothes on the internet because it is cheaper.;I often buy clothes on the internet because it's cheaper.|Sık sık internetten kıyafet alırım çünkü daha ucuz.|Kıyafetleri sık sık internetten alırım, çünkü daha ucuz.
```

D14
```
work_tech.s3_meeting_thursday|The meeting with the customer is now on Thursday, so please send me the report by Wednesday.|The meeting with the customer is now on Thursday, so please send the report to me by Wednesday.;The meeting with the customer is on Thursday now, so please send me the report by Wednesday.;The meeting with the client is now on Thursday, so please send me the report by Wednesday.;The meeting with the customer has been moved to Thursday, so please send me the report by Wednesday.;The meeting with the client has been moved to Thursday, so please send me the report by Wednesday.;The meeting with the customer was moved to Thursday, so please send me the report by Wednesday.|Müşteriyle toplantı perşembeye alındı, bu yüzden lütfen raporu bana çarşambaya kadar gönder.|Müşteriyle toplantı artık perşembe günü, bu yüzden lütfen raporu bana çarşambaya kadar gönder.;Müşteri toplantısı perşembeye alındı, lütfen raporu çarşambaya kadar bana gönderin.
```

D15
```
travel.s2_flight_delay|Our flight has a two-hour delay because of the snow.|Because of the snow our flight has a two-hour delay.;Our flight has a two hour delay because of the snow.;Because of the snow our flight has a two hour delay.;Our flight is delayed two hours because of the snow.;Our flight is two hours late because of the snow.;Our flight is delayed by two hours because of the snow.;There is a two-hour delay on our flight because of the snow.;There's a two-hour delay on our flight because of the snow.;There is a two hour delay on our flight because of the snow.|Kar yüzünden uçuşumuzda iki saatlik rötar var.|Kar yüzünden uçuşumuz iki saat rötarlı.;Kar nedeniyle uçuşumuz iki saat gecikmeli.
```

D16
```
travel.s3_round_trip|A round-trip ticket is much cheaper than two one-way tickets if you book it online.|If you book it online, a round-trip ticket is much cheaper than two one-way tickets.;A round trip ticket is much cheaper than two one way tickets if you book it online.;If you book it online, a round trip ticket is much cheaper than two one way tickets.;A return ticket is much cheaper than two single tickets if you book it online.;A round-trip ticket is much cheaper than two one-way tickets if you buy it online.;If you buy it online, a round-trip ticket is much cheaper than two one-way tickets.;A round trip ticket is much cheaper than two one way tickets if you buy it online.|İnternetten alırsan gidiş-dönüş bilet, iki tek yön biletten çok daha ucuza gelir.|İnternetten alırsanız gidiş-dönüş bilet iki tek yön biletten çok daha ucuza gelir.;İnternetten ayırtırsan gidiş-dönüş bilet iki tek yön biletten çok daha ucuza gelir.
```

D17
```
health.checkup|checkup|check-up;medical checkup|sağlık kontrolü|kontrol;check-up
```

D18
```
home_life.heating|heating|central heating;radiator|kalorifer|ısıtma
```

D19
```
home_life.s1_heating|The heating is not working.|The heating isn't working.;The heating's not working.;The heating does not work.;The heating doesn't work.;The radiator is not working.;The radiator isn't working.;The central heating is not working.;The central heating isn't working.|Kalorifer çalışmıyor.|Isıtma çalışmıyor.;Kalorifer bozuk.
```

D20
```
city_directions.mosque|mosque||cami|
```

S1 (Furkan «pazar» derse bu satır D5'in yerine geçer)
```
city_directions.s3_village_market|We live in a small village, but we drive to the city every Saturday to go to the market.|We live in a small village, but every Saturday we drive to the city to go to the market.;We live in a small village, but we drive to the city to go to the market every Saturday.;We live in a small village, but we drive into the city every Saturday to go to the market.;We live in a small village, but every Saturday we go to the city by car to go to the market.;We live in a small village, but we go to the city by car every Saturday to go to the market.|Küçük bir köyde yaşıyoruz ama her cumartesi pazara gitmek için arabayla şehre gidiyoruz.|Küçük bir köyde yaşıyoruz ama her cumartesi alışveriş için arabayla şehre gidiyoruz.;Küçük bir köyde oturuyoruz ama her cumartesi pazara gitmek için arabayla şehre iniyoruz.
```

## 3. Seviye gözlemleri

Tüm cümleler uzunluk aralığında (zorluk 1 ≤ 7, 2 = 7–13, 3 = 14–22 kelime; sayılarak kontrol edildi).

- `work_school.s3_where_when` (A1 teması): dolaylı soru («tell me where and when the next one is») A2 yapısı. D1'deki yeni biçim de bunu koruyor; A1'de kalacaksa D1'in yerine «I missed the last English lesson. Where and when is the next one?» gibi düz soru düşünülebilir. Bu bir bulgu sayılmadı.
- `describing.s3_special_day` (A1): gelecek anlamında şimdiki zaman («is getting married») A2'ye yakın; kabul edilebilir.
- A2 temalarında (14–18) seviyenin üstünde bir yapı bulunmadı: present perfect («I have had… since», «nobody has come… yet») ve «afford», «within» A2 içinde.

## Yazarın sorduklarına kısa yanıt

- `health.patient` «hasta (kişi)»: Kalabilir. Tek sözcüklü başka karşılık yok, ayraçlı ana metin için örnek de var («başlangıç (yemek)»). `hasta` alt'ı `health.sick` ile çakışmayı üreticiye bildirdiği için gerekli.
- `health.checkup` «kontrol (sağlık)»: Değişmeli (D17).
- `health.dizzy` «başı dönen»: Kalabilir. Türkçede bu anlamda bir sıfat yok, istem olarak açık. `baş dönmesi` alt'ı isim (dizziness); yanlış bir şıkkı doğru saydırmıyor, bu yüzden bulgu sayılmadı.
- `shopping.bargain` «kelepir»: Doğru (isim anlamı). `s3_bargain_market` cümlesinde fiil olarak geçmesi («pazarlık yapmak») yanlış değil ve oyunda bir çakışma yaratmıyor. Sorun yalnız `kapış` alt'ında (H2).
- `shopping.online` «internetten», `shopping.on_sale` «indirimde»: Doğal ve cümlelerdeki kullanımla tutarlı.
- `travel.round_trip`: Tireli ve tiresiz biçimlerin ikisi de iki dilde kabul listesinde, bu yeterli. `s3_round_trip` cümlesinde karışık yazım (`round-trip … one way`) «doğru» değil «yazım hatası» sayılır (2 düzenleme payı); kabul edilebilir.
- `city_directions.s2_straight_two_blocks` «iki sokak»: Doğal ve doğru. trAlt'taki «iki blok» İngilizceden çeviri kokuyor ama oyuncuyu yanlış saydırmıyor, bu yüzden bulgu sayılmadı.
- `work_school.s3_where_when` (D1) ve `travel.s3_round_trip` (D16): İkisi de düzeltilmeli.
- Bilerek bırakılan eş yazımlar (`miss`, `patient`, `cold`, `book`, `change`): Sorun yok. Türkçe istemleri farklı olduğu için yazarak çevirmede belirsizlik yok. Çoktan seçmelide aynı metin ve çakışan istem `generate.ts` içinde eleniyor. Aynı yolla zararsız olan başka örtüşmeler: `describing.comfortable` «rahat» = `people_feelings.relaxed` alt'ı, `travel.seat` «koltuk» = `home.sofa` alt'ı, `travel.gate` alt'ı «kapı» = `home.door`, `shopping.deliver` alt'ı «getirmek» = `action.bring`, `describing.warm` alt'ı «sıcak» = `opposite.hot`.
