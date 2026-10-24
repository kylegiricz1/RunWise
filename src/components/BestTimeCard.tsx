import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LocationSource } from '../types/location';
import { formatTimeLabel } from '../utils/time';

type Props = {
  city: string | null;
  state: string | null;
  bestTime: string | null;
  dayLabel: string; // e.g. "Today", "Tomorrow", "Thursday"
  source?: LocationSource;
  onPressLocation?: () => void;
  // Past-hour awareness props
  isToday?: boolean;
  isPrimePassed?: boolean;
  isOutsideWindow?: boolean;
  preferredWindowPassed?: boolean;
  overallBestTime?: string | null;
  allWindowsPassed?: boolean;
  onJumpToTomorrow?: () => void;
};

export default function BestTimeCard({
  city,
  state,
  bestTime,
  dayLabel,
  source,
  onPressLocation,
  isToday = false,
  isPrimePassed = false,
  isOutsideWindow = false,
  preferredWindowPassed = false,
  overallBestTime,
  allWindowsPassed = false,
  onJumpToTomorrow,
}: Props) {
  const locationLabel = [city, state].filter(Boolean).join(', ') || 'Choose location';
  const formattedBestTime = formatTimeLabel(bestTime);
  const formattedOverall = formatTimeLabel(overallBestTime);

  return (
    <View style={styles.section}>
      <View style={styles.headerRow}>
        <Text style={styles.heading}>Your best run window</Text>
        {onPressLocation ? (
          <Pressable
            style={({ pressed }) => [styles.locationPill, pressed && styles.locationPillPressed]}
            onPress={onPressLocation}
            hitSlop={6}
          >
            <Ionicons
              name={source === 'gps' ? 'navigate-circle' : 'location-sharp'}
              size={14}
              color="#3B82F6"
            />
            <Text style={styles.locationText} numberOfLines={1}>
              {locationLabel}
            </Text>
            <Ionicons name="chevron-down" size={12} color="#64748B" />
          </Pressable>
        ) : locationLabel ? (
          <Text style={styles.locationText}>{locationLabel}</Text>
        ) : null}
      </View>

      <View style={[styles.mainCard, allWindowsPassed && styles.mainCardCompleted]}>
        <View style={styles.cardHeaderRow}>
          <Text style={styles.dayLabel}>{dayLabel}</Text>
          {isToday && isOutsideWindow && (
            <View style={styles.outsideBadge}>
              <Ionicons name="sparkles" size={11} color="#BAE6FD" />
              <Text style={styles.outsideBadgeText}>REST OF DAY</Text>
            </View>
          )}
          {isToday && !isOutsideWindow && isPrimePassed && !allWindowsPassed && (
            <View style={styles.remainingBadge}>
              <Ionicons name="time" size={11} color="#FEF08A" />
              <Text style={styles.remainingBadgeText}>BEST REMAINING</Text>
            </View>
          )}
          {isToday && allWindowsPassed && (
            <View style={styles.completedBadge}>
              <Ionicons name="checkmark-circle" size={12} color="#E2E8F0" />
              <Text style={styles.completedBadgeText}>COMPLETED</Text>
            </View>
          )}
        </View>

        {allWindowsPassed ? (
          <>
            <Text style={styles.timePassed}>Done for today</Text>
            {formattedOverall ? (
              <Text style={styles.subtitle}>
                Today's prime window was at {formattedOverall}.
              </Text>
            ) : (
              <Text style={styles.subtitle}>No more run windows remaining today.</Text>
            )}

            {onJumpToTomorrow && (
              <Pressable
                style={({ pressed }) => [
                  styles.tomorrowButton,
                  pressed && styles.tomorrowButtonPressed,
                ]}
                onPress={onJumpToTomorrow}
                hitSlop={6}
              >
                <Text style={styles.tomorrowButtonText}>View Tomorrow's Forecast</Text>
                <Ionicons name="arrow-forward" size={14} color="#3B82F6" />
              </Pressable>
            )}
          </>
        ) : (
          <>
            <Text style={styles.time}>{formattedBestTime ?? '—'}</Text>
            {isToday && isOutsideWindow ? (
              <Text style={styles.subtitleHighlight}>
                Preferred window passed · Best available for rest of today
              </Text>
            ) : isToday && isPrimePassed && formattedOverall ? (
              <Text style={styles.subtitleHighlight}>
                Earlier prime window: {formattedOverall} (passed)
              </Text>
            ) : (
              <Text style={styles.subtitle}>Cool temperatures and low wind</Text>
            )}
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: 4,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  heading: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#172033',
  },
  locationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    maxWidth: '55%',
  },
  locationPillPressed: {
    backgroundColor: '#F1F5F9',
  },
  locationText: {
    color: '#475569',
    fontSize: 12,
    fontWeight: '600',
    flexShrink: 1,
  },
  mainCard: {
    backgroundColor: '#3B82F6',
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 14,
    marginTop: 4,
  },
  mainCardCompleted: {
    backgroundColor: '#334155',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dayLabel: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  outsideBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.28)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  outsideBadgeText: {
    color: '#BAE6FD',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  remainingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.22)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  remainingBadgeText: {
    color: '#FEF08A',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  completedBadgeText: {
    color: '#E2E8F0',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  time: {
    color: 'white',
    fontSize: 36,
    fontWeight: 'bold',
  },
  timePassed: {
    color: 'white',
    fontSize: 30,
    fontWeight: 'bold',
    marginTop: 2,
  },
  subtitle: {
    color: 'white',
    fontSize: 13,
    marginTop: 2,
    fontWeight: '600',
  },
  subtitleHighlight: {
    color: '#FEF08A',
    fontSize: 12.5,
    marginTop: 3,
    fontWeight: '600',
  },
  tomorrowButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 14,
    marginTop: 10,
    alignSelf: 'flex-start',
  },
  tomorrowButtonPressed: {
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
  },
  tomorrowButtonText: {
    color: '#3B82F6',
    fontSize: 13,
    fontWeight: '700',
  },
});
