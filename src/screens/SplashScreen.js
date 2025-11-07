// src/screens/SplashScreen.js

import React, { useEffect } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { supabase } from "../lib/supabase";

const SplashScreen = ({ navigation }) => {
  useEffect(() => {
    // A short delay to ensure the navigator is ready.
    const timer = setTimeout(() => {
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((event, session) => {
        if (session && session.user) {
          navigation.replace("MainApp");
        } else {
          navigation.replace("Auth");
        }
      });

      // Cleanup the subscription on unmount
      return () => {
        subscription.unsubscribe();
      };
    }, 100); // 100ms delay

    // Cleanup the timer if the component unmounts before it fires
    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default SplashScreen;
