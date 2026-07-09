# Uppdatera hemsidan på Netlify

Publiceringsmappen är:

`C:\Users\danie\Documents\Projektfixaren\hemsida`

Färdig zip finns här:

`C:\Users\danie\Documents\Projektfixaren\produktfixaren-hemsida-uppdaterad.zip`

## Enklaste sättet

1. Gå till Netlify.
2. Öppna sidan `produktfixaren-daniel`.
3. Öppna **Deploys**.
4. Dra in `produktfixaren-hemsida-uppdaterad.zip`.
5. Vänta tills Netlify säger att deployen är klar.
6. Öppna `https://produktfixaren-daniel.netlify.app/` och kontrollera startsida, meny och formulär.

## Vad som ingår nu

- Startsida med tydligare erbjudande, internlänkar och snabb CTA.
- Separata sidor för `/produkttexter/`, `/hemsidesfix/`, `/bildfix/`, `/priser/`, `/case/` som heter Exempel i menyn, `/om/`, `/kontakt/` och `/tack/`.
- Netlify Forms-formulär med honeypot och redirect till `/tack/`.
- Unika titlar, meta descriptions, canonical-länkar och Open Graph-data på viktiga sidor.
- `sitemap.xml`, `robots.txt`, `netlify.toml` och `_headers`.
- Gemensamma komponentklasser i `style.css`: servicekort, priskort, före/efter-block, CTA-sektion, FAQ och kontaktformulär.
- Tillgänglighetsbas: skip link, tydliga fokusstilar, labels, aria-live och reduced-motion-regler.
- Hero-bilden laddas direkt. Bildexempel längre ned använder lättare JPEG-versioner och lazy-loading.
