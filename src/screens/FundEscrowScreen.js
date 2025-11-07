// src/screens/FundEscrowScreen.js
import React, { useState } from "react";
import { View, Text, StyleSheet, Alert, ActivityIndicator } from "react-native";
import { Button, Card, Icon } from "@rneui/themed";
import RazorpayCheckout from "react-native-razorpay";
import { supabase } from "../lib/supabase";

const FundEscrowScreen = ({ route, navigation }) => {
  const { contract } = route.params;
  const [loading, setLoading] = useState(false);

  const handlePayment = async () => {
    setLoading(true);
    try {
      // 1. Call our Supabase Edge Function to create a Razorpay Order
      const { data, error } = await supabase.functions.invoke(
        "create-razorpay-order",
        {
          body: { amount: contract.amount },
        }
      );
      if (error) throw error;

      const { orderId } = data;

      // 2. Get user details for pre-filling the payment form
      const {
        data: { user },
      } = await supabase.auth.getUser();

      // 3. Configure and open the Razorpay Checkout
      const options = {
        description: `Payment for Job #${contract.job_id}`,
        image: "https://i.imgur.com/3g7nmJC.png", // A generic logo
        currency: "INR",
        key: "rzp_test_vvcHOwN8bs9kAi", // <-- REPLACE WITH YOUR KEY ID
        amount: contract.amount * 100,
        order_id: orderId,
        prefill: {
          email: user.email,
          name: user.user_metadata?.full_name || "Anonymous",
        },
        theme: { color: "#007BFF" },
      };

      RazorpayCheckout.open(options)
        .then(async (data) => {
          // Handle success
          await supabase
            .from("contracts")
            .update({ status: "funded" })
            .eq("id", contract.id);

          Alert.alert(
            "Payment Successful!",
            `Payment ID: ${data.razorpay_payment_id}`
          );
          navigation.goBack();
        })
        .catch((error) => {
          // Handle failure
          setLoading(false);
          Alert.alert(
            "Payment Failed",
            `Error: ${error.code} - ${error.description}`
          );
        });
    } catch (error) {
      setLoading(false);
      Alert.alert("Error", "Could not initiate payment. Please try again.");
      console.error("Error creating Razorpay order:", error.message);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
        <Text style={{ marginTop: 10 }}>Initiating secure payment...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Card containerStyle={styles.card}>
        <Card.Title h4>Fund Escrow</Card.Title>
        <Card.Divider />
        <Text style={styles.text}>You are about to pay for the job:</Text>
        <Text style={styles.jobTitle}>{contract.job_id}</Text>
        <Text style={styles.amount}>₹{contract.amount}</Text>
        <Text style={styles.subtext}>
          This amount will be held securely in escrow and will only be released
          to the worker after you approve their submitted work.
        </Text>
        <Button
          title="Pay Now Securely"
          onPress={handlePayment}
          icon={
            <Icon
              name="lock"
              color="white"
              containerStyle={{ marginRight: 10 }}
            />
          }
        />
      </Card>
    </View>
  );
};

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  container: { flex: 1, paddingTop: 20, backgroundColor: "#f5f5f5" },
  card: { borderRadius: 10 },
  text: { fontSize: 16, textAlign: "center", color: "gray", marginBottom: 10 },
  jobTitle: {
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 10,
  },
  amount: {
    fontSize: 48,
    fontWeight: "bold",
    textAlign: "center",
    marginVertical: 20,
  },
  subtext: {
    fontSize: 12,
    textAlign: "center",
    color: "gray",
    marginBottom: 30,
  },
});

export default FundEscrowScreen;
