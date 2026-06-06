import DashboardScreen from '../screens/reports/DashboardScreen';
import ExpenseListScreen from '../screens/expenses/ExpenseListScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import { NavigationContainer } from '@react-navigation/native';
import React from 'react';
import RegisterScreen from '../screens/auth/RegisterScreen';
import ReportScreen from '../screens/reports/ReportScreen';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { useAuth } from '../context/AuthContext';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator>
      <Tab.Screen name="Shpenzimet" component={ExpenseListScreen} />
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Raportet" component={ReportScreen} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { user } = useAuth();
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          <Stack.Screen name="Main" component={MainTabs} />
        ) : (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}