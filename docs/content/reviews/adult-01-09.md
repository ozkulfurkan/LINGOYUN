# Çeviri denetimi: yetişkin temaları 01–09

Kapsam: `content-src/themes/adult/01-greetings.txt` … `09-restaurant.txt` içindeki yeni/değişen satırlar (`kimlik|English|enAlts|Türkçe|trAlts`). Yalnız kimlikten oluşan (önceden denetlenmiş) satırlar atlandı.

## 1. Sonuç

- **Kontrol edilen satır:** 228 (01: 30 · 02: 16 · 03: 28 · 04: 21 · 05: 28 · 06: 36 · 07: 19 · 08: 31 · 09: 19). Kelime/kalıp satırı 79, cümle satırı 149.
- **Bulgular:** HATA 0 · DÜZELT 23 · SOR 1
- **Yayın kararı:** `DÜZELTMEYLE GEÇER`. Anlamı bozan çeviri yok; düzeltilecekler bir kültürel kalıp hatası ("Hoşça kal" / "Güle güle"), birkaç çeviri kokan Türkçe cümle, aynı temada başka kavramla çakışan gevşek alternatifler ve blokla kurulabilen ama `enAlts`'ta olmayan doğru sıralamalar.

Denetimde dikkate alınan oyun kuralları (kaynak koddan doğrulandı):

- Cümle kurmada (`src/features/games/sentence-builder/puzzle.ts`) blok sayısı ana cümlenin kelime sayısına eşit olmalı; karşılaştırmada noktalama ve büyük/küçük harf yok sayılır. Bu yüzden **farklı kelime içeren cümle alternatifleri oyunda hiç kullanılamaz**. Yalnızca ana cümlenin kelimelerinin başka bir sırası işe yarar. Cümle alternatiflerinde aradığım şey bu tür eksik sıralamalar oldu.
- Yazarak cevap yalnızca kelime/kalıp satırlarında var (`src/features/path/step.ts`, TR → EN). Baştaki `a/an/the/to` atılır, tire ve kesme işareti silinir, uzun cevaplarda 1–2 harflik yazım hatası tolere edilir.
- Çoktan seçmeli üretici, metni ya da alternatifi doğru cevapla çakışan şıkkı zaten atıyor (`src/features/quiz/generate.ts`). Bu yüzden aşağıdaki çakışma bulguları "yanlış şık" riski değil. Asıl sorun, oyuncunun başka bir kavramın cevabını yazdığında doğru sayılması.
- Yeni `kid_*` kavramları yalnızca `kid` profiline açılıyor (`scripts/content.mjs`, `ageGroups: [type]`). Bu nedenle `numbers.half` / `kid_numbers.half` gibi aynı metinli çiftler yetişkin havuzunda çakışmıyor.

## 2. Bulgular

Her bulgunun altındaki kod bloğu, tema dosyasındaki satırın **yerine yapıştırılacak tam satırdır**. Çıkarılması gereken kavram yok.

### Özet tablo

