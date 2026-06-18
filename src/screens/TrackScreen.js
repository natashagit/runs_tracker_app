import { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Polyline, Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import {
  pathDistance,
  distanceByMode,
  splitSegments,
  formatDistance,
  formatDuration,
} from '../geo';
import { useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { colors, fonts } from '../theme';

export default function TrackScreen({ navigation }) {
  const addRun = useMutation(api.runs.add);

  const [permission, setPermission] = useState('pending'); // pending | granted | denied
  const [region, setRegion] = useState(null);
  const [coords, setCoords] = useState([]);
  const [elapsed, setElapsed] = useState(0);
  const [status, setStatus] = useState('idle'); // idle | running | paused
  const [mode, setMode] = useState('walk'); // walk | run

  const subRef = useRef(null);
  const timerRef = useRef(null);
  const statusRef = useRef('idle');
  const modeRef = useRef('walk');
  const mapRef = useRef(null);

  // Keep refs in sync with state so the GPS callback reads current values.
  useEffect(() => {
    statusRef.current = status;
  }, [status]);
  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  // Request permission, get an initial fix, then auto-start tracking (the walk).
  useEffect(() => {
    (async () => {
      const { status: perm } = await Location.requestForegroundPermissionsAsync();
      if (perm !== 'granted') {
        setPermission('denied');
        return;
      }
      setPermission('granted');
      try {
        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        setRegion({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
          latitudeDelta: 0.006,
          longitudeDelta: 0.006,
        });
      } catch (e) {
        // Leave region null; map will still render at default.
      }
      // Auto-start the walk the moment you arrive from the Home START button.
      handleStart();
    })();

    return () => stopWatching();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const distance = useMemo(() => pathDistance(coords), [coords]);
  const runDistance = useMemo(() => distanceByMode(coords, 'run'), [coords]);

  // Break the path into contiguous walk/run segments so each draws in its own
  // color. Works for any number of switches (sprint → walk → sprint …).
  const segments = useMemo(() => splitSegments(coords), [coords]);

  const startWatching = async () => {
    subRef.current = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.BestForNavigation,
        distanceInterval: 4, // meters
        timeInterval: 2000,
      },
      (loc) => {
        if (statusRef.current !== 'running') return;
        const { latitude, longitude, accuracy } = loc.coords;
        // Drop low-accuracy noise.
        if (accuracy != null && accuracy > 35) return;
        // Tag each point with the phase it was recorded in (walk or run).
        const point = { latitude, longitude, mode: modeRef.current };
        setCoords((prev) => [...prev, point]);
        if (mapRef.current) {
          mapRef.current.animateCamera({ center: point }, { duration: 500 });
        }
      }
    );
  };

  const stopWatching = () => {
    if (subRef.current) {
      subRef.current.remove();
      subRef.current = null;
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const handleStart = async () => {
    setStatus('running');
    statusRef.current = 'running';
    timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
    await startWatching();
  };

  // Toggle between walk and run. Points recorded after this are tagged with the
  // new phase and drawn in that phase's color. Flip it as often as you like.
  const handleToggleMode = () => {
    const next = modeRef.current === 'run' ? 'walk' : 'run';
    setMode(next);
    modeRef.current = next;
  };

  const handlePause = () => {
    setStatus('paused');
    statusRef.current = 'paused';
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const handleResume = () => {
    setStatus('running');
    statusRef.current = 'running';
    timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
  };

  const handleFinish = () => {
    handlePause();
    if (distance < 10 || coords.length < 2) {
      Alert.alert('Too short', 'Not enough distance to save this session.', [
        { text: 'Keep going', style: 'cancel', onPress: handleResume },
        {
          text: 'Discard',
          style: 'destructive',
          onPress: () => navigation.goBack(),
        },
      ]);
      return;
    }
    Alert.alert('Finish?', 'Save this session to your log?', [
      { text: 'Keep going', style: 'cancel', onPress: handleResume },
      {
        text: 'Save',
        onPress: async () => {
          stopWatching();
          try {
            await addRun({
              date: new Date().toISOString(),
              durationSec: elapsed,
              distanceM: distance, // total: walk + run
              runDistanceM: runDistance, // run portion only
              coords,
            });
            navigation.goBack();
          } catch (e) {
            Alert.alert('Could not save', 'Please try again.', [
              { text: 'OK', onPress: handleResume },
            ]);
          }
        },
      },
    ]);
  };

  if (permission === 'denied') {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.deniedTitle}>Location needed</Text>
        <Text style={styles.deniedText}>
          Run Tracker needs location access to map your route. Enable it in your
          device settings and try again.
        </Text>
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.secondaryButtonText}>Go back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  if (permission === 'pending') {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator color={colors.accent} size="large" />
        <Text style={styles.deniedText}>Getting your location…</Text>
      </SafeAreaView>
    );
  }

  const phaseColor = mode === 'run' ? colors.run : colors.walk;

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={region}
        showsUserLocation
        showsMyLocationButton={false}
        followsUserLocation={status === 'running'}
      >
        {segments.map(
          (seg, i) =>
            seg.points.length > 1 && (
              <Polyline
                key={i}
                coordinates={seg.points}
                strokeColor={seg.mode === 'run' ? colors.run : colors.walk}
                strokeWidth={5}
              />
            )
        )}
        {coords.length > 0 && (
          <Marker
            coordinate={coords[coords.length - 1]}
            anchor={{ x: 0.5, y: 0.5 }}
          >
            <View style={[styles.dot, { backgroundColor: phaseColor }]} />
          </Marker>
        )}
      </MapView>

      <SafeAreaView style={styles.statsPanel} edges={['bottom']}>
        <View style={styles.phaseRow}>
          <View style={[styles.phaseDot, { backgroundColor: phaseColor }]} />
          <Text style={styles.phaseText}>
            {mode === 'run' ? 'RUNNING' : 'WALKING'}
          </Text>
        </View>

        <View style={styles.statsRow}>
          <Stat label="Time" value={formatDuration(elapsed)} big />
          <Stat label="Total" value={formatDistance(distance)} big />
          <Stat label="Run" value={formatDistance(runDistance)} big />
        </View>

        <View style={styles.controls}>
          {status === 'running' && (
            <TouchableOpacity
              style={[
                styles.button,
                { backgroundColor: mode === 'run' ? colors.walk : colors.run },
              ]}
              onPress={handleToggleMode}
            >
              <Text style={styles.toggleText}>
                {mode === 'run' ? 'START WALK' : 'START RUN'}
              </Text>
            </TouchableOpacity>
          )}

          {status === 'running' && (
            <TouchableOpacity
              style={[styles.button, styles.pause]}
              onPress={handlePause}
            >
              <Text style={styles.pauseText}>PAUSE</Text>
            </TouchableOpacity>
          )}

          {status === 'paused' && (
            <View style={styles.pausedRow}>
              <TouchableOpacity
                style={[styles.button, styles.resume, styles.half]}
                onPress={handleResume}
              >
                <Text style={styles.startText}>RESUME</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.finish, styles.half]}
                onPress={handleFinish}
              >
                <Text style={styles.finishText}>FINISH</Text>
              </TouchableOpacity>
            </View>
          )}

          {status === 'running' && (
            <TouchableOpacity onPress={handleFinish} style={styles.finishLink}>
              <Text style={styles.finishLinkText}>FINISH</Text>
            </TouchableOpacity>
          )}
        </View>
      </SafeAreaView>
    </View>
  );
}

