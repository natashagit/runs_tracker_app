import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  type ListRenderItem,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation';
import {
  WORKOUT_CATEGORIES,
  EXERCISES,
  type WorkoutCategory,
} from '../workoutCatalog';
import { colors, fonts } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'NewWorkout'>;

export default function NewWorkoutScreen({ navigation }: Props) {
  const renderItem: ListRenderItem<WorkoutCategory> = ({ item }) => {
    const count = EXERCISES[item].length;
    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.7}
        onPress={() => navigation.navigate('WorkoutExercises', { category: item })}
      >
        <View style={styles.accentBar} />
        <View style={styles.cardBody}>
          <Text style={styles.cardTitle}>{item}</Text>
          <Text style={styles.cardMeta}>
            {count} EXERCISE{count === 1 ? '' : 'S'}
          </Text>
        </View>
        <Text style={styles.chevron}>›</Text>
      </TouchableOpacity>
    );
  };

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
        <Text style={styles.title}>NEW WORKOUT</Text>
      </View>

      <FlatList
        data={WORKOUT_CATEGORIES as readonly WorkoutCategory[]}
        keyExtractor={(c) => c}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />
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
  list: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 40 },

  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  accentBar: { width: 5, alignSelf: 'stretch', backgroundColor: colors.walk },
  cardBody: { flex: 1, padding: 16 },
  cardTitle: {
    color: colors.text,
    fontFamily: fonts.display,
    fontSize: 28,
    letterSpacing: 0.5,
  },
  cardMeta: {
    color: colors.textDim,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    marginTop: 4,
  },
  chevron: {
    color: colors.textDim,
    fontSize: 28,
    paddingRight: 18,
  },
});
