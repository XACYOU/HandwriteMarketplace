import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Card, Button, Input } from "@rneui/themed";

const BidFormComponent = ({ job, currentUserBid, onPlaceBid, onUpdateBid }) => {
  const [amount, setAmount] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // If the user has an existing bid, set the component state
    if (currentUserBid) {
      setIsEditing(false); // Default to view mode
      setAmount(currentUserBid.bid_amount.toString());
    }
  }, [currentUserBid]);

  const handleEditPress = () => {
    setIsEditing(true);
  };

  const handleCancelPress = () => {
    setIsEditing(false);
    // Reset amount to the original bid
    setAmount(currentUserBid.bid_amount.toString());
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    if (isEditing) {
      await onUpdateBid(amount);
      setIsEditing(false); 
    } else {
      await onPlaceBid(amount);
    }
    setIsSubmitting(false);
  };

  if (currentUserBid && !isEditing) {
    return (
      <Card containerStyle={styles.card}>
        <Card.Title>Your Bid</Card.Title>
        <Card.Divider />
        <View style={styles.bidDisplay}>
          <Text style={styles.currentBidText}>
            Your current bid is: ₹{currentUserBid.bid_amount}
          </Text>
          <Button title="Edit Bid" onPress={handleEditPress} type="outline" />
        </View>
      </Card>
    );
  }

  return (
    <Card containerStyle={styles.card}>
      <Card.Title>
        {isEditing ? "Update Your Bid" : "Place Your Bid"}
      </Card.Title>
      <Card.Divider />
      <Input
        placeholder={`Enter amount (e.g., ${job?.budget - 50})`}
        keyboardType="numeric"
        value={amount}
        onChangeText={setAmount}
        leftIcon={<Text style={{ fontSize: 16, color: "gray" }}>₹</Text>}
      />
      <Button
        title={
          isSubmitting
            ? "Submitting..."
            : isEditing
            ? "Update Bid"
            : "Submit Bid"
        }
        onPress={handleSubmit}
        disabled={isSubmitting}
      />
      {isEditing && (
        <Button title="Cancel" onPress={handleCancelPress} type="clear" />
      )}
    </Card>
  );
};

const styles = StyleSheet.create({
  card: { borderRadius: 10 },
  bidDisplay: { alignItems: "center", padding: 10 },
  currentBidText: { fontSize: 18, marginBottom: 15 },
});

export default React.memo(BidFormComponent);
