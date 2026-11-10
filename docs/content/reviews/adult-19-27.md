# Çeviri denetimi: yetişkin temaları 19–27

Kapsam: `content-src/themes/adult/19-people_feelings.txt` … `27-idioms_2.txt` içindeki yeni ya da değişen satırlar (`kimlik|English|enAlts|Türkçe|trAlts`). Yalnız kimlikten oluşan satırlar (daha önce denetlenmiş kavramlar) atlandı.

Kontrol yöntemi: her satır anlam, doğallık, dilbilgisi, `alt` listeleri, seviye ve oyun uygunluğu açısından okundu. Ek olarak:

- `src/features/answer-check/check.ts` okundu: büyük/küçük harf ve noktalama yok sayılıyor, uzun cevaplarda en çok 2 harf hatası tolere ediliyor. Bu yüzden Türkçe isteminde olmayan bir sözcüğün ("so", "a bit") İngilizcede zorunlu olması yazarak çevirmede doğru cevabı reddettiriyor.
- `src/features/quiz/generate.ts` okundu: aynı metni (ana metin ya da alt) paylaşan kavramlar şık olarak birbirini dışlıyor. Yeni kavramlarla mevcut kavramlar arasında metin çakışması bir betikle tarandı.
- `node scripts/content.mjs --check` çalıştırıldı (hiçbir şey yazmaz): geçti.

## 1. Sonuç

- **Kontrol edilen satır:** 295 yeni ya da değişen satır (19: 32, 20: 28, 21: 38, 22: 35, 23: 24, 24: 32, 25: 40, 26: 13, 27: 53).
- **Bulgular:** HATA 3 · DÜZELT 30 · SOR 3
- **Yayın kararı:** `DÜZELTMEYLE GEÇER`. Üç HATA (bir anlam hatası, bir bozuk Türkçe alternatif, bir doğal olmayan İngilizce ana cevap) ve yazarak çevirmede doğru cevabı reddettiren eksik alternatifler düzeltilince yayına çıkabilir.

## 2. Bulgular

Özet tablo. Önerilen tam satırlar tablonun altında, her biri doğrudan tema dosyasına yapıştırılabilir.

