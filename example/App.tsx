// Drop this into a fresh Expo app (npx create-expo-app) to try every option.
import { Button, ScrollView, StyleSheet, Text } from 'react-native';
import { ToastProvider, toast } from 'react-native-notitoast';

const photo = { uri: 'https://picsum.photos/200' };
const avatar = { uri: 'https://i.pravatar.cc/100?img=47' };
const appIcon = { uri: 'https://picsum.photos/id/1062/100' };

const demos: [string, () => void][] = [
  ['Success', () => toast.success('Payment successful', '₹499 paid to Arun Stores')],
  ['Error', () => toast.error('Upload failed', 'Check your internet connection')],
  ['Warning', () => toast.warning('Low storage', 'Only 200 MB left on this device')],
  ['Info', () => toast.info('New update', 'Version 2.1 is available')],
  ['Image right', () => toast.info('Priya sent a photo', 'Check out this view!', { image: photo })],
  ['Image left', () => toast.success('Priya liked your post', 'Tap to view', { image: avatar, imagePosition: 'left' })],
  ['App icon', () => toast.success('Order placed', 'Arriving tomorrow', { appIcon })],
  ['App icon, no badge', () => toast.info('Sync complete', undefined, { appIcon, showTypeBadge: false })],
  ['No icon (accent bar)', () => toast.warning('Session expiring', 'You will be logged out in 2 min', { showIcon: false })],
  ['No icon, no bar', () => toast.info('Plain card', 'Just text', { showIcon: false, showAccentBar: false })],
  ['Tinted', () => toast.success('Saved', 'All changes saved', { variant: 'tinted' })],
  ['Filled', () => toast.error('Payment failed', 'Card declined', { variant: 'filled' })],
  ['Custom colors', () => toast.info('Custom', 'Any colors you like', { backgroundColor: '#0F172A', titleColor: '#F8FAFC', messageColor: '#CBD5E1', accentColor: '#A855F7', borderColor: '#1E293B' })],
  ['Progress bar', () => toast.success('Uploading done', 'With countdown bar', { showProgress: true })],
  ['More lines', () => toast.info('A longer title that is allowed to wrap onto a second line', 'This message has no line limit so it keeps going and going and shows every word you pass in without cutting anything off at all.', { titleLines: 2, messageLines: 0 })],
  ['Small width', () => toast.success('Copied', undefined, { width: 200 })],
  ['Fixed height', () => toast.info('Fixed height', '80px tall', { height: 80 })],
  ['Long duration', () => toast.info('Stays 8 seconds', undefined, { duration: 8000, showProgress: true })],
  ['Sticky', () => toast.warning('Stays until swiped', 'Swipe up to close', { duration: 0 })],
  ['Update in place', () => {
    const id = toast.info('Uploading…', 'Please wait', { duration: 0 });
    setTimeout(() => toast.success('Uploaded', 'Your file is live', { id }), 2000);
  }],
  ['Bottom', () => toast.success('Saved', 'Draft saved', { position: 'bottom' })],
];

function Demo() {
  return (
    <ScrollView contentContainerStyle={styles.screen}>
      <Text style={styles.heading}>react-native-notitoast</Text>
      {demos.map(([label, run]) => (
        <Button key={label} title={label} onPress={run} />
      ))}
    </ScrollView>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <Demo />
    </ToastProvider>
  );
}

const styles = StyleSheet.create({
  screen: { padding: 24, paddingTop: 80, gap: 8 },
  heading: { fontSize: 22, fontWeight: '700', marginBottom: 8 },
});
