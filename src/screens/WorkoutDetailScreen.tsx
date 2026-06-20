import { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from 'convex/react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { api } from '../../convex/_generated/api';
import type { Doc } from '../../convex/_generated/dataModel';
import type { RootStackParamList } from '../navigation';
import { colors, fonts } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'WorkoutDetail'>;
type ExerciseLog = Doc<'exerciseLogs'>;

// Stable local-date key (year-month-day), matching the calendar's logic so a
// log lands on the same day the user tapped regardless of the time of day.
const dayKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;

export default function WorkoutDetailScreen({ navigation, route }: Props) {
  const { date, title } = route.params;
  const logs = useQuery(api.exerciseLogs.list);
  const loading = logs === undefined;

  const targetKey = dayKey(new Date(date));

  // The exercises logged on this day, grouped by workout category. When a
  // `title` is passed (coming from a single workout card) we narrow to just
  // that category; from the calendar we show every category done that day.
  const groups = useMemo(() => {
    const byCategory = new Map<string, ExerciseLog[]>();
    for (const log of logs ?? []) {
      if (dayKey(new Date(log.date)) !== targetKey) continue;
      if (title && log.workout !== title) continue;
      const list = byCategory.get(log.workout) ?? [];
      list.push(log);
      byCategory.set(log.workout, list);
    }
    // Within a category, show exercises in the order they were logged.
    return Array.from(byCategory.entries()).map(([category, items]) => ({
      category,
      items: items.sort((a, b) => a.date.localeCompare(b.date)),
    }));
  }, [logs, targetKey, title]);

  const dateLabel = new Date(date).toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const isEmpty = !loading && groups.length === 0;

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
        <Text style={styles.title}>{title ? title.toUpperCase() : 'WORKOUT'}</Text>
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
          groups.map((group) => (
            <View key={group.category} style={styles.group}>
              {/* Only show a category heading when more than one category was
                  done that day (i.e. when we didn't narrow to a title). */}
              {!title && (
                <Text style={styles.groupHeading}>
                  {group.category.toUpperCase()}
                </Text>
              )}
              {group.items.map((log) => (
                <View key={log._id} style={styles.card}>
                  <View style={styles.accentBar} />
                  <View style={styles.cardBody}>
                    <Text style={styles.exName}>{log.exercise}</Text>
                    <Text style={styles.exMeta}>
                      {log.sets} × {log.reps}
                      <Text style={styles.exMetaDim}>  SETS × REPS</Text>
                    </Text>
                  </View>
                </View>
              ))}
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

  group: { marginBottom: 8 },
  groupHeading: {
    color: colors.walk,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginTop: 12,
    marginBottom: 8,
    marginLeft: 4,
  },

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
  exName: {
    color: colors.text,
    fontFamily: fonts.display,
    fontSize: 22,
    letterSpacing: 0.5,
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
