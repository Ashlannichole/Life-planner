# Sprout for iPhone & Android

A small Expo app that shows the live Sprout web app (https://life-planner-dun-chi.vercel.app) full screen. It feels like a real app:
- No browser bars and no bouncing.
- The phone's back button works.
- Links to other sites open in the phone's browser.

Every change merged into the web app shows up in the installed app the next time it opens. There's nothing to rebuild.

## Put it on TestFlight

Expo builds it in the cloud and uploads it to TestFlight. You don't need a Mac or Xcode, and your phone doesn't have to be on the same network as your computer.

You'll need:
- Node.js on any computer
- A free Expo account (expo.dev)
- Your Apple Developer account

Run:

```bash
cd mobile
npm install
npx eas-cli@latest build --platform ios --auto-submit
```

The first time, it asks a few questions. The answers below are the usual ones:
- **Log in to Expo.** Use your Expo account.
- **Create an EAS project?** Answer **Yes**.
- **Log in to your Apple account?** Answer **Yes**, then sign in with your Apple ID.
- **Generate a new distribution certificate / provisioning profile?** Answer **Yes** both times. Expo makes and stores them for you.
- **App Store Connect app.** It creates the "Sprout" app for you, with bundle ID `com.ashlan.sprout`.

When the build finishes (about 15–30 minutes), Apple processes it for another 5–15 minutes. Then it appears in the **TestFlight** app on your phone.

For the next build, run the same command. The build number goes up on its own.

## Reminders and Apple Health

The app adds two phone-only features to the website:
- **Reminders.** Turn them on in Sprout's Settings. The website works out what to remind you about and when; the app schedules them on the phone (`expo-notifications`).
- **Apple Health (Plus).** Reads sleep, heart rate variability, resting heart rate, steps, and calories eaten and burned (`@kingstinct/react-native-healthkit`). An Oura ring shows up here once Apple Health sharing is turned on in the Oura app.

These are native features, so after changing them you need a new build. Run the same TestFlight command again; it's all set up in `app.json`.

## Home-screen widget

The widget (`widgets.js`, built with `expo-widgets`) shows your next tiny thing, how many you've done today and your plant. It comes in small, medium and large sizes for the home screen, plus lock-screen versions. The website sends it fresh data whenever the plan changes, and tomorrow's plan as well so it switches over at midnight on its own.

The widget is a separate piece of the app, so the first build after adding it asks one extra question: **Generate a new provisioning profile for `com.ashlan.sprout.widgets`?** Answer **Yes**. The app and the widget share data through the App Group `group.com.ashlan.sprout`, which EAS sets up for you.

To add it on the phone, long-press the home screen, tap **Edit → Add Widget**, then pick **Sprout**. For the lock screen, long-press the lock screen and tap **Customize**.

## Calendar sync

`calendar.js` (with `expo-calendar`) syncs both ways with the phone's Calendar app, so it covers every account on the phone (iCloud, Google, Outlook).

- **Calendar → Sprout:** events from the calendars you pick (Settings → Calendar) show up in Sprout, and the plan works around timed ones. All-day entries show up but don't clear the day. They're read-only in Sprout; change them in Calendar.
- **Sprout → Calendar:** Sprout's events go into a calendar called **Sprout**, and update or disappear there when they change in Sprout. Sprout never touches your other calendars.

It syncs from a week back to three months ahead, each time the app opens and whenever Sprout's events change. Calendar access is asked for the first time you switch it on.

## Sprout Plus (in-app purchase through RevenueCat)

Plus is sold as an Apple subscription. `purchases.js` talks to the App Store through RevenueCat, and purchases are tied to the Sprout account so Plus also works on the website. While `PLUS_FREE_DURING_BETA` (in `src/lib/plus.js`) is `true`, everyone gets Plus and buying is just for testing. Purchases made in TestFlight are free.

One-time setup. Do all of this in each service's own website; no keys go in the code or in chat.

1. **App Store Connect → Business (Agreements, Tax, and Banking).** Accept the **Paid Apps** agreement and add your bank and tax info. Subscriptions won't load until this agreement is active, even for testing.
2. **App Store Connect → Sprout → Monetization → Subscriptions.**
   - Create a subscription group called **Sprout Plus**.
   - Add two subscriptions:
     - `sprout_plus_monthly`: 1 month, $3.99.
     - `sprout_plus_yearly`: 1 year, $24.99, with an introductory offer of **1 week free**.
   - Fill in the display name, the description and a review screenshot (a screenshot of the Plus page is fine) until each one says **Ready to Submit**.
3. **App Store Connect → Users and Access → Integrations → In-App Purchase.** Generate a key and download the `.p8` file. Note the Key ID and the Issuer ID shown on that page.
4. **RevenueCat** (app.revenuecat.com, free to start):
   - Create a project called **Sprout**.
   - Add an **App Store** app with bundle ID `com.ashlan.sprout`, and upload the `.p8` file with its Key ID and Issuer ID.
   - **Products:** add `sprout_plus_monthly` and `sprout_plus_yearly`.
   - **Entitlements:** create one with the identifier `plus`, and attach both products.
   - **Offerings:** make sure the **default** offering is current, with a **Monthly** package (`sprout_plus_monthly`) and an **Annual** package (`sprout_plus_yearly`).
5. **Copy RevenueCat's public Apple API key** (Project settings → API keys; it starts with `appl_`). Then go to **expo.dev → Sprout → Environment variables** and add `EXPO_PUBLIC_REVENUECAT_IOS_KEY` with that value, for the **production** environment. EAS bakes it into the next build. Without it, the app just doesn't show the plans.
6. Build again with the usual command. In TestFlight, open **Settings → See everything in Plus** and pick a plan. Apple's sheet says **[Environment: Sandbox]** and doesn't charge. Test subscriptions renew quickly (about once a day) and stop after a few renewals; that's normal.

When you're ready for the App Store:
- Set `PLUS_FREE_DURING_BETA` to `false`.
- Add both subscriptions to the version you submit for review.
- Use `https://life-planner-dun-chi.vercel.app/privacy.html` as the Privacy Policy URL.

## Google Play later

```bash
npx eas-cli@latest build --platform android
npx eas-cli@latest submit --platform android
```

## Before the public App Store release

Apple can turn down apps that are "just a website". Sprout now has several app-only touches:
- Reminders
- Apple Health
- Home-screen and lock-screen widgets
- In-app purchase

For App Review, also:
- Add a demo account in App Review Information.
- Fill in App Privacy using the privacy page: Sprout collects the plan and the health summaries, linked to the account, not used for tracking.
