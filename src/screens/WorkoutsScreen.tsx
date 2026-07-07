import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  type ListRenderItem,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useQuery, useMutation } from 'convex/react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { api } from '../../convex/_generated/api';
import type { Doc } from '../../convex/_generated/dataModel';
import { formatDate } from '../geo';
import type { RootStackParamList } from '../navigation';
import { colors, fonts } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Workouts'>;
type Workout = Doc<'workouts'>;

// Local day key ("YYYY-M-D") for a stored workout row — prefers the explicit
// `day` field, falling back to the timestamp for any legacy row.
const dayKeyOf = (w: Workout) => {
  if (w.day) return w.day;
  const d = new Date(w.date);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
};

export default function WorkoutsScreen({ navigation }: Props) {
  // Reactive query — the list updates automatically when a workout is logged/removed.
  const data = useQuery(api.workouts.list);
  const loading = data === undefined;
  const workouts: Workout[] = data ?? [];

  const removeWorkout = useMutation(api.workouts.remove);
  const startDay = useMutation(api.workouts.startDay);
  const stopDay = useMutation(api.workouts.stopDay);

  // Today's session state drives the START/STOP button.
  const now = new Date();
  const todayKey = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`;
  const todayRow = workouts.find((w) => dayKeyOf(w) === todayKey);
  const sessionActive = todayRow?.completed === false;

  const handleStart = async () => {
    const at = new Date();
    const day = `${at.getFullYear()}-${at.getMonth()}-${at.getDate()}`;
    try {
      await startDay({ date: at.toISOString(), day });
    } catch (e) {
      // Non-fatal: still let them pick a workout; logging will create the row.
    }
    navigation.navigate('NewWorkout');
  };

  const handleStop = async () => {
    try {
      await stopDay({ day: todayKey });
    } catch (e) {
      Alert.alert('Could not stop workout', 'Please try again.');
    }
  };

  const confirmDelete = (workout: Workout) => {
    Alert.alert('Delete workout?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await removeWorkout({ id: workout._id });
          } catch (e) {
            Alert.alert('Could not delete', 'Please try again.');
          }
        },
      },
    ]);
  };

  const renderItem: ListRenderItem<Workout> = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.7}
      onPress={() =>
        navigation.navigate('WorkoutDetail', {
          date: item.date,
          title: item.title,
        })
      }
      onLongPress={() => confirmDelete(item)}
    >
      <View style={styles.accentBar} />
      <View style={styles.cardBody}>
        <Text style={styles.cardTitle}>
          {item.title || (item.completed === false ? 'IN PROGRESS' : 'WORKOUT')}
        </Text>
        <Text style={styles.cardDate}>{formatDate(item.date)}</Text>
      </View>
    </TouchableOpacity>
  );

  const ListHeader = (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={() => navigation.navigate('WorkoutCalendar')}
    >
      <LinearGradient
        colors={['#00E0C7', '#1FB6FF']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.hero}
      >
        <Text style={styles.heroLabel}>TOTAL WORKOUTS</Text>
        <Text style={styles.heroValue}>{workouts.length}</Text>
        <Text style={styles.heroSub}>TAP TO VIEW CALENDAR ›</Text>
      </LinearGradient>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <TouchableOpacity
        style={styles.back}
        onPress={() => navigation.goBack()}
        hitSlop={10}
      >
        <Text style={styles.backText}>‹ HOME</Text>
      </TouchableOpacity>
      <View style={styles.header}>
        <Text style={styles.title}>WORKOUTS</Text>
      </View>

      <FlatList
        data={workouts}
        keyExtractor={(w) => w._id}
        renderItem={renderItem}
        ListHeaderComponent={ListHeader}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>NO WORKOUTS YET</Text>
              <Text style={styles.emptyText}>
                Tap START below to log your first workout.
              </Text>
            </View>
          ) : null
        }
      />

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.startButton, sessionActive && styles.stopButton]}
          activeOpacity={0.85}
          onPress={sessionActive ? handleStop : handleStart}
        >
          <Text
            style={[
              styles.startButtonText,
              sessionActive && styles.stopButtonText,
            ]}
          >
            {sessionActive ? 'STOP' : 'START'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  back: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  backText: {
    color: colors.textDim,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1,
  },
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

  // Workout card with accent stripe
  card: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  accentBar: { width: 5, backgroundColor: colors.walk },
  cardBody: {
    flex: 1,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardTitle: {
    color: colors.text,
    fontFamily: fonts.display,
    fontSize: 24,
    letterSpacing: 0.5,
    flexShrink: 1,
  },
  cardDate: {
    color: colors.textDim,
    fontSize: 13,
    marginLeft: 12,
  },

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
    shadowColor: colors.walk,
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
  // Active session: pink button reading STOP.
  stopButton: {
    backgroundColor: colors.accent2,
    shadowColor: colors.accent2,
  },
  stopButtonText: { color: '#FFFFFF' },
});
