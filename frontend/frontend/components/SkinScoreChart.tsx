import React, { useEffect, useMemo } from "react";
import { Dimensions, StyleSheet, Text, View } from "react-native";
import Animated, {
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import Svg, {
  Circle,
  Defs,
  LinearGradient as SvgGradient,
  Path,
  Stop,
} from "react-native-svg";

const { width } = Dimensions.get("window");

interface ScoreEntry {
  date: string;
  score: number;
}

interface Props {
  data: ScoreEntry[];
}

function normalizeDailyData(data: ScoreEntry[]) {
  const map: Record<string, { total: number; count: number }> = {};

  data.forEach((item) => {
    const day = item.date.split("T")[0]; // handles ISO
    if (!map[day]) map[day] = { total: 0, count: 0 };

    map[day].total += item.score;
    map[day].count += 1;
  });

  return Object.entries(map)
    .map(([date, v]) => ({
      date,
      score: Math.round(v.total / v.count),
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

function getPath(data: ScoreEntry[], chartW: number, chartH: number) {
  if (data.length < 2) return null;

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
  const progress = useSharedValue(0);

  // 🔥 normalize + memoize
  const normalizedData = useMemo(() => normalizeDailyData(data), [data]);

  const chartW = width - 80;
  const chartH = 100;

  useEffect(() => {
    progress.value = withTiming(1, { duration: 800 });
  }, []);

  if (!normalizedData || normalizedData.length < 2) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>No data yet</Text>
      </View>
    );
  }

  const result = getPath(normalizedData, chartW, chartH);
  if (!result) return null;

  const { pathD, points } = result;

  const dayLabels = normalizedData.map((d) => {
    const parts = d.date.split("-");
    return parts[2] ? `${parts[1]}/${parts[2]}` : d.date;
  });

  return (
    <View style={styles.container}>
      <View style={styles.chartWrapper}>
        <Svg width={chartW} height={chartH + 6}>
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
            <Circle
              key={i}
              cx={p.x}
              cy={p.y}
              r={3}
              fill={
                i === points.length - 1 ? "#F0A896" : "#9B8AD4"
              }
            />
          ))}
        </Svg>
      </View>

      <View style={styles.labelRow}>
        {dayLabels.map((label, i) => (
          <Text key={i} style={styles.dayLabel}>
            {label}
          </Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
    width: "100%",
  },

  chartWrapper: {
    width: "100%",
    overflow: "hidden", // ✅ prevents overflow outside card
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