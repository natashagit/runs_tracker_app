import { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from 'convex/react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { api } from '../../convex/_generated/api';
import type { RootStackParamList } from '../navigation';
import { colors, fonts } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'WorkoutCalendar'>;

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

// Stable local-date key (year-month-day) for comparing calendar days.
const dayKey = (y: number, m: number, d: number) => `${y}-${m}-${d}`;

export default function WorkoutCalendarScreen({ navigation }: Props) {
  const logs = useQuery(api.exerciseLogs.list);

  // The set of local days that have at least one logged exercise.
  const loggedDays = useMemo(() => {
    const set = new Set<string>();
    for (const log of logs ?? []) {
      const d = new Date(log.date);
      set.add(dayKey(d.getFullYear(), d.getMonth(), d.getDate()));
    }
    return set;
  }, [logs]);

  const today = new Date();
  const todayKey = dayKey(today.getFullYear(), today.getMonth(), today.getDate());

  const [view, setView] = useState({
    year: today.getFullYear(),
    month: today.getMonth(),
  });

  const weeks = useMemo(() => {
    const firstWeekday = new Date(view.year, view.month, 1).getDay();
    const daysInMonth = new Date(view.year, view.month + 1, 0).getDate();
    const cells: (number | null)[] = [];
    for (let i = 0; i < firstWeekday; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    while (cells.length % 7 !== 0) cells.push(null);
    const rows: (number | null)[][] = [];
    for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));
    return rows;
  }, [view]);

  const prevMonth = () =>
    setView((v) =>
      v.month === 0
        ? { year: v.year - 1, month: 11 }
        : { year: v.year, month: v.month - 1 }
    );
  const nextMonth = () =>
    setView((v) =>
      v.month === 11
        ? { year: v.year + 1, month: 0 }
        : { year: v.year, month: v.month + 1 }
    );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <TouchableOpacity
        style={styles.back}
        onPress={() => navigation.goBack()}
        hitSlop={10}
      >
        <Text style={styles.backText}>‹ WORKOUTS</Text>
      </TouchableOpacity>
      <View style={styles.header}>
        <Text style={styles.title}>CALENDAR</Text>
      </View>

      <View style={styles.monthRow}>
        <TouchableOpacity onPress={prevMonth} hitSlop={12} style={styles.arrowBtn}>
          <Text style={styles.arrow}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.monthLabel}>
          {MONTHS[view.month]} {view.year}
        </Text>
        <TouchableOpacity onPress={nextMonth} hitSlop={12} style={styles.arrowBtn}>
          <Text style={styles.arrow}>›</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.weekdayRow}>
        {WEEKDAYS.map((d, i) => (
          <View key={i} style={styles.cell}>
            <Text style={styles.weekday}>{d}</Text>
          </View>
        ))}
      </View>

      <View style={styles.grid}>
        {weeks.map((week, wi) => (
          <View key={wi} style={styles.weekRow}>
            {week.map((day, di) => {
              if (day === null) {
                return <View key={di} style={styles.cell} />;
              }
              const key = dayKey(view.year, view.month, day);
              const isToday = key === todayKey;
              const isLogged = loggedDays.has(key);
              return (
                <View key={di} style={styles.cell}>
                  <View
                    style={[
                      styles.dayCircle,
                      isLogged && styles.dayLogged,
                      isToday && styles.dayToday,
                    ]}
                  >
                    <Text
                      style={[
                        styles.dayText,
                        (isLogged || isToday) && styles.dayTextOn,
                      ]}
                    >
                      {day}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        ))}
      </View>

      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.walk }]} />
          <Text style={styles.legendText}>WORKOUT LOGGED</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.accent2 }]} />
          <Text style={styles.legendText}>TODAY</Text>
        </View>
      </View>
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
    paddingBottom: 8,
  },
  title: {
    color: colors.text,
    fontFamily: fonts.display,
    fontSize: 44,
    letterSpacing: 1,
  },

  monthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  arrowBtn: { width: 44, alignItems: 'center' },
  arrow: {
    color: colors.text,
    fontSize: 30,
    lineHeight: 32,
  },
  monthLabel: {
    color: colors.text,
    fontFamily: fonts.display,
    fontSize: 24,
    letterSpacing: 0.5,
  },

  weekdayRow: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    marginTop: 4,
  },
  weekday: {
    color: colors.textDim,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },

  grid: { paddingHorizontal: 12, marginTop: 4 },
  weekRow: { flexDirection: 'row' },
  cell: {
    flex: 1,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayLogged: { backgroundColor: colors.walk },
  dayToday: { backgroundColor: colors.accent2 },
  dayText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '600',
  },
  dayTextOn: {
    color: colors.onAccent,
    fontWeight: '800',
  },

  legend: {
    flexDirection: 'row',
    gap: 24,
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center' },
  legendDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    marginRight: 8,
  },
  legendText: {
    color: colors.textDim,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