| # | Şiddet | Kimlik | Dil | Gerekçe (kısa) |
| - | ------ | ------ | --- | -------------- |
| 1 | HATA | `time_links.s3_still_not_finished` | EN | "still … yet" birlikte doğal değil; "still haven't finished it" yazan reddedilir |
| 2 | HATA | `actions_3.s3_teach_cook` | TR | "Annem on iki yaşındayken" = annem on iki yaşındayken |
| 3 | HATA | `describing_2.s3_rich_neighborhood` | TR/EN | trAlt bozuk Türkçe; "can live here" eksik |
| 4 | DÜZELT | `time_links.although` | TR | "-e rağmen" = despite; although = "-mesine rağmen / -se de" |
| 5 | DÜZELT | `idioms.knock_on_wood` | TR | "tahtaya vur" emir kipiyle bu bağlamda kullanılmaz |
| 6 | DÜZELT | `idioms.s1_knock_on_wood` | TR | aynı |
| 7 | DÜZELT | `restaurant_2.undercooked` | TR | "iyi pişmemiş" well done "iyi pişmiş" ile karışır; "az pişmiş" = rare |
| 8 | DÜZELT | `restaurant_2.s1_chicken_undercooked` | TR/EN | aynı; "not cooked enough" cümle alternatifi yok |
| 9 | DÜZELT | `idioms_2.s2_midnight_oil` | TR/EN | "her gece geceyi gündüze kattı" tekrar, doğal değil |
| 10 | DÜZELT | `people_feelings.s3_confident_interview` | TR | "kendimi emin hissettim" çeviri kokuyor |
| 11 | DÜZELT | `describing_2.s2_room_bright` | EN | "a wide living room" doğal değil (oda için spacious/large) |
| 12 | DÜZELT | `actions_2.s2_relax_weekend` | TR | "evde rahatlamayı" çeviri kokuyor; "dinlenmeyi" |
| 13 | DÜZELT | `people_feelings.s2_patient_children` | EN | "olmalısın" → should/must alternatifleri yok |
| 14 | DÜZELT | `people_feelings.s2_relatives_holiday` | EN | "All of our", "for the holiday" yok |
| 15 | DÜZELT | `describing_2.s2_road_dangerous` | TR/EN | TR isteminde "o yüzden" yok, EN'de "so" zorunlu |
| 16 | DÜZELT | `describing_2.s2_fridge_empty` | TR/EN | aynı ("bu yüzden" / "so") |
| 17 | DÜZELT | `time_links.s2_probably_rain` | TR/EN | aynı |
| 18 | DÜZELT | `time_links.s1_just_arrived` | EN | ABD'de en olağan "I just got home." yok |
| 19 | DÜZELT | `time_links.s2_recently_tired` | TR/EN | "I've been feeling", "lately" yok; TR'de "kendimi" eksik |
| 20 | DÜZELT | `idioms.s1_under_weather` | EN | TR "biraz" var; "a bit under the weather" yok |
| 21 | DÜZELT | `leisure_world.s1_love_song` | EN | TR "çok seviyorum"; "so much / very much" yok |
| 22 | DÜZELT | `restaurant_2.s1_soup_cold` | EN | TR "buz gibi"; "ice cold" yok |
| 23 | DÜZELT | `restaurant_2.s1_bread_stale` | TR | garsona "Korkarım…" denmez; "Maalesef…" |
| 24 | DÜZELT | `idioms.s2_by_the_way` | TR | "annene geri döndün mü" iki anlamlı; ana metin trAlt ile yer değiştirmeli |
| 25 | DÜZELT | `leisure_world.s2_exhibition_paintings` | TR | trAlt "yeni bir eski tablolar sergisi" doğal değil |
| 26 | DÜZELT | `actions_3.s2_collect_stamps` | EN | "biriktiriyor" → "has been collecting" yok |
| 27 | DÜZELT | `leisure_world.s3_football_match` | EN | ana metin İngiliz ("football match"); ABD "soccer game" |
| 28 | DÜZELT | `actions_3.s3_protect_skin` | EN | ana metin İngiliz ("sun cream"); ABD "sunscreen" |
| 29 | DÜZELT | `idioms_2.drop_in_the_ocean` | EN | ABD biçimi "a drop in the bucket" |
| 30 | DÜZELT | `idioms_2.s2_drop_ocean` | EN | aynı |
| 31 | DÜZELT | `describing_2.s3_boring_film` | EN | ABD ana metin "movie" (kavram `leisure.film` = movie) |
| 32 | DÜZELT | `time_links.s2_suddenly_lights` | EN | aynı |
| 33 | DÜZELT | `idioms.s2_make_up_mind` | EN | ABD ana metin "store" |
| 34 | SOR | `time_links.ever`, `time_links.however`, `actions_3.join`, `people_feelings.polite` | TR | yazarak çevirmede istem başka kavramın da doğru cevabı |
| 35 | SOR | `idioms_2.speak_of_the_devil` | TR | "iti an çomağı hazırla" üslubu daha kaba |
| 36 | SOR | `idioms_2.storm_in_a_teacup` | EN | ABD biçimi "a tempest in a teapot" |

### HATA

**1. `time_links.s3_still_not_finished`** (EN). Mevcut: `…but they still have not finished it yet.` "still" ve "yet" aynı olumsuz cümlede birlikte kullanılmaz; ana dili İngilizce olan biri ya "still haven't finished it" ya da "haven't finished it yet" der. Üstelik doğru cevap olan "…they still haven't finished it." 4 harf eksik olduğu için (izin 2) yanlış sayılır.

```text
time_links.s3_still_not_finished|They started building the new bridge three years ago, but they still have not finished it.|They started building the new bridge three years ago, but they still haven't finished it.;They started to build the new bridge three years ago, but they still have not finished it.;They started to build the new bridge three years ago, but they still haven't finished it.;They started building the new bridge three years ago, but they have not finished it yet.;They started building the new bridge three years ago, but they haven't finished it yet.|Yeni köprüyü üç yıl önce yapmaya başladılar ama hâlâ bitirmediler.|
```

**2. `actions_3.s3_teach_cook`** (TR). Mevcut: `Annem on iki yaşındayken bana yemek yapmayı öğretti, …` "-ken" yan cümlesinin öznesi ana cümlenin öznesi (annem) olarak okunur: "annem on iki yaşındayken". İngilizcede "when I was twelve".

```text
actions_3.s3_teach_cook|My mother taught me how to cook when I was twelve, and now I prepare dinner for the whole family.|My mother taught me how to cook when I was twelve and now I prepare dinner for the whole family.;When I was twelve, my mother taught me how to cook, and now I prepare dinner for the whole family.;My mom taught me how to cook when I was twelve, and now I prepare dinner for the whole family.;When I was twelve, my mom taught me how to cook, and now I prepare dinner for the whole family.|Ben on iki yaşındayken annem bana yemek yapmayı öğretti, şimdi bütün aileye akşam yemeğini ben hazırlıyorum.|On iki yaşımdayken annem bana yemek yapmayı öğretti, şimdi bütün ailenin akşam yemeğini ben hazırlıyorum.
```

