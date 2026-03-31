import { View, Text, StyleSheet, Pressable, ScrollView, TextInput } from "react-native";
import { useState, useEffect } from "react";
import { LinearGradient } from "expo-linear-gradient";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";


const BACKEND_URL = process.env.EXPO_PUBLIC_API_URL || "http://10.237.1.60:8000";
const API = BACKEND_URL;

const CycleCalendar = ({ userId = "demo-user" }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(null);
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [cycleData, setCycleData] = useState({
    periodStartDate: new Date().toISOString().split('T')[0],
    periodEndDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    cycleLength: 28
  });

 const fetchPredictions = async (startDate, endDate) => {
  setLoading(true);
  try {
    const token = await AsyncStorage.getItem("skinova_token");
    const res = await fetch(`${BACKEND_URL}/api/cycle/predict`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        last_period_start: cycleData.periodStartDate.replace(/ /g, "-"),
        start_date: startDate,
        end_date: endDate,
        cycle_length: cycleData.cycleLength,
        period_duration: 5,
      }),
    });
    const data = await res.json();
    setPredictions(data.predictions || []);
    console.log("predictions sample:", data.predictions?.slice(0,3));
  } catch (error) {
    console.error("Error:", error);
  } finally {
    setLoading(false);
  }
};


  const updateCycleDates = async (newStartDate, newEndDate) => {
    try {
      await axios.post(`${API}/cycle/update-dates`, {
        user_id: userId,
        period_start_date: newStartDate,
        period_end_date: newEndDate,
        cycle_length: cycleData.cycleLength
      });
      setCycleData({
        ...cycleData,
        periodStartDate: newStartDate,
        periodEndDate: newEndDate
      });
    } catch (error) {
      console.error("Error updating cycle dates:", error);
    }
  };

  const getDaysInMonth = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    return days;
  };

  const getPredictionForDate = (date) => {
  if (!date) return null;

  const localDate = new Date(date);
  const formatted = localDate.toISOString().split("T")[0];

  return predictions.find((p) => {
    const pDate = p.date.split("T")[0];
    return pDate === formatted;
  });
};

  const goToPreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  useEffect(() => {
    const firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const lastDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
    fetchPredictions(firstDay.toISOString(), lastDay.toISOString());
  }, [currentMonth, cycleData]);

  const days = getDaysInMonth();
  const monthYear = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const weekDays = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

  const weeks = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  return (
    <LinearGradient colors={["#1A1825", "#1E1B2E"]} style={styles.container}>
      <View style={styles.row}>
        {/* Sidebar */}
        <View style={styles.sidebar}>
          <Text style={styles.sidebarTitle}>Cycle Settings</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Period Start Date</Text>
            <TextInput
              style={styles.input}
              value={cycleData.periodStartDate}
              onChangeText={(text) => {
  setCycleData({ ...cycleData, periodStartDate: text.replace(/ /g, "-") });
}}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#666"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Period End Date</Text>
            <TextInput
              style={styles.input}
              value={cycleData.periodEndDate}
              onChangeText={(text) => {
  setCycleData({ ...cycleData, periodEndDate: text.replace(/ /g, "-") });
}}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#666"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Cycle Length (days)</Text>
            <TextInput
              style={styles.input}
              value={String(cycleData.cycleLength)}
              onChangeText={(text) => setCycleData({ ...cycleData, cycleLength: parseInt(text) || 28 })}
              keyboardType="number-pad"
            />
          </View>

          <View style={styles.divider} />

          <Text style={styles.legendTitle}>Phase Colors</Text>
          <View style={styles.legendItem}>
            <View style={[styles.legendBox, { backgroundColor: '#E87070' }]} />
            <Text style={styles.legendText}>Menstrual Phase</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendBox, { backgroundColor: '#7CC98A' }]} />
            <Text style={styles.legendText}>Follicular Phase</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendBox, { backgroundColor: '#F0A896' }]} />
            <Text style={styles.legendText}>Ovulation Phase</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendBox, { backgroundColor: '#9B8AD4' }]} />
            <Text style={styles.legendText}>Luteal Phase</Text>
          </View>
        </View>

        {/* Calendar */}
        <ScrollView style={styles.calendarContainer} showsVerticalScrollIndicator={false}>
          <View style={styles.calendarHeader}>
            <Text style={styles.calendarTitle}>Cycle Calendar</Text>
            <View style={styles.monthNav}>
              <Pressable onPress={goToPreviousMonth} style={styles.navButton}>
                <Text style={styles.navText}>‹</Text>
              </Pressable>
              <Text style={styles.monthText}>{monthYear}</Text>
              <Pressable onPress={goToNextMonth} style={styles.navButton}>
                <Text style={styles.navText}>›</Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.weekHeader}>
            {weekDays.map(day => (
              <Text key={day} style={styles.weekDay}>{day}</Text>
            ))}
          </View>

          {loading ? (
            <Text style={styles.loadingText}>Loading...</Text>
          ) : (
            weeks.map((week, weekIndex) => (
              <View key={weekIndex} style={styles.week}>
                {week.map((date, dayIndex) => {
                  if (!date) {
                    return <View key={`empty-${dayIndex}`} style={styles.dayCell} />;
                  }

                  const prediction = getPredictionForDate(date);
                  const isSelected = selectedDay?.getTime() === date.getTime();
                  const borderColor = prediction?.color || '#3A3655';

                  return (
                    <Pressable
                      key={date.getTime()}
                      onPress={() => setSelectedDay(isSelected ? null : date)}
                      style={[
                        styles.dayCell,
                        {
                          borderColor: borderColor,
                          backgroundColor: isSelected ? '#3A3655' : '#2A273F',
                        }
                      ]}
                    >
                      {!isSelected ? (
                        <>
                          <Text style={styles.dayNum}>{date.getDate()}</Text>
                          {prediction && (
                            <View style={[styles.dot, { backgroundColor: prediction.color }]} />
                          )}
                        </>
                      ) : (
                        prediction && (
                          <View style={styles.infoBox}>
                            <Text style={styles.phaseText}>{prediction.phase}</Text>
                            <Text style={styles.hormoneText}>{prediction.hormone_info}</Text>
                            <Text style={styles.dayText}>Day {prediction.day_of_cycle}</Text>

<Text style={{
  fontSize: 8,
  color: "#FFD93D",
  marginTop: 2
}}>
  Skin: {prediction.skin_condition || "normal"}
</Text>
                          </View>
                        )
                      )}
                    </Pressable>
                  );
                })}
              </View>
            ))
          )}
        </ScrollView>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    flex: 1,
    padding: 16,
  },
  sidebar: {
    width: 280,
    backgroundColor: 'rgba(42, 39, 63, 0.5)',
    borderRadius: 24,
    padding: 20,
    marginRight: 16,
  },
  sidebarTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#F0EEF8',
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    color: '#999',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#1A1825',
    borderRadius: 12,
    padding: 12,
    color: '#fff',
    fontSize: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginVertical: 20,
  },
  legendTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F0EEF8',
    marginBottom: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  legendBox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    marginRight: 10,
  },
  legendText: {
    color: '#D4C8F5',
    fontSize: 13,
  },
  calendarContainer: {
    flex: 1,
    backgroundColor: 'rgba(42, 39, 63, 0.3)',
    borderRadius: 24,
    padding: 20,
  },
  calendarHeader: {
    marginBottom: 20,
  },
  calendarTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#F0EEF8',
    marginBottom: 16,
  },
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  navButton: {
    padding: 6,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
  },
  navText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  monthText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#F0EEF8',
    minWidth: 180,
    textAlign: 'center',
  },
  weekHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  weekDay: {
    flex: 1,
    textAlign: 'center',
    fontSize: 11,
    fontWeight: 'bold',
    color: '#888',
  },
  week: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  dayCell: {
    flex: 1,
    aspectRatio: 1,
    margin: 3,
    borderRadius: 14,
    borderWidth: 2,
    padding: 8,
    justifyContent: 'flex-start',
    position: 'relative',
  },
  dayNum: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    position: 'absolute',
    top: 8,
    right: 8,
  },
  infoBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  phaseText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#D4C8F5',
    marginBottom: 3,
  },
  hormoneText: {
    fontSize: 7,
    color: '#aaa',
    textAlign: 'center',
    marginBottom: 3,
  },
  dayText: {
    fontSize: 7,
    color: '#888',
  },
  loadingText: {
    color: '#888',
    textAlign: 'center',
    marginTop: 40,
  },
});

export default CycleCalendar;