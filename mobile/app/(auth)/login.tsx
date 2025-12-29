import {
  View,
  Text,
  Pressable,
  Image,
  SafeAreaView,
  StyleSheet,
} from "react-native"
import * as Haptics from "expo-haptics"
import { useAuth } from "../../hooks/useAuth"
import { Ionicons } from "@expo/vector-icons"

export default function LoginScreen() {
  const { signInWithGoogle, loading } = useAuth()

  const handleGoogleSignIn = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    await signInWithGoogle()
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Logo & Branding */}
        <View style={styles.brandingContainer}>
          <View style={styles.logoBox}>
            <Ionicons name="sparkles" size={48} color="white" />
          </View>
          <Text style={styles.title}>BYOC</Text>
          <Text style={styles.subtitle}>Bring Your Own Companion</Text>
        </View>

        {/* Value Proposition */}
        <View style={styles.valueProposition}>
          <Text style={styles.valueText}>
            The AI habit tracker that costs{"\n"}
            <Text style={styles.valueHighlight}>cents, not dollars.</Text>
          </Text>
        </View>

        {/* Sign In Button */}
        <Pressable
          onPress={handleGoogleSignIn}
          disabled={loading}
          style={({ pressed }) => [
            styles.signInButton,
            pressed && styles.signInButtonPressed,
          ]}
        >
          <Image
            source={{ uri: "https://www.google.com/favicon.ico" }}
            style={styles.googleIcon}
          />
          <Text style={styles.signInText}>
            {loading ? "Signing in..." : "Continue with Google"}
          </Text>
        </Pressable>

        {/* Footer */}
        <Text style={styles.footer}>
          By continuing, you agree to our Terms of Service and Privacy Policy
        </Text>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F2F2F7",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  brandingContainer: {
    alignItems: "center",
    marginBottom: 48,
  },
  logoBox: {
    width: 96,
    height: 96,
    borderRadius: 24,
    backgroundColor: "#007AFF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#1C1C1E",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#8E8E93",
    textAlign: "center",
  },
  valueProposition: {
    marginBottom: 48,
  },
  valueText: {
    textAlign: "center",
    color: "#6B6B6B",
    fontSize: 16,
    lineHeight: 24,
  },
  valueHighlight: {
    fontWeight: "600",
    color: "#007AFF",
  },
  signInButton: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E5E5",
  },
  signInButtonPressed: {
    opacity: 0.8,
  },
  googleIcon: {
    width: 20,
    height: 20,
    marginRight: 12,
  },
  signInText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1C1C1E",
  },
  footer: {
    fontSize: 12,
    color: "#8E8E93",
    textAlign: "center",
    marginTop: 32,
    paddingHorizontal: 16,
  },
})
