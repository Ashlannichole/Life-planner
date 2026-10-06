// "Plus": the paid tier. There's no payment yet (in the iPhone app it has to go through
// Apple's in-app purchase), so Plus features are free during the beta. When payments
// arrive, only `hasPlus` changes; every Plus feature already asks it.

export const PLUS_FREE_DURING_BETA = true

export function hasPlus(state) {
  return PLUS_FREE_DURING_BETA || !!state?.plus?.active
}

export const PLUS_LABEL = PLUS_FREE_DURING_BETA ? 'Plus · free in beta' : 'Plus'
