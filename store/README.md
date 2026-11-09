# Mağaza dosyaları

- `listings.json` — App Store ve Play metinleri (TR, EN). Karakter sınırlarını `listings.test.ts` denetler. `{{PRIVACY_URL}}` yerine yayımlanan gizlilik adresi yazılır.
- `privacy-labels.md` — App Store "App Privacy" cevapları.
- `data-safety.md` — Play "Veri güvenliği" ve Aileler politikası cevapları.
- Gizlilik politikası: `docs/privacy/index.html` (EN), `docs/privacy/tr.html` (TR).

## Furkan'ın doldurması gerekenler

| Yer tutucu                                    | Nerede                                                                                    |
| --------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `{{GELISTIRICI_ADI}}` / `{{DEVELOPER_NAME}}`  | `docs/privacy/*.html` — App Store'daki satıcı adıyla aynı                                 |
| `{{ILETISIM_EPOSTASI}}` / `{{CONTACT_EMAIL}}` | `docs/privacy/*.html` — destek e-postası                                                  |
| `{{YURURLUK_TARIHI}}` / `{{EFFECTIVE_DATE}}`  | `docs/privacy/*.html` — yayın günü                                                        |
| `{{PRIVACY_URL}}`                             | `listings.json` — GitHub Pages açılınca `https://ozkulfurkan.github.io/LINGOYUN/privacy/` |

GitHub Pages: repo → Settings → Pages → Source: `main` dalı, `/docs` klasörü.