| # | Şiddet | Kimlik | Dil | Mevcut (kısa) | Gerekçe |
|---|---|---|---|---|---|
| 1 | DÜZELT | greetings.s2_have_good_trip | TR+EN | "Hoşça kal, iyi yolculuklar…" | Yolcuyu uğurlayan, kalan kişidir; Türkçede kalan kişi **"Güle güle"** der, "Hoşça kal"ı giden söyler. Ayrıca blokla kurulabilen "…call us when you arrive and have a good trip" eksik. |
| 2 | DÜZELT | greetings.s3_heard_about_you | EN+TR | "…to meet you, because my sister has told me…" | "because" İngilizcede doğal değil, Türkçedeki "çünkü"nün kalıbı; Türkçede de "çünkü" yapay duruyor. |
| 3 | DÜZELT | greetings.s2_how_weekend | EN alt | — | Aynı bloklarla doğru sıra: "how was **the** weekend with **your** family" eksik. |
| 4 | DÜZELT | greetings.s3_thanks_everything | EN alt | "…see you soon again." | "see you soon again" doğal İngilizce değil; kabul listesinden çıkmalı. |
| 5 | DÜZELT | people.s2_grandmother_stories | EN alt | — | "…stories before bed every night" ve "Before bed every night…" aynı bloklarla doğru, eksik. |
| 6 | DÜZELT | numbers.phone_number | EN+TR alt | alt `number`, `numara` | Aynı temadaki `numbers.number` ile birebir çakışıyor: "telefon numarası" sorusuna "number" yazan doğru sayılıyor. |
| 7 | DÜZELT | numbers.s2_twice_week | EN alt | — | "Twice a week after work I go to the gym." eksik. |
| 8 | DÜZELT | numbers.s3_door_code | EN alt | — | "We live on the third floor, at number forty-five, …" aynı bloklarla doğru, eksik. |
| 9 | DÜZELT | numbers.s3_repeat_number | TR | "…tekrar eder misiniz, çünkü yalnızca ilk beş rakamı yazabildim." | Soru cümlesi noktayla bitiyor; soru eki ortada kalıyor. Sıralama değiştirilerek soru sona alınmalı. |
| 10 | DÜZELT | numbers.s3_million_views | TR | "…bir milyondan fazla izlenmeye ulaştı." | "izlenmeye ulaştı" çeviri kokuyor ve kulağa bozuk geliyor; doğalı "izlenme sayısı bir milyonu geçti". |
| 11 | DÜZELT | food.s2_turkish_breakfast | EN alt | "…eggs and tea usually." | Zarf cümle sonunda doğal değil; yanlış İngilizceyi kabul ediyor. |
| 12 | DÜZELT | time.s2_walk_every_day | EN alt | — | "Before breakfast I walk for thirty minutes every day." eksik. |
| 13 | DÜZELT | time.s3_weekdays | EN alt | — | "I get up at half past six on weekdays, but on Saturdays and Sundays I sleep until nine." eksik. |
| 14 | DÜZELT | calendar_colors.public_holiday | EN alt | alt `holiday` | Tek başına "holiday" resmî tatil değil; `travel.holiday` (tatil) alternatifiyle çakışıyor. |
| 15 | DÜZELT | calendar_colors.s2_dress_blue | TR | "…var mı, lütfen?" | "var mı" sorusuna sondan "lütfen" eklemek Türkçede doğal değil (İngilizce kalıbı). Doğalı "var mı acaba?". |
| 16 | DÜZELT | calendar_colors.s2_anniversary | TR | "on iki haziranda" | Belirli tarih bildiren ay adı büyük harfle yazılır ve ek kesmeyle ayrılır (TDK): "12 Haziran'da". 06'daki "3 Ekim" ile de tutarlı olur. |
| 17 | DÜZELT | calendar_colors.s3_party_saturday | TR | "partiyi onun yerine cumartesi yapıyoruz" | "onun yerine" "instead"ın birebir çevirisi; "onun" bir kişiyi çağrıştırıyor. Doğalı "partiyi cumartesiye alıyoruz". |
| 18 | DÜZELT | calendar_colors.s3_kitchen_calendar | TR | "büyük bir takvim tutuyoruz" | "keep a calendar"ın birebir çevirisi; Türkçede "takvim tutmak" ajanda tutmak gibi anlaşılır. Doğalı "takvimimiz var / takvim asılı". |
| 19 | DÜZELT | calendar_colors.s3_school_holidays | EN | "The school holidays…" | Ana cümle İngiltere kullanımı; kural gereği ABD varsayılan (`vacation`), İngiltere biçimi alternatife. |
| 20 | DÜZELT | home_clothes.s2_red_dress | TR | "…bir elbise giyiyor." | İngilizcedeki present continuous burada gelecek planı bildiriyor; Türkçede "giyiyor" "şu an giyiyor" diye okunuyor. Doğalı "giyecek". |
| 21 | DÜZELT | body_weather.s3_snow_play | EN | "play in the garden" | ABD'de evin önündeki/arkasındaki alan "yard"dır ("garden" sebze/çiçek bahçesi). ABD varsayılanı için "yard" ana metin olmalı. |
| 22 | DÜZELT | restaurant.todays_special | EN alt | alt `special` | Tek başına "special" `describing.special` (özel) ile çakışıyor: "günün yemeği" sorusuna "special" yazan doğru sayılıyor. |
| 23 | DÜZELT | restaurant.buffet | EN+TR alt | alt `open buffet`; `büfe` | "open buffet" ana dili İngilizce olanın kullandığı bir söz değil. Türkçede "büfe" büyük ölçüde kiosk/atıştırmalık tezgâhı anlamında, "buffet"in karşılığı değil (yanlış arkadaş). |
| 24 | SOR | food.s2_shopping_list ve listeli tüm cümleler | EN alt | — | Ürün kararı gerekiyor; aşağıya bakınız. |