**3. `describing_2.s3_rich_neighborhood`** (TR/EN). Mevcut trAlt: `…burada ancak zenginler yaşamayı karşılayabilir.` "afford"un sözcüğü sözcüğüne çevirisi; Türkçede "yaşamayı karşılamak" diye bir kullanım yok. Ayrıca Türkçe ana metin "yaşayabilir" diyor; bunu "only rich people can live here" diye çeviren oyuncu reddedilir ("afford to " 10 harf).

```text
describing_2.s3_rich_neighborhood|The houses in this neighborhood are beautiful, but only rich people can afford to live here.|The houses in this neighbourhood are beautiful, but only rich people can afford to live here.;The houses in this neighborhood are beautiful, but only rich people can live here.;The houses in this neighbourhood are beautiful, but only rich people can live here.;The houses in this neighborhood are very beautiful, but only rich people can afford to live here.;The houses in this neighborhood are very beautiful, but only rich people can live here.|Bu mahalledeki evler çok güzel ama burada yalnızca zengin insanlar yaşayabilir.|Bu mahalledeki evler çok güzel ama burada oturmaya ancak zenginlerin gücü yeter.
```

### DÜZELT

**4. `time_links.although`** (TR). Mevcut: `-e rağmen|rağmen`. "-e rağmen" isme gelen edattır (yağmura rağmen) ve "despite / in spite of" karşılığıdır. "although" yan cümle bağlar: "-mesine rağmen" ya da "-se de". Örnek cümle (`s3_although_tired`) zaten "olmama rağmen" kullanıyor. İleride B1'e "despite" eklenirse iki kavram aynı Türkçeyi paylaşır.

```text
time_links.although|although|though;even though|-mesine rağmen|-se de;rağmen
```

**5. `idioms.knock_on_wood`** (TR). Mevcut: `tahtaya vur|şeytan kulağına kurşun`. Türkçede bu kalıp kişinin kendi sözü için söylenir: "tahtaya vurayım" ya da "şeytan kulağına kurşun". Karşıdakine "tahtaya vur" demek başka bir şey (ona bir emir). Deyime karşılık gelen deyim "şeytan kulağına kurşun".

```text
idioms.knock_on_wood|knock on wood|touch wood|şeytan kulağına kurşun|tahtaya vurmak;tahtaya vur
```

**6. `idioms.s1_knock_on_wood`** (TR). Mevcut: `Her şey yolunda, tahtaya vur.` Aynı gerekçe.

```text
idioms.s1_knock_on_wood|Everything is fine, knock on wood.|Knock on wood, everything is fine.;Everything is fine, touch wood.;Touch wood, everything is fine.|Her şey yolunda, şeytan kulağına kurşun.|Her şey yolunda, tahtaya vurayım.
```

**7. `restaurant_2.undercooked`** (TR). Mevcut: `iyi pişmemiş|az pişmiş kalmış;çiğ kalmış`. Aynı temada `restaurant.well_done` = "iyi pişmiş" ve `restaurant.rare` = "az pişmiş". Türkçede "iyi pişmemiş" kolayca "well done değil" diye okunur ve çoktan seçmelide "iyi pişmiş / iyi pişmemiş" iki harf farkla yan yana gelebilir. "Az pişmiş" ise bir tercih (rare), kusur değil. Kusuru en açık anlatan "yeterince pişmemiş".

```text
restaurant_2.undercooked|undercooked|not cooked enough|yeterince pişmemiş|iyi pişmemiş;çiğ kalmış
```

**8. `restaurant_2.s1_chicken_undercooked`** (TR/EN). Aynı gerekçe. "Yeterince pişmemiş" istemini "not cooked enough" diye çeviren oyuncu da kabul edilmeli.

```text
restaurant_2.s1_chicken_undercooked|This chicken is undercooked.|The chicken is undercooked.;This chicken is not cooked enough.;This chicken isn't cooked enough.;The chicken is not cooked enough.;The chicken isn't cooked enough.|Bu tavuk yeterince pişmemiş.|Bu tavuk iyi pişmemiş.;Bu tavuk çiğ kalmış.
```

