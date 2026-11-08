---
name: kids-ux
description: 2–7 ve 7–12 yaş için ekran ve oyun tasarım kuralları — dokunma alanları, okuma gerektirmeyen arayüz, sesli yönlendirme, ebeveyn kapısı, oturum süresi, mağaza ve gizlilik kuralları. mini veya kid profilinde görünen herhangi bir ekranı tasarlarken ya da kodlarken oku.
---

# Çocuk UX kuralları

## 2–7 yaş (`mini`)

- **Okuma gerektirmez.** Her yönerge sesli (Zeynep, Nehir veya Kerem söyler); metin varsa yardımcıdır.
- Dokunma alanı **en az 64 pt**, öğeler arası en az 16 pt. Ekranda aynı anda en fazla 4 seçenek.
- Sürükle-bırak toleranslı: hedefe yakın bırakılan nesne mıknatıs gibi yerine oturur.
- Ekranın köşelerine yanlışlıkla çıkış yaptıracak buton koyma; çıkış ebeveyn kapısının arkasında.
- Yanlışta ceza, can, süre yok. 2 yanlıştan sonra doğru seçenek hafifçe parlar.
- Bir oturum ~5 dakika / 8–10 etkinlik; sonunda karakter "yarın görüşürüz" der (zorlamadan).
- Ana renkler ve şekillerle gezinme (ikon + karakter), menü listesi yok.

## 7–12 yaş (`kid`)

- Dokunma alanı en az 48 pt; metin gövde boyutu en az 18 pt.
- Talimat kısa metin + isteğe bağlı ses butonu; 7–8 yaş için sorular varsayılan olarak sesli okunur.
- Süreli modlar isteğe bağlı; varsayılan süresiz.
- İlerleme görünür: harita, seri, taş — ama kayıp korkusu yaratma (seri bozulursa "dondurma" hakkı).

## Tüm çocuk profilleri

- **Ebeveyn kapısı**: satın alma, ayarlar, dış bağlantı, profil silme öncesinde. Rastgele çarpma sorusu ("7 × 8 = ?") veya sayıları yazıyla gösterip rakamla girdirme; sabit cevap kullanma.
- Reklam yok, dış bağlantı yok, sosyal paylaşım yok, sohbet yok.
- **Karanlık örüntü (dark pattern) yok**: sahte geri sayım, suçlama metni, çocuğa satın alma baskısı yok. Paywall çocuğa değil ebeveyne konuşur ve kapının arkasındadır.
- Kişisel veri toplanmaz: profilde yalnızca takma ad + avatar + yaş grubu, cihazda kalır. Analitik/çökme raporuna çocuk adı gitmez.
- Erişilebilirlik: `accessibilityLabel` her etkileşimli öğede (TR ve EN), renk körlüğüne uygun (şekil + renk), azaltılmış hareket desteği.
- Sol ve sağ elle eşit rahat kullanım; önemli butonlar alt-orta bölgede.

## Mağaza notları

- Kategori: Eğitim (Kids kategorisi değil), yaş derecelendirmesi 4+.
- Apple 3.1.1: 7 günlük deneme 0 TL non-consumable ürün ile; abonelik metni (süre, fiyat, yenileme, iptal) paywall'da açıkça yazılı.
- Google Play "Families" politikası: hedef kitlede çocuk varsa Families kurallarına uy (onaylı SDK'lar, veri toplama sınırları).
