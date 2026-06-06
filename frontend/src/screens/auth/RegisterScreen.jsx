import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import React, { useState } from 'react';

import api from '../../services/api';

export default function RegisterScreen({ navigation }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [loading, setLoading] = useState(false);

  const getPasswordStrength = () => {
    if (password.length === 0) return 0;
    if (password.length < 6) return 1;
    if (password.length < 10) return 2;
    return 3;
  };

  const strengthLabel = ['', 'E dobët', 'E mesme', 'E fortë'];
  const strengthColor = ['#eee', '#e74c3c', '#f39c12', '#27ae60'];
  const strength = getPasswordStrength();

  const handleRegister = async () => {
    if (!name || !email || !password || !confirmPassword) {
      Alert.alert('Gabim', 'Plotëso të gjitha fushat!');
      return;
    }
    if (password.length < 8) {
      Alert.alert('Gabim', 'Fjalëkalimi duhet të ketë minimum 8 karaktere!');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Gabim', 'Fjalëkalimet nuk përputhen!');
      return;
    }
    if (!acceptTerms) {
      Alert.alert('Gabim', 'Duhet të pranosh Kushtet e Shërbimit!');
      return;
    }
    setLoading(true);
    try {
      await api.post('/auth/register', { name, email, password });
      Alert.alert('Sukses', 'Llogaria u krijua!');
      navigation.navigate('Login');
    } catch (err) {
      Alert.alert('Gabim', 'Email ekziston ose gabim serveri!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* HEADER BLU */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Krijo Llogari</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.content}>

          <Text style={styles.title}>Regjistrohu</Text>

          {/* EMRI I PLOTË */}
          <Text style={styles.label}>Emri i plotë</Text>
          <TextInput
            style={styles.input}
            placeholder="Emri Mbiemri"
            placeholderTextColor="#aaa"
            value={name}
            onChangeText={setName}
          />

          {/* EMAIL */}
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="email@shembull.com"
            placeholderTextColor="#aaa"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          {/* FJALËKALIMI */}
          <Text style={styles.label}>Fjalëkalimi</Text>
          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.passwordInput}
              placeholder="Min. 8 karaktere"
              placeholderTextColor="#aaa"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity
              style={styles.eyeButton}
              onPress={() => setShowPassword(!showPassword)}
            >
              <Text style={styles.eyeIcon}>{showPassword ? '🙈' : '👁️'}</Text>
            </TouchableOpacity>
          </View>

          {/* KONFIRMO FJALËKALIMIN */}
          <Text style={styles.label}>Konfirmo Fjalëkalimin</Text>
          <TextInput
            style={styles.input}
            placeholder="Përsërit fjalëkalimin"
            placeholderTextColor="#aaa"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
          />

          {/* PROGRESS BAR */}
          {password.length > 0 && (
            <View style={styles.strengthContainer}>
              <View style={styles.strengthBars}>
                {[1, 2, 3].map(i => (
                  <View
                    key={i}
                    style={[
                      styles.strengthBar,
                      { backgroundColor: i <= strength ? strengthColor[strength] : '#eee' }
                    ]}
                  />
                ))}
              </View>
              <Text style={[styles.strengthLabel, { color: strengthColor[strength] }]}>
                {strengthLabel[strength]}
              </Text>
            </View>
          )}

          {/* CHECKBOX KUSHTET */}
          <TouchableOpacity
            style={styles.checkboxContainer}
            onPress={() => setAcceptTerms(!acceptTerms)}
          >
            <View style={[styles.checkbox, acceptTerms && styles.checkboxChecked]}>
              {acceptTerms && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text style={styles.checkboxLabel}>Pranoj Kushtet e Shërbimit</Text>
          </TouchableOpacity>

          {/* BUTONI REGJISTROHU */}
          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleRegister}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Duke u regjistruar...' : 'REGJISTROHU'}
            </Text>
          </TouchableOpacity>

          {/* KYÇUNI */}
          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>Keni llogari? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.loginLink}>Kyçuni këtu</Text>
            </TouchableOpacity>
          </View>

        </View>
      </ScrollView>
    </KeyboardAvoidingView>
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
    padding: 24,
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#1a3a6e',
    marginTop: 16,
    marginBottom: 24,
    textAlign: 'center',
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
    padding: 14,
    fontSize: 15,
    color: '#333',
    marginBottom: 18,
    backgroundColor: '#fff',
  },
  passwordContainer: {
    flexDirection: 'row',
    borderWidth: 1.5,
    borderColor: '#d0d0d0',
    borderRadius: 10,
    marginBottom: 18,
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  passwordInput: {
    flex: 1,
    padding: 14,
    fontSize: 15,
    color: '#333',
  },
  eyeButton: {
    padding: 14,
  },
  eyeIcon: {
    fontSize: 18,
  },
  strengthContainer: {
    marginBottom: 16,
  },
  strengthBars: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 4,
  },
  strengthBar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  strengthLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#1a3a6e',
    borderRadius: 4,
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#1a3a6e',
  },
  checkmark: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  checkboxLabel: {
    fontSize: 14,
    color: '#333',
  },
  button: {
    backgroundColor: '#1a3a6e',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonDisabled: {
    backgroundColor: '#7a9cc6',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  loginText: {
    fontSize: 14,
    color: '#666',
  },
  loginLink: {
    fontSize: 14,
    color: '#1a3a6e',
    fontWeight: 'bold',
  },
});