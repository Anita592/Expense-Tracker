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
import { useAuth } from '../../context/AuthContext';

const getErrorMessage = (err) => {
  if (err.response?.data?.message) return err.response.data.message;
  if (err.code === 'ECONNABORTED') return 'Kërkesa skadoi. Kontrollo nëse backend është duke punuar.';
  if (err.message === 'Network Error') return 'Nuk mund të lidhet me backend. Kontrollo URL/portin e API-së dhe CORS.';
  return err.message || 'Gabim i panjohur gjatë kyçjes.';
};

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [debugMessage, setDebugMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const { login } = useAuth();

  const handleLogin = async () => {
    console.log('LOGIN BUTTON CLICKED');
    setErrorMessage('');
    setDebugMessage('LOGIN BUTTON CLICKED');
    if (!email || !password) {
      setErrorMessage('Missing email or password. The request was not sent.');
      setDebugMessage('LOGIN BUTTON CLICKED -> validation stopped request');
      Alert.alert('Gabim', 'Plotëso të gjitha fushat!');
      return;
    }
    const apiUrl = `${api.defaults.baseURL}/auth/login`;
    console.log('LOGIN API URL:', apiUrl);
    setDebugMessage(`Calling API: ${apiUrl}`);
    setLoading(true);
    try {
      const res = await login(email, password);
      console.log('LOGIN RESPONSE STATUS:', res.status);
      console.log('LOGIN RESPONSE BODY:', res.data);
      setDebugMessage(`Login response ${res.status}: ${JSON.stringify(res.data)}`);
    } catch (err) {
      console.error('Login failed:', err.response?.data || err.message);
      const message = getErrorMessage(err);
      setErrorMessage(message);
      setDebugMessage(`Login failed: ${message}`);
      Alert.alert('Gabim', message);
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
        <Text style={styles.headerTitle}>Expense Tracker</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.content}>

          <Text style={styles.title}>Mirë se vini!</Text>
          <Text style={styles.subtitle}>Kyçuni në llogarinë tuaj</Text>

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
              placeholder="••••••••"
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

          {/* HARRUAT FJALËKALIMIN */}
          <TouchableOpacity style={styles.forgotContainer}>
            <Text style={styles.forgotText}>Harruat fjalëkalimin?</Text>
          </TouchableOpacity>

          {/* BUTONI KYÇU */}
          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Duke hyrë...' : 'KYÇU'}
            </Text>
          </TouchableOpacity>

          {!!debugMessage && (
            <View style={styles.debugBox}>
              <Text style={styles.debugText}>{debugMessage}</Text>
            </View>
          )}

          {!!errorMessage && (
            <Text style={styles.errorText}>{errorMessage}</Text>
          )}

          {/* DIVIDER */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>ose</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* GOOGLE BUTTON */}
          <TouchableOpacity style={styles.googleButton}>
            <Text style={styles.googleIcon}>🔵</Text>
            <Text style={styles.googleText}>Kyçu me Google</Text>
          </TouchableOpacity>

          {/* REGJISTROHU */}
          <View style={styles.registerContainer}>
            <Text style={styles.registerText}>Nuk keni llogari? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.registerLink}>Regjistrohu këtu</Text>
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
    letterSpacing: 0.5,
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
    marginTop: 24,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: '#888',
    marginBottom: 28,
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
    marginBottom: 8,
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
  forgotContainer: {
    alignItems: 'flex-end',
    marginBottom: 20,
  },
  forgotText: {
    color: '#1a3a6e',
    fontSize: 13,
    fontWeight: '500',
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
  debugBox: {
    borderWidth: 1,
    borderColor: '#d0d0d0',
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
    backgroundColor: '#f8f8f8',
  },
  debugText: {
    color: '#333',
    fontSize: 12,
  },
  errorText: {
    color: '#e74c3c',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 12,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#eee',
  },
  dividerText: {
    marginHorizontal: 12,
    color: '#aaa',
    fontSize: 13,
  },
  googleButton: {
    flexDirection: 'row',
    borderWidth: 1.5,
    borderColor: '#d0d0d0',
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  googleIcon: {
    fontSize: 18,
    marginRight: 10,
  },
  googleText: {
    fontSize: 15,
    color: '#333',
    fontWeight: '500',
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  registerText: {
    fontSize: 14,
    color: '#666',
  },
  registerLink: {
    fontSize: 14,
    color: '#1a3a6e',
    fontWeight: 'bold',
  },
});
