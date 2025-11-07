// src/screens/MyJobsScreen.js
import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { Tab, TabView } from "@rneui/themed";
import { supabase } from "../lib/supabase";
import { useFocusEffect } from "@react-navigation/native";

const MyJobsScreen = ({ navigation }) => {
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [postedJobs, setPostedJobs] = useState([]);
  const [myBids, setMyBids] = useState([]);

  useFocusEffect(
    useCallback(() => {
      const fetchData = async () => {
        setLoading(true);
        await fetchPostedJobs();
        await fetchMyBids();
        setLoading(false);
      };
      fetchData();
    }, [])
  );

  const fetchPostedJobs = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("jobs")
        .select("*")
        .eq("client_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPostedJobs(data);
    } catch (error) {
      console.error("Error fetching posted jobs:", error.message);
    }
  };

  const fetchMyBids = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("bids")
        .select(
          `
          *,
          jobs (
            id,
            title,
            budget
          )
        `
        )
        .eq("worker_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setMyBids(data);
    } catch (error) {
      console.error("Error fetching my bids:", error.message);
    }
  };

  const renderPostedJob = ({ item }) => (
    <TouchableOpacity
      style={styles.itemContainer}
      // THE FIX IS HERE
      onPress={() =>
        navigation.navigate("Marketplace", {
          screen: "JobDetail",
          params: { jobId: item.id },
        })
      }
    >
      <Text style={styles.itemTitle}>{item.title}</Text>
      <Text style={styles.itemSubtitle}>Budget: ₹{item.budget}</Text>
    </TouchableOpacity>
  );

  const renderMyBid = ({ item }) => (
    <TouchableOpacity
      style={styles.itemContainer}
      // AND THE FIX IS HERE
      onPress={() =>
        navigation.navigate("Marketplace", {
          screen: "JobDetail",
          params: { jobId: item.jobs.id },
        })
      }
    >
      <View>
        <Text style={styles.itemTitle}>{item.jobs.title}</Text>
        <Text style={styles.itemSubtitle}>Job Budget: ₹{item.jobs.budget}</Text>
      </View>
      <Text style={styles.myBidText}>Your Bid: ₹{item.bid_amount}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Tab
        value={index}
        onChange={setIndex}
        indicatorStyle={styles.tabIndicator}
      >
        <Tab.Item title="Jobs I've Posted" titleStyle={styles.tabTitle} />
        <Tab.Item title="My Bids" titleStyle={styles.tabTitle} />
      </Tab>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" />
        </View>
      ) : (
        <TabView value={index} onChange={setIndex} animationType="spring">
          <TabView.Item style={{ width: "100%" }}>
            <FlatList
              data={postedJobs}
              renderItem={renderPostedJob}
              keyExtractor={(item) => item.id.toString()}
              ListEmptyComponent={
                <Text style={styles.emptyText}>
                  You haven't posted any jobs yet.
                </Text>
              }
            />
          </TabView.Item>
          <TabView.Item style={{ width: "100%" }}>
            <FlatList
              data={myBids}
              renderItem={renderMyBid}
              keyExtractor={(item) => item.id.toString()}
              ListEmptyComponent={
                <Text style={styles.emptyText}>
                  You haven't placed any bids yet.
                </Text>
              }
            />
          </TabView.Item>
        </TabView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  tabIndicator: {
    backgroundColor: "#007BFF",
    height: 3,
  },
  tabTitle: {
    fontSize: 14,
    color: "#007BFF",
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  itemContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: "bold",
  },
  itemSubtitle: {
    fontSize: 14,
    color: "gray",
    marginTop: 2,
  },
  myBidText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#28A745",
  },
  emptyText: {
    textAlign: "center",
    marginTop: 50,
    color: "gray",
  },
});

export default MyJobsScreen;
