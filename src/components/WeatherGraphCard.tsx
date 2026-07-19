import React, { useMemo, useState } from 'react';
import { Dimensions, Pressable, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedProps,
  useSharedValue,
} from 'react-native-reanimated';
import Svg, { Circle, Line, Path, Text as SvgText } from 'react-native-svg';
import { HourlyPoint } from '../types/weather';

type MetricKey = 'feelsLike' | 'humidity' | 'wind' | 'rainChance';
type AxisKey = 'percent' | 'temp' | 'wind';

type Props = {
  data: HourlyPoint[];
  // The "HH:MM" portion of the scored best-run hour (as produced by
  // bestRunHour(...).time.split('T')[1]). When provided, the chart
  // defaults its selection/tooltip to this hour instead of sitting empty.
  bestTime?: string | null;
};

// ---- Animated SVG primitives ----
const AnimatedLine = Animated.createAnimatedComponent(Line);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

// ---- Static metric config ----
const METRICS: {
  key: MetricKey;
  label: string;
  color: string;
  unit: string;
  axis: AxisKey;
}[] = [
  { key: 'feelsLike', label: 'Feels Like', color: '#3B82F6', unit: '°F', axis: 'temp' },
  { key: 'humidity', label: 'Humidity', color: '#10B981', unit: '%', axis: 'percent' },
  { key: 'wind', label: 'Wind', color: '#F59E0B', unit: 'mph', axis: 'wind' },
  { key: 'rainChance', label: 'Rain', color: '#6366F1', unit: '%', axis: 'percent' },
];

// ---- Layout constants ----
const CARD_PADDING = 20;
const CHART_HEIGHT = 190;
const TOP_PAD = 16;
const BOTTOM_PAD = 26;
const LEFT_PAD = 34;
const RIGHT_PAD = 46;

const SCREEN_WIDTH = Dimensions.get('window').width;
const CHART_WIDTH = SCREEN_WIDTH - CARD_PADDING * 2 - LEFT_PAD - RIGHT_PAD;
const PLOT_TOP = TOP_PAD;
const PLOT_BOTTOM = TOP_PAD + CHART_HEIGHT;

function formatHour(isoTime: string): string {
  const timePart = isoTime.split('T')[1] ?? isoTime;
  const hour = parseInt(timePart.split(':')[0], 10);
  const period = hour >= 12 ? 'PM' : 'AM';
  let h12 = hour % 12;
  if (h12 === 0) h12 = 12;
  return `${h12}${period}`;
}

// Catmull-Rom to Bezier smoothing for a nicer line than straight segments.
function buildSmoothPath(xs: number[], ys: number[]): string {
  if (xs.length === 0) return '';
  if (xs.length === 1) return `M${xs[0]},${ys[0]}`;

  let d = `M${xs[0]},${ys[0]}`;
  for (let i = 0; i < xs.length - 1; i++) {
    const x0 = xs[i - 1] ?? xs[i];
    const y0 = ys[i - 1] ?? ys[i];
    const x1 = xs[i];
    const y1 = ys[i];
    const x2 = xs[i + 1];
    const y2 = ys[i + 1];
    const x3 = xs[i + 2] ?? x2;
    const y3 = ys[i + 2] ?? y2;

    const cp1x = x1 + (x2 - x0) / 6;
    const cp1y = y1 + (y2 - y0) / 6;
    const cp2x = x2 - (x3 - x1) / 6;
    const cp2y = y2 - (y3 - y1) / 6;

    d += ` C${cp1x},${cp1y} ${cp2x},${cp2y} ${x2},${y2}`;
  }
  return d;
}

function makeScale(min: number, max: number) {
  const span = max - min || 1;
  return (value: number) => PLOT_TOP + (1 - (value - min) / span) * CHART_HEIGHT;
}

