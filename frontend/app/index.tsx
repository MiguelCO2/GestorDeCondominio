import { Redirect } from 'expo-router';
import { useAuth } from '../hooks/useAuth';

// Entry point: decidir entre login y tabs según haya sesión.
export default function Index() {
  const { user } = useAuth();
  return user ? <Redirect href="/(tabs)" /> : <Redirect href="/login" />;
}
