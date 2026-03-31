import React, { useEffect } from "react";
import { Dimensions, StyleSheet, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import Svg, { Circle, Defs, LinearGradient as SvgGradient, Path, Stop, Text as SvgText } from "react-native-svg";

const { width } = Dimensions.get("window");

interface ScoreEntry {
  date: string;
  score: number;
}

interface Props {
  data: ScoreEntry[];
}

function getPath(data: ScoreEntry[], chartW: number, chartH: number) {
  if (data.length < 2) return "";
  const minScore = 0;
  const maxScore = 100;
  const xStep = chartW / (data.length - 1);
  const points = data.map((d, i) => ({
    x: i * xStep,
    y: chartH - ((d.score - minScore) / (maxScore - minScore)) * chartH,
  }));

  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const cp1x = prev.x + (curr.x - prev.x) / 2;
    const cp1y = prev.y;
    const cp2x = prev.x + (curr.x - prev.x) / 2;
    const cp2y = curr.y;
    d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${curr.x} ${curr.y}`;
  }
  return { pathD: d, points };
}

export function SkinScoreChart({ data }: Props) {
  const chartW = width - 80;
  const chartH = 100;
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(1, { duration: 1000 });
  }, []);

  if (!data || data.length < 2) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>No data yet</Text>
      </View>
    );
  }

  const result = getPath(data, chartW, chartH);
  if (!result) return null;
  const { pathD, points } = result;
  const lastPoint = points[points.length - 1];
  const lastScore = data[data.length - 1].score;

  const dayLabels = data.map((d) => {
    const parts = d.date.split("-");
    return parts[2] ? `${parts[1]}/${parts[2]}` : d.date;
  });

  return (
    <View style={styles.container}>
      <Svg width={chartW} height={chartH + 4}>
        <Defs>
          <SvgGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor="#9B8AD4" stopOpacity="1" />
            <Stop offset="1" stopColor="#F0A896" stopOpacity="1" />
          </SvgGradient>
        </Defs>
        <Path
          d={pathD}
          fill="none"
          stroke="url(#lineGrad)"
          strokeWidth={2.5}
          strokeLinecap="round"
        />
        {points.map((p, i) => (
          <Circle key={i} cx={p.x} cy={p.y} r={3} fill={i === points.length - 1 ? "#F0A896" : "#9B8AD4"} />
        ))}
      </Svg>
      <View style={styles.labelRow}>
        {dayLabels.map((l, i) => (
          <Text key={i} style={styles.dayLabel}>
            {l}
          </Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
  },
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 6,
    paddingHorizontal: 2,
  },
  dayLabel: {
    fontSize: 10,
    fontFamily: "Inter_400Regular",
    color: "#605D72",
  },
  empty: {
    height: 80,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: "#605D72",
  },
});