export default function WeatherGraphCard({ data, bestTime }: Props) {
  const [visible, setVisible] = useState<Record<MetricKey, boolean>>({
    feelsLike: true,
    humidity: true,
    wind: true,
    rainChance: true,
  });

  const [tooltip, setTooltip] = useState<{
    hour: string;
    values: Record<MetricKey, number>;
    isBest: boolean;
  } | null>(null);

  const selectedIdx = useSharedValue(-1);

  const toggleMetric = (key: MetricKey) => {
    setVisible((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // ---- Compute scales & pixel points (recomputed only when data changes) ----
  const { xs, pointsByMetric, axisLabels } = useMemo(() => {
    if (!data.length) {
      return { xs: [] as number[], pointsByMetric: {} as Record<MetricKey, number[]>, axisLabels: null };
    }

    const n = data.length;
    const xs = data.map((_, i) => LEFT_PAD + (i / (n - 1 || 1)) * CHART_WIDTH);

    const feelsLikeVals = data.map((d) => d.feelsLike);
    const windVals = data.map((d) => d.wind);

    const tempMin = Math.floor(Math.min(...feelsLikeVals)) - 2;
    const tempMax = Math.ceil(Math.max(...feelsLikeVals)) + 2;
    const windMin = 0;
    const windMax = Math.ceil(Math.max(...windVals)) + 2;

    const percentScale = makeScale(0, 100);
    const tempScale = makeScale(tempMin, tempMax);
    const windScale = makeScale(windMin, windMax);

    const scaleFor = (axis: AxisKey) =>
      axis === 'percent' ? percentScale : axis === 'temp' ? tempScale : windScale;

    const pointsByMetric = {} as Record<MetricKey, number[]>;
    METRICS.forEach((m) => {
      const scale = scaleFor(m.axis);
      pointsByMetric[m.key] = data.map((d) => scale(d[m.key]));
    });

    return {
      xs,
      pointsByMetric,
      axisLabels: {
        tempMin,
        tempMax,
        windMin,
        windMax,
      },
    };
  }, [data]);

  // Index of the scored best-run hour within `data`, or -1 if unknown/not found.
  const bestIndex = useMemo(() => {
    if (!bestTime || !data.length) return -1;
    return data.findIndex((d) => d.time.split('T')[1] === bestTime);
  }, [data, bestTime]);

  const xsShared = useSharedValue<number[]>([]);
  const pointsShared = useSharedValue<Record<MetricKey, number[]>>({
    feelsLike: [],
    humidity: [],
    wind: [],
    rainChance: [],
  });

  React.useEffect(() => {
    xsShared.value = xs;
    pointsShared.value = pointsByMetric;
  }, [xs, pointsByMetric]);

  const updateTooltip = (idx: number) => {
    if (idx < 0 || idx >= data.length) {
      setTooltip(null);
      return;
    }
    const point = data[idx];
    setTooltip({
      hour: formatHour(point.time),
      isBest: idx === bestIndex,
      values: {
        feelsLike: point.feelsLike,
        humidity: point.humidity,
        wind: point.wind,
        rainChance: point.rainChance,
      },
    });
  };

  const clearTooltip = () => setTooltip(null);

  // Default the tooltip to the best-run hour as soon as it's known, so the
  // panel isn't empty on load — the drag indicator itself stays hidden
  // until the user actually touches the chart (see the static best-time
  // line rendered separately below).
  React.useEffect(() => {
    if (bestIndex >= 0 && xs.length > 0) {
      updateTooltip(bestIndex);
    }
  }, [bestIndex, xs.length]);

  const panGesture = Gesture.Pan()
    .activateAfterLongPress(250)
    .onStart((e) => {
      const n = xsShared.value.length;
      if (n === 0) return;
      const relativeX = e.x - LEFT_PAD;
      const step = CHART_WIDTH / (n - 1 || 1);
      const idx = Math.min(n - 1, Math.max(0, Math.round(relativeX / step)));
      selectedIdx.value = idx;
      runOnJS(updateTooltip)(idx);
    })
    .onUpdate((e) => {
      const n = xsShared.value.length;
      if (n === 0) return;
      const relativeX = e.x - LEFT_PAD;
      const step = CHART_WIDTH / (n - 1 || 1);
      const idx = Math.min(n - 1, Math.max(0, Math.round(relativeX / step)));
      if (idx !== selectedIdx.value) {
        selectedIdx.value = idx;
        runOnJS(updateTooltip)(idx);
      }
    })
    .onEnd(() => {
      selectedIdx.value = -1;
      if (bestIndex >= 0) {
        runOnJS(updateTooltip)(bestIndex);
      } else {
        runOnJS(clearTooltip)();
      }
    })
    .onFinalize(() => {
      selectedIdx.value = -1;
      if (bestIndex >= 0) {
        runOnJS(updateTooltip)(bestIndex);
      } else {
        runOnJS(clearTooltip)();
      }
    });

  const indicatorProps = useAnimatedProps(() => {
    const idx = selectedIdx.value;
    const x = idx >= 0 ? xsShared.value[idx] : -100;
    return { x1: x, x2: x, opacity: idx >= 0 ? 1 : 0 };
  });

  const dotProps = (key: MetricKey) =>
    useAnimatedProps(() => {
      const idx = selectedIdx.value;
      if (idx < 0) return { cx: -100, cy: -100, opacity: 0 };
      const x = xsShared.value[idx];
      const y = pointsShared.value[key]?.[idx];
      return { cx: x ?? -100, cy: y ?? -100, opacity: visible[key] ? 1 : 0 };
    });

  const feelsLikeDotProps = dotProps('feelsLike');
  const humidityDotProps = dotProps('humidity');
  const windDotProps = dotProps('wind');
  const rainDotProps = dotProps('rainChance');
  const dotPropsMap: Record<MetricKey, ReturnType<typeof dotProps>> = {
    feelsLike: feelsLikeDotProps,
    humidity: humidityDotProps,
    wind: windDotProps,
    rainChance: rainDotProps,
  };

  const hourLabelIndices = useMemo(() => {
    if (!data.length) return [];
    const step = 4;
    const indices: number[] = [];
    for (let i = 0; i < data.length; i += step) indices.push(i);
    if (indices[indices.length - 1] !== data.length - 1) {
      indices.push(data.length - 1);
    }
    return indices;
  }, [data]);

  if (!data.length) {
    return (
      <View style={styles.card}>
        <Text style={styles.cardTitle}>24-Hour Outlook</Text>
        <Text style={styles.placeholder}>Loading hourly data…</Text>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>24-Hour Outlook</Text>

      {/* Fixed-position tooltip panel — never overlaps the chart */}
      <View style={styles.tooltipPanel}>
        {tooltip ? (
          <>
            <View style={styles.tooltipHeaderRow}>
              <Text style={styles.tooltipHour}>{tooltip.hour}</Text>
              {tooltip.isBest && (
                <View style={styles.bestBadge}>
                  <Text style={styles.bestBadgeText}>Best time to run</Text>
                </View>
              )}
            </View>
            <View style={styles.tooltipRow}>
              {METRICS.map((m) => (
                <View key={m.key} style={styles.tooltipItem}>
                  <View style={[styles.dot, { backgroundColor: m.color }]} />
                  <Text style={styles.tooltipValue}>
                    {Math.round(tooltip.values[m.key])}
                    {m.unit}
                  </Text>
                </View>
              ))}
            </View>
          </>
        ) : (
          <Text style={styles.placeholder}>Hold and drag the chart to inspect an hour</Text>
        )}
      </View>

      <GestureDetector gesture={panGesture}>
        <View style={styles.chartWrapper}>
          <Svg width={SCREEN_WIDTH - CARD_PADDING * 2} height={TOP_PAD + CHART_HEIGHT + BOTTOM_PAD}>
            {/* Percent gridlines (25/50/75) */}
            {[25, 50, 75].map((pct) => {
              const y = PLOT_TOP + (1 - pct / 100) * CHART_HEIGHT;
              return (
                <Line
                  key={pct}
                  x1={LEFT_PAD}
                  x2={LEFT_PAD + CHART_WIDTH}
                  y1={y}
                  y2={y}
                  stroke="#E5E9F0"
                  strokeWidth={1}
                />
              );
            })}

            {/* Left axis (percent) labels */}
            <SvgText x={4} y={PLOT_TOP + 4} fontSize={10} fill="#9AA3B2">
              100%
            </SvgText>
            <SvgText x={4} y={PLOT_BOTTOM} fontSize={10} fill="#9AA3B2">
              0%
            </SvgText>

            {/* Right axis (temp / wind) labels */}
            {axisLabels && (
              <>
                <SvgText x={LEFT_PAD + CHART_WIDTH + 6} y={PLOT_TOP + 4} fontSize={10} fill="#3B82F6">
                  {axisLabels.tempMax}°
                </SvgText>
                <SvgText x={LEFT_PAD + CHART_WIDTH + 6} y={PLOT_BOTTOM} fontSize={10} fill="#3B82F6">
                  {axisLabels.tempMin}°
                </SvgText>
                <SvgText x={LEFT_PAD + CHART_WIDTH + 6} y={PLOT_TOP + 18} fontSize={10} fill="#F59E0B">
                  {axisLabels.windMax}mph
                </SvgText>
                <SvgText x={LEFT_PAD + CHART_WIDTH + 6} y={PLOT_BOTTOM - 14} fontSize={10} fill="#F59E0B">
                  {axisLabels.windMin}mph
                </SvgText>
              </>
            )}

            {/* Hour labels */}
            {hourLabelIndices.map((i) => (
              <SvgText
                key={i}
                x={xs[i]}
                y={PLOT_BOTTOM + 18}
                fontSize={10}
                fill="#9AA3B2"
                textAnchor="middle"
              >
                {formatHour(data[i].time)}
              </SvgText>
            ))}

            {/* Metric lines */}
            {METRICS.map((m) =>
              visible[m.key] ? (
                <Path
                  key={m.key}
                  d={buildSmoothPath(xs, pointsByMetric[m.key])}
                  stroke={m.color}
                  strokeWidth={2.5}
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              ) : null
            )}

            {/* Persistent best-time line — solid, always visible, unaffected by dragging */}
            {bestIndex >= 0 && xs[bestIndex] !== undefined && (
              <>
                <Line
                  x1={xs[bestIndex]}
                  x2={xs[bestIndex]}
                  y1={PLOT_TOP}
                  y2={PLOT_BOTTOM}
                  stroke="#3B82F6"
                  strokeWidth={2}
                />
                {METRICS.map((m) =>
                  visible[m.key] ? (
                    <Circle
                      key={`best-${m.key}`}
                      cx={xs[bestIndex]}
                      cy={pointsByMetric[m.key][bestIndex]}
                      r={5}
                      fill={m.color}
                      stroke="white"
                      strokeWidth={2}
                    />
                  ) : null
                )}
              </>
            )}

            {/* Drag indicator line — dashed, only visible while actively dragging */}
            <AnimatedLine
              animatedProps={indicatorProps}
              y1={PLOT_TOP}
              y2={PLOT_BOTTOM}
              stroke="#B8C0CC"
              strokeWidth={1.5}
              strokeDasharray="4,4"
            />

            {/* Drag indicator dots per active metric */}
            {METRICS.map((m) => (
              <AnimatedCircle
                key={m.key}
                animatedProps={dotPropsMap[m.key]}
                r={5}
                fill={m.color}
                stroke="white"
                strokeWidth={2}
              />
            ))}
          </Svg>
        </View>
      </GestureDetector>

      {/* Legend / toggles */}
      <View style={styles.legendRow}>
        {METRICS.map((m) => {
          const active = visible[m.key];
          return (
            <Pressable
              key={m.key}
              onPress={() => toggleMetric(m.key)}
              style={[styles.legendItem, !active && styles.legendItemInactive]}
            >
              <View
                style={[
                  styles.dot,
                  { backgroundColor: active ? m.color : '#CBD2DB' },
                ]}
              />
              <Text style={[styles.legendLabel, !active && styles.legendLabelInactive]}>
                {m.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'white',
    borderRadius: 18,
    padding: CARD_PADDING,
    marginBottom: 10,
  },

  cardTitle: {
    fontSize: 22,
    fontWeight: '600',
    marginBottom: 12,
  },

  tooltipPanel: {
    minHeight: 48,
    justifyContent: 'center',
    marginBottom: 8,
    paddingHorizontal: 4,
  },

  tooltipHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },

  tooltipHour: {
    fontSize: 13,
    fontWeight: '700',
    color: '#333',
    marginRight: 8,
  },

  bestBadge: {
    backgroundColor: '#3B82F6',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },

  bestBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: 'white',
  },

  tooltipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },

  tooltipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    marginBottom: 2,
  },

  tooltipValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
  },

  placeholder: {
    fontSize: 13,
    color: '#9AA3B2',
    fontStyle: 'italic',
  },

  chartWrapper: {
    alignSelf: 'stretch',
  },

  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },

  legendRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
  },

  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    marginBottom: 6,
    paddingVertical: 2,
  },

  legendItemInactive: {
    opacity: 0.5,
  },

  legendLabel: {
    fontSize: 13,
    color: '#333',
    fontWeight: '500',
  },

  legendLabelInactive: {
    color: '#9AA3B2',
  },
});