### Yapıştırılacak satırlar

**1. greetings.s2_have_good_trip** (01-greetings.txt). "Hoşça kal"lı Türkçe alternatifler de aynı nedenle çıkarıldı.

```
greetings.s2_have_good_trip|Goodbye, have a good trip and call us when you arrive.|Goodbye, have a nice trip and call us when you arrive.;Bye, have a good trip and call us when you arrive.;Goodbye, have a good trip and when you arrive call us.;Goodbye, have a good trip, and call us when you get there.;Goodbye, have a safe trip and call us when you arrive.;Goodbye, call us when you arrive and have a good trip.|Güle güle, iyi yolculuklar, varınca bizi ara.|Güle güle, iyi yolculuklar, vardığında bizi ara.;Güle güle, iyi yolculuklar, varınca bizi arayın.
```

**2. greetings.s3_heard_about_you** (01). Ana cümle 15 kelime, zorluk 3 aralığında kalıyor.

```
greetings.s3_heard_about_you|It is a pleasure to meet you, my sister has told me so much about you.|It's a pleasure to meet you, my sister has told me so much about you.;It is a pleasure to meet you, my sister told me so much about you.;It's a pleasure to meet you, my sister told me so much about you.;My sister has told me so much about you, it is a pleasure to meet you.;My sister has told me so much about you, it's a pleasure to meet you.|Sizinle tanıştığıma çok memnun oldum, kız kardeşim bana sizden çok bahsetti.|Tanıştığımıza memnun oldum, kız kardeşim bana sizden çok söz etti.;Sizinle tanıştığıma çok memnun oldum, ablam bana sizden çok bahsetti.
```

**3. greetings.s2_how_weekend** (01)

```
greetings.s2_how_weekend|Good morning, how was your weekend with the family?|Good morning, how was your weekend with your family?;Morning, how was your weekend with the family?;Good morning, how was the weekend with your family?|Günaydın, aileyle hafta sonun nasıldı?|Günaydın, ailenle hafta sonun nasıl geçti?;Günaydın, aileyle hafta sonunuz nasıldı?
```

**4. greetings.s3_thanks_everything** (01)

```
greetings.s3_thanks_everything|Thank you for everything, we had a wonderful time here and we hope to see you again soon.|Thanks for everything, we had a wonderful time here and we hope to see you again soon.;Thank you for everything, we had a great time here and we hope to see you again soon.;Thank you for everything, we had a wonderful time here and hope to see you again soon.|Her şey için teşekkürler, burada harika vakit geçirdik ve yakında tekrar görüşmeyi umuyoruz.|Her şey için teşekkür ederiz, burada çok güzel zaman geçirdik, umarız yakında yine görüşürüz.
```

**5. people.s2_grandmother_stories** (02-people.txt)

```
people.s2_grandmother_stories|My grandmother tells the children stories every night before bed.|Every night before bed my grandmother tells the children stories.;My grandmother tells stories to the children every night before bed.;My grandma tells the children stories every night before bed.;My grandmother tells the kids stories every night before bed.;My grandmother tells the children stories before bed every night.;Before bed every night my grandmother tells the children stories.|Büyükannem her gece yatmadan önce çocuklara masal anlatıyor.|Babaannem her gece yatmadan önce çocuklara masal anlatır.;Anneannem her gece yatmadan önce çocuklara masal anlatır.
```

**6. numbers.phone_number** (03-numbers.txt)

```
numbers.phone_number|phone number|telephone number|telefon numarası|
```

**7. numbers.s2_twice_week** (03)

```
numbers.s2_twice_week|I go to the gym twice a week after work.|After work I go to the gym twice a week.;I go to the gym after work twice a week.;Twice a week I go to the gym after work.;I go to the gym two times a week after work.;Twice a week after work I go to the gym.|Haftada iki kez işten sonra spor salonuna gidiyorum.|İşten sonra haftada iki kez spor salonuna giderim.;Haftada iki gün işten sonra spora gidiyorum.
```

**8. numbers.s3_door_code** (03)

```
numbers.s3_door_code|We live at number forty-five, on the third floor, and the door code is seven eight two.|We live at number forty five, on the third floor, and the door code is seven eight two.;We live at number forty-five on the third floor and the door code is seven eight two.;We live at number 45, on the third floor, and the door code is 782.;We live on the third floor, at number forty-five, and the door code is seven eight two.;We live on the third floor, at number forty five, and the door code is seven eight two.|Kırk beş numarada, üçüncü katta oturuyoruz ve kapı şifresi yedi sekiz iki.|Kırk beş numarada, üçüncü katta yaşıyoruz, kapı kodu yedi sekiz iki.
```

