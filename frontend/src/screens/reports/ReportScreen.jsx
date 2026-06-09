import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { LineChart, PieChart } from 'react-native-chart-kit';
import React, { useCallback, useMemo, useState } from 'react';

import api from '../../services/api';
import { useFocusEffect } from '@react-navigation/native';

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const chartConfig = {
  backgroundGradientFrom: '#fff',
  backgroundGradientTo: '#fff',
  color: (opacity = 1) => `rgba(26, 58, 110, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(80, 80, 80, ${opacity})`,
  decimalPlaces: 0,
  propsForDots: {
    r: '3',
    strokeWidth: '2',
    stroke: '#1a3a6e',
  },
};

const formatCurrency = (value) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(Number(value || 0));

const getDaysInMonth = (month, year) => new Date(year, month, 0).getDate();

const escapeCsvValue = (value) => {
  const stringValue = String(value ?? '');
  if (/[",\n]/.test(stringValue)) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
};

const buildCsv = (report) => {
  const rows = [
    ['Monthly Expense Report'],
    ['Period', `${MONTHS[report.month - 1]} ${report.year}`],
    ['Total expenses', report.total],
    ['Budget', report.budget || 0],
    [],
    ['Category', 'Transactions', 'Total'],
    ...report.categories.map((item) => [item.category, item.count, item.total]),
    [],
    ['Date', 'Category', 'Amount', 'Note'],
    ...report.expenses.map((expense) => [
      expense.date,
      expense.category,
      expense.amount,
      expense.note,
    ]),
  ];

  return rows.map((row) => row.map(escapeCsvValue).join(',')).join('\n');
};

const escapeHtml = (value) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const buildPdfHtml = (report) => {
  const period = `${MONTHS[report.month - 1]} ${report.year}`;
  const categories = report.categories.length
    ? report.categories
        .map(
          (item) => `
            <tr>
              <td>${escapeHtml(item.category)}</td>
              <td>${escapeHtml(item.count)}</td>
              <td>${escapeHtml(formatCurrency(item.total))}</td>
            </tr>`
        )
        .join('')
    : '<tr><td colspan="3">No category expenses for this period.</td></tr>';

  const expenses = report.expenses.length
    ? report.expenses
        .map(
          (expense) => `
            <tr>
              <td>${escapeHtml(expense.date)}</td>
              <td>${escapeHtml(expense.category)}</td>
              <td>${escapeHtml(formatCurrency(expense.amount))}</td>
              <td>${escapeHtml(expense.note || '')}</td>
            </tr>`
        )
        .join('')
    : '<tr><td colspan="4">No expenses for this period.</td></tr>';

  return `
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Expense Report - ${escapeHtml(period)}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            color: #333;
            margin: 32px;
          }
          h1 {
            color: #1a3a6e;
            font-size: 28px;
            margin-bottom: 4px;
          }
          h2 {
            color: #1a3a6e;
            font-size: 18px;
            margin-top: 28px;
          }
          .muted {
            color: #666;
            margin-top: 0;
          }
          .summary {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 12px;
            margin-top: 24px;
          }
          .summary-item {
            border: 1px solid #ddd;
            border-radius: 8px;
            padding: 14px;
          }
          .label {
            color: #666;
            font-size: 12px;
            font-weight: 700;
            text-transform: uppercase;
          }
          .value {
            color: #1a3a6e;
            font-size: 20px;
            font-weight: 700;
            margin-top: 8px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
          }
          th,
          td {
            border: 1px solid #ddd;
            padding: 9px;
            text-align: left;
            vertical-align: top;
          }
          th {
            background: #f2f5f9;
            color: #1a3a6e;
          }
          @media print {
            body {
              margin: 20px;
            }
          }
        </style>
      </head>
      <body>
        <h1>Monthly Expense Report</h1>
        <p class="muted">${escapeHtml(period)}</p>

        <section class="summary">
          <div class="summary-item">
            <div class="label">Total expenses</div>
            <div class="value">${escapeHtml(formatCurrency(report.total))}</div>
          </div>
          <div class="summary-item">
            <div class="label">Budget</div>
            <div class="value">${escapeHtml(formatCurrency(report.budget || 0))}</div>
          </div>
          <div class="summary-item">
            <div class="label">Transactions</div>
            <div class="value">${escapeHtml(report.expenses.length)}</div>
          </div>
        </section>

        <h2>Expenses by Category</h2>
        <table>
          <thead>
            <tr>
              <th>Category</th>
              <th>Transactions</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>${categories}</tbody>
        </table>

        <h2>Expense Details</h2>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Category</th>
              <th>Amount</th>
              <th>Note</th>
            </tr>
          </thead>
          <tbody>${expenses}</tbody>
        </table>
      </body>
    </html>`;
};

export default function ReportScreen() {
  const today = new Date();
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [year, setYear] = useState(today.getFullYear());
  const [report, setReport] = useState(null);
  const [budgetInput, setBudgetInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [savingBudget, setSavingBudget] = useState(false);

  const screenWidth = Dimensions.get('window').width;
  const contentWidth = Math.min(screenWidth - 32, 720);
  const chartWidth = Math.max(contentWidth - 28, 280);

  const loadReport = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/reports/monthly', {
        params: { month, year },
      });
      setReport(res.data);
      setBudgetInput(res.data.budget ? String(res.data.budget) : '');
    } catch (err) {
      Alert.alert('Error', 'Could not load the monthly report.');
    } finally {
      setLoading(false);
    }
  }, [month, year]);

  useFocusEffect(
    useCallback(() => {
      loadReport();
    }, [loadReport])
  );

  const dailyChartData = useMemo(() => {
    const daysInMonth = getDaysInMonth(month, year);
    const totalsByDay = new Map((report?.daily || []).map((item) => [item.day, item.total]));
    const labels = [];
    const data = [];

    for (let day = 1; day <= daysInMonth; day += 1) {
      labels.push(day === 1 || day === daysInMonth || day % 5 === 0 ? String(day) : '');
      data.push(Number(totalsByDay.get(day) || 0));
    }

    return {
      labels,
      datasets: [{ data }],
    };
  }, [month, report?.daily, year]);

  const pieData = useMemo(
    () =>
      (report?.categories || []).map((item, index) => ({
        name: item.category,
        amount: item.total,
        color: item.color || ['#1a3a6e', '#27ae60', '#f39c12', '#e74c3c'][index % 4],
        legendFontColor: '#333',
        legendFontSize: 12,
      })),
    [report?.categories]
  );

  const total = Number(report?.total || 0);
  const budget = Number(report?.budget || 0);
  const budgetPercent = budget > 0 ? Math.min((total / budget) * 100, 100) : 0;
  const isOverBudget = budget > 0 && total > budget;
  const isNearBudget = budget > 0 && total >= budget * 0.9 && total <= budget;
  const hasExpenses = total > 0 && (report?.expenses || []).length > 0;

  const changeMonth = (direction) => {
    if (direction === -1 && month === 1) {
      setMonth(12);
      setYear((currentYear) => currentYear - 1);
      return;
    }

    if (direction === 1 && month === 12) {
      setMonth(1);
      setYear((currentYear) => currentYear + 1);
      return;
    }

    setMonth((currentMonth) => currentMonth + direction);
  };

  const saveBudget = async () => {
    const amount = Number(budgetInput || 0);

    if (Number.isNaN(amount) || amount < 0) {
      Alert.alert('Error', 'Enter a valid monthly budget.');
      return;
    }

    setSavingBudget(true);
    try {
      const res = await api.put('/reports/budget', { month, year, amount });
      setReport((current) => ({ ...current, budget: res.data.amount }));
      setBudgetInput(res.data.amount ? String(res.data.amount) : '');
      Alert.alert('Saved', 'Monthly budget was updated.');
    } catch (err) {
      Alert.alert('Error', 'Could not save the monthly budget.');
    } finally {
      setSavingBudget(false);
    }
  };

  const exportCsv = () => {
    if (!report) return;

    const csv = buildCsv(report);
    const fileName = `expense-report-${report.year}-${String(report.month).padStart(2, '0')}.csv`;

    if (Platform.OS === 'web') {
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = fileName;
      link.click();
      URL.revokeObjectURL(link.href);
      return;
    }

    Alert.alert('CSV ready', 'CSV export is prepared. Add a file sharing library to save it on this platform.');
  };

  const exportPdf = () => {
    if (!report) return;

    if (Platform.OS !== 'web') {
      Alert.alert(
        'PDF export',
        'PDF export is available on web. For mobile PDF saving, add expo-print and expo-sharing.'
      );
      return;
    }

    const printWindow = window.open('', '_blank');

    if (!printWindow) {
      Alert.alert('PDF export', 'Allow pop-ups for this site, then try Export PDF again.');
      return;
    }

    printWindow.document.open();
    printWindow.document.write(buildPdfHtml(report));
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Reports</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={[styles.content, { maxWidth: contentWidth }]}>
          <View style={styles.periodRow}>
            <TouchableOpacity style={styles.periodButton} onPress={() => changeMonth(-1)}>
              <Text style={styles.periodButtonText}>{'<'}</Text>
            </TouchableOpacity>
            <View style={styles.periodCenter}>
              <Text style={styles.periodLabel}>{MONTHS[month - 1]}</Text>
              <TextInput
                style={styles.yearInput}
                keyboardType="number-pad"
                value={String(year)}
                onChangeText={(value) => {
                  const nextYear = Number(value);
                  if (value.length <= 4 && !Number.isNaN(nextYear)) {
                    setYear(nextYear || today.getFullYear());
                  }
                }}
              />
            </View>
            <TouchableOpacity style={styles.periodButton} onPress={() => changeMonth(1)}>
              <Text style={styles.periodButtonText}>{'>'}</Text>
            </TouchableOpacity>
          </View>

          {loading && !report ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="large" color="#1a3a6e" />
              <Text style={styles.mutedText}>Loading report...</Text>
            </View>
          ) : (
            <>
              <View style={styles.summaryGrid}>
                <View style={styles.summaryCard}>
                  <Text style={styles.summaryLabel}>Total expenses</Text>
                  <Text style={styles.summaryValue}>{formatCurrency(total)}</Text>
                </View>
                <View style={styles.summaryCard}>
                  <Text style={styles.summaryLabel}>Transactions</Text>
                  <Text style={styles.summaryValue}>{report?.expenses?.length || 0}</Text>
                </View>
              </View>

              <View style={styles.panel}>
                <View style={styles.panelHeader}>
                  <Text style={styles.panelTitle}>Monthly budget</Text>
                  <TouchableOpacity
                    style={[styles.smallButton, savingBudget && styles.buttonDisabled]}
                    onPress={saveBudget}
                    disabled={savingBudget}
                  >
                    <Text style={styles.smallButtonText}>{savingBudget ? 'Saving...' : 'Save'}</Text>
                  </TouchableOpacity>
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="Set budget amount"
                  placeholderTextColor="#aaa"
                  keyboardType="decimal-pad"
                  value={budgetInput}
                  onChangeText={setBudgetInput}
                />
                <View style={styles.progressTrack}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${budgetPercent}%`,
                        backgroundColor: isOverBudget ? '#e74c3c' : isNearBudget ? '#f39c12' : '#27ae60',
                      },
                    ]}
                  />
                </View>
                <Text style={styles.budgetText}>
                  {budget > 0
                    ? `${formatCurrency(total)} of ${formatCurrency(budget)} used`
                    : 'No monthly budget set yet.'}
                </Text>
                {isNearBudget && (
                  <Text style={styles.warningText}>Warning: expenses reached 90% of the budget.</Text>
                )}
                {isOverBudget && (
                  <Text style={styles.alertText}>Alert: expenses passed 100% of the budget.</Text>
                )}
              </View>

              {!hasExpenses ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyTitle}>No expenses for this period</Text>
                  <Text style={styles.mutedText}>Choose another month or add expenses to see the report.</Text>
                </View>
              ) : (
                <>
                  <View style={styles.panel}>
                    <Text style={styles.panelTitle}>Monthly spending</Text>
                    <LineChart
                      data={dailyChartData}
                      width={chartWidth}
                      height={220}
                      chartConfig={chartConfig}
                      bezier
                      style={styles.chart}
                    />
                  </View>

                  <View style={styles.panel}>
                    <Text style={styles.panelTitle}>Category breakdown</Text>
                    <PieChart
                      data={pieData}
                      width={chartWidth}
                      height={220}
                      chartConfig={chartConfig}
                      accessor="amount"
                      backgroundColor="transparent"
                      paddingLeft="8"
                      absolute
                    />
                  </View>

                  <View style={styles.panel}>
                    <Text style={styles.panelTitle}>Expenses by category</Text>
                    {report.categories.map((item) => (
                      <View key={`${item.categoryId || item.category}-${item.total}`} style={styles.categoryRow}>
                        <View style={[styles.categoryDot, { backgroundColor: item.color }]} />
                        <View style={styles.categoryInfo}>
                          <Text style={styles.categoryName}>{item.category}</Text>
                          <Text style={styles.mutedText}>{item.count} transaction(s)</Text>
                        </View>
                        <Text style={styles.categoryAmount}>{formatCurrency(item.total)}</Text>
                      </View>
                    ))}
                  </View>
                </>
              )}

              <View style={styles.exportRow}>
                <TouchableOpacity
                  style={[styles.exportButton, !report && styles.buttonDisabled]}
                  onPress={exportCsv}
                  disabled={!report}
                >
                  <Text style={styles.exportButtonText}>Export CSV</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.secondaryButton, !report && styles.buttonDisabled]}
                  onPress={exportPdf}
                  disabled={!report}
                >
                  <Text style={styles.secondaryButtonText}>Export PDF</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    backgroundColor: '#1a3a6e',
    paddingTop: 50,
    paddingBottom: 20,
    alignItems: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
  },
  scroll: {
    flexGrow: 1,
  },
  content: {
    width: '100%',
    alignSelf: 'center',
    padding: 16,
    gap: 16,
  },
  periodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  periodButton: {
    width: 44,
    height: 44,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#d0d0d0',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  periodButtonText: {
    color: '#1a3a6e',
    fontSize: 28,
    fontWeight: 'bold',
    lineHeight: 30,
  },
  periodCenter: {
    alignItems: 'center',
  },
  periodLabel: {
    color: '#1a3a6e',
    fontSize: 24,
    fontWeight: 'bold',
  },
  yearInput: {
    color: '#666',
    fontSize: 15,
    fontWeight: '600',
    minWidth: 64,
    textAlign: 'center',
    paddingVertical: 4,
  },
  loadingBox: {
    alignItems: 'center',
    gap: 12,
    paddingVertical: 48,
  },
  summaryGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: '#e5e5e5',
    borderRadius: 10,
    padding: 16,
    backgroundColor: '#fff',
  },
  summaryLabel: {
    color: '#666',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
  },
  summaryValue: {
    color: '#1a3a6e',
    fontSize: 24,
    fontWeight: 'bold',
  },
  panel: {
    borderWidth: 1.5,
    borderColor: '#e5e5e5',
    borderRadius: 10,
    padding: 14,
    backgroundColor: '#fff',
    overflow: 'hidden',
  },
  panelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  panelTitle: {
    color: '#1a3a6e',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  input: {
    borderWidth: 1.5,
    borderColor: '#d0d0d0',
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    color: '#333',
    marginBottom: 12,
    backgroundColor: '#fff',
  },
  smallButton: {
    backgroundColor: '#1a3a6e',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    marginBottom: 12,
  },
  smallButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: 'bold',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  progressTrack: {
    height: 12,
    borderRadius: 8,
    backgroundColor: '#eee',
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 8,
  },
  budgetText: {
    color: '#333',
    fontSize: 14,
    fontWeight: '600',
  },
  warningText: {
    color: '#f39c12',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 8,
  },
  alertText: {
    color: '#e74c3c',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 8,
  },
  emptyState: {
    borderWidth: 1.5,
    borderColor: '#e5e5e5',
    borderRadius: 10,
    padding: 24,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  emptyTitle: {
    color: '#1a3a6e',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  mutedText: {
    color: '#777',
    fontSize: 13,
  },
  chart: {
    borderRadius: 10,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingVertical: 12,
  },
  categoryDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 10,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    color: '#333',
    fontSize: 15,
    fontWeight: '700',
  },
  categoryAmount: {
    color: '#1a3a6e',
    fontSize: 15,
    fontWeight: 'bold',
  },
  exportRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  exportButton: {
    flex: 1,
    backgroundColor: '#1a3a6e',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  exportButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
  },
  secondaryButton: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: '#1a3a6e',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#1a3a6e',
    fontSize: 15,
    fontWeight: 'bold',
  },
});
