import { Stack } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '../src/components/ui/toaster';
import { Toaster as Sonner } from '../src/components/ui/sonner';
import { TooltipProvider } from '../src/components/ui/tooltip';

const queryClient = new QueryClient();

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="main" options={{ headerShown: false }} />
      <Stack.Screen name="biometric-setup" options={{ headerShown: false }} />
    </Stack>
      </TooltipProvider>
    </QueryClientProvider>
  );
} 