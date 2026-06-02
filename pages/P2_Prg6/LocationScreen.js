import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import MapView, { Marker } from "react-native-maps";
import * as Location from "expo-location";
import { MaterialIcons } from "@expo/vector-icons";

export default function LocationScreen() {
  const BASE_URL = "http://10.1.13.68:8080/api/presensi";

  const [location, setLocation] = useState(null);
  const [marker, setMarker] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [statusLokasi, setStatusLokasi] = useState("Belum divalidasi");

  useEffect(() => {
    getCurrentLocation();
  }, []);

  const getCurrentLocation = async () => {
    try {
      setIsLoading(true);

      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") {
        Alert.alert(
          "Izin Lokasi Ditolak",
          "Aplikasi membutuhkan izin lokasi untuk validasi presensi."
        );
        setIsLoading(false);
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({});

      const coordinate = {
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
      };

      setLocation(coordinate);
      setMarker(coordinate);
    } catch (error) {
      console.error("Location error:", error);
      Alert.alert("Error", "Gagal mengambil lokasi pengguna.");
    } finally {
      setIsLoading(false);
    }
  };

  const validateLocation = async () => {
    if (!marker) {
      Alert.alert("Peringatan", "Lokasi belum tersedia.");
      return;
    }

    try {
      setStatusLokasi("Memvalidasi...");

      const response = await fetch(`${BASE_URL}/locate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          lat: marker.latitude,
          lng: marker.longitude,
        }),
      });

      const result = await response.text();

      if (result === "IN AREA") {
        setStatusLokasi("IN AREA");
        Alert.alert("Berhasil", "Lokasi kamu berada di area presensi.");
      } else {
        setStatusLokasi("OUT AREA");
        Alert.alert("Di Luar Area", "Lokasi kamu berada di luar area presensi.");
      }
    } catch (error) {
      console.error("Validate location error:", error);
      setStatusLokasi("Error");
      Alert.alert(
        "Error Jaringan",
        "Gagal menghubungi API. Pastikan backend Spring Boot berjalan."
      );
    }
  };

  const handleMapPress = (event) => {
    setMarker(event.nativeEvent.coordinate);
    setStatusLokasi("Belum divalidasi");
  };

  if (isLoading || !location) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1565C0" />
        <Text style={styles.loadingText}>Mengambil lokasi...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Location Check</Text>
        <Text style={styles.headerSub}>Validasi lokasi presensi mahasiswa</Text>
      </View>

      <View style={styles.content}>
        <MapView
          style={styles.map}
          initialRegion={{
            latitude: location.latitude,
            longitude: location.longitude,
            latitudeDelta: 0.005,
            longitudeDelta: 0.005,
          }}
          onPress={handleMapPress}
        >
          {marker && (
            <Marker
              coordinate={marker}
              title="Lokasi Dipilih"
              description="Titik yang akan divalidasi"
            />
          )}
        </MapView>

        <View style={styles.infoCard}>
          <View style={styles.statusRow}>
            <MaterialIcons name="location-on" size={24} color="#1565C0" />
            <View>
              <Text style={styles.statusLabel}>Status Lokasi</Text>
              <Text
                style={[
                  styles.statusText,
                  statusLokasi === "IN AREA" && styles.statusIn,
                  statusLokasi === "OUT AREA" && styles.statusOut,
                ]}
              >
                {statusLokasi}
              </Text>
            </View>
          </View>

          <View style={styles.coordinateBox}>
            <Text style={styles.coordLabel}>Latitude</Text>
            <Text style={styles.coordText}>{marker?.latitude}</Text>

            <Text style={styles.coordLabel}>Longitude</Text>
            <Text style={styles.coordText}>{marker?.longitude}</Text>
          </View>

          <TouchableOpacity style={styles.button} onPress={validateLocation}>
            <MaterialIcons name="my-location" size={20} color="#FFFFFF" />
            <Text style={styles.buttonText}>VALIDASI LOKASI</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryButton} onPress={getCurrentLocation}>
            <MaterialIcons name="gps-fixed" size={20} color="#1565C0" />
            <Text style={styles.secondaryButtonText}>Gunakan Lokasi Saya</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1565C0",
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: "#F0F4FF",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    color: "#1565C0",
    fontWeight: "bold",
  },
  header: {
    backgroundColor: "#1565C0",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  headerSub: {
    fontSize: 13,
    color: "rgba(255,255,255,0.75)",
    marginTop: 4,
  },
  content: {
    flex: 1,
    backgroundColor: "#F0F4FF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -20,
    padding: 16,
  },
  map: {
    height: 330,
    borderRadius: 18,
    marginBottom: 16,
  },
  infoCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 16,
    borderWidth: 0.5,
    borderColor: "#E3F2FD",
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 14,
  },
  statusLabel: {
    fontSize: 12,
    color: "#90CAF9",
  },
  statusText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1A1A1A",
  },
  statusIn: {
    color: "#2E7D32",
  },
  statusOut: {
    color: "#C62828",
  },
  coordinateBox: {
    backgroundColor: "#F8FBFF",
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
  },
  coordLabel: {
    fontSize: 11,
    color: "#90CAF9",
    fontWeight: "bold",
    marginTop: 6,
  },
  coordText: {
    fontSize: 13,
    color: "#1A1A1A",
  },
  button: {
    backgroundColor: "#1565C0",
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  buttonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },
  secondaryButton: {
    borderWidth: 1.5,
    borderColor: "#BBDEFB",
    borderRadius: 12,
    padding: 13,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
    marginTop: 10,
  },
  secondaryButtonText: {
    color: "#1565C0",
    fontWeight: "bold",
  },
});