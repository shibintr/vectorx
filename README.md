# VectorX — Static Website

Three pages (`index.html`, `about.html`, `contact.html`) built with HTML5, CSS3, Bootstrap 5.3.3 and vanilla JS. No build step: open `index.html` or serve the folder with any static host.

## Things to configure before going live

| What | Where |
|---|---|
| **WhatsApp number** (not in site-contents.docx) | `assets/js/main.js` → `SITE_CONFIG.whatsappNumber` — digits only with country code, e.g. `"919876543210"`. While empty, WhatsApp still opens with the message pre-filled and the visitor picks the chat. |
| **Domain** (currently `https://vectorx.live`) | canonical / `og:*` / JSON-LD in each HTML `<head>`, `sitemap.xml`, `robots.txt` |
| **Office address** (not in the docx; site shows "India") | Address card in `contact.html`, footer "Contact" column |

## Structure
```
index.html  about.html  contact.html
favicon.ico  apple-touch-icon.png  site.webmanifest  sitemap.xml  robots.txt
assets/css/style.css     design tokens (palette from theme.pdf/logo) + components
assets/js/main.js        loader, nav, scroll reveals, WhatsApp form
assets/images/           logo.jpeg (original), logo lock-ups, section imagery (WebP), og-image.jpg, icons
```
