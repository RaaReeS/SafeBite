import { Stack } from "expo-router";
import { stackScreenOptions } from "@/lib/stack-options";

export default function AppLayout() {
  return <Stack screenOptions={stackScreenOptions} />;
}
