import React, { useState, useEffect, useRef, useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Alert,
  Modal,
  TouchableWithoutFeedback,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CameraView, useCameraPermissions } from "expo-camera";
import { MaterialIcons } from "@expo/vector-icons";
import { AuthContext } from "./AuthContext";

export default function AboutScreen() {
  const { userData } = useContext(AuthContext);

  const [permission, requestPermission] = useCameraPermissions();
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [isViewingPhoto, setIsViewingPhoto] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const cameraRef = useRef(null);

  const BASE_URL = "http://10.1.13.68:8080/api/mahasiswa";

  const nimUser = userData?.nim_mhs || "0320240029";
  const namaUser = userData?.nama || "Ilham Muhammad Agung Kawani";
  const prodiUser = userData?.prodi || "Manajemen Informatika";

  useEffect(() => {
    loadProfilePhotoFromServer();
  }, []);

  const loadProfilePhotoFromServer = async () => {
    try {
      const response = await fetch(`${BASE_URL}/${nimUser}`);

      if (!response.ok) {
        console.log("Foto profil belum ada di server.");
        return;
      }

      const result = await response.json();

      if (result.fotoMhs) {
        setProfilePhoto(`data:image/jpeg;base64,${result.fotoMhs}`);
      }
    } catch (error) {
      console.error("Gagal mengambil foto dari server:", error);
    }
  };

  const takePicture = async () => {
    if (!cameraRef.current) return;

    try {
      setIsUploading(true);

      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.3,
      });

      const formData = new FormData();

      formData.append("nim", nimUser);
      formData.append("nama", namaUser);
      formData.append("foto", {
        uri: photo.uri,
        name: `${nimUser}_profile.jpg`,
        type: "image/jpeg",
      });

      const response = await fetch(`${BASE_URL}/upload`, {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        setProfilePhoto(photo.uri);
        setIsCameraOpen(false);
        Alert.alert("Berhasil", "Foto profil berhasil diupload ke server!");
      } else {
        Alert.alert(
          "Gagal Upload",
          "Foto gagal diupload. Pastikan NIM sudah ada dan backend berjalan."
        );
      }
    } catch (error) {
      console.error("Upload foto error:", error);
      Alert.alert(
        "Error",
        "Gagal upload foto. Pastikan IP backend benar dan Spring Boot aktif."
      );
    } finally {
      setIsUploading(false);
    }
  };

  if (isCameraOpen) {
    if (!permission) {
      return (
        <View style={styles.centerContainer}>
          <Text style={styles.infoText}>Memuat perizinan...</Text>
        </View>
      );
    }

    if (!permission.granted) {
      return (
        <SafeAreaView style={styles.centerContainer}>
          <MaterialIcons
            name="camera-alt"
            size={48}
            color="#90CAF9"
            style={{ marginBottom: 16 }}
          />
          <Text style={styles.infoText}>
            Kami butuh akses kamera untuk Selfie Profil.
          </Text>

          <TouchableOpacity style={styles.photoBtn} onPress={requestPermission}>
            <MaterialIcons name="camera-alt" size={20} color="white" />
            <Text style={styles.photoBtnText}>Beri Izin Kamera</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={() => setIsCameraOpen(false)}
          >
            <Text style={styles.cancelBtnText}>Batal</Text>
          </TouchableOpacity>
        </SafeAreaView>
      );
    }

    return (
      <View style={styles.cameraContainer}>
        <CameraView
          style={StyleSheet.absoluteFillObject}
          facing="front"
          mirror={false}
          ref={cameraRef}
        />

        <View style={styles.cameraOverlay}>
          <View style={styles.captureContainer}>
            {isUploading ? (
              <ActivityIndicator size="large" color="#FFFFFF" />
            ) : (
              <>
                <TouchableOpacity
                  style={styles.captureButton}
                  onPress={takePicture}
                >
                  <Text style={styles.captureButtonText}>Jepret</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.cameraCancelButton}
                  onPress={() => setIsCameraOpen(false)}
                >
                  <Text style={styles.photoBtnText}>Batal</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Tentang Saya</Text>
          <Text style={styles.headerSub}>Profil & informasi akun</Text>
        </View>

        <View style={styles.contentArea}>
          <View style={styles.profileCard}>
            <TouchableOpacity
              style={styles.avatarWrap}
              onPress={
                profilePhoto
                  ? () => setIsViewingPhoto(true)
                  : () => setIsCameraOpen(true)
              }
              activeOpacity={0.85}
            >
              {profilePhoto ? (
                <Image
                  source={{ uri: profilePhoto }}
                  style={styles.profileImage}
                />
              ) : (
                <MaterialIcons name="person" size={52} color="#1565C0" />
              )}

              <View style={styles.avatarCam}>
                <MaterialIcons name="camera-alt" size={14} color="white" />
              </View>
            </TouchableOpacity>

            <Text style={styles.profileName}>{namaUser}</Text>
            <Text style={styles.profileNim}>No. Induk: {nimUser}</Text>
            <Text style={styles.profileProdi}>{prodiUser}</Text>

            <View style={styles.infoSection}>
              <View style={styles.infoRow}>
                <View style={styles.infoIcon}>
                  <MaterialIcons name="badge" size={18} color="#1565C0" />
                </View>
                <View>
                  <Text style={styles.infoLabel}>NIM</Text>
                  <Text style={styles.infoVal}>{nimUser}</Text>
                </View>
              </View>

              <View style={styles.infoRow}>
                <View style={styles.infoIcon}>
                  <MaterialIcons name="menu-book" size={18} color="#1565C0" />
                </View>
                <View>
                  <Text style={styles.infoLabel}>Program Studi</Text>
                  <Text style={styles.infoVal}>{prodiUser}</Text>
                </View>
              </View>

              <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
                <View style={styles.infoIcon}>
                  <MaterialIcons name="apartment" size={18} color="#1565C0" />
                </View>
                <View>
                  <Text style={styles.infoLabel}>Kelas</Text>
                  <Text style={styles.infoVal}>Informatika-2A</Text>
                </View>
              </View>
            </View>

            <TouchableOpacity
              style={styles.photoBtn}
              onPress={() => setIsCameraOpen(true)}
              activeOpacity={0.85}
            >
              <MaterialIcons name="camera-alt" size={20} color="white" />
              <Text style={styles.photoBtnText}>
                {profilePhoto ? "Ganti Foto Selfie" : "Ambil Foto Selfie"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <Modal
        visible={isViewingPhoto}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsViewingPhoto(false)}
      >
        <TouchableWithoutFeedback onPress={() => setIsViewingPhoto(false)}>
          <View style={styles.modalBackground}>
            <TouchableWithoutFeedback onPress={() => {}}>
              <Image
                source={{ uri: profilePhoto }}
                style={styles.fullScreenImage}
              />
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#1565C0" },
  scrollContent: { flexGrow: 1 },
  centerContainer: {
    flex: 1,
    backgroundColor: "#F0F4FF",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    gap: 12,
  },
  header: {
    backgroundColor: "#1565C0",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 44,
  },
  headerTitle: {
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
    alignItems: "center",
  },
  profileCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    borderWidth: 0.5,
    borderColor: "#E3F2FD",
    padding: 28,
    width: "100%",
    alignItems: "center",
  },
  avatarWrap: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: "#E3F2FD",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    borderWidth: 3,
    borderColor: "#1565C0",
    position: "relative",
    overflow: "visible",
  },
  profileImage: {
    width: 110,
    height: 110,
    borderRadius: 55,
    transform: [{ scaleX: -1 }],
  },
  avatarCam: {
    position: "absolute",
    bottom: 4,
    right: 0,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#1565C0",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  profileName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1A1A1A",
    marginBottom: 4,
    textAlign: "center",
  },
  profileNim: {
    fontSize: 13,
    color: "#666",
    marginBottom: 4,
  },
  profileProdi: {
    fontSize: 13,
    color: "#1565C0",
    fontWeight: "bold",
    marginBottom: 24,
    textAlign: "center",
  },
  infoSection: {
    width: "100%",
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: "#E3F2FD",
  },
  infoIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#E3F2FD",
    alignItems: "center",
    justifyContent: "center",
  },
  infoLabel: {
    fontSize: 11,
    color: "#90CAF9",
    marginBottom: 2,
  },
  infoVal: {
    fontSize: 13,
    color: "#1A1A1A",
    fontWeight: "500",
  },
  photoBtn: {
    backgroundColor: "#1565C0",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  photoBtnText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 15,
  },
  cancelBtn: {
    marginTop: 12,
    borderWidth: 1.5,
    borderColor: "#BBDEFB",
    borderRadius: 12,
    paddingVertical: 13,
    paddingHorizontal: 20,
    width: "100%",
    alignItems: "center",
  },
  cancelBtnText: {
    color: "#1565C0",
    fontWeight: "bold",
    fontSize: 15,
  },
  infoText: {
    textAlign: "center",
    marginBottom: 20,
    fontSize: 15,
    color: "#444",
    lineHeight: 22,
  },
  cameraContainer: { flex: 1, backgroundColor: "black" },
  cameraOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "transparent",
    justifyContent: "flex-end",
  },
  captureContainer: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    alignItems: "center",
    marginBottom: 40,
  },
  captureButton: {
    backgroundColor: "white",
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 30,
    elevation: 5,
  },
  captureButtonText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "black",
  },
  cameraCancelButton: {
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 30,
  },
  modalBackground: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.8)",
    justifyContent: "center",
    alignItems: "center",
  },
  fullScreenImage: {
    width: "90%",
    height: "60%",
    resizeMode: "contain",
    transform: [{ scaleX: -1 }],
  },
});