**9. `idioms_2.s2_midnight_oil`** (TR/EN). Mevcut: `Final sınavlarından önce her gece geceyi gündüze kattı.` "Her gece geceyi" tekrarı doğal değil; deyim zaten süreklilik bildiriyor. "Every night" yerine "for weeks" alınırsa iki dil örtüşür ve uzunluk korunur.

```text
idioms_2.s2_midnight_oil|She burned the midnight oil for weeks before her final exams.|He burned the midnight oil for weeks before his final exams.;She burnt the midnight oil for weeks before her final exams.;He burnt the midnight oil for weeks before his final exams.;For weeks before her final exams, she burned the midnight oil.;For weeks before his final exams, he burned the midnight oil.|Final sınavlarından önce haftalarca geceyi gündüze kattı.|Final sınavlarından önce haftalarca geceyi gündüze katarak çalıştı.
```

**10. `people_feelings.s3_confident_interview`** (TR). Mevcut: `…kendimi çok daha emin hissettim.` "Kendimi emin hissetmek" çeviri kokuyor; doğal söyleyiş "kendimi özgüvenli hissetmek", "kendime güvenmek" ya da "kendimden emin olmak". İngilizce alternatiflere "really nervous before" sırası da eklendi.

```text
people_feelings.s3_confident_interview|Before the interview I was very nervous, but after the first few questions I felt much more confident.|Before the interview I was really nervous, but after the first few questions I felt much more confident.;I was very nervous before the interview, but after the first few questions I felt much more confident.;I was really nervous before the interview, but after the first few questions I felt much more confident.|Görüşmeden önce çok gergindim ama ilk birkaç sorudan sonra kendimi çok daha özgüvenli hissettim.|Mülakattan önce çok gergindim ama ilk birkaç sorudan sonra kendime çok daha fazla güvendim.;Görüşmeden önce çok gergindim ama ilk birkaç sorudan sonra kendimden çok daha emin oldum.
```

**11. `describing_2.s2_room_bright`** (EN). Mevcut: `…has a bright and wide living room.` İngilizcede oda için "wide" denmez; "geniş oda" = "spacious / large room". (Not: bu değişiklikle `quality.wide` temada örnek cümlesiz kalır; kural gerektirmiyor, istenirse başka bir cümlede "The river is very wide here." gibi kullanılabilir.)

```text
describing_2.s2_room_bright|Our new apartment has a bright and spacious living room.|Our new apartment has a spacious and bright living room.;Our new apartment has a bright, spacious living room.;Our new apartment has a large and bright living room.;Our new apartment has a bright and large living room.;Our new flat has a bright and spacious living room.;Our new flat has a spacious and bright living room.|Yeni dairemizin aydınlık ve geniş bir oturma odası var.|
```

**12. `actions_2.s2_relax_weekend`** (TR). Mevcut: `Hafta sonları evde rahatlamayı ve kitap okumayı severim.` Bu bağlamda "relax" = "dinlenmek"; "evde rahatlamayı severim" çeviri Türkçesi. İngilizce alternatiflere "relaxing … reading" ve "On the weekend" eklendi.

```text
actions_2.s2_relax_weekend|On weekends I like to relax at home and read a book.|I like to relax at home and read a book on weekends.;At weekends I like to relax at home and read a book.;On weekends I like relaxing at home and reading a book.;I like relaxing at home and reading a book on weekends.;On the weekend I like to relax at home and read a book.|Hafta sonları evde dinlenmeyi ve kitap okumayı severim.|Hafta sonları evde dinlenip kitap okumayı severim.
```

**13. `people_feelings.s2_patient_children`** (EN). Türkçe istem "olmalısın"; bunun ilk akla gelen çevirisi "should / must be". İkisi de kabul listesinde yok ve "need to" ile 3+ harf fark ettiği için reddedilir.

```text
people_feelings.s2_patient_children|You need to be very patient when you work with small children.|You have to be very patient when you work with small children.;You should be very patient when you work with small children.;You must be very patient when you work with small children.;You need to be very patient when working with small children.;You have to be very patient when working with small children.;You should be very patient when working with small children.;When you work with small children, you need to be very patient.;When you work with small children, you have to be very patient.;When you work with small children, you should be very patient.|Küçük çocuklarla çalışırken çok sabırlı olmalısın.|
```

**14. `people_feelings.s2_relatives_holiday`** (EN). "Bütün akrabalarımız" en sık "All of our relatives" diye yazılır (3 harf fark, reddedilir). "Bayramda" için "for the holiday" da doğru.

