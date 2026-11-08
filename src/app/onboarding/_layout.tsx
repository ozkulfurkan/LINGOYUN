import { Stack } from 'expo-router';

export default function OnboardingLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* The profile exists by now: going back would offer to create it again. */}
      <Stack.Screen name="level" options={{ gestureEnabled: false }} />
    </Stack>
  );
}
