import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, DarkTheme, type Theme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts, Anton_400Regular } from '@expo-google-fonts/anton';
import { View, ActivityIndicator } from 'react-native';
import {
  ConvexReactClient,
  Authenticated,
  Unauthenticated,
  AuthLoading,
} from 'convex/react';
import { ConvexAuthProvider } from '@convex-dev/auth/react';
import * as SecureStore from 'expo-secure-store';
import LandingScreen from './src/screens/LandingScreen';
import RunsScreen from './src/screens/RunsScreen';
import WorkoutsScreen from './src/screens/WorkoutsScreen';
import NewWorkoutScreen from './src/screens/NewWorkoutScreen';
import WorkoutExercisesScreen from './src/screens/WorkoutExercisesScreen';
import TrackScreen from './src/screens/TrackScreen';
import RunDetailScreen from './src/screens/RunDetailScreen';
import AuthScreen from './src/screens/AuthScreen';
import type { RootStackParamList } from './src/navigation';
import { colors } from './src/theme';

const Stack = createNativeStackNavigator<RootStackParamList>();

// Convex client. unsavedChangesWarning is web-only and noisy in React Native.
const convex = new ConvexReactClient(process.env.EXPO_PUBLIC_CONVEX_URL!, {
  unsavedChangesWarning: false,
});

// Persist Convex Auth tokens in the device keychain/keystore via expo-secure-store.
const secureStorage = {
  getItem: SecureStore.getItemAsync,
  setItem: SecureStore.setItemAsync,
  removeItem: SecureStore.deleteItemAsync,
};

const navTheme: Theme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: colors.bg,
    card: colors.bg,
    text: colors.text,
    border: colors.border,
    primary: colors.accent,
  },
};

function Loading() {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.bg,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <ActivityIndicator color={colors.accent} size="large" />
    </View>
  );
}

function MainStack() {
  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: colors.bg },
          headerTintColor: colors.text,
          headerShadowVisible: false,
          contentStyle: { backgroundColor: colors.bg },
        }}
      >
        <Stack.Screen
          name="Home"
          component={LandingScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Runs"
          component={RunsScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Workouts"
          component={WorkoutsScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="NewWorkout"
          component={NewWorkoutScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="WorkoutExercises"
          component={WorkoutExercisesScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Track"
          component={TrackScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="RunDetail"
          component={RunDetailScreen}
          options={{ title: 'Run Details' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  // Load the Nike-style display font before rendering the UI.
  const [fontsLoaded] = useFonts({ Anton_400Regular });

  if (!fontsLoaded) {
    return <Loading />;
  }

  return (
    <ConvexAuthProvider client={convex} storage={secureStorage}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <AuthLoading>
          <Loading />
        </AuthLoading>
        <Unauthenticated>
          <AuthScreen />
        </Unauthenticated>
        <Authenticated>
          <MainStack />
        </Authenticated>
      </SafeAreaProvider>
    </ConvexAuthProvider>
  );
}
