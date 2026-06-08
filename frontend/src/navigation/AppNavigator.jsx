import DashboardScreen from '../screens/reports/DashboardScreen';
import ExpenseListScreen from '../screens/expenses/ExpenseListScreen';
import AddExpenseScreen from '../screens/expenses/AddExpenseScreen';
import EditExpenseScreen from '../screens/expenses/EditExpenseScreen';
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
const ExpensesStack = createStackNavigator();

function ExpensesStackScreen() {
  return (
    <ExpensesStack.Navigator>
      <ExpensesStack.Screen name="ExpenseListScreen" component={ExpenseListScreen} options={{ headerShown: false }} />
      <ExpensesStack.Screen name="AddExpense" component={AddExpenseScreen} options={{ title: 'Add Expense' }} />
      <ExpensesStack.Screen name="EditExpense" component={EditExpenseScreen} options={{ title: 'Edit Expense' }} />
    </ExpensesStack.Navigator>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator>
      <Tab.Screen name="Shpenzimet" component={ExpensesStackScreen} options={{ headerShown: false }} />
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