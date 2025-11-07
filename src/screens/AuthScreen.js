// src/screens/AuthScreen.js

import React, { useState } from "react";
import {
  View,
  StyleSheet,
  Alert,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Button, Input, Text } from "@rneui/themed";
import { supabase } from "../lib/supabase";

export default function AuthScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState(""); // For sign up
  const [loading, setLoading] = useState(false);
  const [isSigningUp, setIsSigningUp] = useState(false); // To toggle between Sign In/Sign Up

  // Sign In function
  async function signInWithEmail() {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    if (error) Alert.alert("Error", error.message);
    setLoading(false);
  }

  // Sign Up function
  async function signUpWithEmail() {
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email: email,
      password: password,
      options: {
        data: {
          full_name: name, // Add user's name to metadata
        },
      },
    });

    if (error) {
      Alert.alert("Error", error.message);
    } else if (!data.session) {
      Alert.alert("Success", "Please check your inbox for email verification!");
    }
    setLoading(false);
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <View style={styles.header}>
        <Text h3 style={styles.headerText}>
          Handwrite Marketplace
        </Text>
        <Text style={styles.subHeaderText}>
          {isSigningUp ? "Create a new account" : "Welcome back"}
        </Text>
      </View>

      <View style={styles.formContainer}>
        {isSigningUp && (
          <Input
            label="Full Name"
            leftIcon={{ type: "font-awesome", name: "user" }}
            onChangeText={(text) => setName(text)}
            value={name}
            placeholder="John Doe"
            autoCapitalize="words"
          />
        )}
        <Input
          label="Email"
          leftIcon={{ type: "font-awesome", name: "envelope" }}
          onChangeText={(text) => setEmail(text)}
          value={email}
          placeholder="email@address.com"
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <Input
          label="Password"
          leftIcon={{ type: "font-awesome", name: "lock" }}
          onChangeText={(text) => setPassword(text)}
          value={password}
          secureTextEntry={true}
          placeholder="Password"
          autoCapitalize="none"
        />
      </View>

      <View style={styles.buttonContainer}>
        <Button
          title={loading ? "Loading..." : isSigningUp ? "Sign Up" : "Sign In"}
          disabled={loading}
          onPress={isSigningUp ? signUpWithEmail : signInWithEmail}
          buttonStyle={styles.mainButton}
          titleStyle={styles.buttonTitle}
        />
        <TouchableOpacity onPress={() => setIsSigningUp(!isSigningUp)}>
          <Text style={styles.toggleText}>
            {isSigningUp
              ? "Already have an account? Sign In"
              : "Don't have an account? Sign Up"}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
    backgroundColor: "#F5F5F5",
  },
  header: {
    alignItems: "center",
    marginBottom: 40,
  },
  headerText: {
    fontWeight: "bold",
    marginBottom: 8,
  },
  subHeaderText: {
    fontSize: 16,
    color: "gray",
  },
  formContainer: {
    marginBottom: 20,
  },
  buttonContainer: {
    width: "100%",
    marginTop: 10,
  },
  mainButton: {
    backgroundColor: "#007BFF",
    borderRadius: 8,
    paddingVertical: 12,
  },
  buttonTitle: {
    fontWeight: "bold",
    fontSize: 16,
    textAlign: "center", // ensures text stays centered
  },
  toggleText: {
    color: "#007BFF",
    marginTop: 20,
    fontWeight: "600",
  },
});
