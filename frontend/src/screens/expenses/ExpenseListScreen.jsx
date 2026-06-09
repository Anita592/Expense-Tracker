import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import React, { useCallback, useMemo, useState } from 'react';

import api from '../../services/api';
import { useFocusEffect } from '@react-navigation/native';

const todayIso = () => new Date().toISOString().slice(0, 10);
const currentMonth = () => new Date().toISOString().slice(0, 7);

const emptyForm = {
  amount: '',
  category: '',
  expense_date: todayIso(),
  note: '',
};

const formatCurrency = (value) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(Number(value || 0));

const getErrorMessage = (err, fallback) =>
  err.response?.data?.message || err.message || fallback;

export default function ExpenseListScreen() {
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingExpense, setEditingExpense] = useState(null);
  const [filterCategoryId, setFilterCategoryId] = useState('');
  const [filterMonth, setFilterMonth] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const total = useMemo(
    () => expenses.reduce((sum, expense) => sum + Number(expense.amount || 0), 0),
    [expenses]
  );

  const fetchCategories = useCallback(async () => {
    const res = await api.get('/expenses/categories');
    setCategories(res.data || []);
  }, []);

  const fetchExpenses = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (filterCategoryId) params.categoryId = filterCategoryId;
      if (filterMonth) params.month = filterMonth;

      const res = await api.get('/expenses', { params });
      setExpenses(res.data.expenses || []);
    } catch (err) {
      setError(getErrorMessage(err, 'Could not load expenses.'));
    } finally {
      setLoading(false);
    }
  }, [filterCategoryId, filterMonth]);

  useFocusEffect(
    useCallback(() => {
      fetchCategories().catch((err) => {
        setError(getErrorMessage(err, 'Could not load categories.'));
      });
      fetchExpenses();
    }, [fetchCategories, fetchExpenses])
  );

  const updateForm = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const resetForm = () => {
    setEditingExpense(null);
    setForm({ ...emptyForm, expense_date: todayIso() });
  };

  const refreshAfterChange = async () => {
    await Promise.all([fetchCategories(), fetchExpenses()]);
  };

  const handleSubmit = async () => {
    const amount = Number(form.amount);

    setMessage('');
    setError('');

    if (Number.isNaN(amount) || amount <= 0) {
      setError('Amount must be greater than 0.');
      return;
    }

    if (!form.category.trim()) {
      setError('Category is required.');
      return;
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(form.expense_date)) {
      setError('Date must use YYYY-MM-DD format.');
      return;
    }

    const payload = {
      amount,
      category: form.category.trim(),
      expense_date: form.expense_date,
      note: form.note.trim(),
    };

    setSaving(true);
    try {
      if (editingExpense) {
        await api.put(`/expenses/${editingExpense.id}`, payload);
        setMessage('Expense updated successfully.');
      } else {
        await api.post('/expenses', payload);
        setMessage('Expense added successfully.');
      }

      resetForm();
      await refreshAfterChange();
    } catch (err) {
      setError(getErrorMessage(err, 'Could not save expense.'));
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (expense) => {
    setMessage('');
    setError('');
    setEditingExpense(expense);
    setForm({
      amount: String(expense.amount),
      category: expense.category,
      expense_date: expense.expense_date,
      note: expense.note || '',
    });
  };

  const deleteExpense = async (expense) => {
    setMessage('');
    setError('');
    try {
      await api.delete(`/expenses/${expense.id}`);
      setMessage('Expense deleted successfully.');
      if (editingExpense?.id === expense.id) resetForm();
      await refreshAfterChange();
    } catch (err) {
      setError(getErrorMessage(err, 'Could not delete expense.'));
    }
  };

  const confirmDelete = (expense) => {
    if (Platform.OS === 'web') {
      if (window.confirm('Delete this expense?')) {
        deleteExpense(expense);
      }
      return;
    }

    Alert.alert('Delete expense', 'Are you sure you want to delete this expense?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteExpense(expense) },
    ]);
  };

  const clearFilters = () => {
    setFilterCategoryId('');
    setFilterMonth('');
  };

  const applyCurrentMonth = () => {
    setFilterMonth(currentMonth());
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Expenses</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.content}>
          <View style={styles.summaryRow}>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Total</Text>
              <Text style={styles.summaryValue}>{formatCurrency(total)}</Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Expenses</Text>
              <Text style={styles.summaryValue}>{expenses.length}</Text>
            </View>
          </View>

          {!!message && <Text style={styles.successText}>{message}</Text>}
          {!!error && <Text style={styles.errorText}>{error}</Text>}

          <View style={styles.panel}>
            <Text style={styles.panelTitle}>
              {editingExpense ? 'Edit expense' : 'Add expense'}
            </Text>

            <Text style={styles.label}>Amount</Text>
            <TextInput
              style={styles.input}
              placeholder="0.00"
              placeholderTextColor="#aaa"
              keyboardType="decimal-pad"
              value={form.amount}
              onChangeText={(value) => updateForm('amount', value)}
            />

            <Text style={styles.label}>Category</Text>
            <TextInput
              style={styles.input}
              placeholder="Food, Transport, Rent..."
              placeholderTextColor="#aaa"
              value={form.category}
              onChangeText={(value) => updateForm('category', value)}
            />

            {!!categories.length && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.categoryChips}
              >
                {categories.map((category) => (
                  <TouchableOpacity
                    key={category.id}
                    style={styles.chip}
                    onPress={() => updateForm('category', category.name)}
                  >
                    <Text style={styles.chipText}>{category.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}

            <Text style={styles.label}>Date</Text>
            <TextInput
              style={styles.input}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#aaa"
              value={form.expense_date}
              onChangeText={(value) => updateForm('expense_date', value)}
            />

            <Text style={styles.label}>Note</Text>
            <TextInput
              style={[styles.input, styles.noteInput]}
              placeholder="Optional description"
              placeholderTextColor="#aaa"
              multiline
              value={form.note}
              onChangeText={(value) => updateForm('note', value)}
            />

            <View style={styles.formActions}>
              <TouchableOpacity
                style={[styles.primaryButton, saving && styles.buttonDisabled]}
                onPress={handleSubmit}
                disabled={saving}
              >
                <Text style={styles.primaryButtonText}>
                  {saving ? 'Saving...' : editingExpense ? 'Update Expense' : 'Add Expense'}
                </Text>
              </TouchableOpacity>

              {editingExpense && (
                <TouchableOpacity style={styles.secondaryButton} onPress={resetForm}>
                  <Text style={styles.secondaryButtonText}>Cancel</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          <View style={styles.panel}>
            <Text style={styles.panelTitle}>Filters</Text>

            <Text style={styles.label}>Category</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoryChips}
            >
              <TouchableOpacity
                style={[styles.chip, !filterCategoryId && styles.chipActive]}
                onPress={() => setFilterCategoryId('')}
              >
                <Text style={[styles.chipText, !filterCategoryId && styles.chipTextActive]}>
                  All
                </Text>
              </TouchableOpacity>
              {categories.map((category) => (
                <TouchableOpacity
                  key={category.id}
                  style={[styles.chip, String(category.id) === filterCategoryId && styles.chipActive]}
                  onPress={() => setFilterCategoryId(String(category.id))}
                >
                  <Text
                    style={[
                      styles.chipText,
                      String(category.id) === filterCategoryId && styles.chipTextActive,
                    ]}
                  >
                    {category.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.label}>Month</Text>
            <View style={styles.filterRow}>
              <TextInput
                style={[styles.input, styles.monthInput]}
                placeholder="YYYY-MM"
                placeholderTextColor="#aaa"
                value={filterMonth}
                onChangeText={setFilterMonth}
              />
              <TouchableOpacity style={styles.secondaryButton} onPress={applyCurrentMonth}>
                <Text style={styles.secondaryButtonText}>This Month</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.clearButton} onPress={clearFilters}>
              <Text style={styles.clearButtonText}>Clear Filters</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.panel}>
            <View style={styles.listHeader}>
              <Text style={styles.panelTitle}>Expense list</Text>
              {loading && <ActivityIndicator color="#1a3a6e" />}
            </View>

            {!loading && expenses.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyTitle}>No expenses found</Text>
                <Text style={styles.mutedText}>Add a new expense or clear the filters.</Text>
              </View>
            ) : (
              expenses.map((expense) => (
                <View key={expense.id} style={styles.expenseRow}>
                  <View style={styles.expenseMain}>
                    <Text style={styles.expenseCategory}>{expense.category}</Text>
                    <Text style={styles.mutedText}>{expense.expense_date}</Text>
                    {!!expense.note && <Text style={styles.noteText}>{expense.note}</Text>}
                  </View>
                  <View style={styles.expenseSide}>
                    <Text style={styles.expenseAmount}>{formatCurrency(expense.amount)}</Text>
                    <View style={styles.rowActions}>
                      <TouchableOpacity style={styles.actionButton} onPress={() => startEdit(expense)}>
                        <Text style={styles.actionButtonText}>Edit</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.actionButton, styles.deleteButton]}
                        onPress={() => confirmDelete(expense)}
                      >
                        <Text style={styles.deleteButtonText}>Delete</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ))
            )}
          </View>
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
    padding: 16,
    maxWidth: 760,
    width: '100%',
    alignSelf: 'center',
    gap: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
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
  },
  panelTitle: {
    color: '#1a3a6e',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1.5,
    borderColor: '#d0d0d0',
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    color: '#333',
    marginBottom: 14,
    backgroundColor: '#fff',
  },
  noteInput: {
    minHeight: 82,
    textAlignVertical: 'top',
  },
  categoryChips: {
    gap: 8,
    paddingBottom: 12,
  },
  chip: {
    borderWidth: 1.5,
    borderColor: '#d0d0d0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#fff',
  },
  chipActive: {
    backgroundColor: '#1a3a6e',
    borderColor: '#1a3a6e',
  },
  chipText: {
    color: '#333',
    fontSize: 13,
    fontWeight: '600',
  },
  chipTextActive: {
    color: '#fff',
  },
  formActions: {
    gap: 10,
  },
  primaryButton: {
    backgroundColor: '#1a3a6e',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
  },
  secondaryButton: {
    borderWidth: 1.5,
    borderColor: '#1a3a6e',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  secondaryButtonText: {
    color: '#1a3a6e',
    fontSize: 13,
    fontWeight: 'bold',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
  },
  monthInput: {
    flex: 1,
  },
  clearButton: {
    alignSelf: 'flex-start',
    paddingVertical: 8,
  },
  clearButtonText: {
    color: '#1a3a6e',
    fontSize: 14,
    fontWeight: 'bold',
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 28,
  },
  emptyTitle: {
    color: '#1a3a6e',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  mutedText: {
    color: '#777',
    fontSize: 13,
  },
  expenseRow: {
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingVertical: 14,
    gap: 12,
  },
  expenseMain: {
    gap: 4,
  },
  expenseCategory: {
    color: '#333',
    fontSize: 16,
    fontWeight: 'bold',
  },
  noteText: {
    color: '#555',
    fontSize: 14,
  },
  expenseSide: {
    gap: 10,
  },
  expenseAmount: {
    color: '#1a3a6e',
    fontSize: 18,
    fontWeight: 'bold',
  },
  rowActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    borderWidth: 1.5,
    borderColor: '#1a3a6e',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  actionButtonText: {
    color: '#1a3a6e',
    fontSize: 13,
    fontWeight: 'bold',
  },
  deleteButton: {
    borderColor: '#e74c3c',
  },
  deleteButtonText: {
    color: '#e74c3c',
    fontSize: 13,
    fontWeight: 'bold',
  },
  successText: {
    color: '#27ae60',
    fontSize: 14,
    fontWeight: '700',
  },
  errorText: {
    color: '#e74c3c',
    fontSize: 14,
    fontWeight: '700',
  },
});
