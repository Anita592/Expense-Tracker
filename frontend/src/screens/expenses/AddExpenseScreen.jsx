import React, { useEffect, useState } from 'react';
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

import api from '../../services/api';

const todayIso = () => new Date().toISOString().slice(0, 10);

export default function AddExpenseScreen({ navigation }) {
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(todayIso());
  const [note, setNote] = useState('');
  const [category, setCategory] = useState('');
  const [categories, setCategories] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/expenses/categories')
      .then((res) => {
        setCategories(res.data || []);
      })
      .catch(() => {});
  }, []);

  const handleSave = async () => {
    setError('');
    const amt = Number(amount);

    if (!amt || amt <= 0) {
      setError('Shuma duhet të jetë më e madhe se 0.');
      return;
    }
    if (!category.trim()) {
      setError('Kategoria është e detyrueshme.');
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      setError('Data duhet të jetë në formatin YYYY-MM-DD.');
      return;
    }

    setSaving(true);
    try {
      await api.post('/expenses', {
        amount: amt,
        category: category.trim(),
        expense_date: date,
        note: note.trim(),
      });

      if (Platform.OS !== 'web') {
        Alert.alert('Sukses', 'Shpenzimi u shtua me sukses.');
      }
      navigation.goBack();
    } catch (err) {
      setError(err.response?.data?.message || 'Gabim gjatë ruajtjes.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.label}>Shuma</Text>
      <TextInput
        style={styles.input}
        value={amount}
        onChangeText={setAmount}
        placeholder="0.00"
        placeholderTextColor="#aaa"
        keyboardType="decimal-pad"
      />

      <Text style={styles.label}>Kategoria</Text>
      {categories.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={[styles.chip, category === cat.name && styles.chipActive]}
              onPress={() => setCategory(cat.name)}
            >
              <Text style={[styles.chipText, category === cat.name && styles.chipTextActive]}>
                {cat.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
      <TextInput
        style={styles.input}
        value={category}
        onChangeText={setCategory}
        placeholder="Ushqim, Transport, ..."
        placeholderTextColor="#aaa"
      />

      <Text style={styles.label}>Data</Text>
      <TextInput
        style={styles.input}
        value={date}
        onChangeText={setDate}
        placeholder="YYYY-MM-DD"
        placeholderTextColor="#aaa"
      />

      <Text style={styles.label}>Shënim</Text>
      <TextInput
        style={[styles.input, styles.noteInput]}
        value={note}
        onChangeText={setNote}
        placeholder="Opsional"
        placeholderTextColor="#aaa"
        multiline
      />

      {!!error && <Text style={styles.errorText}>{error}</Text>}

      <TouchableOpacity
        style={[styles.button, saving && styles.buttonDisabled]}
        onPress={handleSave}
        disabled={saving}
      >
        {saving ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>RUAJ SHPENZIMIN</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f6fa',
  },
  content: {
    padding: 16,
    gap: 4,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
    marginTop: 10,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#d0d0d0',
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#333',
  },
  noteInput: {
    minHeight: 90,
    textAlignVertical: 'top',
  },
  chips: {
    gap: 8,
    paddingBottom: 10,
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
  errorText: {
    color: '#e74c3c',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
  },
  button: {
    backgroundColor: '#1a3a6e',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
  },
});