**9. numbers.s3_repeat_number** (03)

```
numbers.s3_repeat_number|Could you repeat your phone number slowly, because I only wrote down the first five numbers?|Could you slowly repeat your phone number, because I only wrote down the first five numbers?;Could you repeat your phone number slowly, because I only wrote down the first five digits?;Can you repeat your phone number slowly, because I only wrote down the first five numbers?;Could you please repeat your phone number slowly, because I only wrote down the first five numbers?;Could you repeat your phone number slowly, please, because I only wrote down the first five numbers?|Sadece ilk beş rakamı yazabildim, telefon numaranızı yavaşça tekrar eder misiniz?|Telefon numaranızı yavaşça tekrar eder misiniz? Sadece ilk beş rakamı yazabildim.;Sadece ilk beş rakamı yazdım, telefon numaranı yavaşça tekrarlar mısın?
```

**10. numbers.s3_million_views** (03)

```
numbers.s3_million_views|Her first video had only fifty views, but a year later it had more than a million.|His first video had only fifty views, but a year later it had more than a million.;Her first video had only fifty views, but a year later it had over a million.;His first video had only fifty views, but a year later it had over a million.;Her first video had only fifty views, but one year later it had more than a million.|İlk videosu yalnızca elli kez izlenmişti ama bir yıl sonra izlenme sayısı bir milyonu geçti.|İlk videosunun sadece elli izlenmesi vardı ama bir yıl sonra bir milyonu geçti.
```

**11. food.s2_turkish_breakfast** (04-food.txt)

```
food.s2_turkish_breakfast|A Turkish breakfast usually has cheese, olives, eggs and tea.|A Turkish breakfast usually includes cheese, olives, eggs and tea.;Usually a Turkish breakfast has cheese, olives, eggs and tea.;A Turkish breakfast usually has cheese, olives, eggs, and tea.|Türk kahvaltısında genellikle peynir, zeytin, yumurta ve çay olur.|Bir Türk kahvaltısında genelde peynir, zeytin, yumurta ve çay bulunur.
```

**12. time.s2_walk_every_day** (05-time.txt)

```
time.s2_walk_every_day|I walk for thirty minutes every day before breakfast.|Every day I walk for thirty minutes before breakfast.;I walk for thirty minutes before breakfast every day.;Every day before breakfast I walk for thirty minutes.;I walk for half an hour every day before breakfast.;I walk thirty minutes every day before breakfast.;Before breakfast I walk for thirty minutes every day.;I walk every day for thirty minutes before breakfast.|Her gün kahvaltıdan önce otuz dakika yürüyorum.|Her gün kahvaltıdan önce yarım saat yürürüm.;Her gün kahvaltıdan önce otuz dakika yürüyüş yapıyorum.
```

**13. time.s3_weekdays** (05)

```
time.s3_weekdays|On weekdays I get up at half past six, but on Saturdays and Sundays I sleep until nine.|I get up at half past six on weekdays, but I sleep until nine on Saturdays and Sundays.;On weekdays I get up at half past six, but on Saturdays and Sundays I sleep till nine.;On weekdays I get up at six thirty, but on Saturdays and Sundays I sleep until nine.;On weekdays I get up at half past six, but I sleep until nine on Saturdays and Sundays.;I get up at half past six on weekdays, but on Saturdays and Sundays I sleep until nine.|Hafta içi altı buçukta kalkıyorum ama cumartesi ve pazar günleri dokuza kadar uyuyorum.|Hafta içi saat altı buçukta kalkarım, cumartesi ve pazarları ise dokuza kadar uyurum.
```

**14. calendar_colors.public_holiday** (06-calendar_colors.txt)

```
calendar_colors.public_holiday|public holiday|national holiday;bank holiday|resmî tatil|resmi tatil
```

**15. calendar_colors.s2_dress_blue** (06)

```
calendar_colors.s2_dress_blue|Do you have this dress in blue or green, please?|Do you have this dress in green or blue, please?;Please, do you have this dress in blue or green?;Do you have this dress in blue or in green, please?;Do you have this dress in blue or green?;Have you got this dress in blue or green, please?|Bu elbisenin mavisi ya da yeşili var mı acaba?|Bu elbise mavi ya da yeşil renkte var mı acaba?;Bu elbisenin mavisi veya yeşili var mı?
```