```text
people_feelings.s2_relatives_holiday|All our relatives come to my grandmother's house during the holiday.|During the holiday, all our relatives come to my grandmother's house.;All of our relatives come to my grandmother's house during the holiday.;During the holiday, all of our relatives come to my grandmother's house.;All our relatives come to my grandmother's house for the holiday.;All of our relatives come to my grandmother's house for the holiday.;All our relatives come to my grandma's house during the holiday.|Bayramda bütün akrabalarımız büyükannemin evine gelir.|Tatilde bütün akrabalarımız büyükannemin evine gelir.
```

**15–17. "so" eksik istemler** (TR/EN). Türkçe ana metinde bağlaç yok ama İngilizce ana metinde "so" var. Türkçe istemi birebir çeviren oyuncu "so " (3 harf) eksik yazdığı için reddedilir. Çözüm: Türkçe ana metne "o yüzden / bu yüzden" eklemek, eski Türkçeyi trAlt'a almak ve "so"suz İngilizceyi de kabul etmek.

```text
describing_2.s2_road_dangerous|This road is narrow and dangerous, so please drive slowly.|This road is dangerous and narrow, so please drive slowly.;This road is narrow and dangerous, so drive slowly, please.;This road is narrow and dangerous, please drive slowly.;This road is dangerous and narrow, please drive slowly.|Bu yol dar ve tehlikeli, o yüzden lütfen yavaş sür.|Bu yol dar ve tehlikeli, lütfen yavaş sür.
```

```text
describing_2.s2_fridge_empty|The fridge is almost empty, so we need to go shopping.|The fridge is nearly empty, so we need to go shopping.;The refrigerator is almost empty, so we need to go shopping.;The fridge is almost empty, so we have to go shopping.;The fridge is almost empty, so we should go shopping.;The fridge is almost empty, we need to go shopping.|Buzdolabı neredeyse boş, bu yüzden alışverişe gitmemiz gerekiyor.|Buzdolabı neredeyse boş, alışverişe gitmemiz gerekiyor.;Buzdolabı neredeyse boş, bu yüzden alışverişe gitmeliyiz.
```

```text
time_links.s2_probably_rain|It will probably rain tomorrow, so take your umbrella with you.|It'll probably rain tomorrow, so take your umbrella with you.;It will probably rain tomorrow, so take an umbrella with you.;It'll probably rain tomorrow, so take an umbrella with you.;It will probably rain tomorrow, take your umbrella with you.;It'll probably rain tomorrow, take your umbrella with you.|Yarın muhtemelen yağmur yağacak, o yüzden şemsiyeni yanına al.|Yarın muhtemelen yağmur yağacak, şemsiyeni yanına al.;Yarın büyük ihtimalle yağmur yağacak, o yüzden şemsiyeni yanına al.
```

**18. `time_links.s1_just_arrived`** (EN). "Eve az önce geldim" için ABD'de en olağan söyleyiş "I just got home." Listede yok ve "arrived" ile çok fark ediyor.

```text
time_links.s1_just_arrived|I have just arrived home.|I've just arrived home.;I just arrived home.;I just got home.;I've just got home.;I have just got home.;I've just gotten home.;I just came home.;I've just come home.|Eve az önce geldim.|Eve yeni geldim.
```

**19. `time_links.s2_recently_tired`** (TR/EN). "Son zamanlarda … hissediyorum" için doğal İngilizce "I've been feeling … lately/recently"; hiçbiri kabul edilmiyor. Türkçede "kendimi çok yorgun hissediyorum" daha doğal ("hissetmek" nesne ister).

```text
time_links.s2_recently_tired|I have felt very tired recently, so I am going to see a doctor.|I've felt very tired recently, so I'm going to see a doctor.;I have been feeling very tired recently, so I am going to see a doctor.;I've been feeling very tired recently, so I'm going to see a doctor.;I've been feeling very tired lately, so I'm going to see a doctor.;I have felt very tired lately, so I am going to see a doctor.;I've felt very tired lately, so I'm going to see a doctor.;I have felt very tired recently, so I will see a doctor.;I've felt very tired recently, so I'll see a doctor.;Recently I have felt very tired, so I am going to see a doctor.;Recently I've felt very tired, so I'm going to see a doctor.|Son zamanlarda kendimi çok yorgun hissediyorum, bu yüzden doktora gideceğim.|Son zamanlarda çok yorgun hissediyorum, bu yüzden doktora gideceğim.
```

