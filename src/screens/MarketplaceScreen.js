// src/screens/MarketplaceScreen.js

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { Card, Button, Icon } from "@rneui/themed";
import { supabase } from "../lib/supabase";

export default function MarketplaceScreen({ navigation }) {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("jobs")
        .select("*")
        .order("created_at", { ascending: false }); // Show newest jobs first

      if (error) throw error;
      setJobs(data);
    } catch (error) {
      console.error("Error fetching jobs:", error.message);
      // In a real app, you might show a user-friendly error message
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchJobs();
  };

  const renderJobItem = ({ item }) => (
    <Card containerStyle={styles.card}>
      <Card.Title style={styles.cardTitle}>{item.title}</Card.Title>
      <Card.Divider />
      <Text style={styles.cardText} numberOfLines={2}>
        {item.description}
      </Text>
      <Text style={styles.cardInfo}>
        Client: <Text style={styles.bold}>{item.client_name}</Text>
      </Text>
      <Text style={styles.cardInfo}>
        Budget: <Text style={styles.bold}>₹{item.budget}</Text>
      </Text>
      <Text style={styles.cardInfo}>
        Deadline:{" "}
        <Text style={styles.bold}>
          {new Date(item.deadline).toLocaleDateString()}
        </Text>
      </Text>
      <Button
        title="View Details & Bid"
        buttonStyle={styles.detailsButton}
        titleStyle={styles.buttonTitle}
        onPress={() => navigation.navigate('JobDetail', { jobId: item.id })}
      />
    </Card>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={jobs}
        renderItem={renderJobItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Job Marketplace</Text>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.centered}>
            <Text>No jobs posted yet. Be the first!</Text>
          </View>
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />
      {/* We will add the "Post Job" screen functionality later */}
      <TouchableOpacity
        style={styles.postJobButton}
        onPress={() => navigation.navigate('PostJob')}
      >
        <Icon name="plus" type="font-awesome" color="white" size={24} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  listContainer: {
    paddingBottom: 80, // Space for the floating button
  },
  header: {
    padding: 20,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#ECECEC",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
  },
  card: {
    borderRadius: 10,
    marginHorizontal: 15,
    marginBottom: 15,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "left",
  },
  cardText: {
    marginBottom: 10,
    color: "#555",
  },
  cardInfo: {
    fontSize: 14,
    color: "gray",
    marginBottom: 2,
  },
  bold: {
    fontWeight: "bold",
    color: "black",
  },
  detailsButton: {
    marginTop: 10,
    backgroundColor: "#007BFF",
    borderRadius: 8,
  },
  buttonTitle: {
    fontWeight: "bold",
  },
  postJobButton: {
    position: "absolute",
    bottom: 20,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#007BFF",
    justifyContent: "center",
    alignItems: "center",
    elevation: 8, // for Android shadow
    shadowColor: "#000", // for iOS shadow
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
});
