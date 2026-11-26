# 脑洞星球 · Mainland China launch checklist

## Current state

The project is a static, no-account prototype. The game page is `game.html`; the original 40-question personality test remains available at `index.html`. Game records are stored in browser localStorage. There is no analytics, ad SDK, payment, user account, cloud leaderboard or server-side data collection in this version.

## Fast preview

1. Use the GitHub Pages preview URL after the feature branch is deployed, or serve the repository root with any static HTTP server.
2. Test on iOS Safari, Android Chrome and WeChat's built-in browser.
3. Check that `game.html`, `game.js`, `game-data.js`, `game.css` and `privacy.html` all load.
4. Test a complete daily round, practice round, timer expiry, hint penalty, replay, quit, local best score and share fallback.

The repository's default branch is `main`. A successful Pages deployment has been observed for `main`, but feature-branch deployment and the exact Pages source configuration have not yet been verified.

## Before public operation in mainland China

- Select a hosting provider and server/edge region that can reliably serve mainland users. Test the actual domain and page from several mainland networks; a successful GitHub Pages build does not guarantee reliable mainland access.
- If using a mainland-hosted server or CDN, confirm the applicable ICP filing requirements with the hosting provider and complete the filing before public website service where required. A custom domain and the provider's filing process may also be required.
- Confirm the operator's identity, contact details, privacy notice, complaint channel, content review process and applicable cybersecurity/data protection obligations.
- This is currently a casual knowledge quiz, not an online game service with accounts, virtual currency, payments or user-generated content. If those features are added, reassess publishing, online-game, consumer protection, advertising and platform requirements with qualified counsel and the relevant authorities before launch. Do not assume this prototype is automatically exempt from all requirements.
- If serving users under 14 or collecting personal information, add the appropriate child privacy and consent safeguards before doing so.
- Do not add ad or payment SDKs until the operator, domain, privacy disclosures, consent requirements and platform policies are ready.

## Suggested release gates

1. Automated validation passes.
2. Manual mobile browser test passes on the target domain.
3. Privacy notice matches the actual hosting and telemetry setup.
4. Mainland network access and latency are acceptable.
5. Operator and filing/compliance checks are complete.
6. Only then announce the public URL and begin measuring acquisition, completion rate, next-day return and share rate.

## Monetization experiment after validation

Start with one clearly labelled, optional rewarded ad for an extra hint or practice round, if the chosen ad provider supports the website format and the operator qualifies. Keep the daily challenge playable without an ad. Consider paid themed question packs only after users show repeat engagement. All ad and payment integrations must be implemented with provider-approved SDKs and server-side validation where relevant.
