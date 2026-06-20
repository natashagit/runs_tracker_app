import { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  PanResponder,
  Dimensions,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMutation } from 'convex/react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { api } from '../../convex/_generated/api';
import type { RootStackParamList } from '../navigation';
import { EXERCISES, DEFAULT_SETS, DEFAULT_REPS } from '../workoutCatalog';
import { colors, fonts } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'WorkoutExercises'>;

const SCREEN_W = Dimensions.get('window').width;
const SWIPE_THRESHOLD = Math.max(120, SCREEN_W * 0.35);

// A small "− value +" stepper. Increments by 1, never below `min`.
function Stepper({
  label,
  value,
  min,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  onChange: (next: number) => void;
}) {
  return (
    <View style={styles.stepper}>
      <Text style={styles.stepperLabel}>{label}</Text>
      <TouchableOpacity
        style={styles.stepBtn}
        onPress={() => onChange(Math.max(min, value - 1))}
        hitSlop={8}
      >
        <Text style={styles.stepBtnText}>−</Text>
      </TouchableOpacity>
      <Text style={styles.stepValue}>{value}</Text>
      <TouchableOpacity
        style={styles.stepBtn}
        onPress={() => onChange(value + 1)}
        hitSlop={8}
      >
        <Text style={styles.stepBtnText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

function ExerciseRow({
  name,
  completed,
  onComplete,
}: {
  name: string;
  completed: boolean;
  onComplete: (name: string, sets: number, reps: number) => void;
}) {
  const [sets, setSets] = useState(DEFAULT_SETS);
  const [reps, setReps] = useState(DEFAULT_REPS);
  const translateX = useRef(new Animated.Value(0)).current;

  // Keep the latest values/callback so the PanResponder closure isn't stale.
  const latest = useRef({ sets, reps, onComplete });
  latest.current = { sets, reps, onComplete };

  const pan = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_e, g) =>
        Math.abs(g.dx) > 10 && Math.abs(g.dx) > Math.abs(g.dy),
      onPanResponderMove: (_e, g) => {
        if (g.dx < 0) translateX.setValue(g.dx);
      },
      onPanResponderRelease: (_e, g) => {
        if (g.dx < -SWIPE_THRESHOLD) {
          Animated.timing(translateX, {
            toValue: -SCREEN_W,
            duration: 180,
            useNativeDriver: true,
          }).start(() => {
            const { sets: s, reps: r, onComplete: cb } = latest.current;
            cb(name, s, r);
          });
        } else {
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
            bounciness: 6,
          }).start();
        }
      },
    })
  ).current;

  if (completed) {
    return (
      <View style={[styles.card, styles.cardDone]}>
        <View style={[styles.accentBar, styles.accentBarDone]} />
        <View style={styles.cardBody}>
          <Text style={[styles.exName, styles.exNameDone]}>{name}</Text>
          <View style={styles.doneRow}>
            <Text style={styles.doneBadge}>✓ LOGGED</Text>
            <Text style={styles.doneSummary}>
              {sets} × {reps}
            </Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.rowWrap}>
      <View style={styles.swipeBg}>
        <Text style={styles.swipeBgText}>✓ LOG</Text>
      </View>
      <Animated.View
        style={[styles.card, { transform: [{ translateX }] }]}
        {...pan.panHandlers}
      >
        <View style={styles.accentBar} />
        <View style={styles.cardBody}>
          <Text style={styles.exName}>{name}</Text>
          <View style={styles.steppers}>
            <Stepper label="SETS" value={sets} min={1} onChange={setSets} />
            <Stepper label="REPS" value={reps} min={1} onChange={setReps} />
          </View>
        </View>
      </Animated.View>
    </View>
  );
}

export default function WorkoutExercisesScreen({ navigation, route }: Props) {
  const { category } = route.params;
  const exercises = EXERCISES[category];

  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [sessionLogged, setSessionLogged] = useState(false);
  const logExercise = useMutation(api.exerciseLogs.add);
  const logWorkout = useMutation(api.workouts.add);

  const handleComplete = async (name: string, sets: number, reps: number) => {
    // Optimistically mark done; the row has already animated away.
    setCompleted((prev) => new Set(prev).add(name));
    try {
      await logExercise({
        date: new Date().toISOString(),
        workout: category,
        exercise: name,
        sets,
        reps,
      });
    } catch (e) {
      setCompleted((prev) => {
        const next = new Set(prev);
        next.delete(name);
        return next;
      });
      Alert.alert('Could not log exercise', 'Please try again.');
    }
  };

  const doneCount = completed.size;
  const allDone = exercises.length > 0 && doneCount === exercises.length;

  // Once every exercise is logged, record the workout session for the day
  // so it shows up in the Workouts list and the total count. Fires once.
  useEffect(() => {
    if (!allDone || sessionLogged) return;
    setSessionLogged(true);
    logWorkout({ date: new Date().toISOString(), title: category }).catch(() => {
      setSessionLogged(false); // allow another attempt
      Alert.alert('Could not save workout', 'Please try again.');
    });
  }, [allDone, sessionLogged, logWorkout, category]);

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
        <Text style={styles.title}>{category.toUpperCase()}</Text>
        <Text style={[styles.subtitle, allDone && styles.subtitleDone]}>
          {allDone
            ? '✓ WORKOUT LOGGED FOR TODAY'
            : `${doneCount}/${exercises.length} LOGGED · SWIPE LEFT TO LOG`}
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      >
        {exercises.map((name) => (
          <ExerciseRow
            key={name}
            name={name}
            completed={completed.has(name)}
            onComplete={handleComplete}
          />
        ))}
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
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    marginTop: 2,
  },
  subtitleDone: { color: colors.walk },
  list: { paddingHorizontal: 16, paddingBottom: 40 },

  rowWrap: {
    marginBottom: 12,
    borderRadius: 16,
    overflow: 'hidden',
  },
  // Revealed behind the card as it slides left.
  swipeBg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.walk,
    borderRadius: 16,
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingRight: 24,
  },
  swipeBgText: {
    color: colors.onAccent,
    fontFamily: fonts.display,
    fontSize: 20,
    letterSpacing: 1,
  },

  card: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  cardDone: { marginBottom: 12, opacity: 0.85 },
  accentBar: { width: 5, alignSelf: 'stretch', backgroundColor: colors.walk },
  accentBarDone: { backgroundColor: colors.textDim },
  cardBody: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  exName: {
    color: colors.text,
    fontFamily: fonts.display,
    fontSize: 22,
    letterSpacing: 0.5,
  },
  exNameDone: { color: colors.textDim },

  steppers: { marginTop: 10, gap: 8 },
  stepper: { flexDirection: 'row', alignItems: 'center' },
  stepperLabel: {
    color: colors.textDim,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    width: 44,
  },
  stepBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBtnText: {
    color: colors.text,
    fontSize: 20,
    lineHeight: 22,
    fontWeight: '700',
  },
  stepValue: {
    color: colors.text,
    fontFamily: fonts.display,
    fontSize: 20,
    minWidth: 40,
    textAlign: 'center',
  },

  doneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  doneBadge: {
    color: colors.walk,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
  },
  doneSummary: {
    color: colors.textDim,
    fontSize: 14,
    fontWeight: '700',
  },
});