**20. `idioms.s1_under_weather`** (EN). Türkçe istem "biraz keyifsizim"; "a bit / a little under the weather" (en doğal söyleyiş) reddediliyor.

```text
idioms.s1_under_weather|I feel under the weather today.|Today I feel under the weather.;I'm feeling under the weather today.;I am feeling under the weather today.;I feel a bit under the weather today.;I'm feeling a bit under the weather today.;I am feeling a bit under the weather today.;I feel a little under the weather today.;I'm feeling a little under the weather today.|Bugün biraz keyifsizim.|Bugün kendimi pek iyi hissetmiyorum.
```

**21. `leisure_world.s1_love_song`** (EN). Türkçe istem "çok seviyorum"; "I love this song so much / very much" reddediliyor.

```text
leisure_world.s1_love_song|I love this song.|I really love this song.;I love this song so much.;I love this song very much.;I love this song a lot.|Bu şarkıyı çok seviyorum.|Bu şarkıya bayılıyorum.
```

**22. `restaurant_2.s1_soup_cold`** (EN). Türkçe istem "buz gibi olmuş"; "My soup is ice cold." yazan reddediliyor.

```text
restaurant_2.s1_soup_cold|My soup is completely cold.|My soup is totally cold.;My soup is ice cold.;My soup is stone cold.;My soup got cold.;My soup has gone cold.|Çorbam buz gibi olmuş.|Çorbam tamamen soğumuş.
```

**23. `restaurant_2.s1_bread_stale`** (TR). Mevcut: `Korkarım ekmek bayat.` "I'm afraid" kalıbının dublaj çevirisi; garsona Türkçede "Maalesef ekmek bayat" denir. İstem değişince "Unfortunately…" de kabul edilmeli.

```text
restaurant_2.s1_bread_stale|I am afraid the bread is stale.|I'm afraid the bread is stale.;The bread is stale, I am afraid.;The bread is stale, I'm afraid.;Unfortunately, the bread is stale.|Maalesef ekmek bayat.|Korkarım ekmek bayat.
```

**24. `idioms.s2_by_the_way`** (TR). Mevcut: `Bu arada, dün annene geri döndün mü?` "Geri dönmek" (dönüş yapmak) iş dili argosu ve "annenin yanına geri döndün mü" diye de okunur. trAlt'taki "anneni geri aradın mı" açık ve doğal; ana metin o olmalı.

```text
idioms.s2_by_the_way|By the way, did you call your mother back yesterday?|By the way, did you call back your mother yesterday?;Did you call your mother back yesterday, by the way?;By the way, did you call your mom back yesterday?;By the way, did you call back your mom yesterday?|Bu arada, dün anneni geri aradın mı?|Bu arada, dün annene geri döndün mü?
```

**25. `leisure_world.s2_exhibition_paintings`** (TR). trAlt `Müzede yeni bir eski tablolar sergisi var.` "Yeni bir eski" yan yana doğal değil.

```text
leisure_world.s2_exhibition_paintings|There is a new exhibition of old paintings at the museum.|At the museum there is a new exhibition of old paintings.;There's a new exhibition of old paintings at the museum.;At the museum there's a new exhibition of old paintings.|Müzede eski tablolardan oluşan yeni bir sergi var.|Müzede eski tabloların yer aldığı yeni bir sergi var.
```

**26. `actions_3.s2_collect_stamps`** (EN). "Gençliğinden beri … biriktiriyor" için en doğal çeviri "has been collecting"; kabul edilmiyor.

```text
actions_3.s2_collect_stamps|My grandfather has collected stamps from many countries since he was young.|Since he was young, my grandfather has collected stamps from many countries.;My grandfather has been collecting stamps from many countries since he was young.;Since he was young, my grandfather has been collecting stamps from many countries.|Dedem gençliğinden beri birçok ülkeden pul biriktiriyor.|Dedem gençliğinden beri birçok ülkenin pulunu topluyor.
```

**27–33. Ana metin ABD İngilizcesi değil** (EN). Kural: İngilizce varsayılanı ABD. Aşağıdakilerde ana metin İngiliz biçiminde, ABD biçimi yalnız alternatifte (ya da hiç yok). Ana metin cümle kurmada blokları ve "doğru cevap" ekranını belirlediği için ABD biçimi ana metin olmalı.

```text
leisure_world.s3_football_match|My husband watches every soccer game on TV, but he has never played a sport in his life.|My wife watches every soccer game on TV, but she has never played a sport in her life.;My husband watches every football match on TV, but he has never played a sport in his life.;My wife watches every football match on TV, but she has never played a sport in her life.;My husband watches every soccer match on TV, but he has never played a sport in his life.;My wife watches every soccer match on TV, but she has never played a sport in her life.|Eşim televizyondaki her futbol maçını izler ama hayatında hiç spor yapmamıştır.|
```

