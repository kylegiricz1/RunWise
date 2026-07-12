import { useMemo, useRef, useState } from 'react';
import { PanResponder, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Line, Polyline, Rect, Text as SvgText } from 'react-native-svg';

type HourlyPoint = {
  time: string;
  feelsLike: number;
  humidity: number;
  rainChance: number;
  wind: number;
};

type Props = {
  data: HourlyPoint[];
  // Index into `data` marking the best time to run.
  // Leave undefined/null until the recommendation logic is wired up.
  bestTimeIndex?: number | null;
};

type SeriesKey = 'feelsLike' | 'humidity' | 'rainChance' | 'wind';

const CHART_WIDTH = 320;
const CHART_HEIGHT = 160;
const PADDING_LEFT = 34;
const PADDING_RIGHT = 34;
const PADDING_TOP = 16;
const PADDING_BOTTOM = 16;
const TOOLTIP_WIDTH = 132;
const TOOLTIP_HEIGHT = 92;

const plotWidth = CHART_WIDTH - PADDING_LEFT - PADDING_RIGHT;
const plotHeight = CHART_HEIGHT - PADDING_TOP - PADDING_BOTTOM;

const SERIES_META: Record<SeriesKey, { color: string; label: string; shape: 'line' | 'band' }> = {
  feelsLike: { color: '#F97316', label: 'Feels Like (°F)', shape: 'line' },
  humidity: { color: '#3B82F6', label: 'Humidity (%)', shape: 'line' },
  rainChance: { color: '#93C5FD', label: 'Rain Chance', shape: 'band' },
  wind: { color: '#10B981', label: 'Wind (mph)', shape: 'line' },
};

// Map a value to a y-pixel given a real domain (not normalized 0–1)
function scaleY(value: number, min: number, max: number) {
  const range = max - min || 1;
  const t = (value - min) / range;
  return PADDING_TOP + (1 - t) * plotHeight;
}

function xForIndex(i: number, count: number) {
  return PADDING_LEFT + (i / (count - 1)) * plotWidth;
}

function toScaledPoints(values: number[], min: number, max: number) {
  return values
    .map((v, i) => `${xForIndex(i, values.length)},${scaleY(v, min, max)}`)
    .join(' ');
}

function indexFromX(x: number, count: number) {
  const clampedX = Math.max(PADDING_LEFT, Math.min(CHART_WIDTH - PADDING_RIGHT, x));
  const ratio = (clampedX - PADDING_LEFT) / plotWidth;
  return Math.round(ratio * (count - 1));
}

