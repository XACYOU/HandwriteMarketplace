// src/navigation/MainAppNavigator.js
import React, { useState, useCallback, useEffect } from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createStackNavigator } from "@react-navigation/stack";
import { Icon, Badge } from "@rneui/themed";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { supabase } from "../lib/supabase";

// Import all screens
import MarketplaceScreen from "../screens/MarketplaceScreen";
import JobDetailScreen from "../screens/JobDetailScreen";
import PostJobScreen from "../screens/PostJobScreen";
import MyJobsScreen from "../screens/MyJobsScreen";
import ProfileScreen from "../screens/ProfileScreen";
import ConversationsScreen from "../screens/ConversationsScreen";
import ChatScreen from "../screens/ChatScreen";
import NotificationsScreen from "../screens/NotificationsScreen";
import FundEscrowScreen from "../screens/FundEscrowScreen";

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const MarketplaceStack = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="MarketplaceFeed"
        component={MarketplaceScreen}
        options={{ title: "Marketplace" }}
      />
      <Stack.Screen
        name="JobDetail"
        component={JobDetailScreen}
        options={{ title: "Job Details" }}
      />
      <Stack.Screen
        name="PostJob"
        component={PostJobScreen}
        options={{ title: "Post a New Job" }}
      />
      {/* ADD THIS SCREEN */}
      <Stack.Screen
        name="FundEscrow"
        component={FundEscrowScreen}
        options={{ title: "Fund Escrow" }}
      />
    </Stack.Navigator>
  );
};

const MessagesStack = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="Conversations"
        component={ConversationsScreen}
        options={{ title: "My Messages" }}
      />
      <Stack.Screen
        name="Chat"
        component={ChatScreen}
        options={({ route }) => ({
          title: `Chat with ${route.params?.receiverName || "User"}`,
        })}
      />
    </Stack.Navigator>
  );
};

const NotificationsStack = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="NotificationsList"
        component={NotificationsScreen}
        options={{ title: "Notifications" }}
      />
    </Stack.Navigator>
  );
};

export default function MainAppNavigator() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [user, setUser] = useState(null);
  const navigation = useNavigation();

  const fetchCount = useCallback(async (currentUser) => {
    if (currentUser) {
      const { count, error } = await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("user_id", currentUser.id)
        .eq("is_read", false);
      if (!error) setUnreadCount(count);
    }
  }, []);

  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user);
      fetchCount(data.user);
    };
    getUser();

    const unsubscribe = navigation.addListener("focus", () => {
      if (user) fetchCount(user);
    });
    return unsubscribe;
  }, [navigation, user, fetchCount]);

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`public:notifications:user_id=eq.${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          fetchCount(user);
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchCount]);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName,
            iconType = "font-awesome";
          if (route.name === "Marketplace") {
            iconName = "briefcase";
          } else if (route.name === "My Jobs") {
            iconName = "tasks";
          } else if (route.name === "Messages") {
            iconName = "chatbubble-ellipses-outline";
            iconType = "ionicon";
          } else if (route.name === "Notifications") {
            iconName = "bell";
          } else if (route.name === "Profile") {
            iconName = "user";
          }
          return (
            <Icon name={iconName} type={iconType} size={size} color={color} />
          );
        },
        tabBarActiveTintColor: "#007BFF",
        tabBarInactiveTintColor: "gray",
      })}
    >
      <Tab.Screen
        name="Marketplace"
        component={MarketplaceStack}
        options={{ headerShown: false }}
      />
      <Tab.Screen name="My Jobs" component={MyJobsScreen} />
      <Tab.Screen
        name="Messages"
        component={MessagesStack}
        options={{ headerShown: false }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            const state = navigation.getState();
            // Check if the currently focused tab is the 'Messages' tab (index 2)
            if (state.index === 2) {
              e.preventDefault();
              navigation.navigate("Messages", { screen: "Conversations" });
            }
          },
        })}
      />
      <Tab.Screen
        name="Notifications"
        component={NotificationsStack}
        options={{
          headerShown: false,
          tabBarBadge: unreadCount > 0 ? unreadCount : null,
        }}
      />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
