---
'reinocapital-calculadora': patch
---

Fix CDN distribution by adding prepublishOnly build script

- Add prepublishOnly script to ensure dist files are built before npm publish
- Ensure CDN links work correctly with built assets
- Fix missing dist files in published package