**16. calendar_colors.s2_anniversary** (06)

```
calendar_colors.s2_anniversary|Our wedding anniversary is on the twelfth of June.|Our wedding anniversary is on June twelfth.;Our wedding anniversary is June twelfth.;Our wedding anniversary is on June the twelfth.;Our wedding anniversary is on June 12.|Evlilik yıl dönümümüz 12 Haziran'da.|Evlilik yıldönümümüz 12 Haziran'da.;Evlilik yıl dönümümüz on iki Haziran'da.
```

**17. calendar_colors.s3_party_saturday** (06)

```
calendar_colors.s3_party_saturday|My birthday is on a Thursday this year, so we are having the party on Saturday instead.|This year my birthday is on a Thursday, so we are having the party on Saturday instead.;My birthday is on a Thursday this year, so we're having the party on Saturday instead.;This year my birthday is on a Thursday, so we're having the party on Saturday instead.;My birthday is on a Thursday this year, so we are having the party on Saturday.;My birthday falls on a Thursday this year, so we're having the party on Saturday instead.|Bu yıl doğum günüm perşembeye denk geliyor, bu yüzden partiyi cumartesiye alıyoruz.|Doğum günüm bu yıl perşembeye denk geldiği için partiyi cumartesi yapacağız.
```

**18. calendar_colors.s3_kitchen_calendar** (06)

```
calendar_colors.s3_kitchen_calendar|We keep a big calendar in the kitchen and write everyone's appointments on it in different colors.|We keep a big calendar in the kitchen and write everyone's appointments on it in different colours.;We keep a big calendar in the kitchen and write everyone's appointments in different colors on it.;We keep a large calendar in the kitchen and write everyone's appointments on it in different colors.;We have a big calendar in the kitchen and write everyone's appointments on it in different colors.|Mutfakta büyük bir takvimimiz var, herkesin randevularını üzerine farklı renklerle yazıyoruz.|Mutfakta büyük bir takvim asılı, herkesin randevularını onun üstüne farklı renklerle yazarız.
```

**19. calendar_colors.s3_school_holidays** (06)

```
calendar_colors.s3_school_holidays|The school vacation starts at the end of June and ends in the second week of September.|The school vacation starts at the end of June and finishes in the second week of September.;The school vacation begins at the end of June and ends in the second week of September.;The school holidays start at the end of June and finish in the second week of September.;The school holidays start at the end of June and end in the second week of September.;The school holidays begin at the end of June and finish in the second week of September.|Okul tatili haziran sonunda başlıyor ve eylülün ikinci haftasında bitiyor.|Okullar haziran sonunda tatile giriyor ve eylülün ikinci haftasında açılıyor.
```

**20. home_clothes.s2_red_dress** (07-home_clothes.txt)

```
home_clothes.s2_red_dress|She is wearing a long red dress to the party tonight.|She's wearing a long red dress to the party tonight.;Tonight she is wearing a long red dress to the party.;Tonight she's wearing a long red dress to the party.;She is wearing a long red dress tonight to the party.;She will wear a long red dress to the party tonight.;She's going to wear a long red dress to the party tonight.|Bu akşam partiye uzun kırmızı bir elbise giyecek.|Bu gece partiye uzun kırmızı bir elbise giyecek.;Bu akşam partide uzun kırmızı bir elbise giyecek.
```

**21. body_weather.s3_snow_play** (08-body_weather.txt)

```
body_weather.s3_snow_play|When it snows, the children run outside and play in the yard until their hands are freezing.|The children run outside when it snows and play in the yard until their hands are freezing.;When it snows the children run outside and play in the yard until their hands are freezing.;When it snows, the kids run outside and play in the yard until their hands are freezing.;When it snows, the children run outside and play in the garden until their hands are freezing.;The children run outside when it snows and play in the garden until their hands are freezing.|Kar yağınca çocuklar dışarı koşuyor ve elleri donana kadar bahçede oynuyorlar.|Kar yağdığında çocuklar dışarı koşar ve elleri buz kesene kadar bahçede oynar.
```

**22. restaurant.todays_special** (09-restaurant.txt)

```
restaurant.todays_special|today's special|daily special;special of the day;dish of the day|günün yemeği|günün menüsü;günün spesiyali
```

**23. restaurant.buffet** (09)

```
restaurant.buffet|buffet|all-you-can-eat buffet|açık büfe|
```

