import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Card, Button, Icon, Avatar } from "@rneui/themed";
import { supabase } from "../lib/supabase";
import BidFormComponent from "../components/BidFormComponent";
import { useFocusEffect } from "@react-navigation/native";

export default function JobDetailScreen({ route, navigation }) {
  const { jobId } = route.params;
  const [job, setJob] = useState(null);
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);

  const currentUserBid = useMemo(
    () => bids.find((bid) => bid.worker_id === currentUserId),
    [bids, currentUserId]
  );

  useFocusEffect(
    useCallback(() => {
      const fetchData = async () => {
        if (!jobId) return;
        setLoading(true);
        await fetchJobDetails();
        await fetchBids();
        setLoading(false);
      };
      fetchData();
    }, [jobId])
  );

  const fetchJobDetails = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setCurrentUserId(user?.id);
      const { data, error } = await supabase
        .from("jobs")
        .select("*")
        .eq("id", jobId)
        .single();
      if (error) throw error;
      setJob(data);
      if (data && user && data.client_id === user.id) setIsClient(true);
    } catch (error) {
      console.error("Error fetching job details:", error.message);
      Alert.alert("Error", "Could not fetch job details.");
    }
  };

  const fetchBids = async () => {
    try {
      const { data: bidsData, error } = await supabase
        .from("bids")
        .select("*")
        .eq("job_id", jobId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      setBids(bidsData);
    } catch (error) {
      console.error("Error fetching bids:", error.message);
    }
  };

  const handleAcceptBid = async (bid) => {
    Alert.alert(
      "Confirm Hire",
      `Are you sure you want to hire ${bid.worker_name} for ₹${bid.bid_amount}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm",
          style: "default",
          onPress: async () => {
            try {
              const { error: jobUpdateError } = await supabase
                .from("jobs")
                .update({
                  status: "in_progress",
                  accepted_worker_id: bid.worker_id,
                  final_amount: bid.bid_amount,
                })
                .eq("id", jobId);
              if (jobUpdateError) throw jobUpdateError;

              // Create the contract and get the newly created record back
              const { data: newContract, error: contractError } = await supabase
                .from("contracts")
                .insert({
                  job_id: jobId,
                  client_id: job.client_id,
                  worker_id: bid.worker_id,
                  amount: bid.bid_amount,
                })
                .select()
                .single(); // .single() returns the object instead of an array
              if (contractError) throw contractError;

              // Navigate to the funding screen with the new contract details
              navigation.navigate("FundEscrow", { contract: newContract });
            } catch (error) {
              Alert.alert("Error", "Could not accept bid. Please try again.");
              console.error("Error accepting bid:", error.message);
            }
          },
        },
      ]
    );
  };

  const validateBid = (amount) => {
    if (!job) return false;
    const numericAmount = parseInt(amount, 10);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      Alert.alert("Invalid Bid", "Please enter a valid bid amount.");
      return false;
    }
    if (numericAmount > job.budget) {
      Alert.alert(
        "Invalid Bid",
        `Your bid cannot exceed the maximum budget of ₹${job.budget}.`
      );
      return false;
    }
    return true;
  };

  const handlePlaceBid = async (amount) => {
    if (!validateBid(amount)) return;
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("You must be logged in to bid.");
      const { error } = await supabase.from("bids").insert({
        job_id: jobId,
        worker_id: user.id,
        worker_name: user.user_metadata?.full_name || "Anonymous Worker",
        bid_amount: parseInt(amount, 10),
      });
      if (error) throw error;
      await fetchBids();
      Alert.alert("Success!", "Your bid has been placed.");
    } catch (error) {
      Alert.alert("Error", "There was an issue placing your bid.");
    }
  };

  const handleUpdateBid = async (amount) => {
    if (!validateBid(amount)) return;
    try {
      const { error } = await supabase
        .from("bids")
        .update({ bid_amount: parseInt(amount, 10) })
        .eq("id", currentUserBid.id);
      if (error) throw error;
      await fetchBids();
      Alert.alert("Success!", "Your bid has been updated.");
    } catch (error) {
      Alert.alert("Error", "There was an issue updating your bid.");
    }
  };

  const BidsListView = () => (
    <Card containerStyle={styles.card}>
      <Card.Title>Bids Received ({bids.length})</Card.Title>
      <Card.Divider />
      {job.status === "in_progress" && (
        <View style={styles.hiredBanner}>
          <Text style={styles.hiredBannerText}>
            A worker has been hired for this job.
          </Text>
        </View>
      )}
      {bids.length > 0 ? (
        bids.map((bid) => (
          <View key={bid.id} style={styles.bidItem}>
            <Avatar
              rounded
              title={bid.worker_name?.charAt(0)}
              containerStyle={{ backgroundColor: "gray" }}
            />
            <View style={styles.bidInfo}>
              <Text style={styles.bidderName}>{bid.worker_name}</Text>
              <Text style={styles.bidAmount}>₹{bid.bid_amount}</Text>
            </View>
            {job.status === "open" && (
              <Button title="Accept" onPress={() => handleAcceptBid(bid)} />
            )}
          </View>
        ))
      ) : (
        <Text style={styles.noBidsText}>No bids have been placed yet.</Text>
      )}
    </Card>
  );

  const WorkerActionsView = () => (
    <>
      {job.status === "open" ? (
        <BidFormComponent
          job={job}
          currentUserBid={currentUserBid}
          onPlaceBid={handlePlaceBid}
          onUpdateBid={handleUpdateBid}
        />
      ) : (
        <View style={styles.hiredBanner}>
          <Text style={styles.hiredBannerText}>
            This job is no longer accepting bids.
          </Text>
        </View>
      )}
      {currentUserBid && (
        <Button
          title={`Chat with Client (${job.client_name})`}
          icon={<Icon name="chat" color="white" />}
          onPress={() =>
            navigation.navigate("Messages", {
              screen: "Chat",
              params: {
                jobId: job.id,
                receiverId: job.client_id,
                receiverName: job.client_name,
              },
            })
          }
          containerStyle={{ paddingHorizontal: 25, paddingBottom: 15 }}
        />
      )}
    </>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }
  if (!job) {
    return (
      <View style={styles.centered}>
        <Text>Job not found.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <Card containerStyle={styles.card}>
        <Card.Title h4 h4Style={styles.jobTitle}>
          {job.title}
        </Card.Title>
        <Card.Divider />
        <Text style={styles.detailLabel}>Client:</Text>
        <Text style={styles.detailText}>{job.client_name}</Text>
        <Text style={styles.detailLabel}>Budget:</Text>
        <Text style={styles.detailText}>Up to ₹{job.budget}</Text>
        <Text style={styles.detailLabel}>Deadline:</Text>
        <Text style={styles.detailText}>
          {job.deadline
            ? new Date(job.deadline).toLocaleDateString()
            : "Not specified"}
        </Text>
        <Text style={styles.detailLabel}>Description:</Text>
        <Text style={styles.description}>{job.description}</Text>
      </Card>

      {isClient ? <BidsListView /> : <WorkerActionsView />}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F5F5" },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  card: { borderRadius: 10, marginHorizontal: 15, marginBottom: 15 },
  jobTitle: { textAlign: "left", marginBottom: 10 },
  detailLabel: { fontSize: 14, color: "gray", marginTop: 10 },
  detailText: { fontSize: 16, fontWeight: "500", marginBottom: 5 },
  description: { fontSize: 16, lineHeight: 22 },
  bidItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  bidInfo: {
    flex: 1,
    marginLeft: 10,
  },
  bidderName: {
    fontSize: 16,
    fontWeight: "bold",
  },
  bidAmount: {
    fontSize: 15,
    color: "#28A745",
  },
  noBidsText: { textAlign: "center", color: "gray", paddingVertical: 10 },
  hiredBanner: {
    backgroundColor: "#e9f5ff",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 10,
  },
  hiredBannerText: {
    color: "#007bff",
    fontWeight: "bold",
  },
});
