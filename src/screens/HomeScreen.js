import { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getRuns, deleteRun } from '../storage';
import {
  formatDistance,
  formatDuration,
  formatPace,
  formatDate,
} from '../geo';
import { colors } from '../theme';

export default function HomeScreen({ navigation }) {
  const [runs, setRuns] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setRuns(await getRuns());
    setLoading(false);
  }, []);

  // Reload every time the screen comes into focus (e.g. after saving a run).
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const confirmDelete = (run) => {
    Alert.alert('Delete run?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteRun(run.id);
          load();
        },
      },
    ]);
  };

  const totalDistance = runs.reduce((s, r) => s + r.distanceM, 0);

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('RunDetail', { run: item })}
      onLongPress={() => confirmDelete(item)}
    >
      <Text style={styles.cardDate}>{formatDate(item.date)}</Text>
      <View style={styles.cardStats}>
        <Stat label="Distance" value={formatDistance(item.distanceM)} />
        <Stat label="Time" value={formatDuration(item.durationSec)} />
        <Stat label="Pace" value={formatPace(item.durationSec, item.distanceM)} />
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Your Runs</Text>
          <Text style={styles.subtitle}>
            {runs.length} run{runs.length === 1 ? '' : 's'} ·{' '}
            {formatDistance(totalDistance)} total
          </Text>
        </View>
      </View>

      <FlatList
        data={runs}
        keyExtractor={(r) => r.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          !loading && (
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>No runs yet</Text>
              <Text style={styles.emptyText}>
                Tap the button below to start tracking your first run.
              </Text>
            </View>
          )
        }
      />

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.startButton}
          onPress={() => navigation.navigate('Track')}
        >
          <Text style={styles.startButtonText}>Start a Run</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function Stat({ label, value }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
  title: { color: colors.text, fontSize: 28, fontWeight: '700' },
  subtitle: { color: colors.textDim, fontSize: 14, marginTop: 4 },
  list: { paddingHorizontal: 16, paddingBottom: 120 },
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardDate: { color: colors.textDim, fontSize: 13, marginBottom: 12 },
  cardStats: { flexDirection: 'row', justifyContent: 'space-between' },
  stat: { flex: 1 },
  statValue: { color: colors.text, fontSize: 18, fontWeight: '700' },
  statLabel: { color: colors.textDim, fontSize: 12, marginTop: 2 },
  empty: { alignItems: 'center', marginTop: 80, paddingHorizontal: 40 },
  emptyTitle: { color: colors.text, fontSize: 18, fontWeight: '600' },
  emptyText: {
    color: colors.textDim,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    paddingBottom: 32,
    backgroundColor: colors.bg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  startButton: {
    backgroundColor: colors.accent,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  startButtonText: { color: '#06210F', fontSize: 17, fontWeight: '700' },
});