**24. SOR: Listeli cümlelerde sıra.** Örnekler: `food.s2_shopping_list` ("eggs, milk, bread and cheese"), `calendar_colors.s2_leaves_fall`, `calendar_colors.s3_navy_suit` ("a white shirt and a gold tie"), `home_clothes.s3_packing`, `food.s3_run_out` ("milk and eggs"). Virgüller bloğa yapışık olsa da karşılaştırmada atılıyor. Bu yüzden "milk, eggs, bread and cheese" gibi her permütasyon dilbilgisi açısından doğru ve anlamı aynı, ama çoğu `enAlts`'ta yok. Türkçe istem sırayı verdiği için oyuncu büyük olasılıkla aynı sırayı izler.
Karar Furkan'ın: (a) liste sırası serbest olsun ve kod tarafında çözülsün (ör. "ve/and"den önceki liste öğelerinin sırasız karşılaştırılması), (b) sıra Türkçe istemi izlemek zorunda kabul edilsin ve olduğu gibi bırakılsın, ya da (c) her permütasyon `enAlts`'a elle yazılsın. (c) önerilmez, çünkü 3 öğeli bir listede 6 sıra çıkıyor.

### Yazarın emin olmadığı noktalar (bulgu çıkmayanlar)

- **greetings.how_are_you ile sentence.l3_how_you aynı metin:** Sorun yok. `sentence.l3_how_you` yalnızca `kid/01-kid_greetings.txt` içinde kullanılıyor, yetişkin temalarında yok. Kinds de farklı (phrase/sentence) ve üretici şıkları aynı türden seçiyor.
- **greetings.how_about_you "and you" = "ya sen":** Doğal ve doğru. "Ya sen?" tam karşılık.
- **restaurant.todays_special = "günün yemeği":** Doğru; esnaf lokantası ve menülerde yaygın. Yalnızca `special` alternatifi çıkarılmalı (bulgu 22).
- **restaurant.baked = "fırında":** Menü bağlamında doğal ("fırında tavuk" = baked chicken). "oven-baked" kabul ediliyor: tire silinince "ovenbaked" oluyor, "oven baked" yazımı da 1 harf toleransıyla geçiyor.
- **calendar_colors.navy = "lacivert":** Doğru. "koyu mavi" ve "dark blue" gevşek ama kabul edilebilir alternatifler; yetişkin havuzunda ayrı bir "dark blue" kavramı olmadığı için çakışma yok.
- **time.day_before_yesterday = "evvelsi gün":** Doğru ve TDK'da var; "evvelki gün" ve "önceki gün" alternatiflerde duruyor. "Önceki gün" günlük dilde daha sık ama "bir önceki gün" anlamına da geldiği için ana metin olarak "evvelsi gün" daha net. Değişiklik gerekmiyor.
- **"enjoy your meal" = "afiyet olsun", "bless you" = "çok yaşa":** İkisi de doğal ve durum için doğru. Tek fark şu: "afiyet olsun" Türkçede yemekten sonra da söylenir, "enjoy your meal" yalnızca yemekten önce. Oyunda soruna yol açmaz.

## 3. Seviye gözlemleri

Bu dokuz temanın hepsi `@band A1`. Kelime ve kolay/orta cümleler genel olarak uygun. Ancak:

- **A2–B1 dilbilgisi taşıyan zor (3) cümleler:** `greetings.s3_forgot_name` (although + present perfect), `greetings.s3_heard_about_you` (present perfect), `people.s3_twins` (tell apart), `people.s3_friends_school` (have been … since), `food.s3_hide_vegetables` (get someone to do), `food.s3_run_out` (run out of + present perfect), `body_weather.s3_hot_summer` (so … that), `body_weather.s3_cut_finger` (past continuous). Orta düzeyde de `numbers.s2_second_time` (this is the second time + present perfect) A2 üstü. Zorluk 3 bir üst basamağa uzanabilir ama "A1" bandında yer almaları seviye testinin sonucunu yanıltabilir.
- **A1 üstü kelimeler:** anniversary, public holiday, beige, navy blue, forecast, sunscreen, lightning (cümlede), high chair, toothpick, tablecloth, straw, buffet, reserved, boiled, baked, terrace, sparkling water. Restoran kelimelerinin çoğu A2, toothpick/high chair ise sıklığı düşük kelimeler. Bunlar ya 26-restaurant_2 gibi sonraki bir temaya taşınmalı ya da bant A2 yapılmalı. Bu bir ürün kararı.
