# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)

---

## Site Imagery Sourcing

`src/data/site-imagery.ts` maps each site slug to a hero banner + thumbnail. All entries currently start as `null` and gracefully fall back to the brand-color watermark on `SiteCard` and `ReviewPage`. To populate them, download sanctioned creative from each affiliate dashboard and drop it in `public/site-banners/{slug}.{ext}`, then update the corresponding entry.

### Where to source creative per affiliate program

| Program | Sites | Where to find banners |
|---|---|---|
| zBuckz | rawhole, peterfever, gayasiannetwork, alternadudes, dirtyboyvideo, dudesraw, japanboyz, sexjapantv, hiroyaxxx, yoshikawasakixxx, wuboyz, barebackrtxxx, cumpigmen, realmenfuck, swinginballs, squirtstudios, aussiesdoit | Dashboard → Marketing Tools → Banners |
| MyGayCash | twinks-in-shorts, athletic-twinks, southern-strokes, daddy-on-twink, touch-that-boy, breed-me-raw, bareback-that-hole, hard-brit-lads, prideflame, barebackcumpigs, bearchubs, bearfilms, hairyandraw | Dashboard → Promotional Materials |
| ChargedCash | twinktrade, dadcreep, brothercrush, familydick, sayuncle, boysatcamp, missionaryboys, militarydick, latinleche, yesfather, bullyhim, youngperps | Dashboard → Banners |
| NakedSword Cash | nakedsword, trailertrashboys | Dashboard → Creative Center |
| CrakRevenue | (smartlinks: Manfinder, gay-dating) | Smartlink Creative Library (already approved) |
| XXXRewards | boyfun, jawked | Dashboard → Banner Library |
| Buddy Profits / Gamma | helix-studios, next-door-twink, next-door-world (post-KYC) | Marketing → Tools (when KYC clears) |
| AdultForce | (queue: men, sean-cody, bromo, etc.) | Dashboard → Creative (post-approval) |

### Image guidelines

- **Format**: WebP preferred. Hero 16:9 ≥ 1200×675; thumbnail 4:3 ≥ 600×450.
- **Alt text**: SFW only — describe brand identity, not content. Google penalises graphic adult alt copy. Existing entries use the safe pattern `"{Site Name} promotional banner"`.
- **Path convention**: `public/site-banners/{slug}-hero.webp` and `public/site-banners/{slug}-thumb.webp`.
- **Never** scrape from member areas. Only use creative the affiliate dashboard explicitly grants for affiliate use.

### Priority order (highest impact first)

Sites where adding imagery has the biggest conversion lift, ordered by current rank × monetisation:

1. helix-studios (rank #1, but affiliate URL pending — sourcing imagery for the review page is still high priority)
2. next-door-twink (rank #2, pending)
3. nakedsword
4. twinks-in-shorts, athletic-twinks, southern-strokes (top MyGayCash earners)
5. twinktrade (top ChargedCash search-volume earner)
6. boyfun, jawked (newest XXXRewards adds)
