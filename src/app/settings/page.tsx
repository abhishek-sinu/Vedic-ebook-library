"use client";
import Settings from '../../components/Settings';
import { useRouter } from 'next/navigation';

export default function SettingsPage() {
  const router = useRouter();
  return <Settings onClose={() => router.back()} />;
}
