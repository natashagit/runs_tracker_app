import { View, Text, StyleSheet } from 'react-native';
import MapView, { Polyline, Marker } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  formatDistance,
  formatDuration,
  formatDate,
  regionForCoords,
  splitSegments,
} from '../geo';
import { colors } from '../theme';

export default function RunDetailScreen({ route }) {
  const { run } = route.params;
  const region = regionForCoords(run.coords);
  const start = run.coords[0];
  const end = run.coords[run.coords.length - 1];

  // Split into contiguous walk/run segments so each draws in its phase color.
  const segments = splitSegments(run.coords);
  // A point with no mode is a legacy run (saved before phases) — draw it neutral.
  const colorFor = (m) =>
    m === 'run' ? colors.run : m === 'walk' ? colors.walk : colors.track;

  return (
    <View style={styles.container}>
      <MapView style={styles.map} initialRegion={region}>
        {segments.map(
          (seg, i) =>
            seg.points.length > 1 && (
              <Polyline
                key={i}
                coordinates={seg.points}
                strokeColor={colorFor(seg.mode)}
                strokeWidth={5}
              />
            )
        )}
        {start && (
          <Marker coordinate={start} title="Start" anchor={{ x: 0.5, y: 0.5 }}>
            <View style={[styles.dot, styles.startDot]} />
          </Marker>
        )}
        {end && (
          <Marker coordinate={end} title="Finish" anchor={{ x: 0.5, y: 0.5 }}>
            <View style={[styles.dot, styles.endDot]} />
          </Marker>
        )}
      </MapView>

      <SafeAreaView style={styles.panel} edges={['bottom']}>
        <Text style={styles.date}>{formatDate(run.date)}</Text>
        <View style={styles.statsRow}>
          <Stat label="Total" value={formatDistance(run.distanceM)} />
          <Stat
            label="Run"
            value={formatDistance(run.runDistanceM ?? 0)}
            color={colors.run}
          />
          <Stat label="Time" value={formatDuration(run.durationSec)} />
        </View>
      </SafeAreaView>
    </View>
  );
}

function Stat({ label, value, color }) {
  return (
    <View style={styles.stat}>
      <Text style={[styles.statValue, color && { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  map: { flex: 1 },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 3,
    borderColor: '#fff',
  },
  startDot: { backgroundColor: colors.accent },
  endDot: { backgroundColor: colors.danger },
  panel: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    borderTopWidth: 1,
    borderColor: colors.border,
  },
  date: { color: colors.textDim, fontSize: 14, marginBottom: 16 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  stat: { flex: 1 },
  statValue: { color: colors.text, fontSize: 20, fontWeight: '700' },
  statLabel: { color: colors.textDim, fontSize: 12, marginTop: 4 },
});
