# Card Image Replacements Needed

For each approved affiliate below, the card-format image currently rendering on Top 10, Latest Reviews, Reviews index, Discount page, or Review page hero is either a letter-initial fallback, a watermarked screenshot, or a leaderboard banner being incorrectly cropped.

The new `<SmartImage>` component renders the fallback cleanly (dark gradient + full label) when no source exists. But fallback is a stopgap — every approved affiliate should ship a real 16:10 card image.

This list is the punch-list for the next sweep through each affiliate dashboard.

## Action items

### MyGayCash network — leaderboard-misuse (replace with 1200×750 card)

Currently rendering leaderboard banners that are too wide for the card slot. Banners themselves are now repurposed into the FeaturedDealBanner pool; this list is about getting proper card creative.

- **Southern Strokes** — Priority: HIGH. Top 10 + Latest Reviews + Reviews index. Source: MyGayCash creative library.
- **Daddy on Twink** — Priority: HIGH. Source: MyGayCash.
- **Athletic Twinks** — Priority: HIGH. Source: MyGayCash.
- **Touch That Boy** — Priority: MEDIUM. Source: MyGayCash.
- **Breed Me Raw** — Priority: HIGH. Source: MyGayCash.
- **Bareback That Hole** — Priority: HIGH. Source: MyGayCash.
- **Hard Brit Lads** — Priority: MEDIUM. Source: MyGayCash.
- **Twinks in Shorts** — Priority: MEDIUM. Source: MyGayCash.
- **Bear Films** — Priority: MEDIUM. Source: MyGayCash.
- **Bear Chubs** — Priority: LOW. Source: MyGayCash.
- **Bareback Cum Pigs** — Priority: LOW. Source: MyGayCash.
- **Hairy and Raw** — Priority: MEDIUM. Source: MyGayCash.

### Crakrevenue / Asian network — leaderboard-misuse

- **PeterFever** — Priority: MEDIUM. Source: Crakrevenue.
- **Japanboyz** — Priority: MEDIUM. Source: Crakrevenue.
- **GayAsianNetwork** — Priority: LOW (skyscraper format only). Source: Crakrevenue.
- **SexJapanTV** — Priority: LOW (skyscraper format only). Source: Crakrevenue.
- **RawHole** — Priority: MEDIUM. Source: Crakrevenue.
- **Yoshi Kawasaki XXX** — Priority: LOW. Source: Crakrevenue.
- **HiroyaXXX** — Priority: LOW. No current card image. Source: Crakrevenue.
- **WuBoyz** — Priority: LOW. No current card image. Source: Crakrevenue.

### Dark Crystal / "creep" network — leaderboard-misuse

- **Dad Creep** — Priority: HIGH. Source: affiliate dashboard.
- **Brother Crush** — Priority: MEDIUM. Source: affiliate dashboard.
- **Family Dick** — Priority: MEDIUM. Source: affiliate dashboard.
- **Say Uncle** — Priority: MEDIUM. Source: affiliate dashboard.
- **Boys at Camp** — Priority: MEDIUM. Source: affiliate dashboard.
- **Missionary Boys** — Priority: MEDIUM. Source: affiliate dashboard.
- **Latin Leche** — Priority: HIGH. Source: affiliate dashboard.
- **Yes Father** — Priority: MEDIUM. Source: affiliate dashboard.
- **Bully Him** — Priority: LOW (skyscraper format only). Source: affiliate dashboard.
- **Young Perps** — Priority: MEDIUM. Source: affiliate dashboard.
- **TwinkTrade** — Priority: LOW (skyscraper). Source: affiliate dashboard.
- **Military Dick** — Priority: HIGH. Currently LOW_RES (600×350). Need ≥1200px source.

### Standalone affiliates — leaderboard-misuse

- **AlternaDudes** — Priority: MEDIUM. Source: AlternaDudes affiliate.
- **DirtyBoyVideo** — Priority: LOW (skyscraper). Source: dashboard.
- **TrailerTrashBoys** — Priority: MEDIUM. Source: dashboard.
- **NakedSword** — Priority: HIGH. Currently 2000×800 (close to card but slightly wide). Press kit likely has 1200×750.
- **Real Men Fuck** — Priority: MEDIUM. Source: dashboard.
- **Swingin Balls** — Priority: LOW. Source: dashboard.
- **Squirt Studios** — Priority: MEDIUM. Source: dashboard.
- **BoyFun** — Priority: MEDIUM. Source: dashboard.

### Pending affiliate approval — banner & card NOT eligible until approval lands

- **Helix Studios** (HelixCash)
- **Next Door Twink** (Buddy Profits/Gamma)
- **Next Door World** (Buddy Profits/Gamma)

### Sites listed in sites.ts with no banner file at all

These render fallback only — also worth sourcing card creative for:

- Prideflame, DudesRaw, Bareback RT XXX, Cum Pig Men, Aussies Do It, Jawked (GIF — needs static JPG)
- Gamma Films / TGP-network sites: Men.com, Sean Cody, Icon Male, Gay Wire, BiEmpire, Twinkpop, Reality Dudes, BigStr, Black Male Me, NoirMale, Guy Selector, SpiceVidsGay, MaleAccess

## Workflow

1. Log into each affiliate dashboard.
2. Pull a banner/key art at **≥ 1200px wide, aspect within 0.5 of 16:10** (i.e. between ~1.1:1 and ~2.1:1).
3. Drop into `public/site-banners/{slug}-hero.jpg`.
4. Run `npm run images:process` to generate the 1200×750 + @2x.
5. Run `npm run images:validate` to confirm.

If a clean source isn't available, the SmartImage fallback (dark gradient with brand name) is shipping today and looks intentional — not broken.
