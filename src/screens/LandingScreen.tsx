import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ImageBackground } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthActions } from '@convex-dev/auth/react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation';
import { colors, fonts } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export default function LandingScreen({ navigation }: Props) {
  const { signOut } = useAuthActions();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>TRAIN</Text>
        <TouchableOpacity style={styles.signOut} onPress={() => signOut()} hitSlop={10}>
          <Text style={styles.signOutText}>SIGN OUT</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.sections}>
        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.section}
          onPress={() => navigation.navigate('Runs')}
        >
          <ImageBackground
            source={require('../../assets/runs-bg.png')}
            style={styles.sectionImage}
            contentFit="cover"
            contentPosition="top"
          >
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.75)']}
              start={{ x: 0, y: 0.35 }}
              end={{ x: 0, y: 1 }}
              style={styles.sectionFill}
            >
              <Text style={styles.sectionLabel}>TRACK & REVIEW</Text>
              <Text style={styles.sectionTitle}>RUNS</Text>
            </LinearGradient>
          </ImageBackground>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.section}
          onPress={() => navigation.navigate('Workouts')}
        >
          <ImageBackground
            source={require('../../assets/workouts-bg.jpg')}
            style={styles.sectionImage}
            contentFit="cover"
            contentPosition="top"
          >
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.75)']}
              start={{ x: 0, y: 0.35 }}
              end={{ x: 0, y: 1 }}
              style={styles.sectionFill}
            >
              <Text style={styles.sectionLabel}>STRENGTH & TRAINING</Text>
              <Text style={styles.sectionTitle}>WORKOUTS</Text>
            </LinearGradient>
          </ImageBackground>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 8,
  },
  title: {
    color: colors.text,
    fontFamily: fonts.display,
    fontSize: 44,
    letterSpacing: 1,
  },
  signOut: { paddingVertical: 6, paddingHorizontal: 4 },
  signOutText: {
    color: colors.textDim,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
  },

  sections: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 24,
    gap: 16,
  },
  section: {
    flex: 1,
    borderRadius: 24,
    overflow: 'hidden',
  },
  sectionImage: {
    flex: 1,
  },
  sectionFill: {
    flex: 1,
    padding: 24,
    justifyContent: 'flex-end',
  },
  sectionLabel: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontFamily: fonts.display,
    fontSize: 56,
    marginTop: 6,
  },
});