function Stat({ label, value, big }) {
  return (
    <View style={styles.stat}>
      <Text style={[styles.statValue, big && styles.statValueBig]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  map: { flex: 1 },
  center: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  deniedTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
  },
  deniedText: {
    color: colors.textDim,
    fontSize: 15,
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 22,
  },
  dot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 3,
    borderColor: '#fff',
  },
  statsPanel: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 18,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderColor: colors.border,
  },
  phaseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  phaseDot: { width: 9, height: 9, borderRadius: 5, marginRight: 8 },
  phaseText: {
    color: colors.text,
    fontFamily: fonts.display,
    fontSize: 14,
    letterSpacing: 1.5,
  },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  stat: { flex: 1, alignItems: 'center' },
  statValue: { color: colors.text, fontFamily: fonts.display, fontSize: 22 },
  statValueBig: { fontSize: 34 },
  statLabel: {
    color: colors.textDim,
    fontSize: 11,
    marginTop: 4,
    letterSpacing: 1,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  controls: { marginTop: 20, marginBottom: 8 },
  button: {
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  resume: { backgroundColor: colors.accent },
  pause: { backgroundColor: colors.border },
  finish: { backgroundColor: colors.danger },
  toggleText: {
    color: colors.onAccent,
    fontFamily: fonts.display,
    fontSize: 18,
    letterSpacing: 1,
  },
  startText: {
    color: colors.onAccent,
    fontFamily: fonts.display,
    fontSize: 18,
    letterSpacing: 1,
  },
  pauseText: {
    color: colors.text,
    fontFamily: fonts.display,
    fontSize: 18,
    letterSpacing: 1,
  },
  finishText: {
    color: '#fff',
    fontFamily: fonts.display,
    fontSize: 18,
    letterSpacing: 1,
  },
  pausedRow: { flexDirection: 'row', gap: 12 },
  half: { flex: 1 },
  finishLink: { alignItems: 'center', paddingVertical: 6 },
  finishLinkText: {
    color: colors.textDim,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1,
  },
  secondaryButton: {
    marginTop: 28,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  secondaryButtonText: { color: colors.text, fontSize: 15, fontWeight: '600' },
});
