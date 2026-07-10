# Produktfixaren quality rules

- Keep the site static, fast and easy to edit. Do not add dependencies unless there is a clear reason.
- The live site source is `hemsida`. Edit site HTML/CSS/JS there unless the user asks for project notes or tooling changes.
- Write customer-facing copy in clear Swedish with short sentences and concrete next steps.
- Keep pages mobile-first and accessible: semantic headings, labels, visible focus states and keyboard-friendly navigation.
- Every important page should have a unique title, description, canonical URL and internal links.
- Use Formspree for contact forms. Keep the honeypot field and the `/tack/` redirect.
- Do not lazy-load the hero image. Lazy-load below-the-fold images.
- Avoid vague marketing claims. Explain what is fixed, who it helps and what the customer gets.
- Run a local link/metadata check before packaging the site.

## Durable commands

- Local preview can be started with `Start-Job -ScriptBlock { param($p,$dir) py -m http.server $p --bind 127.0.0.1 --directory $dir } -ArgumentList 4173,(Resolve-Path 'hemsida').Path`.
- Check the preview with `Invoke-WebRequest -Uri http://127.0.0.1:4173/ -UseBasicParsing`.
- Package for Netlify Drop with `Compress-Archive -Path .\hemsida\* -DestinationPath .\produktfixaren-hemsida-uppdaterad.zip -Force`.
- Before upload, inspect the zip root. It should contain `index.html`, `style.css`, `main.js`, `_headers`, `robots.txt`, `sitemap.xml`, image assets and page folders directly at the root.

## Review checklist

- Check all main pages: `/`, `/produkttexter/`, `/hemsidesfix/`, `/bildfix/`, `/priser/`, `/case/`, `/om/`, `/kontakt/`, `/tack/`.
- Verify metadata on important pages: unique title, description, canonical URL and internal links.
- Verify Swedish characters render as UTF-8: `å`, `ä`, `ö`.
- Verify images: hero image loads eagerly and has dimensions; below-the-fold images use `loading="lazy"` and dimensions.
- Verify accessibility basics: skip link, semantic headings, labels, visible focus states, keyboard-friendly nav and no horizontal page overflow.
- Verify Formspree forms: `name="kontakt"`, honeypot field and `_next` redirect to `/tack/`.
- Check for common UI anti-patterns: `transition: all`, `outline: none`, disabled zoom, `...` instead of `…`, blocked paste, missing labels or missing image dimensions.

## Gotchas

- Do not use long `immutable` caching for unversioned `style.css` or `main.js`; returning visitors can keep stale CSS/JS after deploy.
- Keep deploy zips clean. Do not upload preview logs, local notes or unused heavy originals unless they are intentionally part of the live site.
- If contact copy asks for images, make the next step clear. The current form accepts text and links, not file uploads.
- Hidden mobile scrollbars can make horizontal navigation less obvious. If the nav scrolls, make sure users can tell more links exist.
- WebP is fine for the hero image, but JPG/PNG is safer for `og:image` social previews.
- Git may not be usable from this folder even when `.git` exists. Check before relying on Git commands.
- PowerShell `Start-Process` may fail in this environment because of duplicate `Path`/`PATH` environment entries. Use the preview command above if that happens.

## Done means

- The local link/metadata check passes.
- Desktop and mobile previews show no broken layout, overlap or horizontal page overflow.
- The contact form keeps Formspree, honeypot and `/tack/` redirect intact.
- The zip is rebuilt from the current `hemsida` contents and has files at the zip root.
- After upload, verify the live Netlify page, nav links, key offer text, `/kontakt/`, `/robots.txt`, `/sitemap.xml` and one test form submission.
