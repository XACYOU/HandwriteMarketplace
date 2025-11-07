// src/screens/ConversationsScreen.js
import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../lib/supabase';
import { Avatar } from '@rneui/themed';

const ConversationsScreen = ({ navigation }) => {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState(null);

  useFocusEffect(
    useCallback(() => {
      const fetchConversations = async () => {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setLoading(false); return;
        }
        setCurrentUserId(user.id);

        try {
          const { data, error } = await supabase
            .from('messages')
            .select(`*, sender:profiles!messages_sender_id_fkey(full_name), receiver:profiles!messages_receiver_id_fkey(full_name), jobs(title)`)
            .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
            .order('created_at', { ascending: false });
          if (error) throw error;

          // ** FIX: Group by user, not by user + job **
          const conversationsMap = new Map();
          for (const message of data) {
            const otherUserId = message.sender_id === user.id ? message.receiver_id : message.sender_id;
            // The key is now just the other user's ID
            if (!conversationsMap.has(otherUserId)) {
              const otherUser = message.sender_id === user.id ? message.receiver : message.sender;
              conversationsMap.set(otherUserId, {
                ...message,
                otherUserName: otherUser?.full_name || 'A User',
                otherUserId: otherUserId,
                jobTitle: message.jobs?.title || 'Unknown Job'
              });
            }
          }
          setConversations(Array.from(conversationsMap.values()));
        } catch (err) { console.error("Error fetching conversations:", err.message);
        } finally { setLoading(false); }
      };
      fetchConversations();
    }, [])
  );

  const renderConversation = ({ item }) => (
    <TouchableOpacity 
      style={styles.itemContainer}
      // Navigate to the chat for the job associated with the LATEST message
      onPress={() => navigation.navigate('Chat', {
        jobId: item.job_id,
        receiverId: item.otherUserId,
        receiverName: item.otherUserName
      })}
    >
      <Avatar rounded title={item.otherUserName.charAt(0)} containerStyle={{ backgroundColor: '#007BFF' }} />
      <View style={styles.textContainer}>
        <Text style={styles.userName}>{item.otherUserName}</Text>
        <Text style={styles.lastMessage} numberOfLines={1}>{item.content}</Text>
        <Text style={styles.jobTitle} numberOfLines={1}>Last message regarding: {item.jobTitle}</Text>
      </View>
    </TouchableOpacity>
  );
  
  if (loading) {
    return <View style={styles.centered}><ActivityIndicator size="large" /></View>;
  }

  return (
    <FlatList
      data={conversations}
      renderItem={renderConversation}
      keyExtractor={(item) => item.id.toString()}
      ListEmptyComponent={<Text style={styles.emptyText}>You have no conversations yet.</Text>}
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
  },
  textContainer: { flex: 1, marginLeft: 15 },
  userName: { fontSize: 16, fontWeight: "bold" },
  jobTitle: { fontSize: 13, color: "gray" },
  lastMessage: { fontSize: 14, color: "#333", marginTop: 2 },
  emptyText: { textAlign: "center", marginTop: 50, color: "gray" },
});

export default ConversationsScreen;
