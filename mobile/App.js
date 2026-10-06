import { useCallback, useEffect, useRef, useState } from 'react'
import { ActivityIndicator, BackHandler, Linking, Platform, Pressable, StyleSheet, Text, View, useColorScheme } from 'react-native'
import { StatusBar } from 'expo-status-bar'
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context'
import { WebView } from 'react-native-webview'

// The live Sprout web app. The app's own CSS handles the notch and home bar on iOS.
const SPROUT_URL = 'https://life-planner-dun-chi.vercel.app'
const SPROUT_HOST = new URL(SPROUT_URL).host

// Same colors as --bg / --ink / --accent in src/styles.css, so there's no white flash while loading.
const COLORS = {
  light: { bg: '#f7f4ee', ink: '#37362f', accent: '#5d8c69', accentInk: '#ffffff' },
  dark: { bg: '#1c1e1b', ink: '#ebe8e0', accent: '#86b892', accentInk: '#172019' },
}

/** Stays inside Sprout; anything else (links in notes, Supabase pages) opens in the phone's browser. */
function isSproutUrl(url) {
  if (url.startsWith('about:') || url.startsWith('data:') || url.startsWith('blob:')) return true
  try {
    return new URL(url).host === SPROUT_HOST
  } catch {
    return false
  }
}

function Sprout() {
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light'
  const colors = COLORS[scheme]
  const webview = useRef(null)
  const canGoBack = useRef(false)
  const [failed, setFailed] = useState(false)

  // Android back button goes back inside Sprout before leaving the app.
  useEffect(() => {
    if (Platform.OS !== 'android') return
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (!canGoBack.current) return false
      webview.current?.goBack()
      return true
    })
    return () => sub.remove()
  }, [])

  const onShouldStart = useCallback((req) => {
    if (req.isTopFrame === false || isSproutUrl(req.url)) return true
    Linking.openURL(req.url).catch(() => {})
    return false
  }, [])

  const retry = () => {
    setFailed(false)
    webview.current?.reload()
  }

  const page = (
    <WebView
      ref={webview}
      source={{ uri: SPROUT_URL }}
      style={{ flex: 1, backgroundColor: colors.bg }}
      containerStyle={{ backgroundColor: colors.bg }}
      // Feel like an app, not a web page.
      bounces={false}
      overScrollMode="never"
      contentInsetAdjustmentBehavior="never"
      automaticallyAdjustContentInsets={false}
      allowsLinkPreview={false}
      textZoom={100}
      setSupportMultipleWindows={false}
      // Keep the account and offline data between launches.
      domStorageEnabled
      sharedCookiesEnabled
      cacheEnabled
      startInLoadingState
      renderLoading={() => (
        <View style={[StyleSheet.absoluteFill, styles.center, { backgroundColor: colors.bg }]}>
          <Text style={styles.logo}>🌱</Text>
          <ActivityIndicator color={colors.accent} />
        </View>
      )}
      onNavigationStateChange={(nav) => {
        canGoBack.current = nav.canGoBack
      }}
      onShouldStartLoadWithRequest={onShouldStart}
      onError={() => setFailed(true)}
      // iOS can kill a backgrounded web view; bring it back instead of showing a blank screen.
      onContentProcessDidTerminate={() => webview.current?.reload()}
      onRenderProcessGone={() => webview.current?.reload()}
    />
  )

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      {/* iOS: full screen, the page pads itself. Android web views don't report the
          system bars to the page, so keep it inside them there. */}
      {Platform.OS === 'ios' ? page : <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>{page}</SafeAreaView>}
      {failed && (
        <View style={[StyleSheet.absoluteFill, styles.center, { backgroundColor: colors.bg }]}>
          <Text style={styles.logo}>🌱</Text>
          <Text style={[styles.title, { color: colors.ink }]}>Can’t reach Sprout</Text>
          <Text style={[styles.body, { color: colors.ink }]}>Check your connection and try again.</Text>
          <Pressable onPress={retry} style={[styles.button, { backgroundColor: colors.accent }]}>
            <Text style={[styles.buttonText, { color: colors.accentInk }]}>Try again</Text>
          </Pressable>
        </View>
      )}
    </View>
  )
}

export default function App() {
  return (
    <SafeAreaProvider>
      <Sprout />
    </SafeAreaProvider>
  )
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12 },
  logo: { fontSize: 48 },
  title: { fontSize: 20, fontWeight: '700' },
  body: { fontSize: 16, opacity: 0.7, textAlign: 'center' },
  button: { marginTop: 8, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 999 },
  buttonText: { fontSize: 16, fontWeight: '700' },
})
