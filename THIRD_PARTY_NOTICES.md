# Dependencies, assets and attribution

- **React / React DOM:** Meta and contributors, MIT. https://github.com/facebook/react
- **React Router:** Remix Software and contributors, MIT. https://github.com/remix-run/react-router
- **Three.js:** three.js authors, MIT. https://github.com/mrdoob/three.js — the city scene itself is original procedural artwork in `src/CityScene.tsx`.
- **Manrope:** Mikhail Sharanda, Mirko Velimirovic and contributors, SIL Open Font License 1.1. The unmodified variable font is self-hosted in `public/fonts/Manrope.ttf`; the full licence is `public/fonts/OFL-Manrope.txt`. https://github.com/google/fonts/tree/main/ofl/manrope
- **Tooling:** Vite, TypeScript, Vitest, Prettier and type definitions; exact versions in the lockfile. Respective licences are included in installed package directories.
- **Municipal/public agency evidence:** publisher-specific rights apply; concise attributed summaries link to primary sources in `src/sources.ts`. No source photographs or city logos are used.
- **IMGW-PIB:** public synoptic station observations. Provider attribution, report time and retrieval time are shown in the app. https://danepubliczne.imgw.pl/
- **Open-Meteo:** forecast API; CC BY 4.0 data attribution and non-commercial service conditions. https://open-meteo.com/en/terms
- **Natural Earth / world-atlas 2.0.2:** public-domain geographic data retained from the previous prototype. It is not imported by the new welcome page. https://www.naturalearthdata.com/about/terms-of-use/

No commercial partnerships, city participation or endorsement are implied. Local proposals and the Elsewhere visual identity were developed for this hackathon prototype with Codex assistance. “Elsewhere” is a working brand; no domain or trademark availability claim is made.

## Optional research provider

OpenAI Responses API with web search is an optional server-side integration. It requires an account/key, explicit per-run consent and permitted inputs, and may incur usage charges. Model outputs and newly discovered sources require verification. No key or live paid research run was used in this implementation's tests. Documentation: https://developers.openai.com/api/docs/guides/tools-web-search/.

The civic comparison also references the City of Kraków/Statistics Poland and City of Helsinki/Statistics Finland for 2024 municipal populations. Exact links and dates appear in `src/sources.ts` and in the comparison interface.