```text
actions_3.s3_protect_skin|In summer you should wear a hat and use sunscreen to protect your skin from the sun.|In summer you should wear a hat and use sun cream to protect your skin from the sun.;You should wear a hat and use sunscreen in summer to protect your skin from the sun.;You should wear a hat and use sun cream in summer to protect your skin from the sun.|Yazın cildini güneşten korumak için şapka takmalı ve güneş kremi kullanmalısın.|
```

```text
idioms_2.drop_in_the_ocean|a drop in the bucket|a drop in the ocean;drop in the bucket;drop in the ocean|devede kulak|
```

```text
idioms_2.s2_drop_ocean|The money we collected is just a drop in the bucket.|The money that we collected is just a drop in the bucket.;The money we collected is only a drop in the bucket.;The money we collected is just a drop in the ocean.;The money that we collected is just a drop in the ocean.;The money we collected is only a drop in the ocean.|Topladığımız para devede kulak.|Topladığımız para sadece devede kulak kalıyor.
```

```text
describing_2.s3_boring_film|Everyone said the movie was interesting, but I found it so boring that I fell asleep after twenty minutes.|Everyone said the film was interesting, but I found it so boring that I fell asleep after twenty minutes.;Everybody said the movie was interesting, but I found it so boring that I fell asleep after twenty minutes.;Everybody said the film was interesting, but I found it so boring that I fell asleep after twenty minutes.|Herkes filmin ilginç olduğunu söyledi ama ben o kadar sıkıcı buldum ki yirmi dakika sonra uyuyakaldım.|
```

```text
time_links.s2_suddenly_lights|We were watching a movie when suddenly all the lights went out.|We were watching a film when suddenly all the lights went out.;We were watching a movie when all the lights suddenly went out.;We were watching a film when all the lights suddenly went out.|Film izliyorduk ki birden bütün ışıklar söndü.|Film izlerken aniden bütün ışıklar söndü.
```

```text
idioms.s2_make_up_mind|You need to make up your mind before the store closes.|You have to make up your mind before the store closes.;You need to make up your mind before the shop closes.;You have to make up your mind before the shop closes.|Mağaza kapanmadan kararını vermen gerekiyor.|
```

### SOR

**34. Yazarak çevirmede istemin başka bir kavramın da doğru cevabı olması** (`time_links.ever`, `time_links.however`, `actions_3.join`, `people_feelings.polite`). Çoktan seçmelide sorun yok: `generate.ts` ortak metni olan kavramları şık olarak dışlıyor. Ama yazarak çevirmede istem yalnız Türkçe ana metindir ve aşağıdaki istemler mevcut bir kavramın kabul edilen Türkçesiyle aynı:

| Yeni kavram (istem) | Aynı Türkçeyi kabul eden mevcut kavram | Oyuncunun yazabileceği, reddedilen cevap |
| ------------------- | -------------------------------------- | ---------------------------------------- |
| `time_links.ever` ("hiç") | `time.never` (alt: "hiç") | never |
| `time_links.however` ("ancak") | `function.but` (alt: "fakat; ancak") | but |
| `actions_3.join` ("katılmak") | `action.agree` (alt: "katılmak") | agree |
| `people_feelings.polite` ("kibar") | `person.kind` (alt: "kibar") | kind |

Karar Furkan'ın: (a) yazarak çevirmede başka bir kavramın kabul listesindeki cevaba "doğru, ama aranan kelime X" geri bildirimi vermek (kod değişikliği), (b) mevcut kavramlardan çakışan alt'ları çıkarmak ("hiç", "ancak", "katılmak", "kibar"), ya da (c) yeni kavramın Türkçesini ayırt edici yapmak (ör. `actions_3.join` için "bir gruba katılmak"). `however` için en az zararlı yerel çözüm "but"u enAlts'a eklemek: `time_links.however|however|but|ancak|fakat;ne var ki;bununla birlikte`.

**35. `idioms_2.speak_of_the_devil`** (TR). "İti an çomağı hazırla" doğru karşılık ama gelen kişiyi ite benzettiği için İngilizcedeki şakacı kalıptan belirgin biçimde daha kaba; yakın arkadaşlar arasında kullanılır. Kibar Türkçe karşılık "iyi insan lafının üstüne gelir". Öneri (alt olarak eklemek ürün kararı):

