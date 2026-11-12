// Sprout Plus through Apple in-app purchase, handled by RevenueCat. The website shows the
// Plus page and asks; this file talks to the App Store. Purchases are tied to the Sprout
// account (RevenueCat's app user id is the Supabase user id), so Plus follows you to any
// device you sign in on.
//
// The RevenueCat key is the public iOS SDK key ("appl_…"). It isn't secret, but it lives in
// EAS (expo.dev → project → Environment variables → EXPO_PUBLIC_REVENUECAT_IOS_KEY), not in
// the repo. Without it the app simply doesn't offer purchases.

import { Linking, Platform } from 'react-native'

const API_KEY = Platform.OS === 'ios' ? process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY : null
// The entitlement set up in RevenueCat that unlocks Plus.
const ENTITLEMENT = 'plus'

let Purchases = null
let configured = false

export const purchasesAvailable = () => !!API_KEY

function sdk() {
  if (!API_KEY) return null
  if (!Purchases) Purchases = require('react-native-purchases').default
  return Purchases
}

/** Plus status in the shape the website keeps: { active, expires, willRenew, productId, sandbox }. */
function statusFrom(info) {
  const e = info?.entitlements?.active?.[ENTITLEMENT]
  return {
    active: !!e,
    expires: e?.expirationDate || null,
    willRenew: !!e?.willRenew,
    productId: e?.productIdentifier || null,
    sandbox: !!e?.isSandbox,
  }
}

/** Start RevenueCat for this account (or anonymously until someone signs in). */
export async function startPurchases(userId, onChange) {
  const P = sdk()
  if (!P) return null
  if (!configured) {
    P.configure({ apiKey: API_KEY, appUserID: userId || undefined })
    P.addCustomerInfoUpdateListener((info) => onChange?.(statusFrom(info)))
    configured = true
  } else if (userId) {
    const current = await P.getAppUserID()
    if (current !== userId) await P.logIn(userId)
  }
  return statusFrom(await P.getCustomerInfo())
}

/** The packages on sale (monthly, yearly…) with Apple's localized prices. */
export async function plusOfferings() {
  const P = sdk()
  if (!P) return []
  const offerings = await P.getOfferings()
  return (offerings.current?.availablePackages || []).map((p) => ({
    id: p.identifier,
    type: p.packageType, // MONTHLY, ANNUAL, LIFETIME…
    title: p.product.title,
    price: p.product.priceString,
    pricePerMonth: p.product.pricePerMonthString || null,
    period: p.product.subscriptionPeriod || null, // P1M, P1Y
    trial: p.product.introPrice
      ? {
          free: p.product.introPrice.price === 0,
          price: p.product.introPrice.priceString,
          unit: p.product.introPrice.periodUnit, // DAY, WEEK, MONTH, YEAR
          count: p.product.introPrice.periodNumberOfUnits,
        }
      : null,
  }))
}

/** Buy a package. Returns the new status, or { cancelled: true } if they backed out. */
export async function buyPlus(packageId) {
  const P = sdk()
  const offerings = await P.getOfferings()
  const pkg = offerings.current?.availablePackages.find((p) => p.identifier === packageId)
  if (!pkg) throw new Error('That plan isn’t available right now.')
  try {
    const { customerInfo } = await P.purchasePackage(pkg)
    return statusFrom(customerInfo)
  } catch (err) {
    if (err?.userCancelled) return { cancelled: true }
    throw err
  }
}

export async function restorePlus() {
  return statusFrom(await sdk().restorePurchases())
}

/** Apple's own subscription page, where people cancel or switch plans. */
export function manageSubscription() {
  return Linking.openURL('https://apps.apple.com/account/subscriptions')
}
