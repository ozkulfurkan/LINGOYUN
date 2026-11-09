# App Store — App Privacy ("gizlilik etiketleri")

App Store Connect → Uygulama → **App Privacy** → Get Started. Cevaplar gizlilik politikasıyla (`docs/privacy/`) aynı olmalı.

**Privacy Policy URL:** `https://ozkulfurkan.github.io/LINGOYUN/privacy/` (GitHub Pages açılınca; Settings → Pages → `main` / `docs`).

## "Do you or your third-party partners collect data from this app?" → **Yes**

Sentry çökme raporları ve RevenueCat abonelik doğrulaması cihazdan çıkar. Profiller, takma adlar ve ilerleme cihazda kalır; toplanmış sayılmaz.

## Seçilecek veri türleri

| Kategori    | Veri türü             | Neden                            |
| ----------- | --------------------- | -------------------------------- |
| Diagnostics | Crash Data            | Sentry                           |
| Diagnostics | Performance Data      | Sentry (izleme örneklemesi)      |
| Diagnostics | Other Diagnostic Data | Sentry                           |
| Purchases   | Purchase History      | RevenueCat (LNG-25 ile birlikte) |

Diğer bütün kategoriler (Contact Info, Health, Financial, Location, Sensitive Info, Contacts, User Content, Browsing/Search History, Identifiers, Usage Data, Other Data) → **seçme**.

## Her veri türü için aynı cevaplar

- **Purposes:** App Functionality (yalnızca bu)
- **Linked to the user's identity?** → **No** (RevenueCat anonim kimlik kullanır)
- **Used for tracking?** → **No**

## Ek ayarlar

- Sentry → lingoyun → Settings → Security & Privacy → **"Prevent Storing of IP Addresses" açık** (politika bunu söylüyor).
- Kategori: **Education** (Kids kategorisi değil); yaş derecelendirmesi 4+.
