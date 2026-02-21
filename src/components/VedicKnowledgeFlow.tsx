import React from 'react';
import ReactFlow, { Background, Controls, MiniMap, useReactFlow } from 'reactflow';
import 'reactflow/dist/style.css';
import { useRouter } from 'next/navigation';


// Expanded nodes and edges for the full Vedic Knowledge diagram
const nodes = [
  // Top level
  { id: 'vedic', position: { x: 650, y: 0 }, data: { label: 'VEDIC KNOWLEDGE' }, style: { width: 340, height: 80, background: 'linear-gradient(90deg,#e3f0ff 60%,#c7e0ff 100%)', fontWeight: 'bold', fontSize: 28, border: '2.5px solid #1976d2', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1a237e', boxShadow: '0 2px 12px #7bb0ff33' } },
  { id: 'sruti', position: { x: 400, y: 120 }, data: { label: 'SRUTI' }, style: { width: 120, height: 40, background: '#d0f5c7', fontWeight: 'bold', border: '2px solid #388e3c', borderRadius: 8 } },
  { id: 'smrti', position: { x: 900, y: 120 }, data: { label: 'SMRTI' }, style: { width: 120, height: 40, background: '#ffe0b2', fontWeight: 'bold', border: '2px solid #f57c00', borderRadius: 8 } },
  // SRUTI children (only VEDAS)
  { id: 'vedas', position: { x: 400, y: 240 }, data: { label: 'VEDAS\nRg, Yajur, Sama, Atharva' }, style: { width: 180, height: 60, background: '#e8f5e9', border: '1px solid #388e3c', borderRadius: 6, whiteSpace: 'pre-line' } },
  // SMRTI children (all others)
  { id: 'upvedas', position: { x: 700, y: 240 }, data: { label: 'UPVEDAS' }, style: { width: 100, height: 36, background: '#e8f5e9', border: '1px solid #388e3c', borderRadius: 6 } },
  { id: 'vedangas', position: { x: 850, y: 240 }, data: { label: 'VEDANGAS' }, style: { width: 110, height: 36, background: '#e8f5e9', border: '1px solid #388e3c', borderRadius: 6 } },
  // VEDAS sub
  { id: 'samhitas', position: { x: 450, y: 320 }, data: { label: 'Samhitas mantras' }, style: { width: 110, height: 40, background: '#fff', border: '1px solid #388e3c', borderRadius: 6, whiteSpace: 'pre-line' } },
  { id: 'brahmanas', position: { x: 450, y: 370 }, data: { label: 'Brahmanas Ritual explanation of mantras' }, style: { width: 180, height: 60, background: '#fff', border: '1px solid #388e3c', borderRadius: 6, whiteSpace: 'pre-line', fontSize: 13 } },
  { id: 'aranyakas', position: { x: 450, y: 440 }, data: { label: 'Aranyakas Esoteric explanation of mantras' }, style: { width: 180, height: 60, background: '#fff', border: '1px solid #388e3c', borderRadius: 6, whiteSpace: 'pre-line', fontSize: 13 } },
  { id: 'upanishads', position: { x: 450, y: 510 }, data: { label: 'Upanishads\nJnana-kanda' }, style: { width: 120, height: 52, background: '#fff', border: '1px solid #1976d2', borderRadius: 6, whiteSpace: 'pre-line', fontSize: 13 } },
  // UPVEDAS sub
  { id: 'ayurveda', position: { x: 800, y: 320 }, data: { label: 'Ayurveda' }, style: { width: 80, height: 32, background: '#fff', border: '1px solid #388e3c', borderRadius: 6 } },
  { id: 'dhanurveda', position: { x: 800, y: 360 }, data: { label: 'Dhanurveda' }, style: { width: 80, height: 32, background: '#fff', border: '1px solid #388e3c', borderRadius: 6 } },
  { id: 'gandharvaveda', position: { x: 800, y: 400 }, data: { label: 'Gandharvaveda' }, style: { width: 100, height: 32, background: '#fff', border: '1px solid #388e3c', borderRadius: 6 } },
  { id: 'sthapathyaveda', position: { x: 800, y: 440 }, data: { label: 'Sthapatyaveda' }, style: { width: 100, height: 32, background: '#fff', border: '1px solid #388e3c', borderRadius: 6 } },
  { id: 'arthashastra', position: { x: 800, y: 480 }, data: { label: 'Arthashastra' }, style: { width: 100, height: 32, background: '#fff', border: '1px solid #388e3c', borderRadius: 6 } },
  // VEDANGAS sub
  { id: 'kalpa', position: { x: 950, y: 320 }, data: { label: 'Kalpa\nritual details' }, style: { width: 110, height: 36, background: '#fff', border: '1px solid #388e3c', borderRadius: 6, whiteSpace: 'pre-line', fontSize: 13 } },
  { id: 'siksa', position: { x: 950, y: 360 }, data: { label: 'Siksa\npronunciation' }, style: { width: 110, height: 36, background: '#fff', border: '1px solid #388e3c', borderRadius: 6, whiteSpace: 'pre-line', fontSize: 13 } },
  { id: 'vyakarana', position: { x: 950, y: 400 }, data: { label: 'Vyakarana\ngrammar' }, style: { width: 110, height: 36, background: '#fff', border: '1px solid #388e3c', borderRadius: 6, whiteSpace: 'pre-line', fontSize: 13 } },
  { id: 'nirukta', position: { x: 950, y: 440 }, data: { label: 'Nirukta\netymology' }, style: { width: 110, height: 36, background: '#fff', border: '1px solid #388e3c', borderRadius: 6, whiteSpace: 'pre-line', fontSize: 13 } },
  { id: 'chandas', position: { x: 950, y: 480 }, data: { label: 'Chandas\nmeters' }, style: { width: 110, height: 36, background: '#fff', border: '1px solid #388e3c', borderRadius: 6, whiteSpace: 'pre-line', fontSize: 13 } },
  { id: 'jyotisa', position: { x: 950, y: 520 }, data: { label: 'Jyotisa\nAstronomy' }, style: { width: 110, height: 52, background: '#fff', border: '1px solid #388e3c', borderRadius: 6, whiteSpace: 'pre-line', fontSize: 13 } },
  // SMRTI children
  { id: 'darshanas', position: { x: 980, y: 240 }, data: { label: 'SIX DARSHANAS' }, style: { width: 150, height: 40, background: 'linear-gradient(90deg,#e3f0ff 60%,#c7e0ff 100%)', border: '2px solid #1976d2', borderRadius: 10, color: '#1a237e', fontWeight: 'bold', fontSize: 15, boxShadow: '0 2px 8px #7bb0ff33' } },
  { id: 'puranas', position: { x: 1150, y: 240 }, data: { label: 'PURANAS' }, style: { width: 120, height: 40, background: 'linear-gradient(90deg,#e3f0ff 60%,#c7e0ff 100%)', border: '2px solid #1976d2', borderRadius: 10, color: '#1a237e', fontWeight: 'bold', fontSize: 18, boxShadow: '0 2px 8px #7bb0ff33' } },
  { id: 'itihasas', position: { x: 1300, y: 240 }, data: { label: 'ITIHASAS' }, style: { width: 120, height: 40, background: 'linear-gradient(90deg,#e3f0ff 60%,#c7e0ff 100%)', border: '2px solid #1976d2', borderRadius: 10, color: '#1a237e', fontWeight: 'bold', fontSize: 18, boxShadow: '0 2px 8px #7bb0ff33' } },
  { id: 'tantras', position: { x: 1450, y: 240 }, data: { label: 'TANTRAS' }, style: { width: 120, height: 40, background: 'linear-gradient(90deg,#e3f0ff 60%,#c7e0ff 100%)', border: '2px solid #1976d2', borderRadius: 10, color: '#1a237e', fontWeight: 'bold', fontSize: 18, boxShadow: '0 2px 8px #7bb0ff33' } },
  { id: 'agamas', position: { x: 1600, y: 240 }, data: { label: 'AGAMAS' }, style: { width: 120, height: 40, background: 'linear-gradient(90deg,#e3f0ff 60%,#c7e0ff 100%)', border: '2px solid #1976d2', borderRadius: 10, color: '#1a237e', fontWeight: 'bold', fontSize: 18, boxShadow: '0 2px 8px #7bb0ff33' } },
  // SIX DARSHANAS sub
  { id: 'sankhya', position: { x: 1100, y: 320 }, data: { label: 'Sankhya\n(Atheist Kapila)' }, style: { width: 130, height: 36, background: '#fffde7', border: '1px solid #fbc02d', borderRadius: 6, whiteSpace: 'pre-line', fontSize: 13 } },
  { id: 'yoga', position: { x: 1100, y: 360 }, data: { label: 'Yoga\n(Patanjali)' }, style: { width: 130, height: 36, background: '#fffde7', border: '1px solid #fbc02d', borderRadius: 6, whiteSpace: 'pre-line', fontSize: 13 } },
  { id: 'nyaya', position: { x: 1100, y: 400 }, data: { label: 'Nyaya\n(Gautama)' }, style: { width: 130, height: 36, background: '#e3f2fd', border: '1px solid #1976d2', borderRadius: 6, whiteSpace: 'pre-line', fontSize: 13 } },
  { id: 'vaisesika', position: { x: 1100, y: 440 }, data: { label: 'Vaisesika\n(Kanada)' }, style: { width: 130, height: 36, background: '#e3f2fd', border: '1px solid #1976d2', borderRadius: 6, whiteSpace: 'pre-line', fontSize: 13 } },
  { id: 'mimamsa', position: { x: 1100, y: 480 }, data: { label: 'Mimamsa\n(Jaimini)' }, style: { width: 130, height: 36, background: '#ede7f6', border: '1px solid #7e57c2', borderRadius: 6, whiteSpace: 'pre-line', fontSize: 13 } },
  { id: 'vedanta', position: { x: 1100, y: 520 }, data: { label: 'Vedanta\n(Vyasa)' }, style: { width: 130, height: 52, background: '#ede7f6', border: '1px solid #7e57c2', borderRadius: 6, whiteSpace: 'pre-line', fontSize: 13 } },
  // PURANAS sub
  { id: 'maha', position: { x: 1250, y: 320 }, data: { label: 'Maha Puranas 18' }, style: { width: 120, height: 32, background: '#fff', border: '1px solid #fbc02d', borderRadius: 6 } },
  { id: 'upa', position: { x: 1250, y: 360 }, data: { label: 'Upa Puranas 18' }, style: { width: 120, height: 32, background: '#fff', border: '1px solid #fbc02d', borderRadius: 6 } },
  { id: 'aupa', position: { x: 1250, y: 400 }, data: { label: 'Aupa Puranas' }, style: { width: 120, height: 32, background: '#fff', border: '1px solid #fbc02d', borderRadius: 6 } },
  { id: 'aupupa', position: { x: 1250, y: 440 }, data: { label: 'Aupupa Puranas' }, style: { width: 120, height: 32, background: '#fff', border: '1px solid #fbc02d', borderRadius: 6 } },
  { id: 'sthala', position: { x: 1250, y: 480 }, data: { label: 'Sthala Puranas' }, style: { width: 120, height: 32, background: '#fff', border: '1px solid #fbc02d', borderRadius: 6 } },
  // ITIHASAS sub
  { id: 'ramayana', position: { x: 1400, y: 320 }, data: { label: 'Ramayana' }, style: { width: 100, height: 32, background: '#fff', border: '1px solid #fbc02d', borderRadius: 6 } },
  { id: 'mahabharata', position: { x: 1400, y: 360 }, data: { label: 'Mahabharata' }, style: { width: 100, height: 32, background: '#fff', border: '1px solid #fbc02d', borderRadius: 6 } },
  { id: 'visnu', position: { x: 1420, y: 400 }, data: { label: 'Visnu Sahasra nama' }, style: { width: 120, height: 32, background: '#fff', border: '1px solid #fbc02d', borderRadius: 6 } },
   { id: 'gita', position: { x: 1420, y: 440 }, data: { label: 'Bhagavad Gita' }, style: { width: 120, height: 36, background: '#c8e6c9', border: '2px solid #388e3c', borderRadius: 6, fontWeight: 'bold' } },
  // TANTRAS sub
  { id: 'tamasic', position: { x: 1550, y: 320 }, data: { label: 'Tamasic' }, style: { width: 90, height: 32, background: '#fff', border: '1px solid #fbc02d', borderRadius: 6 } },
  { id: 'rajasic', position: { x: 1550, y: 360 }, data: { label: 'Rajasic' }, style: { width: 90, height: 32, background: '#fff', border: '1px solid #fbc02d', borderRadius: 6 } },
   { id: 'sattvic', position: { x: 1550, y: 400 }, data: { label: 'Sattvic' }, style: { width: 90, height: 32, background: '#fff', border: '1px solid #fbc02d', borderRadius: 6 } },
  { id: 'agamas', position: { x: 1580, y: 240 }, data: { label: 'AGAMAS' }, style: { width: 120, height: 40, background: 'linear-gradient(90deg,#e3f0ff 60%,#c7e0ff 100%)', border: '2px solid #1976d2', borderRadius: 10, color: '#1a237e', fontWeight: 'bold', fontSize: 18, boxShadow: '0 2px 8px #7bb0ff33' } },
  // AGAMAS sub (closer, vertically aligned)
  { id: 'shakta', position: { x: 1650, y: 300 }, data: { label: 'Shakta' }, style: { width: 90, height: 32, background: '#fff', border: '1px solid #fbc02d', borderRadius: 6 } },
  { id: 'shaiva', position: { x: 1650, y: 340 }, data: { label: 'Shaiva' }, style: { width: 90, height: 32, background: '#fff', border: '1px solid #fbc02d', borderRadius: 6 } },
  { id: 'vaisnava', position: { x: 1650, y: 380 }, data: { label: 'Vaisnava' }, style: { width: 90, height: 32, background: '#fff', border: '1px solid #fbc02d', borderRadius: 6 } },
  { id: 'vaikhanasa', position: { x: 1720, y: 420 }, data: { label: 'Vaikhanasa' }, style: { width: 90, height: 32, background: '#fff', border: '1px solid #fbc02d', borderRadius: 6 } },
  { id: 'pancharatra', position: { x: 1720, y: 460 }, data: { label: 'Pancharatra' }, style: { width: 90, height: 32, background: '#fff', border: '1px solid #fbc02d', borderRadius: 6 } },
  // BOTTOM PHILOSOPHIES
  { id: 'advaita', position: { x: 800, y: 700 }, data: { label: 'Advaita' }, style: { width: 100, height: 36, background: '#ede7f6', border: '1px solid #7e57c2', borderRadius: 6, fontWeight: 'bold' } },
  { id: 'kevala', position: { x: 600, y: 860 }, data: { label: 'Kevala-Advaita (Sankara)' }, style: { width: 160, height: 32, background: '#fff', border: '1px solid #7e57c2', borderRadius: 6, fontSize: 13 } },
  { id: 'siva', position: { x: 600, y: 900 }, data: { label: 'Siva-advaita (Kashmir Shaivism)' }, style: { width: 180, height: 52, background: '#fff', border: '1px solid #7e57c2', borderRadius: 6, fontSize: 13 } },
  { id: 'suddha', position: { x: 800, y: 860 }, data: { label: 'Suddha-advaita (Vallabha)' }, style: { width: 160, height: 32, background: '#fff', border: '1px solid #7e57c2', borderRadius: 6, fontSize: 13 } },
  { id: 'visita', position: { x: 800, y: 900 }, data: { label: 'Visita-Advaita (Ramanuja)' }, style: { width: 160, height: 52, background: '#fff', border: '1px solid #7e57c2', borderRadius: 6, fontSize: 13 } },
  { id: 'bheda', position: { x: 1000, y: 700 }, data: { label: 'Bheda-abheda' }, style: { width: 120, height: 36, background: '#ede7f6', border: '1px solid #7e57c2', borderRadius: 6, fontWeight: 'bold' } },
  { id: 'bheda-bhaskara', position: { x: 1000, y: 860 }, data: { label: 'Bheda-abheda (Bhaskara)' }, style: { width: 160, height: 32, background: '#fff', border: '1px solid #7e57c2', borderRadius: 6, fontSize: 13 } },
  { id: 'bheda-nimbarka', position: { x: 1200, y: 860 }, data: { label: 'Bheda-abheda (Nimbarka)' }, style: { width: 160, height: 32, background: '#fff', border: '1px solid #7e57c2', borderRadius: 6, fontSize: 13 } },
  { id: 'acintya', position: { x: 1400, y: 860 }, data: { label: 'Acintya Bheda-abheda (Lord Caitanya)' }, style: { width: 220, height: 52, background: '#fff', border: '1px solid #7e57c2', borderRadius: 6, fontSize: 13 } },
  { id: 'dvaita', position: { x: 1200, y: 700 }, data: { label: 'Dvaita (Madhava)' }, style: { width: 140, height: 36, background: '#ede7f6', border: '1px solid #7e57c2', borderRadius: 6, fontWeight: 'bold' } },
];

const edges = [
  // Main flows (all straight lines)
  { id: 'e1', source: 'vedic', target: 'sruti', type: 'straight' },
  { id: 'e2', source: 'vedic', target: 'smrti', type: 'straight' },
  { id: 'e3', source: 'sruti', target: 'vedas', type: 'straight' },
  { id: 'e4', source: 'smrti', target: 'upvedas', type: 'straight' },
  { id: 'e5', source: 'smrti', target: 'vedangas', type: 'straight' },
  { id: 'e6', source: 'vedas', target: 'samhitas', type: 'straight' },
  { id: 'e7', source: 'vedas', target: 'brahmanas', type: 'straight' },
  { id: 'e8', source: 'vedas', target: 'aranyakas', type: 'straight' },
  { id: 'e9', source: 'vedas', target: 'upanishads', type: 'straight' },
  { id: 'e10', source: 'upvedas', target: 'ayurveda', type: 'straight' },
  { id: 'e11', source: 'upvedas', target: 'dhanurveda', type: 'straight' },
  { id: 'e12', source: 'upvedas', target: 'gandharvaveda', type: 'straight' },
  { id: 'e13', source: 'upvedas', target: 'sthapathyaveda', type: 'straight' },
  { id: 'e14', source: 'upvedas', target: 'arthashastra', type: 'straight' },
  { id: 'e15', source: 'vedangas', target: 'kalpa', type: 'straight' },
  { id: 'e16', source: 'vedangas', target: 'siksa', type: 'straight' },
  { id: 'e17', source: 'vedangas', target: 'vyakarana', type: 'straight' },
  { id: 'e18', source: 'vedangas', target: 'nirukta', type: 'straight' },
  { id: 'e19', source: 'vedangas', target: 'chandas', type: 'straight' },
  { id: 'e20', source: 'vedangas', target: 'jyotisa', type: 'straight' },
  { id: 'e21', source: 'smrti', target: 'darshanas', type: 'straight' },
  { id: 'e22', source: 'smrti', target: 'puranas', type: 'straight' },
  { id: 'e23', source: 'smrti', target: 'itihasas', type: 'straight' },
  { id: 'e24', source: 'smrti', target: 'tantras', type: 'straight' },
  { id: 'e25', source: 'smrti', target: 'agamas', type: 'straight' },
  { id: 'e26', source: 'darshanas', target: 'sankhya', type: 'straight' },
  { id: 'e27', source: 'darshanas', target: 'yoga', type: 'straight' },
  { id: 'e28', source: 'darshanas', target: 'nyaya', type: 'straight' },
  { id: 'e29', source: 'darshanas', target: 'vaisesika', type: 'straight' },
  { id: 'e30', source: 'darshanas', target: 'mimamsa', type: 'straight' },
  { id: 'e31', source: 'darshanas', target: 'vedanta', type: 'straight' },
  { id: 'e32', source: 'puranas', target: 'maha', type: 'straight' },
  { id: 'e33', source: 'puranas', target: 'upa', type: 'straight' },
  { id: 'e34', source: 'puranas', target: 'aupa', type: 'straight' },
  { id: 'e35', source: 'puranas', target: 'aupupa', type: 'straight' },
  { id: 'e36', source: 'puranas', target: 'sthala', type: 'straight' },
  { id: 'e37', source: 'itihasas', target: 'ramayana', type: 'straight' },
  { id: 'e38', source: 'itihasas', target: 'mahabharata', type: 'straight' },
  { id: 'e39', source: 'mahabharata', target: 'visnu', type: 'straight' },
  { id: 'e40', source: 'tantras', target: 'tamasic', type: 'straight' },
  { id: 'e41', source: 'tantras', target: 'rajasic', type: 'straight' },
  { id: 'e42', source: 'tantras', target: 'sattvic', type: 'straight' },
  { id: 'e43', source: 'agamas', target: 'shakta', type: 'straight' },
  { id: 'e44', source: 'agamas', target: 'shaiva', type: 'straight' },
  { id: 'e45', source: 'agamas', target: 'vaisnava', type: 'straight' },
  { id: 'e46', source: 'vaisnava', target: 'vaikhanasa', type: 'straight' },
  { id: 'e47', source: 'vaisnava', target: 'pancharatra', type: 'straight' },
  // Prasthana Trayam
  { id: 'e48', source: 'gita', target: 'mahabharata', type: 'straight' },
  // Bottom philosophies
  { id: 'e49', source: 'vedanta', target: 'advaita', type: 'straight' },
  { id: 'e50', source: 'vedanta', target: 'bheda', type: 'straight' },
  { id: 'e51', source: 'vedanta', target: 'dvaita', type: 'straight' },
  { id: 'e52', source: 'advaita', target: 'kevala', type: 'straight' },
  { id: 'e53', source: 'advaita', target: 'siva', type: 'straight' },
  { id: 'e54', source: 'advaita', target: 'suddha', type: 'straight' },
  { id: 'e55', source: 'advaita', target: 'visita', type: 'straight' },
  { id: 'e56', source: 'bheda', target: 'bheda-bhaskara', type: 'straight' },
  { id: 'e57', source: 'bheda', target: 'bheda-nimbarka', type: 'straight' },
  { id: 'e58', source: 'bheda', target: 'acintya', type: 'straight' },
  // Dvaita does not have sub-branches in the diagram
];

export default function VedicKnowledgeFlow() {
  const router = useRouter();

  // List of node ids and their target routes (add more as needed)
  const nodeRoutes: Record<string, string> = {
    ramayana: '/category/ramayana',
    mahabharata: '/category/mahabharata',
    vedas: '/category/vedas',
    upanishads: '/category/upanishads',
    gita: '/category/gita',
    puranas: '/category/puranas',
    // Add more mappings as needed
  };


  // Custom node click handler
  const onNodeClick = (_: any, node: any) => {
    const route = nodeRoutes[node.id];
    if (route) {
      router.push(route);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100vw',
        backgroundImage: "url('/login-bg.png')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        // Removed overflowX: 'hidden' to allow horizontal scroll on mobile
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '1200px',
          margin: '0 auto',
          paddingTop: 0,
          paddingBottom: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <div
          style={{
            width: '100%',
            margin: '8px 0 16px 0',
            padding: '10px 16px',
            background: 'linear-gradient(90deg,#e3f0ff 60%,#c7e0ff 100%)',
            borderRadius: 14,
            boxShadow: '0 2px 12px #7bb0ff33',
            fontFamily: 'inherit',
            color: '#1a237e',
            fontSize: 16,
            lineHeight: 1.5,
            border: '2.5px solid #1abc9c',
            textAlign: 'center',
            letterSpacing: 0.1,
            overflow: 'hidden',
            whiteSpace: 'nowrap',
            position: 'relative',
          }}
        >
        <div style={{
          display: 'inline-block',
          animation: 'marquee 60s linear infinite',
          minWidth: '100%',
        }}>
          <strong>How to use the Vedic Knowledge Map:</strong> &nbsp;
          <span style={{ color: '#6d4c00', fontSize: 15 }}>
            <b>Zoom in/out:</b> Use your mouse wheel or the +/- controls at the bottom left to zoom the diagram for better visibility. &nbsp;|&nbsp;
            <b>Pan/Move:</b> Click and drag anywhere on the background to move around the map and explore different sections. &nbsp;|&nbsp;
            <b>Click to explore:</b> Click on any box in the diagram to instantly navigate to that section and learn more about it. &nbsp;|&nbsp;
            <b>Tip:</b> You can interact with the map on any device—desktop, tablet, or mobile!
          </span>
        </div>
        <style>{`
          @keyframes marquee {
            0% { transform: translateX(0); }
            100% { transform: translateX(-100%); }
          }
        `}</style>
      </div>

        {/* Donor/Acknowledgment Section moved after map */}
        <div
          style={{
            width: '100%',
            height: '600px',
            background: 'linear-gradient(180deg,#fffde4 0%,#ffe9ca 100%)',
            borderRadius: 16,
            boxShadow: '0 2px 16px #e0c68a55',
            margin: 'auto',
            overflowX: 'auto',
            WebkitOverflowScrolling: 'touch',
            touchAction: 'pan-x pan-y',
          }}
        >
          <ReactFlow
            nodes={nodes}
            edges={edges}
            fitView
            panOnDrag={true}
            zoomOnScroll={true}
            zoomOnPinch={true}
            panOnScroll={true}
            nodesDraggable={false}
            nodesConnectable={false}
            elementsSelectable={false}
            selectionOnDrag={false}
            proOptions={{ hideAttribution: true }}
            defaultEdgeOptions={{ type: 'straight' }}
            onNodeClick={onNodeClick}
            style={{ minWidth: 700 }}
          >
            <Background color="#fbc02d22" gap={32} />
            <MiniMap nodeColor={() => '#fbc02d'} />
            <Controls showInteractive={false} />
          </ReactFlow>
        </div>

        <div style={{
          maxWidth: '1200px',
          margin: '32px auto 32px auto', // More space above and below
          display: 'flex',
          justifyContent: 'center',
        }}>
          <div style={{
            width: '100%',
            background: 'linear-gradient(90deg,#e3f0ff 60%,#c7e0ff 100%)',
            border: '2px solid #1abc9c',
            padding: '20px 32px',
            borderRadius: 16,
            fontSize: 18,
            color: '#1a237e',
            display: 'flex',
            alignItems: 'flex-start',
            gap: 32,
            boxShadow: '0 2px 16px #7bb0ff33',
            fontFamily: 'inherit',
          }}>
            <div style={{flex: 1}}>
              {(() => {
                const donorData = {
                  donors: [
                    "Ananya Sharma", "Rohan Patel", "Priya Singh", "Vikram Das", "Meera Joshi", "Suresh Kumar", "Kavita Rao", "Amit Verma", "Sneha Gupta", "Rahul Mehta", "Sunita Reddy", "Arjun Nair", "Deepa Chawla", "Mohan Iyer", "Pooja Sethi", "Ajay Malhotra", "Neha Jain"
                  ]
                };
                return (
                  <>
                    Thanks to donors: {donorData.donors.join('; ')}; and all others for <span style={{color:'#d2691e', fontWeight:'bold'}}>supporting</span> this site.
                  </>
                );
              })()}
            </div>
            <button style={{
              background: 'linear-gradient(90deg, #1976d2 0%, #ffd700 100%)',
              color: '#fff',
              border: 'none',
              borderRadius: 12,
              padding: '14px 36px',
              fontSize: 20,
              fontWeight: 700,
              cursor: 'pointer',
              marginLeft: 16,
              boxShadow: '0 2px 12px #1976d233',
              letterSpacing: 0.5,
              transition: 'background 0.3s',
              position: 'relative',
              zIndex: 1,
            }}>Donate</button>
          </div>
        </div>
      </div>
    </div>
  );
}
