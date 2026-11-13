import { useLocalSearchParams } from 'expo-router';
import { AcceptInviteScreen } from '../../src/components/AcceptInviteScreen';

export default function InviteLinkRoute() {
  const { token } = useLocalSearchParams<{ token: string }>();
  return <AcceptInviteScreen key={token} linkToken={token} />;
}