```text
idioms_2.speak_of_the_devil|speak of the devil||iti an çomağı hazırla|iyi insan lafının üstüne gelir
```

**36. `idioms_2.storm_in_a_teacup`** (EN). ABD biçimi "a tempest in a teapot" ama İngiliz biçimi uluslararası olarak daha bilinir. ABD varsayılanı kuralı deyimlerde de uygulanacaksa:

```text
idioms_2.storm_in_a_teacup|a tempest in a teapot|a storm in a teacup;tempest in a teapot;storm in a teacup|bir bardak suda fırtına|
```

## Yazarın emin olmadığı satırlar

| Kimlik | Karar |
| ------ | ----- |
| `idioms_2.pull_your_leg` "birini işletmek" | Doğru. TDK: "işletmek: birini aldatarak, şakayla kandırarak eğlenmek". Cümledeki "seni işletiyorum" doğal. |
| `idioms_2.cut_corners` "işi baştan savma yapmak" | Doğru ve doğal. İstenirse alt olarak "kolaya kaçmak" eklenebilir. Bulgu değil. |
| `idioms_2.full_plate` "başını kaşıyacak vakti olmamak" | Kabul edilebilir: anlam "çok meşgul olmak" ile örtüşüyor. Daha yakın karşılık "işi başından aşkın olmak" (yük ve sorumluluk vurgusu da var). Bulgu değil, isteğe bağlı: `idioms_2.full_plate|have a lot on your plate|have a lot on one's plate;a lot on my plate|işi başından aşkın olmak|başını kaşıyacak vakti olmamak` |
| `idioms_2.middle_of_nowhere` | Doğru. "Kuş uçmaz kervan geçmez bir yer" tam karşılık, "ıssız bir yerde" iyi bir alt. |
| `idioms.under_the_weather` "keyifsiz olmak" | Doğru. TDK "keyifsiz" 2. anlam: "hafifçe rahatsız, hasta". Cümle için yalnız alt eksik (bulgu 20). |
| `idioms.knock_on_wood` "tahtaya vur" | Düzeltilmeli (bulgu 5–6). |
| `time_links.since` "-den beri" | Doğru, `function.until` "-e kadar" biçimiyle tutarlı. |
| `time_links.while` "-ken" | Doğru. |
| `time_links.although` "-e rağmen" | Düzeltilmeli (bulgu 4). |
| `restaurant_2.undercooked` "iyi pişmemiş" | Düzeltilmeli (bulgu 7–8). |

Öteki 45 deyimin Türkçe karşılıkları deyime deyim, anlamca eşdeğer ve doğal bulundu ("aynı gemide olmak", "baltayı gömmek" gibi çeviri kökenli olanlar Türkçede yerleşmiş).

## 3. Seviye gözlemleri

Bunlar bulgu değil, bilgi:

- **`adult.people_feelings` (A2):** jealous, disappointed, embarrassed, confident, generous, selfish genelde B1 sayılır. Temanın A2 sonuna yerleştirilmesi uygun; yeni kavramlar A2 sınav sorusu olarak zor gelebilir.
- **`adult.actions_3` (A2):** forgive, protect, improve, describe B1 sınırında.
- **`adult.time_links` (A2):** however, although, especially, at least B1 sınırında. `s2_recently_tired` cümlesindeki present perfect ("have felt … recently") A2 sonu için uygun.
- **`adult.idioms` (A2):** under the weather, lose your temper, rain cats and dogs, in the same boat, knock on wood B1 deyimleri. Bant A2 kalacaksa temanın en sona konması doğru.
- **`adult.idioms_2` (B1):** bite off more than you can chew, a blessing in disguise, too many cooks spoil the broth, a storm in a teacup, once bitten twice shy B2 düzeyinde. Bant B1 ise sınav (placement) havuzuna girmemeleri iyi olur.
- **`adult.restaurant_2` (B1):** yeni kavramlar (undercooked, stale, split the bill, leftovers, tap water) ve 1. zorluk cümleleri B1'e uygun. Kapsam dışı ama dikkat: bu temanın 2. ve 3. zorluk cümleleri mevcut `b2_*` ve `c1_*` cümleleri; B1 bandı için ağır.

## Not

Yalnız virgülle ayrılan alternatifler (ör. `…, because…` / `… because…`) gereksiz: cevap denetimi noktalamayı yok sayıyor. Zararı yok, temizlik için çıkarılabilir. Bulgu sayılmadı.
