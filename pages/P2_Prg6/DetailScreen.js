import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import PropTypes from "prop-types";
import { useNavigation } from "@react-navigation/native";

export default function DetailScreen({ route }) {
  const { dataPresensi } = route.params;
  const isPresent = dataPresensi.status === "Present";
  const navigation = useNavigation();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backBtn}
          >
            <MaterialIcons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>

          <Text style={styles.headerCourse}>{dataPresensi.course}</Text>
          <Text style={styles.headerSub}>Detail kehadiran</Text>
        </View>

        <View style={styles.contentArea}>
          <View style={styles.detailCard}>
            <View
              style={[
                styles.statusBanner,
                isPresent
                  ? styles.statusBannerPresent
                  : styles.statusBannerAbsent,
              ]}
            >
              <View
                style={[
                  styles.statusIcon,
                  isPresent
                    ? styles.statusIconPresent
                    : styles.statusIconAbsent,
                ]}
              >
                <MaterialIcons
                  name={isPresent ? "check-circle" : "cancel"}
                  size={22}
                  color={isPresent ? "#2E7D32" : "#C62828"}
                />
              </View>
              <Text
                style={[
                  styles.statusLabel,
                  isPresent
                    ? styles.statusLabelPresent
                    : styles.statusLabelAbsent,
                ]}
              >
                {isPresent ? "Present — Hadir" : "Absent — Tidak Hadir"}
              </Text>
            </View>

            <View style={styles.rows}>
              <View style={styles.drow}>
                <View style={styles.drowIcon}>
                  <MaterialIcons name="event" size={18} color="#1565C0" />
                </View>
                <View>
                  <Text style={styles.drowLabel}>Tanggal</Text>
                  <Text style={styles.drowVal}>{dataPresensi.date}</Text>
                </View>
              </View>

              {dataPresensi.jamPresensi && (
                <View style={styles.drow}>
                  <View style={styles.drowIcon}>
                    <MaterialIcons
                      name="access-time"
                      size={18}
                      color="#1565C0"
                    />
                  </View>
                  <View>
                    <Text style={styles.drowLabel}>Jam Presensi</Text>
                    <Text style={styles.drowVal}>
                      {dataPresensi.jamPresensi}
                    </Text>
                  </View>
                </View>
              )}

              <View style={styles.drow}>
                <View style={styles.drowIcon}>
                  <MaterialIcons name="apartment" size={18} color="#1565C0" />
                </View>
                <View>
                  <Text style={styles.drowLabel}>Ruangan</Text>
                  <Text style={styles.drowVal}>
                    {dataPresensi.ruangan || dataPresensi.room || "-"}
                  </Text>
                </View>
              </View>

              <View style={[styles.drow, { borderBottomWidth: 0 }]}>
                <View style={styles.drowIcon}>
                  <MaterialIcons name="person-pin" size={18} color="#1565C0" />
                </View>
                <View>
                  <Text style={styles.drowLabel}>Dosen Pengampu</Text>
                  <Text style={styles.drowVal}>
                    {dataPresensi.dosenPengampu || dataPresensi.lecturer || "-"}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

DetailScreen.propTypes = {
  route: PropTypes.shape({
    params: PropTypes.shape({
      dataPresensi: PropTypes.shape({
        course: PropTypes.string.isRequired,
        date: PropTypes.string.isRequired,
        status: PropTypes.string.isRequired,
        jamPresensi: PropTypes.string,
        ruangan: PropTypes.string,
        room: PropTypes.string,
        dosenPengampu: PropTypes.string,
        lecturer: PropTypes.string,
      }).isRequired,
    }).isRequired,
  }).isRequired,
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1565C0",
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    backgroundColor: "#1565C0",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 44,
  },
  headerCourse: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  headerSub: {
    fontSize: 13,
    color: "rgba(255,255,255,0.7)",
  },
  contentArea: {
    backgroundColor: "#F0F4FF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -20,
    flex: 1,
    padding: 20,
    paddingTop: 24,
  },
  detailCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 0.5,
    borderColor: "#E3F2FD",
    overflow: "hidden",
  },
  statusBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    paddingHorizontal: 16,
  },
  statusBannerPresent: { backgroundColor: "#E8F5E9" },
  statusBannerAbsent: { backgroundColor: "#FFEBEE" },
  statusIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  statusIconPresent: { backgroundColor: "#C8E6C9" },
  statusIconAbsent: { backgroundColor: "#FFCDD2" },
  statusLabel: { fontSize: 14, fontWeight: "bold" },
  statusLabelPresent: { color: "#2E7D32" },
  statusLabelAbsent: { color: "#C62828" },

  rows: {
    paddingVertical: 4,
  },
  drow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: "#E3F2FD",
  },
  drowIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#E3F2FD",
    alignItems: "center",
    justifyContent: "center",
  },
  drowLabel: {
    fontSize: 11,
    color: "#90CAF9",
    marginBottom: 2,
  },
  drowVal: {
    fontSize: 14,
    fontWeight: "500",
    color: "#1A1A1A",
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
});
