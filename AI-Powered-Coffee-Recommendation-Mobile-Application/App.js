// App.js — Main React Native Chat Interface
// This is the screen the user sees when they open the app.

import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { GiftedChat, Bubble, QuickReplies } from 'react-native-gifted-chat';
import axios from 'axios';

// Change this to your laptop's IP address when testing on a phone
const API_BASE = 'http://192.168.1.x:8000';   // Replace x with your IP

export default function App() {
  const [messages, setMessages]   = useState([]);
  const [sessionId, setSessionId] = useState(null);
  const [loading, setLoading]     = useState(false);

  // Start a new session when the app loads
  useEffect(() => {
    startSession();
  }, []);

  const startSession = async () => {
    try {
      const res = await axios.post(`${API_BASE}/session/start`);
      setSessionId(res.data.session_id);
      // Show a welcome message from the bot
      addBotMessage('Hello! Welcome to our coffee shop! Type Hi to get started.');
    } catch (err) {
      console.error('Failed to start session:', err.message);
    }
  };

  const addBotMessage = (text, quickReplies = []) => {
    const msg = {
      _id:  Math.random().toString(),
      text: text,
      createdAt: new Date(),
      user: { _id: 2, name: 'CoffeeBot', avatar: require('./assets/bot.png') },
    };
    if (quickReplies.length > 0) {
      msg.quickReplies = {
        type: 'radio',
        values: quickReplies.map(r => ({ title: r, value: r })),
      };
    }
    setMessages(prev => GiftedChat.append(prev, [msg]));
  };

  // Called when user sends a message
  const onSend = useCallback(async (newMessages = []) => {
    setMessages(prev => GiftedChat.append(prev, newMessages));
    const userText = newMessages[0].text;
    setLoading(true);
    try {
      const res = await axios.post(`${API_BASE}/chat`, {
        session_id: sessionId,
        message:    userText,
      });
      addBotMessage(res.data.reply, res.data.quick_replies || []);
    } catch (err) {
      addBotMessage('Sorry, I could not connect to the server. Please try again.');
    }
    setLoading(false);
  }, [sessionId]);

  // Called when user taps a quick reply button
  const onQuickReply = (replies) => {
    const text = replies[0].value;
    onSend([{ _id: Math.random().toString(), text, createdAt: new Date(), user: { _id: 1 } }]);
  };

  return (
    <View style={styles.container}>
      <GiftedChat
        messages={messages}
        onSend={onSend}
        onQuickReply={onQuickReply}
        user={{ _id: 1 }}
        isTyping={loading}
        placeholder='Type a message...'
        renderBubble={props => (
          <Bubble
            {...props}
            wrapperStyle={{
              right: { backgroundColor: '#6F4E37' },  // Coffee brown for user
              left:  { backgroundColor: '#F5F5F0' },  // Cream for bot
            }}
          />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF8F0' }
});
