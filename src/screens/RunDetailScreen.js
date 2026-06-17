import { View, Text, StyleSheet } from 'react-native';
import MapView, { Polyline, Marker } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  formatDistance,
  formatDuration,
  formatPace,
  formatDate,
  regionForCoords,
} from '../geo';
import { colors } from '../theme';

export default function RunDetailScreen({ route }) {
  const { run } = route.params;
  const region = regionForCoords(run.coords);
  const start = run.coords[0];
  const end = run.coords[run.coords.length - 1];

  // Split into walk/run segments by each point's mode (same as TrackScreen).
  const walkLine = run.coords.filter((p) => p.mode === 'walk');
  const runPoints = run.coords.filter((p) => p.mode === 'run');
  const runLine =
    walkLine.length && runPoints.length
      ? [walkLine[walkLine.length - 1], ...runPoints]
      : runPoints;
  // Older runs saved before phases existed have no mode — draw them as one line.
  const isLegacy = walkLine.length === 0 && runPoints.length === 0;

  return (
    <View style={styles.container}>
      <MapView style={styles.map} initialRegion={region}>
        {isLegacy && run.coords.length > 1 && (
          <Polyline
            coordinates={run.coords}
            strokeColor={colors.track}
            strokeWidth={5}
          />
        )}
        {walkLine.length > 1 && (
          <Polyline
            coordinates={walkLine}
            strokeColor={colors.walk}
            strokeWidth={5}
          />
        )}
        {runLine.length > 1 && (
          <Polyline
            coordinates={runLine}
            strokeColor={colors.run}
            strokeWidth={5}
          />
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
          <Stat label="Distance" value={formatDistance(run.distanceM)} />
          <Stat label="Time" value={formatDuration(run.durationSec)} />
          <Stat label="Pace" value={formatPace(run.durationSec, run.distanceM)} />
        </View>
      </SafeAreaView>
    </View>
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
