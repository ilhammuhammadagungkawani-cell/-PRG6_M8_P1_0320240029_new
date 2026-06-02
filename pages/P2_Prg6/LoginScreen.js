import React, { useState, useContext } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { AuthContext } from "./AuthContext";

export default function LoginScreen() {
  const [nim, setNim] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { login } = useContext(AuthContext);
  const BASE_URL = "http://10.1.13.68:8080/api/user";

  const handleLogin = async () => {
    if (nim.trim() === "" || password.trim() === "") {
      Alert.alert("Peringatan", "NIM dan Password harus diisi!");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${BASE_URL}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          authcode: "astratech@123",
        },
        body: JSON.stringify({ nim, password }),
      });

      const result = await response.json();

      if (result.code === 200 && result.data) {
        login(result.data);
        Alert.alert("Berhasil!", `Selamat datang, ${result.data.mhsName}!`);
      } else {
        Alert.alert("Login Gagal", result.message || "NIM atau Password salah!");
      }
    } catch (error) {
      Alert.alert(
        "Error Jaringan",
        "Tidak dapat terhubung ke server. Pastikan backend berjalan dan IP sudah benar.\n\nError: " +
          error.message
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.topBox}>
            <View style={styles.iconBox}>
              <MaterialIcons name="school" size={42} color="#1565C0" />
            </View>
<Text style={styles.appTitle}>Attendance App</Text>            <Text style={styles.appSubtitle}>
              Sistem presensi mahasiswa berbasis mobile
            </Text>
          </View>

          <View style={styles.loginCard}>
            <Text style={styles.welcomeText}>Masuk Akun</Text>
            <Text style={styles.descText}>
              Silakan gunakan NIM dan password kamu
            </Text>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Nomor Induk Mahasiswa</Text>
              <View style={styles.inputWrapper}>
                <MaterialIcons name="badge" size={22} color="#1565C0" />
                <TextInput
                  style={styles.input}
                  placeholder="0320240029"
                  placeholderTextColor="#90CAF9"
                  value={nim}
                  onChangeText={setNim}
                  keyboardType="numeric"
                  autoCapitalize="none"
                />
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.inputWrapper}>
                <MaterialIcons name="lock" size={22} color="#1565C0" />
                <TextInput
                  style={styles.input}
                  placeholder="Masukkan password"
                  placeholderTextColor="#90CAF9"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <MaterialIcons
                    name={showPassword ? "visibility" : "visibility-off"}
                    size={22}
                    color="#1565C0"
                  />
                </TouchableOpacity>
              </View>
            </View>

            {isLoading ? (
              <View style={styles.loadingBox}>
                <ActivityIndicator size="large" color="#1565C0" />
                <Text style={styles.loadingText}>Memproses login...</Text>
              </View>
            ) : (
              <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
                <Text style={styles.loginButtonText}>LOGIN SEKARANG</Text>
              </TouchableOpacity>
            )}

            <View style={styles.accountBox}>
              <MaterialIcons name="info-outline" size={20} color="#1565C0" />
              <View>
                <Text style={styles.accountTitle}>Data Login</Text>
                <Text style={styles.accountText}>NIM: 0320240029</Text>
                <Text style={styles.accountText}>Password: 123456</Text>
              </View>
            </View>
          </View>

          <Text style={styles.footerText}>Attendance Management App</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1565C0",
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 28,
  },
  topBox: {
    paddingTop: 40,
    paddingBottom: 30,
    alignItems: "flex-start",
  },
  iconBox: {
    width: 86,
    height: 86,
    borderRadius: 22,
    backgroundColor: "#E3F2FD",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },
  appTitle: {
    fontSize: 31,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 8,
  },
  appSubtitle: {
    fontSize: 15,
    color: "rgba(255,255,255,0.82)",
    lineHeight: 22,
  },
  loginCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 26,
    padding: 24,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1A1A1A",
  },
  descText: {
    fontSize: 13,
    color: "#666",
    marginTop: 5,
    marginBottom: 24,
  },
  formGroup: {
    marginBottom: 18,
  },
  label: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#1565C0",
    marginBottom: 8,
  },
  inputWrapper: {
    height: 56,
    borderRadius: 16,
    backgroundColor: "#F8FBFF",
    borderWidth: 1.5,
    borderColor: "#BBDEFB",
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: "#1A1A1A",
  },
  loginButton: {
    height: 56,
    borderRadius: 16,
    backgroundColor: "#1565C0",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 6,
  },
  loginButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "bold",
    letterSpacing: 0.8,
  },
  loadingBox: {
    alignItems: "center",
    marginVertical: 10,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 13,
    color: "#666",
  },
  accountBox: {
    flexDirection: "row",
    gap: 12,
    backgroundColor: "#E3F2FD",
    borderRadius: 16,
    padding: 14,
    marginTop: 22,
  },
  accountTitle: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#1565C0",
    marginBottom: 4,
  },
  accountText: {
    fontSize: 13,
    color: "#1976D2",
  },
  footerText: {
    textAlign: "center",
    color: "rgba(255,255,255,0.75)",
    fontSize: 12,
    marginTop: 22,
  },
});