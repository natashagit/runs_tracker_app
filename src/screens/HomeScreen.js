import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useQuery, useMutation } from 'convex/react';
import { useAuthActions } from '@convex-dev/auth/react';
import { api } from '../../convex/_generated/api';
import {
  formatDistance,
  formatDuration,
  formatPace,
  formatDate,
} from '../geo';
import { colors, fonts } from '../theme';

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export default function HomeScreen({ navigation }) {
  // Reactive query — the list updates automatically when a run is added/removed.
  const data = useQuery(api.runs.list);
  const loading = data === undefined;
  const runs = data ?? [];

  const removeRun = useMutation(api.runs.remove);
  const { signOut } = useAuthActions();

  const confirmDelete = (run) => {
    Alert.alert('Delete run?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await removeRun({ id: run._id });
          } catch (e) {
            Alert.alert('Could not delete', 'Please try again.');
          }
        },
      },
    ]);
  };

  const confirmSignOut = () => {
    Alert.alert('Sign out?', 'You can sign back in anytime.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: () => signOut() },
    ]);
  };

  // Derived stats for the hero panel.
  const totalDistance = runs.reduce((s, r) => s + r.distanceM, 0);
  const now = Date.now();
  const weekDistance = runs.reduce(
    (s, r) => (now - new Date(r.date).getTime() <= WEEK_MS ? s + r.distanceM : s),
    0
  );

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.7}
      onPress={() => navigation.navigate('RunDetail', { run: item })}
      onLongPress={() => confirmDelete(item)}
    >
      <View style={styles.accentBar} />
      <View style={styles.cardBody}>
        <Text style={styles.cardDate}>{formatDate(item.date)}</Text>
        <View style={styles.cardStatsRow}>
          <View>
            <Text style={styles.cardStatLabel}>TOTAL</Text>
            <Text style={styles.cardDistance}>
              {formatDistance(item.distanceM)}
            </Text>
          </View>
          <View style={styles.cardStatRightCol}>
            <Text style={styles.cardStatLabel}>RUN</Text>
            <Text style={[styles.cardDistance, styles.cardRunDistance]}>
              {formatDistance(item.runDistanceM ?? 0)}
            </Text>
          </View>
        </View>
        <Text style={styles.cardMeta}>
          {formatDuration(item.durationSec)} ·{' '}
          {formatPace(item.durationSec, item.distanceM)}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const ListHeader = (
    <LinearGradient
      colors={[colors.accent, colors.accent2]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.hero}
    >
      <Text style={styles.heroLabel}>TOTAL DISTANCE</Text>
      <Text style={styles.heroValue}>{formatDistance(totalDistance)}</Text>
      <Text style={styles.heroSub}>
        {runs.length} RUN{runs.length === 1 ? '' : 'S'} ·{' '}
        {formatDistance(weekDistance)} THIS WEEK
      </Text>
    </LinearGradient>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>YOUR RUNS</Text>
        <TouchableOpacity
          style={styles.signOut}
          onPress={confirmSignOut}
          hitSlop={10}
        >
          <Text style={styles.signOutText}>SIGN OUT</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={runs}
        keyExtractor={(r) => r._id}
        renderItem={renderItem}
        ListHeaderComponent={ListHeader}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          !loading && (
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>NO RUNS YET</Text>
              <Text style={styles.emptyText}>
                Tap START below to track your first run.
              </Text>
            </View>
          )
        }
      />

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.startButton}
          activeOpacity={0.85}
          onPress={() => navigation.navigate('Track')}
        >
          <Text style={styles.startButtonText}>START</Text>
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
  signOut: {
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  signOutText: {
    color: colors.textDim,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
  },
  list: { paddingHorizontal: 16, paddingBottom: 150 },

  // Gradient hero summary panel
  hero: {
    borderRadius: 24,
    padding: 24,
    marginTop: 8,
    marginBottom: 20,
  },
  heroLabel: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  heroValue: {
    color: '#FFFFFF',
    fontFamily: fonts.display,
    fontSize: 56,
    marginTop: 8,
  },
  heroSub: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginTop: 6,
  },

  // Run card with accent stripe
  card: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  accentBar: { width: 5, backgroundColor: colors.accent2 },
  cardBody: { flex: 1, padding: 16 },
  cardDate: { color: colors.textDim, fontSize: 13 },
  cardStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 8,
  },
  cardStatRightCol: { alignItems: 'flex-end' },
  cardStatLabel: {
    color: colors.textDim,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },
  cardDistance: {
    color: colors.text,
    fontFamily: fonts.display,
    fontSize: 30,
    marginTop: 2,
  },
  cardRunDistance: { color: colors.run },
  cardMeta: { color: colors.textDim, fontSize: 14, marginTop: 8 },

  // Empty state
  empty: { alignItems: 'center', marginTop: 40, paddingHorizontal: 40 },
  emptyTitle: {
    color: colors.text,
    fontFamily: fonts.display,
    fontSize: 22,
    letterSpacing: 1,
  },
  emptyText: {
    color: colors.textDim,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
  },

  // Floating circular START button
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingTop: 16,
    paddingBottom: 36,
    backgroundColor: colors.bg,
    alignItems: 'center',
  },
  startButton: {
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.accent2,
    shadowOpacity: 0.5,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  startButtonText: {
    color: '#0A0A0A',
    fontFamily: fonts.display,
    fontSize: 22,
    letterSpacing: 1,
  },
});
