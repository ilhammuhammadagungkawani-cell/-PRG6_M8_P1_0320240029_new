import { useState, useEffect, useMemo, useRef, useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  TextInput,
  ActivityIndicator,
  Platform,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import PropTypes from "prop-types";
import { AuthContext } from "./AuthContext";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as Location from "expo-location";

const HomeScreen = ({ navigation }) => {
  const { userData, logout } = useContext(AuthContext);
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [currentTime, setCurrentTime] = useState("Memuat jam...");
  const [note, setNote] = useState("");
  const [isPosting, setIsPosting] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [isScanning, setIsScanning] = useState(true);
  const [isAlertShowing, setIsAlertShowing] = useState(false);
  const noteInputRef = useRef(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [locationStatus, setLocationStatus] = useState("checking");
  const [distance, setDistance] = useState(0);

  const BASE_URL = "http://10.1.13.68:8080/api/presensi";
  const KAMPUS_LAT = -6.346000;
const KAMPUS_LON = 107.149000;

const MAKSIMAL_JARAK_METER = 50;
  const nimUser = userData?.nim_mhs || userData?.mhsNim || "0320240029";
  const namaUser =
    userData?.nama ||
    userData?.mhsName ||
    "Ilham Muhammad Agung Kawani";

  const attendanceStats = useMemo(() => {
    return { totalPresent: 12, totalAbsent: 2 };
  }, []);

  useEffect(() => {
  const timer = setInterval(() => {
    setCurrentTime(new Date().toLocaleTimeString("id-ID"));
  }, 1000);

  verifyLocation();

  return () => clearInterval(timer);
}, []);
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3;

  const p1 = (lat1 * Math.PI) / 180;
  const p2 = (lat2 * Math.PI) / 180;

  const deltaP = ((lat2 - lat1) * Math.PI) / 180;
  const deltaL = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaP / 2) * Math.sin(deltaP / 2) +
    Math.cos(p1) *
      Math.cos(p2) *
      Math.sin(deltaL / 2) *
      Math.sin(deltaL / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};

const verifyLocation = async () => {
  try {
    const { status } =
      await Location.requestForegroundPermissionsAsync();

    if (status !== "granted") {
      setLocationStatus("error");
      return;
    }

    const currentLocation =
      await Location.getCurrentPositionAsync({});

    const jarak = calculateDistance(
      currentLocation.coords.latitude,
      currentLocation.coords.longitude,
      KAMPUS_LAT,
      KAMPUS_LON
    );

    setDistance(Math.round(jarak));

    if (jarak <= MAKSIMAL_JARAK_METER) {
      setLocationStatus("valid");
    } else {
      setLocationStatus("invalid");
    }
  } catch (error) {
    console.error(error);
    setLocationStatus("error");
  }
};
  const handleCheckIn = async () => {
    if (isCheckedIn) return Alert.alert("Perhatian", "Anda sudah Check In.");

    if (note.trim() === "") {
      Alert.alert("Peringatan", "Catatan kehadiran wajib diisi!");
      noteInputRef.current.focus();
      return;
    }

    setIsPosting(true);
    const now = new Date();

    const payload = {
      kodeMk: "TRPL205",
      course: "Mobile Programming",
      status: "Present",
      nimMhs: nimUser,
      pertemuanKe: 5,
      date: now.toISOString().split("T")[0],
      jamPresensi: now.toLocaleTimeString("id-ID", { hour12: false }),
      kode_qr: "AUTH-TRPL205-W5-XYZ987",
      ruangan: "Lab Komputer 3",
      dosenPengampu: "Tim Dosen TRPL",
    };

    try {
      const response = await fetch(BASE_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (response.ok) {
        setIsCheckedIn(true);
        Alert.alert("Berhasil!", "Presensi masuk ke Database.", [
          {
            text: "Lihat Riwayat",
            onPress: () => navigation.navigate("HistoryTab"),
          },
        ]);
      } else {
        Alert.alert("Gagal", result.message || "Terjadi kesalahan di server.");
      }
    } catch (error) {
      console.error("handleCheckIn error:", error);
      Alert.alert(
        "Error Jaringan",
        "Pastikan IP Laptop benar dan Spring Boot berjalan."
      );
    } finally {
      setIsPosting(false);
    }
  };

 const handleOpenScanner = async () => {
  if (locationStatus !== "valid") {
    Alert.alert(
      "Akses Ditolak",
      `Anda berada ${distance} meter dari area kampus`
    );
    return;
  }

  if (!permission?.granted) {
    const result = await requestPermission();
    if (!result.granted) {
      Alert.alert(
        "Izin Ditolak",
        "Aplikasi butuh akses kamera untuk memindai QR Code."
      );
      return;
    }
  }

  setIsScanning(true);
  setShowScanner(true);
};

  const handleBarCodeScanned = ({ data }) => {
    if (!isScanning) return;
    setIsScanning(false);

    try {
      const qrData = JSON.parse(data);

      setIsAlertShowing(true);
      Alert.alert(
        "QR Code Terdeteksi",
        `Mata Kuliah: ${qrData.kodeMk}\nPertemuan: ${qrData.pertemuanKe}\nRuangan: ${qrData.ruangan}\n\nLanjutkan Presensi (Check-In)?`,
        [
          {
            text: "Batal",
            onPress: () => {
              setIsAlertShowing(false);
              setIsScanning(true);
            },
            style: "cancel",
          },
          {
            text: "Ya, Check In",
            onPress: () => {
              setIsAlertShowing(false);
              setShowScanner(false);
              handleSubmitPresensi(qrData);
            },
          },
        ]
      );
    } catch (e) {
      console.error("QR parse error:", e);
      Alert.alert(
        "QR Tidak Valid",
        "Pastikan Anda memindai QR Code Presensi Dosen."
      );
      setIsScanning(true);
    }
  };

  const handleSubmitPresensi = async (qrData) => {
    setIsPosting(true);
    const now = new Date();

    const payload = {
      kodeMk: qrData.kodeMk,
      course: qrData.course || qrData.namaMk || "Mobile Programming",
      nimMhs: nimUser,
      pertemuanKe: qrData.pertemuanKe,
      date: now.toISOString().split("T")[0],
      jamPresensi: now.toLocaleTimeString("en-GB"),
      status: "Present",
      ruangan: qrData.ruangan,
      kode_qr: qrData.kode_qr || "",
      dosenPengampu: qrData.dosenPengampu || "",
    };

    try {
      const response = await fetch(BASE_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (response.ok) {
        setIsCheckedIn(true);
        Alert.alert("Berhasil!", "Presensi sukses dicatat ke Database.", [
          {
            text: "Lihat Riwayat",
            onPress: () => navigation.navigate("HistoryTab"),
          },
        ]);
      } else {
        Alert.alert("Gagal", result.message || "Terjadi kesalahan di server.");
      }
    } catch (error) {
      console.error("handleSubmitPresensi error:", error);
      Alert.alert(
        "Error Jaringan",
        "Pastikan IP Laptop benar dan API berjalan."
      );
    } finally {
      setIsPosting(false);
    }
  };

  const handleLogout = () => {
    if (Platform.OS === "web" && globalThis.window?.confirm) {
      if (globalThis.window.confirm("Apakah Anda yakin ingin keluar?")) logout();
    } else {
      Alert.alert("Konfirmasi Logout", "Apakah Anda yakin ingin keluar?", [
        { text: "Batal", style: "cancel" },
        { text: "Logout", style: "destructive", onPress: () => logout() },
      ]);
    }
  };
  if (locationStatus === "checking") {
  return (
    <SafeAreaView style={styles.centerContainer}>
      <ActivityIndicator size="large" color="#1565C0" />
      <Text style={styles.loadingText}>Memverifikasi Lokasi Anda...</Text>
    </SafeAreaView>
  );
}

if (locationStatus === "invalid") {
  return (
    <SafeAreaView style={styles.centerContainer}>
      <MaterialIcons name="block" size={72} color="#D32F2F" />
      <Text style={styles.errorTitle}>Akses Ditolak</Text>
      <Text style={styles.errorSubtitle}>
        Anda berada {distance} meter dari area kampus.
      </Text>
      <TouchableOpacity style={styles.retryButton} onPress={verifyLocation}>
        <Text style={styles.retryButtonText}>Cek Ulang Lokasi</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <Text style={styles.headerTitle}>Attendance App</Text>
            <View style={styles.headerRight}>
              <Text style={styles.clockText}>{currentTime}</Text>
              <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
                <MaterialIcons name="logout" size={18} color="#FF6B6B" />
              </TouchableOpacity>
            </View>
          </View>
          <Text style={styles.headerGreeting}>Selamat datang kembali 👋</Text>
        </View>

        <View style={styles.contentArea}>
          <Text style={styles.sectionLabel}>Profil Mahasiswa</Text>
          <View style={styles.profileCard}>
            <View style={styles.avatar}>
              <MaterialIcons name="person" size={28} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.profileName}>{namaUser}</Text>
              <Text style={styles.profileSub}>NIM : {nimUser}</Text>
              <Text style={styles.profileSub}>Kelas : Informatika-2A</Text>
            </View>
          </View>

          <Text style={styles.sectionLabel}>Kelas Hari Ini</Text>
          <View style={styles.classCard}>
            <View style={styles.classCardHeader}>
              <Text style={styles.classCardTitle}>Today's Class</Text>
              <TouchableOpacity
                onPress={handleOpenScanner}
                style={styles.qrBtn}
              >
                <MaterialIcons
                  name="qr-code-scanner"
                  size={22}
                  color="#1565C0"
                />
              </TouchableOpacity>
            </View>

            <View style={styles.badgeRow}>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>TRPL205</Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <MaterialIcons name="menu-book" size={16} color="#90CAF9" />
              <Text style={styles.infoText}>Mobile Programming</Text>
            </View>
            <View style={styles.infoRow}>
              <MaterialIcons name="access-time" size={16} color="#90CAF9" />
              <Text style={styles.infoText}>08:00 – 10:00</Text>
            </View>
            <View style={styles.infoRow}>
              <MaterialIcons name="location-on" size={16} color="#90CAF9" />
              <Text style={styles.infoText}>Lab Komputer 3</Text>
            </View>

            {!isCheckedIn && (
              <TextInput
                ref={noteInputRef}
                style={styles.noteInput}
                placeholder="Tulis catatan (cth: Hadir lab)"
                placeholderTextColor="#BDBDBD"
                value={note}
                onChangeText={setNote}
              />
            )}

            {isPosting ? (
              <ActivityIndicator
                size="large"
                color="#1565C0"
                style={{ marginTop: 16 }}
              />
            ) : (
              <TouchableOpacity
                style={[
                  styles.checkInBtn,
                  isCheckedIn && styles.checkInBtnDone,
                ]}
                onPress={handleCheckIn}
                disabled={isCheckedIn}
                activeOpacity={0.85}
              >
                <MaterialIcons
                  name={isCheckedIn ? "check-circle" : "login"}
                  size={20}
                  color="white"
                />
                <Text style={styles.checkInBtnText}>
                  {isCheckedIn ? "CHECKED IN" : "CHECK IN SEKARANG"}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          <Text style={styles.sectionLabel}>Statistik Kehadiran</Text>
          <View style={styles.statsCard}>
            <View style={styles.statBox}>
              <Text style={styles.statNum}>{attendanceStats.totalPresent}</Text>
              <Text style={styles.statLabel}>Total Present</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={[styles.statNum, { color: "#E53935" }]}>
                {attendanceStats.totalAbsent}
              </Text>
              <Text style={styles.statLabel}>Total Absent</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <Modal
        visible={showScanner}
        animationType="slide"
        onRequestClose={() => setShowScanner(false)}
      >
        <View style={styles.scannerContainer}>
          <CameraView
            style={StyleSheet.absoluteFillObject}
            facing="back"
            onBarcodeScanned={isScanning ? handleBarCodeScanned : undefined}
            barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
          />
          <View style={styles.scannerOverlay}>
            <View style={styles.scannerUnfocused} />
            <View style={styles.scannerFocused}>
              <View style={styles.borderCornerTopLeft} />
              <View style={styles.borderCornerTopRight} />
              <View style={styles.borderCornerBottomLeft} />
              <View style={styles.borderCornerBottomRight} />
            </View>
            <View style={styles.scannerUnfocused}>
              <Text style={styles.scanText}>
                Arahkan Kamera ke QR Code Dosen
              </Text>

              {!isScanning && !isAlertShowing && (
                <TouchableOpacity
                  onPress={() => setIsScanning(true)}
                  style={styles.scanAgainButton}
                >
                  <Text style={styles.scanAgainText}>Scan Lagi</Text>
                </TouchableOpacity>
              )}

              {!isAlertShowing && (
                <TouchableOpacity
                  onPress={() => setShowScanner(false)}
                  style={styles.closeButton}
                >
                  <Text style={styles.closeButtonText}>Tutup</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

HomeScreen.propTypes = {
  navigation: PropTypes.shape({
    navigate: PropTypes.func.isRequired,
  }).isRequired,
};

export default HomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1565C0",
  },
  centerContainer: {
  flex: 1,
  backgroundColor: "#F0F4FF",
  justifyContent: "center",
  alignItems: "center",
  padding: 24,
},

loadingText: {
  marginTop: 16,
  fontSize: 16,
  fontWeight: "bold",
  color: "#1565C0",
},

errorTitle: {
  fontSize: 24,
  fontWeight: "bold",
  color: "#D32F2F",
  marginTop: 16,
},

errorSubtitle: {
  fontSize: 15,
  color: "#444",
  textAlign: "center",
  marginTop: 10,
  marginBottom: 20,
},

retryButton: {
  backgroundColor: "#1565C0",
  paddingVertical: 12,
  paddingHorizontal: 22,
  borderRadius: 12,
},

retryButtonText: {
  color: "#FFFFFF",
  fontWeight: "bold",
},
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    backgroundColor: "#1565C0",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  clockText: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#90CAF9",
    fontVariant: ["tabular-nums"],
  },
  logoutBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerGreeting: {
    fontSize: 13,
    color: "rgba(255,255,255,0.7)",
    marginTop: 2,
  },
  contentArea: {
    backgroundColor: "#F0F4FF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -20,
    flex: 1,
    padding: 20,
    paddingTop: 22,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#90CAF9",
    letterSpacing: 0.6,
    marginBottom: 10,
    textTransform: "uppercase",
  },
  profileCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginBottom: 20,
    borderWidth: 0.5,
    borderColor: "#E3F2FD",
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#1565C0",
    alignItems: "center",
    justifyContent: "center",
  },
  profileName: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#1A1A1A",
    marginBottom: 3,
  },
  profileSub: {
    fontSize: 12,
    color: "#666",
    lineHeight: 18,
  },
  classCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 0.5,
    borderColor: "#E3F2FD",
  },
  classCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  classCardTitle: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#1A1A1A",
  },
  qrBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: "#E3F2FD",
    alignItems: "center",
    justifyContent: "center",
  },
  badgeRow: {
    flexDirection: "row",
    marginBottom: 12,
  },
  badge: {
    backgroundColor: "#E3F2FD",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#1565C0",
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  infoText: {
    fontSize: 13,
    color: "#444",
  },
  noteInput: {
    borderWidth: 1.5,
    borderColor: "#BBDEFB",
    borderRadius: 10,
    padding: 10,
    marginTop: 14,
    fontSize: 13,
    color: "#1A1A1A",
    backgroundColor: "#F8FBFF",
  },
  checkInBtn: {
    backgroundColor: "#1565C0",
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 14,
    flexDirection: "row",
    gap: 8,
    shadowColor: "#1565C0",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  checkInBtnDone: {
    backgroundColor: "#90CAF9",
  },
  checkInBtnText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
    letterSpacing: 0.8,
  },
  statsCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    marginBottom: 20,
    borderWidth: 0.5,
    borderColor: "#E3F2FD",
  },
  statBox: {
    alignItems: "center",
  },
  statNum: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#1565C0",
  },
  statLabel: {
    fontSize: 12,
    color: "#90CAF9",
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 50,
    backgroundColor: "#E3F2FD",
  },
  scannerContainer: {
    flex: 1,
    backgroundColor: "black",
  },
  scannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  scannerUnfocused: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  scannerFocused: {
    width: 250,
    height: 250,
    alignSelf: "center",
    backgroundColor: "transparent",
    position: "relative",
  },
  scanText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
    backgroundColor: "rgba(0,0,0,0.7)",
    padding: 10,
    borderRadius: 5,
    marginBottom: 15,
  },
  scanAgainButton: {
    backgroundColor: "#ffc107",
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
  },
  scanAgainText: {
    color: "#000",
    fontWeight: "bold",
  },
  closeButton: {
    backgroundColor: "#FF3B30",
    padding: 12,
    borderRadius: 8,
    paddingHorizontal: 30,
  },
  closeButtonText: {
    color: "white",
    fontWeight: "bold",
  },
  borderCornerTopLeft: {
    position: "absolute",
    top: 0,
    left: 0,
    width: 40,
    height: 40,
    borderTopWidth: 5,
    borderLeftWidth: 5,
    borderColor: "#007bff",
  },
  borderCornerTopRight: {
    position: "absolute",
    top: 0,
    right: 0,
    width: 40,
    height: 40,
    borderTopWidth: 5,
    borderRightWidth: 5,
    borderColor: "#007bff",
  },
  borderCornerBottomLeft: {
    position: "absolute",
    bottom: 0,
    left: 0,
    width: 40,
    height: 40,
    borderBottomWidth: 5,
    borderLeftWidth: 5,
    borderColor: "#007bff",
  },
  borderCornerBottomRight: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 40,
    height: 40,
    borderBottomWidth: 5,
    borderRightWidth: 5,
    borderColor: "#007bff",
  },
});