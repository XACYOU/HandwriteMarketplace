// src/screens/ProfileScreen.js
import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ActivityIndicator, Alert } from "react-native";
import { Button, Icon } from "@rneui/themed";
import { supabase } from "../lib/supabase";
import * as WebBrowser from "expo-web-browser";
import { useAuthRequest, makeRedirectUri } from "expo-auth-session";

WebBrowser.maybeCompleteAuthSession();

const discovery = {
  authorizationEndpoint: "https://accounts.google.com/o/oauth2/v2/auth",
  tokenEndpoint: "https://oauth2.googleapis.com/token",
  revocationEndpoint: "https://oauth2.googleapis.com/revoke",
};

const ProfileScreen = ({ navigation }) => {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  const androidClientId =
    "125784393716-ce0pejlssd3i4ss6aramf2hicttgnfim.apps.googleusercontent.com";
  // Use the makeRedirectUri function with the scheme from your app.json
  const redirectUri = makeRedirectUri({
    scheme: "handwritemarketplace",
    path: "oauth2redirect",
  });

  const [request, response, promptAsync] = useAuthRequest(
    {
      // Use the Android/iOS Client ID as the primary clientId
      clientId: androidClientId,
      androidClientId: androidClientId,
      scopes: ["https://www.googleapis.com/auth/drive.readonly"],
      redirectUri: redirectUri,
    },
    discovery
  );

  useEffect(() => {
    const getSessionData = async () => {
      const { data } = await supabase.auth.getSession();
      setSession(data.session);
      setLoading(false);
    };
    getSessionData();
  }, []);

  useEffect(() => {
    if (response?.type === "success") {
      const { code } = response.params;
      Alert.alert(
        "Success!",
        "You have successfully granted access to your Google Drive. We'll build the file viewer next."
      );
    } else if (response?.type === "error") {
      Alert.alert(
        "Authentication Error",
        response.params.error_description || "Something went wrong."
      );
    }
  }, [response]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Icon name="user-circle" type="font-awesome" size={80} color="#ccc" />
        <Text style={styles.name}>
          {session?.user?.user_metadata?.full_name || "User"}
        </Text>
        <Text style={styles.email}>{session?.user?.email}</Text>
      </View>

      <View style={styles.driveSection}>
        <Icon
          name="google-drive"
          type="material-community"
          size={60}
          color="#4285F4"
        />
        <Text style={styles.driveText}>
          Connect your Google Drive account to use images from your drive as
          your portfolio.
        </Text>
        <Button
          title="Connect to Google Drive"
          disabled={!request}
          onPress={() => {
            promptAsync(); // No proxy needed for this flow
          }}
          icon={
            <Icon
              name="google"
              type="font-awesome"
              color="white"
              containerStyle={{ marginRight: 10 }}
            />
          }
        />
      </View>

      <Button
        title="Sign Out"
        onPress={() => supabase.auth.signOut()}
        buttonStyle={styles.signOutButton}
        containerStyle={styles.signOutContainer}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  name: { fontSize: 22, fontWeight: "bold", marginTop: 10 },
  email: { fontSize: 16, color: "gray", marginTop: 5 },
  driveSection: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 30,
    textAlign: "center",
  },
  driveText: {
    marginVertical: 20,
    fontSize: 16,
    textAlign: "center",
    color: "gray",
  },
  signOutContainer: { padding: 20 },
  signOutButton: { backgroundColor: "#DC3545", borderRadius: 8 },
});

export default ProfileScreen;