export default function WeatherGraphCard({ data, bestTimeIndex }: Props) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [visible, setVisible] = useState<Record<SeriesKey, boolean>>({
    feelsLike: true,
    humidity: true,
    rainChance: true,
    wind: true,
  });

  const feelsLikeValues = data.map(d => d.feelsLike);
  const feelsLikeMin = Math.floor(Math.min(...feelsLikeValues) - 3);
  const feelsLikeMax = Math.ceil(Math.max(...feelsLikeValues) + 3);

  const humidityPoints = useMemo(
    () => toScaledPoints(data.map(d => d.humidity), 0, 100),
    [data]
  );
  const feelsLikePoints = useMemo(
    () => toScaledPoints(feelsLikeValues, feelsLikeMin, feelsLikeMax),
    [data, feelsLikeMin, feelsLikeMax]
  );

  const windValues = data.map(d => d.wind);
  const windMin = Math.floor(Math.min(...windValues, 0));
  const windMax = Math.ceil(Math.max(...windValues) + 2);
  const windPoints = useMemo(
    () => toScaledPoints(windValues, windMin, windMax),
    [data, windMin, windMax]
  );

  const barWidth = plotWidth / data.length;
  const bestTimeX =
    bestTimeIndex != null ? xForIndex(bestTimeIndex, data.length) : null;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: evt => {
        setActiveIndex(indexFromX(evt.nativeEvent.locationX, data.length));
      },
      onPanResponderMove: evt => {
        setActiveIndex(indexFromX(evt.nativeEvent.locationX, data.length));
      },
      onPanResponderRelease: () => setActiveIndex(null),
      onPanResponderTerminate: () => setActiveIndex(null),
    })
  ).current;

  if (data.length === 0) return null;

  const activePoint = activeIndex != null ? data[activeIndex] : null;
  const activeX = activeIndex != null ? xForIndex(activeIndex, data.length) : null;

  // Keep the tooltip on-screen by flipping it to the left of the touch
  // point when it would otherwise overflow the right edge of the chart.
  const tooltipX =
    activeX != null
      ? Math.min(
          Math.max(activeX - TOOLTIP_WIDTH / 2, 2),
          CHART_WIDTH - TOOLTIP_WIDTH - 2
        )
      : 0;

  function toggleSeries(key: SeriesKey) {
    setVisible(prev => ({ ...prev, [key]: !prev[key] }));
  }

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Tomorrow's Trends</Text>

      <View style={styles.legendRow}>
        {(Object.keys(SERIES_META) as SeriesKey[]).map(key => (
          <LegendToggle
            key={key}
            color={SERIES_META[key].color}
            label={SERIES_META[key].label}
            shape={SERIES_META[key].shape}
            active={visible[key]}
            onPress={() => toggleSeries(key)}
          />
        ))}
      </View>

      <View style={{ width: CHART_WIDTH, height: CHART_HEIGHT }} {...panResponder.panHandlers}>
        <Svg width={CHART_WIDTH} height={CHART_HEIGHT}>
          {/* Rain chance as a shaded background band per hour */}
          {visible.rainChance &&
            data.map((d, i) => (
              <Rect
                key={`rain-${i}`}
                x={PADDING_LEFT + i * barWidth}
                y={PADDING_TOP}
                width={barWidth}
                height={plotHeight}
                fill={SERIES_META.rainChance.color}
                opacity={(d.rainChance / 100) * 0.35}
              />
            ))}

          {/* Axis reference lines */}
          <Line
            x1={PADDING_LEFT}
            y1={PADDING_TOP}
            x2={PADDING_LEFT}
            y2={CHART_HEIGHT - PADDING_BOTTOM}
            stroke="#ddd"
            strokeWidth={1}
          />
          <Line
            x1={CHART_WIDTH - PADDING_RIGHT}
            y1={PADDING_TOP}
            x2={CHART_WIDTH - PADDING_RIGHT}
            y2={CHART_HEIGHT - PADDING_BOTTOM}
            stroke="#ddd"
            strokeWidth={1}
          />

          {/* Left axis labels (feels-like temp) */}
          {visible.feelsLike && (
            <>
              <SvgText x={4} y={PADDING_TOP + 4} fontSize={10} fill={SERIES_META.feelsLike.color}>
                {feelsLikeMax}°
              </SvgText>
              <SvgText x={4} y={CHART_HEIGHT - PADDING_BOTTOM} fontSize={10} fill={SERIES_META.feelsLike.color}>
                {feelsLikeMin}°
              </SvgText>
            </>
          )}

          {/* Right axis labels (humidity %) */}
          {visible.humidity && (
            <>
              <SvgText x={CHART_WIDTH - 28} y={PADDING_TOP + 4} fontSize={10} fill={SERIES_META.humidity.color}>
                100%
              </SvgText>
              <SvgText x={CHART_WIDTH - 24} y={CHART_HEIGHT - PADDING_BOTTOM} fontSize={10} fill={SERIES_META.humidity.color}>
                0%
              </SvgText>
            </>
          )}

          {visible.feelsLike && (
            <Polyline points={feelsLikePoints} fill="none" stroke={SERIES_META.feelsLike.color} strokeWidth={2} />
          )}
          {visible.humidity && (
            <Polyline points={humidityPoints} fill="none" stroke={SERIES_META.humidity.color} strokeWidth={2} />
          )}
          {visible.wind && (
            <Polyline points={windPoints} fill="none" stroke={SERIES_META.wind.color} strokeWidth={2} strokeDasharray="5,3" />
          )}

          {bestTimeX != null && (
            <>
              <Line
                x1={bestTimeX}
                y1={PADDING_TOP}
                x2={bestTimeX}
                y2={CHART_HEIGHT - PADDING_BOTTOM}
                stroke="#111"
                strokeWidth={2}
                strokeDasharray="4,4"
              />
              <SvgText x={bestTimeX} y={PADDING_TOP - 4} fontSize={11} fill="#111" textAnchor="middle">
                Best time
              </SvgText>
            </>
          )}

          {/* Touch indicator: vertical guide + dots on each visible series */}
          {activeIndex != null && activeX != null && (
            <>
              <Line
                x1={activeX}
                y1={PADDING_TOP}
                x2={activeX}
                y2={CHART_HEIGHT - PADDING_BOTTOM}
                stroke="#999"
                strokeWidth={1}
                strokeDasharray="3,3"
              />
              {visible.feelsLike && (
                <Circle
                  cx={activeX}
                  cy={scaleY(data[activeIndex].feelsLike, feelsLikeMin, feelsLikeMax)}
                  r={4}
                  fill={SERIES_META.feelsLike.color}
                  stroke="white"
                  strokeWidth={1.5}
                />
              )}
              {visible.humidity && (
                <Circle
                  cx={activeX}
                  cy={scaleY(data[activeIndex].humidity, 0, 100)}
                  r={4}
                  fill={SERIES_META.humidity.color}
                  stroke="white"
                  strokeWidth={1.5}
                />
              )}
              {visible.wind && (
                <Circle
                  cx={activeX}
                  cy={scaleY(data[activeIndex].wind, windMin, windMax)}
                  r={4}
                  fill={SERIES_META.wind.color}
                  stroke="white"
                  strokeWidth={1.5}
                />
              )}
            </>
          )}
        </Svg>

        {activePoint && (
          <View style={[styles.tooltip, { left: tooltipX, top: 4 }]} pointerEvents="none">
            <Text style={styles.tooltipTime}>{formatHour(activePoint.time)}</Text>
            {visible.feelsLike && (
              <TooltipRow color={SERIES_META.feelsLike.color} label="Feels like" value={`${activePoint.feelsLike}°`} />
            )}
            {visible.humidity && (
              <TooltipRow color={SERIES_META.humidity.color} label="Humidity" value={`${activePoint.humidity}%`} />
            )}
            {visible.rainChance && (
              <TooltipRow color={SERIES_META.rainChance.color} label="Rain" value={`${activePoint.rainChance}%`} />
            )}
            {visible.wind && (
              <TooltipRow color={SERIES_META.wind.color} label="Wind" value={`${activePoint.wind} mph`} />
            )}
          </View>
        )}
      </View>

      <View style={styles.axisRow}>
        <Text style={styles.axisLabel}>{formatHour(data[0].time)}</Text>
        <Text style={styles.axisLabel}>
          {formatHour(data[Math.floor(data.length / 2)].time)}
        </Text>
        <Text style={styles.axisLabel}>{formatHour(data[data.length - 1].time)}</Text>
      </View>

      {activeIndex == null && (
        <Text style={styles.hint}>Touch and drag the chart to see values</Text>
      )}
    </View>
  );
}

