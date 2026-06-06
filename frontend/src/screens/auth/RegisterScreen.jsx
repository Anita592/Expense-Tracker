import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import React, { useState } from 'react';

import api from '../../services/api';

export default function RegisterScreen({ navigation }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleRegister = async () => {
    if (!name || !email || !password) {
      Alert.alert('Gabim', 'Plotëso të gjitha fushat!');
      return;
    }
    if (password.length < 8) {
      Alert.alert('Gabim', 'Fjalëkalimi duhet të ketë min 8 karaktere!');
      return;
    }
    try {
      await api.post('/auth/register', { name, email, password });
      Alert.alert('Sukses', 'Llogaria u krijua!');
      navigation.navigate('Login');
    } catch (err) {
      Alert.alert('Gabim', 'Email ekziston ose gabim serveri!');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Regjistrohu</Text>
      <TextInput style={styles.input} placeholder="Emri" value={name} onChangeText={setName} />
      <TextInput style={styles.input} placeholder="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
      <TextInput style={styles.input} placeholder="Fjalëkalimi" value={password} onChangeText={setPassword} secureTextEntry />
      <TouchableOpacity style={styles.button} onPress={handleRegister}>
        <Text style={styles.buttonText}>Regjistrohu</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.navigate('Login')}>
        <Text style={styles.link}>Ke llogari? Hyr</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20, backgroundColor: '#fff' },
  title: { fontSize: 28, fontWeight: 'bold', textAlign: 'center', marginBottom: 30, color: '#1F3864' },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12, marginBottom: 15, fontSize: 16 },
  button: { backgroundColor: '#2E75B6', padding: 15, borderRadius: 8, alignItems: 'center', marginBottom: 15 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  link: { textAlign: 'center', color: '#2E75B6', fontSize: 14 },
});