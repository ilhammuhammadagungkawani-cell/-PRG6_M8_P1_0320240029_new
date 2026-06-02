import { useState, useCallback, useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import PropTypes from "prop-types";
import { useFocusEffect } from "@react-navigation/native";
import { AuthContext } from "./AuthContext";

export default function HistoryScreen({ navigation }) {
  const { userData } = useContext(AuthContext);
  const [historyData, setHistoryData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [page, setPage] = useState(0);
  const [isLastPage, setIsLastPage] = useState(false);

const BASE_URL = "http://10.1.13.68:8080/api/presensi";  const fetchAttendanceData = async (targetPage = 0) => {
    if (isLoading || (isLastPage && targetPage !== 0)) return;

    setIsLoading(true);
    try {
      const response = await fetch(
        `${BASE_URL}/history/${userData?.nim_mhs || "0320240029"}?page=${targetPage}&size=10`
      );
      const json = await response.json();
      const newItems = json.content;

      if (targetPage === 0) {
        setHistoryData(newItems);
      } else {
        setHistoryData((prev) => [...prev, ...newItems]);
      }

      setPage(targetPage);
      setIsLastPage(json.last);
    } catch (error) {
      console.error("fetchAttendanceData error:", error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchAttendanceData(0);
    }, []),
  );

  const onRefresh = () => {
    setIsRefreshing(true);
    fetchAttendanceData(0);
  };

  const handleLoadMore = () => {
    if (!isLastPage && !isLoading) {
      fetchAttendanceData(page + 1);
    }
  };

  const renderItem = ({ item }) => {
    const isPresent = item.status === "Present";
    return (
      <TouchableOpacity
        style={styles.item}
        onPress={() => navigation.navigate("Detail", { dataPresensi: item })}
        activeOpacity={0.85}
      >
        <View style={[styles.itemIcon, !isPresent && styles.itemIconAbsent]}>
          <MaterialIcons
            name={isPresent ? "check-circle" : "cancel"}
            size={22}
            color={isPresent ? "#1565C0" : "#E53935"}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.course}>{item.course}</Text>
          <Text style={styles.date}>
            {item.date} | {item.jamPresensi}
          </Text>
        </View>
        <View
          style={[
            styles.badge,
            isPresent ? styles.badgePresent : styles.badgeAbsent,
          ]}
        >
          <Text
            style={[
              styles.badgeText,
              isPresent ? styles.badgeTextPresent : styles.badgeTextAbsent,
            ]}
          >
            {item.status}
          </Text>
        </View>
        <MaterialIcons
          name="chevron-right"
          size={20}
          color="#BBDEFB"
          style={{ marginLeft: 8 }}
        />
      </TouchableOpacity>
    );
  };

  const renderFooter = () => {
    if (!isLoading) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color="#1565C0" />
        <Text style={styles.loaderText}>Memuat data dari server...</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={historyData}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.content}
        refreshing={isRefreshing}
        onRefresh={onRefresh}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={renderFooter}
        ListHeaderComponent={
          <>
            <View style={styles.header}>
              <Text style={styles.headerTitle}>Riwayat Presensi</Text>
              <Text style={styles.headerSub}>Semua riwayat kehadiranmu</Text>
            </View>

            <View style={styles.cardAreaTop} />

            <Text style={styles.sectionLabel}>Daftar Kehadiran</Text>
          </>
        }
        ListEmptyComponent={
          !isLoading && (
            <Text style={styles.emptyText}>Tidak ada riwayat absensi.</Text>
          )
        }
      />
    </SafeAreaView>
  );
}

HistoryScreen.propTypes = {
  navigation: PropTypes.shape({
    navigate: PropTypes.func.isRequired,
  }).isRequired,
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1565C0",
  },
  content: {
    flexGrow: 1,
    backgroundColor: "#F0F4FF",
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
  cardAreaTop: {
    backgroundColor: "#F0F4FF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -20,
    paddingTop: 20,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#90CAF9",
    letterSpacing: 0.6,
    textTransform: "uppercase",
    marginHorizontal: 16,
    marginBottom: 12,
    marginTop: 4,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    marginHorizontal: 16,
    marginBottom: 10,
    borderWidth: 0.5,
    borderColor: "#E3F2FD",
  },
  itemIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: "#E3F2FD",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  itemIconAbsent: {
    backgroundColor: "#FFEBEE",
  },
  course: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#1A1A1A",
    marginBottom: 3,
  },
  date: {
    fontSize: 11,
    color: "#90CAF9",
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  badgePresent: {
    backgroundColor: "#E8F5E9",
  },
  badgeAbsent: {
    backgroundColor: "#FFEBEE",
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "700",
  },
  badgeTextPresent: {
    color: "#2E7D32",
  },
  badgeTextAbsent: {
    color: "#C62828",
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  loaderText: {
    color: "#90CAF9",
    fontSize: 12,
  },
  emptyText: {
    textAlign: "center",
    marginTop: 50,
    color: "#90CAF9",
    fontSize: 14,
  },
});
