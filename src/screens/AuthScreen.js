import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthActions } from '@convex-dev/auth/react';
import { colors, fonts } from '../theme';

export default function AuthScreen() {
  const { signIn } = useAuthActions();
  const [flow, setFlow] = useState('signIn'); // signIn | signUp
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const isSignUp = flow === 'signUp';

  const handleSubmit = async () => {
    const trimmed = email.trim();
    if (!trimmed || !password) {
      setError('Enter your email and password.');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await signIn('password', { email: trimmed, password, flow });
      // On success the <Authenticated> tree in App.js takes over.
    } catch (e) {
      setError(
        isSignUp
          ? 'Could not create that account. The email may already be in use.'
          : 'Invalid email or password.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.content}>
          <LinearGradient
            colors={[colors.accent, colors.accent2]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.badge}
          >
            <Text style={styles.badgeText}>RUN{'\n'}TRACKER</Text>
          </LinearGradient>

          <Text style={styles.title}>
            {isSignUp ? 'CREATE ACCOUNT' : 'WELCOME BACK'}
          </Text>
          <Text style={styles.subtitle}>
            {isSignUp
              ? 'Sign up to sync your runs.'
              : 'Sign in to see your runs.'}
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor={colors.textDim}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            textContentType="emailAddress"
            value={email}
            onChangeText={setEmail}
            editable={!submitting}
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor={colors.textDim}
            autoCapitalize="none"
            secureTextEntry
            textContentType={isSignUp ? 'newPassword' : 'password'}
            value={password}
            onChangeText={setPassword}
            editable={!submitting}
            onSubmitEditing={handleSubmit}
            returnKeyType="go"
          />

          {error && <Text style={styles.error}>{error}</Text>}

          <TouchableOpacity
            style={[styles.submit, submitting && styles.submitDisabled]}
            activeOpacity={0.85}
            onPress={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color={colors.onAccent} />
            ) : (
              <Text style={styles.submitText}>
                {isSignUp ? 'SIGN UP' : 'SIGN IN'}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.toggle}
            onPress={() => {
              setError(null);
              setFlow(isSignUp ? 'signIn' : 'signUp');
            }}
            disabled={submitting}
          >
            <Text style={styles.toggleText}>
              {isSignUp
                ? 'Already have an account? Sign in'
                : "New here? Create an account"}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  badge: {
    alignSelf: 'flex-start',
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 18,
    marginBottom: 28,
  },
  badgeText: {
    color: '#FFFFFF',
    fontFamily: fonts.display,
    fontSize: 24,
    letterSpacing: 1,
    lineHeight: 26,
  },
  title: {
    color: colors.text,
    fontFamily: fonts.display,
    fontSize: 40,
    letterSpacing: 1,
  },
  subtitle: {
    color: colors.textDim,
    fontSize: 15,
    marginTop: 6,
    marginBottom: 28,
  },
  input: {
    backgroundColor: colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.text,
    fontSize: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 12,
  },
  error: {
    color: colors.danger,
    fontSize: 14,
    marginBottom: 8,
    marginTop: 2,
  },
  submit: {
    backgroundColor: colors.accent,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  submitDisabled: { opacity: 0.6 },
  submitText: {
    color: colors.onAccent,
    fontFamily: fonts.display,
    fontSize: 20,
    letterSpacing: 1,
  },
  toggle: { alignItems: 'center', paddingVertical: 18 },
  toggleText: {
    color: colors.textDim,
    fontSize: 14,
    fontWeight: '600',
  },
});
