import React, { useState } from "react";
import { ScrollView, StyleSheet, Alert, View } from "react-native";
import { Input, Button, Text } from "@rneui/themed";
import { supabase } from "../lib/supabase";
import DateInput from "../components/DateInput";


export default function PostJobScreen({ navigation }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [budget, setBudget] = useState("");
  const [deadline, setDeadline] = useState(null);
  const [loading, setLoading] = useState(false);

  const handlePostJob = async () => {
    if (!title || !budget) {
      Alert.alert("Error", "Please fill in at least the title and budget.");
      return;
    }

    setLoading(true);
    try {
      // First, get the current user's full name from their profile data
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("User not found.");

      const clientName = user.user_metadata?.full_name || "Anonymous";

      // Now, insert the job with the user's name
      const { data, error } = await supabase
        .from("jobs")
        .insert({
          title: title,
          description: description,
          budget: parseInt(budget, 10), // Ensure budget is an integer
          deadline: deadline || null, // Allow empty deadline
          client_id: user.id,
          client_name: clientName,
        })
        .select();

      if (error) throw error;

      Alert.alert("Success", "Your job has been posted!");
      navigation.goBack(); // Go back to the marketplace screen
    } catch (error) {
      console.error("Error posting job:", error.message);
      Alert.alert("Error", "Failed to post job. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.header}>
        <Text h4 style={styles.headerText}>
          Post a New Job
        </Text>
        <Text style={styles.subHeaderText}>
          Fill in the details below to find a worker.
        </Text>
      </View>
      <Input
        label="Job Title"
        placeholder="e.g., Transcribe Physics Notes"
        value={title}
        onChangeText={setTitle}
        containerStyle={styles.inputContainer}
      />
      <Input
        label="Description"
        placeholder="Describe the task, number of pages, etc."
        value={description}
        onChangeText={setDescription}
        multiline
        numberOfLines={4}
        containerStyle={styles.inputContainer}
      />
      <Input
        label="Maximum Budget (₹)"
        placeholder="e.g., 500"
        value={budget}
        onChangeText={setBudget}
        keyboardType="numeric"
        containerStyle={styles.inputContainer}
      />
      <DateInput
        label="Submission Deadline (Optional)"
        value={deadline}
        onChange={setDeadline}
      />
      <Button
        title={loading ? "Posting..." : "Post Job"}
        onPress={handlePostJob}
        disabled={loading}
        buttonStyle={styles.postButton}
        titleStyle={styles.buttonTitle}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
    padding: 20,
  },
  header: {
    marginBottom: 20,
    alignItems: "center",
  },
  headerText: {
    fontWeight: "bold",
  },
  subHeaderText: {
    color: "gray",
    marginTop: 5,
  },
  inputContainer: {
    marginBottom: 15,
  },
  postButton: {
    backgroundColor: "#28A745", // A green color for success
    borderRadius: 8,
    paddingVertical: 12,
  },
  buttonTitle: {
    fontWeight: "bold",
  },
});
