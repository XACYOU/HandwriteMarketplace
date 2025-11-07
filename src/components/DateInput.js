// src/components/DateInput.js
import React, { useState } from "react";
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  Platform,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Icon } from "@rneui/themed";

export default function DateInput({ label, value, onChange }) {
  const [show, setShow] = useState(false);

  const onDateChange = (event, selectedDate) => {
    setShow(Platform.OS === "ios"); // On iOS, the picker is a modal
    if (selectedDate) {
      onChange(selectedDate);
    }
  };

  const showDatePicker = () => {
    setShow(true);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity onPress={showDatePicker} style={styles.inputBox}>
        <Text style={value ? styles.inputText : styles.placeholder}>
          {value ? value.toLocaleDateString() : "Select a date"}
        </Text>
        <Icon name="calendar" type="font-awesome" color="#555" />
      </TouchableOpacity>

      {show && (
        <DateTimePicker
          testID="dateTimePicker"
          value={value || new Date()} // Use selected date or today
          mode="date"
          display="default"
          onChange={onDateChange}
          minimumDate={new Date()} // Prevent selecting past dates
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  label: {
    fontWeight: "bold",
    fontSize: 16,
    color: "#86939e",
    marginBottom: 5,
  },
  inputBox: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
    paddingVertical: 12,
  },
  inputText: {
    fontSize: 18,
    color: "black",
  },
  placeholder: {
    fontSize: 18,
    color: "#aaa",
  },
});
