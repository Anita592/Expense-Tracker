import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, Button, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import ExpenseItem from '../../components/ExpenseItem';
import { deleteExpense, getCategories, getExpenses } from '../../services/expenseService';

const userId = 1;

const sameMonth = (dateString, date) => {
  const candidate = new Date(dateString);
  return candidate.getFullYear() === date.getFullYear() && candidate.getMonth() === date.getMonth();
};

export default function ExpenseListScreen({ navigation }) {
  const [expenses, setExpenses] = useState([]);
  const [allExpenses, setAllExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const isFocused = useIsFocused();

  const loadCategories = useCallback(async () => {
    const result = await getCategories(userId);
    setCategories(result);
  }, []);

  const loadAllExpenses = useCallback(async () => {
    const result = await getExpenses(userId, {});
    setAllExpenses(result);
  }, []);

  const loadExpenses = useCallback(async () => {
    const filters = {};
    if (categoryFilter) {
      filters.categoryId = Number(categoryFilter);
    }
    if (dateFilter) {
      filters.date = dateFilter;
    }
    const result = await getExpenses(userId, filters);
    setExpenses(result);
  }, [categoryFilter, dateFilter]);

  useEffect(() => {
    if (!isFocused) {
      return;
    }

    loadCategories();
    loadAllExpenses();
    loadExpenses();
  }, [isFocused, loadCategories, loadAllExpenses, loadExpenses]);

  const currentMonthTotal = allExpenses
    .filter((expense) => sameMonth(expense.date, new Date()))
    .reduce((sum, expense) => sum + expense.amount, 0);

  const handleDelete = (id) => {
    Alert.alert('Delete expense', 'Are you sure you want to delete this expense?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteExpense(id);
          await loadAllExpenses();
          await loadExpenses();
        },
      },
    ]);
  };

  const clearFilters = () => {
    setCategoryFilter('');
    setDateFilter('');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Expense Tracker</Text>
        <Text style={styles.total}>Monthly total: ${currentMonthTotal.toFixed(2)}</Text>
      </View>

      <View style={styles.controls}>
        <Button title="Add Expense" onPress={() => navigation.navigate('AddExpense')} />
      </View>

      <View style={styles.filterSection}>
        <Text style={styles.sectionTitle}>Filters</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryRow}>
          <TouchableOpacity onPress={() => setCategoryFilter('')} style={[styles.categoryButton, !categoryFilter && styles.categoryButtonActive]}>
            <Text style={[styles.categoryButtonText, !categoryFilter && styles.categoryButtonTextActive]}>All</Text>
          </TouchableOpacity>
          {categories.map((category) => (
            <TouchableOpacity
              key={category.id}
              onPress={() => setCategoryFilter(String(category.id))}
              style={[styles.categoryButton, categoryFilter === String(category.id) && styles.categoryButtonActive]}
            >
              <Text style={[styles.categoryButtonText, categoryFilter === String(category.id) && styles.categoryButtonTextActive]}>
                {category.icon} {category.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.filterRow}>
          <TextInput
            style={styles.input}
            value={dateFilter}
            onChangeText={setDateFilter}
            placeholder="Date (YYYY-MM-DD)"
          />
          <Button title="Clear" onPress={clearFilters} />
        </View>
      </View>

      <ScrollView style={styles.list} contentContainerStyle={expenses.length === 0 ? styles.emptyContainer : undefined}>
        {expenses.length === 0 ? (
          <Text style={styles.emptyText}>No expenses found</Text>
        ) : (
          expenses.map((expense) => {
            const category = categories.find((item) => item.id === expense.categoryId);
            return (
              <ExpenseItem
                key={expense.id}
                expense={expense}
                categoryName={category ? `${category.icon} ${category.name}` : 'Unknown'}
                onEdit={(item) => navigation.navigate('EditExpense', { expense: item })}
                onDelete={handleDelete}
              />
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f2f6ff',
    padding: 16,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1d2939',
  },
  total: {
    marginTop: 6,
    fontSize: 16,
    color: '#475569',
  },
  controls: {
    marginBottom: 20,
  },
  filterSection: {
    marginBottom: 16,
    padding: 14,
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  sectionTitle: {
    marginBottom: 10,
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  categoryRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  categoryButton: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 20,
    backgroundColor: '#e2e8f0',
    marginRight: 8,
  },
  categoryButtonActive: {
    backgroundColor: '#2563eb',
  },
  categoryButtonText: {
    color: '#334155',
    fontWeight: '600',
  },
  categoryButtonTextActive: {
    color: '#fff',
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginRight: 10,
    backgroundColor: '#fff',
  },
  list: {
    flex: 1,
  },
  emptyContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 50,
  },
});