function LegendToggle({
  color,
  label,
  shape,
  active,
  onPress,
}: {
  color: string;
  label: string;
  shape: 'line' | 'band';
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.legendItem} onPress={onPress} hitSlop={6}>
      <View
        style={[
          shape === 'line' ? styles.dot : styles.swatch,
          { backgroundColor: color, opacity: active ? 1 : 0.25 },
        ]}
      />
      <Text style={[styles.legendLabel, !active && styles.legendLabelOff]}>{label}</Text>
    </Pressable>
  );
}

function TooltipRow({ color, label, value }: { color: string; label: string; value: string }) {
  return (
    <View style={styles.tooltipRow}>
      <View style={[styles.tooltipDot, { backgroundColor: color }]} />
      <Text style={styles.tooltipLabel}>{label}</Text>
      <Text style={styles.tooltipValue}>{value}</Text>
    </View>
  );
}

function formatHour(isoTime: string) {
  const date = new Date(isoTime);
  return date.toLocaleTimeString([], { hour: 'numeric' });
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'white',
    borderRadius: 18,
    padding: 20,
    marginTop: 25,
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    marginBottom: 12,
  },
  legendRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    marginBottom: 4,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  swatch: {
    width: 12,
    height: 8,
    borderRadius: 2,
    marginRight: 6,
  },
  legendLabel: {
    fontSize: 13,
    color: '#666',
  },
  legendLabelOff: {
    color: '#bbb',
    textDecorationLine: 'line-through',
  },
  axisRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
    paddingHorizontal: PADDING_LEFT,
  },
  axisLabel: {
    fontSize: 12,
    color: '#999',
  },
  hint: {
    fontSize: 11,
    color: '#bbb',
    textAlign: 'center',
    marginTop: 4,
  },
  tooltip: {
    position: 'absolute',
    width: TOOLTIP_WIDTH,
    minHeight: TOOLTIP_HEIGHT,
    backgroundColor: 'rgba(17,17,17,0.92)',
    borderRadius: 10,
    padding: 8,
  },
  tooltipTime: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  tooltipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  tooltipDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  tooltipLabel: {
    color: '#ccc',
    fontSize: 11,
    flex: 1,
  },
  tooltipValue: {
    color: 'white',
    fontSize: 11,
    fontWeight: '600',
  },
});