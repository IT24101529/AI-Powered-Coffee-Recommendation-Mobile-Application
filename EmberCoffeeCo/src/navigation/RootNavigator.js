import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { useAuth } from '../context/AuthContext';

// Auth screens
import SplashScreen from '../screens/SplashScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';

// Customer screens
import HomeScreen from '../screens/HomeScreen';
import MenuScreen from '../screens/MenuScreen';
import RewardsScreen from '../screens/RewardsScreen';
import OrdersScreen from '../screens/OrdersScreen';
import ProfileScreen from '../screens/ProfileScreen';

// Nested stack screens
import ProductDetailScreen from '../screens/ProductDetailScreen';
import MyRewardsScreen from '../screens/MyRewardsScreen';
import OrderTrackingScreen from '../screens/OrderTrackingScreen';
import CheckoutScreen from '../screens/CheckoutScreen';
import CartScreen from '../screens/CartScreen';

// Admin screens
import ReviewsFeedScreen from '../screens/ReviewsFeedScreen';
import AdminDashboardScreen from '../screens/AdminDashboardScreen';
import AdminProductsScreen from '../screens/AdminProductsScreen';
import AdminOrdersScreen from '../screens/AdminOrdersScreen';
import AdminRewardsScreen from '../screens/AdminRewardsScreen';
import AdminPromotionsScreen from '../screens/AdminPromotionsScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const stackOptions = { headerShown: false };

function AuthStack() {
  return (
    <Stack.Navigator screenOptions={stackOptions}>
      <Stack.Screen name="Splash" component={SplashScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
  );
}

function HomeStack() {
  return (
    <Stack.Navigator screenOptions={stackOptions}>
      <Stack.Screen name="HomeScreen" component={HomeScreen} />
      <Stack.Screen name="ProductDetail" component={ProductDetailScreen} />
    </Stack.Navigator>
  );
}

function MenuStack() {
  return (
    <Stack.Navigator screenOptions={stackOptions}>
      <Stack.Screen name="MenuScreen" component={MenuScreen} />
      <Stack.Screen name="ProductDetail" component={ProductDetailScreen} />
      <Stack.Screen name="ReviewsFeed" component={ReviewsFeedScreen} />
    </Stack.Navigator>
  );
}

function RewardsStack() {
  return (
    <Stack.Navigator screenOptions={stackOptions}>
      <Stack.Screen name="RewardsScreen" component={RewardsScreen} />
      <Stack.Screen name="MyRewards" component={MyRewardsScreen} />
    </Stack.Navigator>
  );
}

function OrdersStack() {
  return (
    <Stack.Navigator screenOptions={stackOptions}>
      <Stack.Screen name="OrdersScreen" component={OrdersScreen} />
      <Stack.Screen name="OrderTracking" component={OrderTrackingScreen} />
      <Stack.Screen name="Checkout" component={CheckoutScreen} />
      <Stack.Screen name="Cart" component={CartScreen} />
    </Stack.Navigator>
  );
}

function ProfileStack() {
  return (
    <Stack.Navigator screenOptions={stackOptions}>
      <Stack.Screen name="ProfileScreen" component={ProfileScreen} />
    </Stack.Navigator>
  );
}

function AdminStack() {
  return (
    <Stack.Navigator screenOptions={stackOptions}>
      <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} />
      <Stack.Screen name="AdminProducts" component={AdminProductsScreen} />
      <Stack.Screen name="AdminOrders" component={AdminOrdersScreen} />
      <Stack.Screen name="AdminRewards" component={AdminRewardsScreen} />
      <Stack.Screen name="AdminPromotions" component={AdminPromotionsScreen} />
    </Stack.Navigator>
  );
}

const tabOptions = {
  headerShown: false,
  tabBarStyle: { display: 'none' },
};

function AppTabs() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  return (
    <Tab.Navigator screenOptions={tabOptions}>
      <Tab.Screen name="Home" component={HomeStack} />
      <Tab.Screen name="Menu" component={MenuStack} />
      <Tab.Screen name="Rewards" component={RewardsStack} />
      <Tab.Screen name="Orders" component={OrdersStack} />
      <Tab.Screen name="Profile" component={ProfileStack} />
      {isAdmin && (
        <Tab.Screen name="Admin" component={AdminStack} />
      )}
    </Tab.Navigator>
  );
}

export default function RootNavigator() {
  const { token } = useAuth();
  return token ? <AppTabs /> : <AuthStack />;
}
