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

## Google Play later

```bash
npx eas-cli@latest build --platform android
npx eas-cli@latest submit --platform android
```

## Before the public App Store release

Apple can turn down apps that are "just a website". Before submitting for review, add a few app-only touches:
- Notifications
- Widgets
- Home-screen quick actions
