import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TextInput, Button, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { getCategories, updateExpense } from '../../services/expenseService';

const userId = 1;

export default function EditExpenseScreen({ route, navigation }) {
  const expense = route.params?.expense;
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState('');
  const [note, setNote] = useState('');
  const [categoryId, setCategoryId] = useState(null);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    if (expense) {
      setAmount(String(expense.amount));
      setDate(expense.date);
      setNote(expense.note || '');
      setCategoryId(expense.categoryId);
    }

    const load = async () => {
      const result = await getCategories(userId);
      setCategories(result);
    };
    load();
  }, [expense]);

  const handleUpdate = async () => {
    if (!expense) {
      return;
    }

    if (!amount || !date || !categoryId) {
      Alert.alert('Validation', 'Please fill out amount, category, and date.');
      return;
    }

    await updateExpense(expense.id, {
      amount: parseFloat(amount),
      categoryId,
      date,
      note,
    });
    navigation.goBack();
  };

  if (!expense) {
    return (
      <View style={styles.container}>
        <Text style={styles.emptyText}>No expense selected.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Text style={styles.label}>Amount</Text>
      <TextInput
        style={styles.input}
        value={amount}
        onChangeText={setAmount}
        placeholder="Enter amount"
        keyboardType="numeric"
      />

      <Text style={styles.label}>Category</Text>
      <View style={styles.categoryRow}>
        {categories.map((category) => (
          <TouchableOpacity
            key={category.id}
            onPress={() => setCategoryId(category.id)}
            style={[styles.categoryButton, categoryId === category.id && styles.categoryButtonActive]}
          >
            <Text style={[styles.categoryText, categoryId === category.id && styles.categoryTextActive]}>{category.icon} {category.name}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Date</Text>
      <TextInput
        style={styles.input}
        value={date}
        onChangeText={setDate}
        placeholder="YYYY-MM-DD"
      />

      <Text style={styles.label}>Note</Text>
      <TextInput
        style={[styles.input, styles.noteInput]}
        value={note}
        onChangeText={setNote}
        placeholder="Optional note"
        multiline
      />

      <View style={styles.buttonContainer}>
        <Button title="Update Expense" onPress={handleUpdate} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  contentContainer: {
    padding: 16,
  },
  label: {
    marginBottom: 8,
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 16,
  },
  noteInput: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  categoryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  categoryButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: '#e2e8f0',
    marginRight: 8,
    marginBottom: 8,
  },
  categoryButtonActive: {
    backgroundColor: '#2563eb',
  },
  categoryText: {
    color: '#334155',
    fontWeight: '600',
  },
  categoryTextActive: {
    color: '#ffffff',
  },
  buttonContainer: {
    marginTop: 8,
  },
  emptyText: {
    marginTop: 40,
    textAlign: 'center',
    color: '#475569',
    fontSize: 16,
  },
});
