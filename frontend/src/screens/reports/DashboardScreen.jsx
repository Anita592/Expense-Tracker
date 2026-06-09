import {
  ActivityIndicator,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import React, { useCallback, useState } from 'react';

import { BarChart } from 'react-native-chart-kit';
import api from '../../services/api';
import { useFocusEffect } from '@react-navigation/native';

const SCREEN_WIDTH = Dimensions.get('window').width;
const BLUE = '#1a3a6e';
const DAY_LABELS = ['H', 'M', 'M', 'E', 'P', 'S', 'D'];

function relativeDate(dateStr) {
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  if (dateStr === today) return 'sot';
  if (dateStr === yesterday) return 'dje';
  return dateStr;
}

const CATEGORY_COLORS = [
  '#f5a623', '#e8784b', '#5b8dee', '#3dbf74',
  '#b95de3', '#e85b7a', '#4ab8c1',
];

function categoryColor(name = '') {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + hash * 31;
  return CATEGORY_COLORS[Math.abs(hash) % CATEGORY_COLORS.length];
}

export default function DashboardScreen() {
  const [loading, setLoading] = useState(true);
  const [budget, setBudget] = useState(0);
  const [total, setTotal] = useState(0);
  const [recent, setRecent] = useState([]);
  const [weeklyTotals, setWeeklyTotals] = useState([0, 0, 0, 0, 0, 0, 0]);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        setLoading(true);
        try {
          const res = await api.get('/reports/dashboard');
          const data = res.data;
          setBudget(data.budget || 0);
          setTotal(data.monthTotal || 0);
          setRecent(data.recent || []);
          setWeeklyTotals(data.weekly || [0, 0, 0, 0, 0, 0, 0]);
        } catch {
          // dashboard shows empty state on error
        } finally {
          setLoading(false);
        }
      })();
    }, [])
  );

  const pct = budget > 0 ? Math.min(Math.round((total / budget) * 100), 100) : 0;

  const chartData = {
    labels: DAY_LABELS,
    datasets: [{ data: weeklyTotals.map((v) => (v > 0 ? v : 0.001)) }],
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Dashboard</Text>
      </View>

      {loading ? (
        <ActivityIndicator style={styles.loader} color={BLUE} size="large" />
      ) : (
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.budgetCard}>
            <Text style={styles.budgetText}>
              Buxheti mujor: €{total.toFixed(2)} / €{budget.toFixed(2)} ({pct}%)
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Shpenzimet javore</Text>
            <BarChart
              data={chartData}
              width={SCREEN_WIDTH - 32}
              height={180}
              fromZero
              withInnerLines={false}
              showValuesOnTopOfBars={false}
              chartConfig={{
                backgroundColor: '#fff',
                backgroundGradientFrom: '#fff',
                backgroundGradientTo: '#fff',
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(26, 58, 110, ${opacity})`,
                labelColor: () => '#999',
                barPercentage: 0.55,
                propsForBackgroundLines: { stroke: 'transparent' },
              }}
              style={styles.chart}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Të fundit</Text>
            {recent.length === 0 ? (
              <Text style={styles.emptyText}>Nuk ka shpenzime këtë muaj</Text>
            ) : (
              recent.map((exp) => (
                <View key={exp.id} style={styles.expenseRow}>
                  <View style={[styles.iconCircle, { backgroundColor: categoryColor(exp.category) }]}>
                    <Text style={styles.iconText}>
                      {(exp.category || 'P').charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.expenseInfo}>
                    <Text style={styles.expenseName} numberOfLines={1}>
                      {exp.note || exp.category}
                    </Text>
                    <Text style={styles.expenseSub}>
                      {exp.category} • {relativeDate(exp.date)}
                    </Text>
                  </View>
                  <Text style={styles.expenseAmount}>-€{Number(exp.amount).toFixed(2)}</Text>
                </View>
              ))
            )}
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f6fa',
  },
  header: {
    backgroundColor: BLUE,
    paddingTop: 50,
    paddingBottom: 20,
    alignItems: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
  },
  loader: {
    marginTop: 60,
  },
  scroll: {
    padding: 16,
    gap: 16,
  },
  budgetCard: {
    backgroundColor: BLUE,
    borderRadius: 14,
    padding: 20,
    alignItems: 'center',
  },
  budgetText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#222',
    marginBottom: 12,
  },
  chart: {
    borderRadius: 10,
    marginLeft: -16,
  },
  expenseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  iconText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: 'bold',
  },
  expenseInfo: {
    flex: 1,
  },
  expenseName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#222',
  },
  expenseSub: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  expenseAmount: {
    fontSize: 15,
    fontWeight: '700',
    color: '#e74c3c',
  },
  emptyText: {
    color: '#aaa',
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 16,
  },
});
