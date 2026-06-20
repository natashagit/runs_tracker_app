import { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from 'convex/react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { api } from '../../convex/_generated/api';
import type { RootStackParamList } from '../navigation';
import { colors, fonts } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'WorkoutDetail'>;

// Stable local-date key (year-month-day), matching the calendar's logic so a
// log lands on the same day the user tapped regardless of the time of day.
const dayKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;

export default function WorkoutDetailScreen({ navigation, route }: Props) {
  const { date, title } = route.params;
  const logs = useQuery(api.exerciseLogs.list);
  const loading = logs === undefined;

  const targetKey = dayKey(new Date(date));

  // Every exercise logged on this day, as one combined list (in log order).
  // A day may include more than one category (e.g. Back then Arms) — they're
  // shown together here, not split into separate sections.
  const dayLogs = useMemo(() => {
    return (logs ?? [])
      .filter((log) => dayKey(new Date(log.date)) === targetKey)
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [logs, targetKey]);

  // The day's title is the distinct categories joined: "Back + Arms". Derived
  // from the logs so it's correct from either entry point; falls back to any
  // title passed in, then a generic label.
  const headerTitle = useMemo(() => {
    const cats: string[] = [];
    for (const log of dayLogs) {
      if (!cats.includes(log.workout)) cats.push(log.workout);
    }
    return cats.join(' + ') || title || 'Workout';
  }, [dayLogs, title]);

  const dateLabel = new Date(date).toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const isEmpty = !loading && dayLogs.length === 0;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <TouchableOpacity
        style={styles.back}
        onPress={() => navigation.goBack()}
        hitSlop={10}
      >
        <Text style={styles.backText}>‹ BACK</Text>
      </TouchableOpacity>
      <View style={styles.header}>
        <Text style={styles.title}>{headerTitle.toUpperCase()}</Text>
        <Text style={styles.subtitle}>{dateLabel}</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      >
        {isEmpty ? (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>NO EXERCISES LOGGED</Text>
            <Text style={styles.emptyText}>
              There are no logged exercises for this day.
            </Text>
          </View>
        ) : (
          dayLogs.map((log) => (
            <View key={log._id} style={styles.card}>
              <View style={styles.accentBar} />
              <View style={styles.cardBody}>
                <View style={styles.exHeader}>
                  <Text style={styles.exName}>{log.exercise}</Text>
                  {/* Small tag so Back vs Arms exercises stay distinguishable
                      within the single combined list. */}
                  <Text style={styles.exTag}>{log.workout.toUpperCase()}</Text>
                </View>
                <Text style={styles.exMeta}>
                  {log.sets} × {log.reps}
                  <Text style={styles.exMetaDim}>  SETS × REPS</Text>
                </Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  back: { paddingHorizontal: 20, paddingTop: 8 },
  backText: {
    color: colors.textDim,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
  title: {
    color: colors.text,
    fontFamily: fonts.display,
    fontSize: 44,
    letterSpacing: 1,
  },
  subtitle: {
    color: colors.textDim,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  list: { paddingHorizontal: 16, paddingBottom: 40 },

  card: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  accentBar: { width: 5, alignSelf: 'stretch', backgroundColor: colors.walk },
  cardBody: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  exHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  exName: {
    color: colors.text,
    fontFamily: fonts.display,
    fontSize: 22,
    letterSpacing: 0.5,
    flexShrink: 1,
  },
  exTag: {
    color: colors.walk,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    marginLeft: 10,
  },
  exMeta: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
    marginTop: 6,
  },
  exMetaDim: {
    color: colors.textDim,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },

  empty: { alignItems: 'center', marginTop: 60, paddingHorizontal: 40 },
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
});
