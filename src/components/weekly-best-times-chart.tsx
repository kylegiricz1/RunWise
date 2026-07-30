import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Svg, { Circle, Line, Path, Text as SvgText } from 'react-native-svg';
import { DailyBestTime } from '../types/weather';
import { getShortDateLabel } from '../utils/date';
import { formatTimeLabel } from '../utils/time';

type Props = {
  data: DailyBestTime[];
  onSelectDay: (index: number) => void;
};

const CARD_PADDING = 16;
const TOP_PADDING = 32;
const BOTTOM_PADDING = 30;
const LEFT_PADDING = 34;
const RIGHT_PADDING = 10;
const CHART_HEIGHT = 210;

function hourOf(time: string): number {
  const [hour, minute] = time.split(':').map(Number);
  return hour + (minute ?? 0) / 60;
}

export default function WeeklyBestTimesChart({ data, onSelectDay }: Props) {
  const { width } = useWindowDimensions();
  const svgWidth = Math.max(260, width - 80);
  const chartWidth = svgWidth - LEFT_PADDING - RIGHT_PADDING;
  const plotBottom = TOP_PADDING + CHART_HEIGHT;
  const points = data
    .map((item, index) => {
      if (!item.time) return null;
      const x = LEFT_PADDING + (index / Math.max(data.length - 1, 1)) * chartWidth;
      const y = TOP_PADDING + (hourOf(item.time) / 24) * CHART_HEIGHT;
      return { ...item, index, x, y };
    })
    .filter((point): point is NonNullable<typeof point> => point !== null);

  const path = points.map((point, index) => `${index === 0 ? 'M' : 'L'}${point.x},${point.y}`).join(' ');

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Best run time each day</Text>
      <Text style={styles.subtitle}>Tap a point to view that day on Home.</Text>

      <Svg width={svgWidth} height={TOP_PADDING + CHART_HEIGHT + BOTTOM_PADDING}>
        {[6, 12, 18].map((hour) => {
          const y = TOP_PADDING + (hour / 24) * CHART_HEIGHT;
          return (
            <Line
              key={hour}
              x1={LEFT_PADDING}
              x2={LEFT_PADDING + chartWidth}
              y1={y}
              y2={y}
              stroke="#E5E9F0"
              strokeWidth={1}
            />
          );
        })}

        <SvgText x={0} y={TOP_PADDING + 4} fontSize={10} fill="#94A3B8">
          12 AM
        </SvgText>
        <SvgText x={4} y={TOP_PADDING + (6 / 24) * CHART_HEIGHT + 4} fontSize={10} fill="#94A3B8">
          6 AM
        </SvgText>
        <SvgText x={4} y={TOP_PADDING + (12 / 24) * CHART_HEIGHT + 4} fontSize={10} fill="#94A3B8">
          12 PM
        </SvgText>
        <SvgText x={4} y={TOP_PADDING + (18 / 24) * CHART_HEIGHT + 4} fontSize={10} fill="#94A3B8">
          6 PM
        </SvgText>

        {path ? <Path d={path} stroke="#3B82F6" strokeWidth={3} fill="none" /> : null}

        {points.map((point) => (
          <Circle
            key={point.date}
            cx={point.x}
            cy={point.y}
            r={8}
            fill="#3B82F6"
            stroke="white"
            strokeWidth={3}
            onPress={() => onSelectDay(point.index)}
          />
        ))}

        {points.map((point) => (
          <SvgText
            key={`${point.date}-time`}
            x={point.x}
            y={Math.max(14, point.y - 12)}
            fontSize={10}
            fontWeight="700"
            fill="#1E3A8A"
            textAnchor="middle"
          >
            {formatTimeLabel(point.time)}
          </SvgText>
        ))}

        {data.map((item, index) => {
          const { weekday } = getShortDateLabel(item.date);
          const x = LEFT_PADDING + (index / Math.max(data.length - 1, 1)) * chartWidth;
          return (
            <SvgText
              key={`${item.date}-day`}
              x={x}
              y={plotBottom + 20}
              fontSize={10}
              fontWeight="600"
              fill="#64748B"
              textAnchor="middle"
            >
              {weekday}
            </SvgText>
          );
        })}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: CARD_PADDING,
  },
  title: {
    color: '#172033',
    fontSize: 20,
    fontWeight: '700',
  },
  subtitle: {
    color: '#64748B',
    fontSize: 14,
    marginTop: 4,
  },
});
