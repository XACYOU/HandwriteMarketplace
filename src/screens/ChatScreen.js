// src/screens/ChatScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { Icon } from '@rneui/themed';
import { supabase } from '../lib/supabase';

const ChatScreen = ({ route }) => {
  const { jobId, receiverId } = route.params;
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const setupChat = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUser(user);
        await fetchMessages(user.id);
      }
      setLoading(false);
    };
    setupChat();
  }, [jobId, receiverId]);

  useEffect(() => {
    if (!currentUser) return;
    const channel = supabase
      .channel(`chat:${jobId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `job_id=eq.${jobId}` }, 
      (payload) => {
        if (payload.new.sender_id !== currentUser.id) {
          setMessages(prevMessages => [payload.new, ...prevMessages]);
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [currentUser, jobId]);

  const fetchMessages = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('job_id', jobId)
        .in('sender_id', [userId, receiverId])
        .in('receiver_id', [userId, receiverId])
        .order('created_at', { ascending: false });
      if (error) throw error;
      setMessages(data);
    } catch (error) { console.error("Error fetching messages:", error.message); }
  };

  const handleSend = async () => {
    if (newMessage.trim() === '' || !currentUser) return;
    const messageContent = newMessage.trim();
    setNewMessage('');

    // ** THE FIX IS HERE **
    const senderName = currentUser.user_metadata?.full_name || 'Anonymous';

    const optimisticMessage = {
      id: Math.random(),
      job_id: jobId,
      sender_id: currentUser.id,
      receiver_id: receiverId,
      sender_name: senderName,
      content: messageContent,
      created_at: new Date().toISOString(),
    };
    setMessages(prevMessages => [optimisticMessage, ...prevMessages]);

    const { data, error } = await supabase
      .from('messages')
      .insert({
        job_id: jobId,
        sender_id: currentUser.id,
        receiver_id: receiverId,
        sender_name: senderName, // We now send the name
        content: messageContent,
      })
      .select()
      .single();
    if (error) {
      console.error("Error sending message:", error.message);
      setMessages(prevMessages => prevMessages.filter(m => m.id !== optimisticMessage.id));
      Alert.alert("Error", "Failed to send message.");
    } else {
      setMessages(prevMessages => prevMessages.map(m => m.id === optimisticMessage.id ? data : m));
    }
  };

  const renderMessage = ({ item }) => {
    const isMyMessage = item.sender_id === currentUser?.id;
    return (
      <View style={[styles.messageBubble, isMyMessage ? styles.myMessage : styles.theirMessage]}>
        <Text style={isMyMessage ? styles.myMessageText : styles.theirMessageText}>{item.content}</Text>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={90}
    >
      <FlatList
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id.toString()}
        inverted
        contentContainerStyle={styles.messageList}
      />
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={newMessage}
          onChangeText={setNewMessage}
          placeholder="Type a message..."
          placeholderTextColor="#999"
        />
        <TouchableOpacity style={styles.sendButton} onPress={handleSend}>
          <Icon name="send" type="material" color="#fff" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f0f0f0" },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  messageList: { paddingHorizontal: 10, paddingTop: 10 },
  messageBubble: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 20,
    marginBottom: 10,
    maxWidth: "80%",
  },
  myMessage: {
    backgroundColor: "#007BFF",
    alignSelf: "flex-end",
    borderBottomRightRadius: 5,
  },
  theirMessage: {
    backgroundColor: "#E5E5EA",
    alignSelf: "flex-start",
    borderBottomLeftRadius: 5,
  },
  myMessageText: { color: "white", fontSize: 16 },
  theirMessageText: { color: "black", fontSize: 16 },
  inputContainer: {
    flexDirection: "row",
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: "#ddd",
    backgroundColor: "#fff",
  },
  input: {
    flex: 1,
    height: 40,
    backgroundColor: "#f0f0f0",
    borderRadius: 20,
    paddingHorizontal: 15,
    fontSize: 16,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#007BFF",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 10,
  },
});

export default ChatScreen;
