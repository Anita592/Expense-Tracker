import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

const ExpenseItem = ({ expense, categoryName, onEdit, onDelete }) => {
  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <View>
          <Text style={styles.amount}>${expense.amount.toFixed(2)}</Text>
          <Text style={styles.meta}>{categoryName} • {expense.date}</Text>
        </View>
        <View style={styles.actions}>
          <TouchableOpacity onPress={() => onEdit(expense)} style={styles.actionButton}>
            <Text style={styles.actionText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => onDelete(expense.id)} style={styles.deleteButton}>
            <Text style={styles.actionText}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
      <Text style={styles.note}>{expense.note || 'No note'}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  amount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#222',
  },
  meta: {
    marginTop: 4,
    color: '#666',
  },
  note: {
    marginTop: 10,
    color: '#444',
  },
  actions: {
    flexDirection: 'row',
  },
  actionButton: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: '#2f80ed',
    marginRight: 8,
  },
  actionButton: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: '#2f80ed',
  },
  deleteButton: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: '#eb5757',
  },
  actionText: {
    color: '#fff',
    fontWeight: '600',
  },
});

export default ExpenseItem;
