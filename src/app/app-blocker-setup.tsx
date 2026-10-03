import { router } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, radius, spacing, typography } from "@/theme/colors";
import { useSetupStore } from "@/store/setupStore";
import {
  AVAILABLE_APPS,
  APP_PRESETS,
  getDefaultSelectedApps,
} from "@/data/restrictedApps";
import { SelectedAppsCard } from "@/components/blocker/SelectedAppsCard";
import { PresetToggle } from "@/components/blocker/PresetToggle";
import { AppListItem } from "@/components/blocker/AppListItem";
import type { RestrictedApp } from "@/types";

/**
 * Page 2: Distraction App Blocker
 * Allows user to select which apps to block during focus mode.
 */
export default function AppBlockerSetupScreen() {
  const { restrictedApps, toggleApp, setRestrictedApps } = useSetupStore();
  const [showAppList, setShowAppList] = useState(false);

  // Initialize with default apps if none selected
  const initializedApps = useMemo(() => {
    if (restrictedApps.length === 0) {
      return getDefaultSelectedApps();
    }
    return restrictedApps;
  }, [restrictedApps]);

  const selectedIds = useMemo(
    () => new Set(initializedApps.map((a) => a.id)),
    [initializedApps],
  );

  const handleToggleApp = (app: RestrictedApp) => {
    toggleApp(app);
  };

  const handlePresetToggle = (presetId: string) => {
    const preset = APP_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;

    const presetApps = AVAILABLE_APPS.filter((a) =>
      preset.appIds.includes(a.id),
    );
    const allSelected = presetApps.every((a) => selectedIds.has(a.id));

    if (allSelected) {
      // Deselect all apps in this preset
      const newApps = restrictedApps.filter(
        (a) => !preset.appIds.includes(a.id),
      );
      setRestrictedApps(newApps);
    } else {
      // Select all apps in this preset
      const newApps = [...restrictedApps];
      presetApps.forEach((app) => {
        if (!selectedIds.has(app.id)) {
          newApps.push(app);
        }
      });
      setRestrictedApps(newApps);
    }
  };

  const isPresetActive = (presetId: string): boolean => {
    const preset = APP_PRESETS.find((p) => p.id === presetId);
    if (!preset) return false;
    const presetApps = AVAILABLE_APPS.filter((a) =>
      preset.appIds.includes(a.id),
    );
    return presetApps.every((a) => selectedIds.has(a.id));
  };

  const handleNext = () => {
    // Save selection and navigate to Timer Setup
    router.push("/timer-setup" as any);
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Quay lại"
        >
          <Text style={styles.backIcon}>‹</Text>
        </Pressable>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>Bước 2 trong 3</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Title Section */}
        <View style={styles.titleSection}>
          <Text style={styles.title}>Block Distractions</Text>
          <Text style={styles.subtitle}>
            Chọn ứng dụng gây xao nhãng. Bản hiện tại ghi nhận khi bạn rời ứng
            dụng; chưa chặn ở cấp hệ điều hành.
          </Text>
        </View>

        {/* Selected Apps Summary Card */}
        <SelectedAppsCard apps={initializedApps} />

        {/* Quick Presets */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Presets</Text>
          <View style={styles.presetsContainer}>
            {APP_PRESETS.map((preset) => (
              <PresetToggle
                key={preset.id}
                preset={preset}
                isActive={isPresetActive(preset.id)}
                onPress={() => handlePresetToggle(preset.id)}
              />
            ))}
          </View>
        </View>

        {/* Select Apps Button */}
        <Pressable
          onPress={() => setShowAppList(!showAppList)}
          style={styles.selectButton}
          accessibilityRole="button"
        >
          <Text style={styles.selectButtonText}>
            {showAppList ? "Hide App List" : "Select Apps to Block"}
          </Text>
          <Text style={styles.selectButtonIcon}>{showAppList ? "▲" : "▼"}</Text>
        </Pressable>

        {/* App List */}
        {showAppList && (
          <View style={styles.appList}>
            {AVAILABLE_APPS.map((app) => (
              <AppListItem
                key={app.id}
                app={app}
                isSelected={selectedIds.has(app.id)}
                onToggle={() => handleToggleApp(app)}
              />
            ))}
          </View>
        )}
      </ScrollView>

      {/* Bottom Action */}
      <View style={styles.bottomContainer}>
        <Pressable
          onPress={handleNext}
          style={styles.nextButton}
          accessibilityRole="button"
        >
          <Text style={styles.nextButtonText}>NEXT</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: colors.card,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  backIcon: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.text,
    lineHeight: 26,
  },
  badge: {
    backgroundColor: colors.accentSoft,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
  },
  badgeText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.accent,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  titleSection: {
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.title,
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...typography.bodySecondary,
    lineHeight: 20,
  },
  section: {
    marginTop: spacing.lg,
  },
  sectionTitle: {
    ...typography.label,
    marginBottom: spacing.sm,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  presetsContainer: {
    gap: spacing.sm,
  },
  selectButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.card,
    borderRadius: radius.button,
    paddingVertical: spacing.md,
    marginTop: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  selectButtonText: {
    ...typography.body,
    fontWeight: "600",
    color: colors.accent,
  },
  selectButtonIcon: {
    fontSize: 12,
    color: colors.accent,
  },
  appList: {
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  bottomContainer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.background,
  },
  nextButton: {
    backgroundColor: colors.accent,
    borderRadius: radius.button,
    paddingVertical: spacing.md,
    alignItems: "center",
  },
  nextButtonText: {
    ...typography.button,
    letterSpacing: 1,
  },
});
