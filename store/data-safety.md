# Google Play — Veri güvenliği formu

Play Console → Uygulama içeriği → **Veri güvenliği**.

- **Uygulamanız kullanıcı verisi topluyor veya paylaşıyor mu?** → Evet
- **Toplanan verilerin tümü aktarım sırasında şifreleniyor mu?** → Evet (Sentry ve RevenueCat HTTPS kullanır)
- **Kullanıcılar verilerinin silinmesini isteyebilir mi?** → Evet (e-posta ile; cihazdakiler uygulamadan silinir)

| Veri türü                                                 | Toplanıyor        | Paylaşılıyor | İsteğe bağlı | Amaç                  |
| --------------------------------------------------------- | ----------------- | ------------ | ------------ | --------------------- |
| Uygulama etkinliği → yok                                  | —                 | —            | —            | —                     |
| Uygulama bilgileri ve performansı → Kilitlenme günlükleri | Evet              | Hayır        | Hayır        | Uygulama işlevselliği |
| Uygulama bilgileri ve performansı → Teşhis                | Evet              | Hayır        | Hayır        | Uygulama işlevselliği |
| Finansal bilgiler → Satın alma geçmişi                    | Evet (LNG-25 ile) | Hayır        | Hayır        | Uygulama işlevselliği |

Diğer bütün türler (konum, kişisel bilgiler, fotoğraf, ses, kişiler, mesajlar, cihaz kimlikleri…) → **toplanmıyor**.

## Aileler politikası (hedef kitlede çocuk var)

- **Hedef yaş grupları:** 5 yaş ve altı, 6–8, 9–12, 13 ve üstü (uygulama ailece kullanılır).
- **Reklam:** yok. **Kullanılan SDK'lar:** Sentry, RevenueCat, Expo — Play'in "Families Self-Certified SDK" listesinde olduklarını göndermeden önce kontrol et.
- Çocuklardan kişisel bilgi toplanmaz; takma ad cihazda kalır; satın alma ebeveyn kapısının arkasında.
