// src/screens/NotificationsScreen.js
import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../lib/supabase';
import { Icon } from '@rneui/themed';

const NotificationsScreen = ({ navigation }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (user) {
        fetchNotifications();
      }
    }, [user])
  );

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*, actor:profiles(full_name)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setNotifications(data);

      // ** FIX 2: Mark as read AFTER the initial data has been set and displayed **
      if (data && data.length > 0) {
        markAllAsRead();
      }
    } catch (error) { 
      console.error("Error fetching notifications:", error.message); 
    } finally {
      setLoading(false);
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;
    try {
      // Send update to the database in the background
      await supabase.from('notifications').update({ is_read: true }).eq('user_id', user.id).eq('is_read', false);
    } catch (error) { 
      console.error("Error marking notifications as read:", error.message); 
    }
  };

  const handleNotificationPress = (item) => {
    if (item.notification_type === 'new_message' && item.actor_id && item.actor?.full_name) {
      navigation.navigate('Messages', {
        screen: 'Chat',
        params: { jobId: item.link_to_job_id, receiverId: item.actor_id, receiverName: item.actor.full_name, },
      });
    } else if (item.link_to_job_id) {
      navigation.navigate('Marketplace', {
        screen: 'JobDetail',
        params: { jobId: item.link_to_job_id },
      });
    } else {
      Alert.alert("No action available for this notification.");
    }
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity 
      style={[styles.itemContainer, !item.is_read && styles.unreadItem]}
      onPress={() => handleNotificationPress(item)}
    >
      <Icon name="bell" type="font-awesome" color={!item.is_read ? '#007BFF' : 'gray'} style={styles.icon}/>
      <View style={styles.textContainer}>
        <Text style={styles.itemTitle}>{item.title}</Text>
        <Text style={styles.itemDate}>{new Date(item.created_at).toLocaleString()}</Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <FlatList
      data={notifications}
      renderItem={renderItem}
      keyExtractor={(item) => item.id.toString()}
      ListEmptyComponent={
        <Text style={styles.emptyText}>You have no notifications.</Text>
      }
    />
  );
};

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  itemContainer: {
    flexDirection: "row",
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  unreadItem: { backgroundColor: "#E9F5FF" },
  icon: { marginRight: 15 },
  textContainer: { flex: 1 },
  itemTitle: { fontSize: 16 },
  itemDate: { fontSize: 12, color: "gray", marginTop: 4 },
  emptyText: { textAlign: "center", marginTop: 50, color: "gray" },
});

export default NotificationsScreen;
