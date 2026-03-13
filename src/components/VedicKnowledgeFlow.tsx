import React, { useRef, useEffect } from 'react';
import ReactFlow, { Background, Controls, MiniMap, useReactFlow } from 'reactflow';
import 'reactflow/dist/style.css';
import { useRouter } from 'next/navigation';


// Expanded nodes and edges for the full Vedic Knowledge diagram
const nodes = [
  // Top level
  { id: 'vedic', position: { x: 650, y: 0 }, data: { label: 'Vedic Literature' }, style: { width: 340, height: 80, background: 'linear-gradient(90deg,#e3f0ff 60%,#c7e0ff 100%)', fontWeight: 'bold', fontSize: 28, border: '2.5px solid #1976d2', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1a237e', boxShadow: '0 2px 12px #7bb0ff33' } },
  { id: 'sruti', position: { x: 400, y: 120 }, data: { label: 'ŚRUTI' }, style: { width: 120, height: 40, background: '#d0f5c7', fontWeight: 'bold', border: '2px solid #388e3c', borderRadius: 8 } },
  { id: 'smrti', position: { x: 900, y: 120 }, data: { label: 'SMṚTI' }, style: { width: 120, height: 40, background: '#ffe0b2', fontWeight: 'bold', border: '2px solid #f57c00', borderRadius: 8 } },
  // SRUTI children (only VEDAS)
  { id: 'vedas', position: { x: 400, y: 240 }, data: { label: 'VEDAS\nṚg, Yajur, Sāma, Atharva' }, style: { width: 180, height: 60, background: '#e8f5e9', border: '1px solid #388e3c', borderRadius: 6, whiteSpace: 'pre-line' } },
  // SMRTI children (all others)
  { id: 'upvedas', position: { x: 700, y: 240 }, data: { label: 'UPAVEDAS' }, style: { width: 100, height: 36, background: '#e8f5e9', border: '1px solid #388e3c', borderRadius: 6 } },
  { id: 'vedangas', position: { x: 850, y: 240 }, data: { label: 'VEDĀṄGAS' }, style: { width: 110, height: 36, background: '#e8f5e9', border: '1px solid #388e3c', borderRadius: 6 } },
  // VEDAS sub
  { id: 'samhitas', position: { x: 450, y: 370 }, data: { label: 'Saṃhitās mantras' }, style: { width: 110, height: 40, background: '#fff', border: '1px solid #388e3c', borderRadius: 6, whiteSpace: 'pre-line' } },
  { id: 'brahmanas', position: { x: 450, y: 370 }, data: { label: 'Brāhmaṇas Ritual explanation of mantras' }, style: { width: 180, height: 60, background: '#fff', border: '1px solid #388e3c', borderRadius: 6, whiteSpace: 'pre-line', fontSize: 13 } },
  { id: 'aranyakas', position: { x: 450, y: 440 }, data: { label: 'Āraṇyakas Esoteric explanation of mantras' }, style: { width: 180, height: 60, background: '#fff', border: '1px solid #388e3c', borderRadius: 6, whiteSpace: 'pre-line', fontSize: 13 } },
  { id: 'upanishads', position: { x: 450, y: 510 }, data: { label: 'Upaniṣads\nJñāna-kāṇḍa' }, style: { width: 180, height: 60, background: '#fff', border: '1px solid #1976d2', borderRadius: 6, whiteSpace: 'pre-line', fontSize: 13 } },
  // UPVEDAS sub
  { id: 'ayurveda', position: { x: 800, y: 320 }, data: { label: 'Āyurveda' }, style: { width: 100, height: 32, background: '#fff', border: '1px solid #388e3c', borderRadius: 6 } },
  { id: 'dhanurveda', position: { x: 800, y: 360 }, data: { label: 'Dhanurveda' }, style: { width: 100, height: 32, background: '#fff', border: '1px solid #388e3c', borderRadius: 6 } },
  { id: 'gandharvaveda', position: { x: 800, y: 400 }, data: { label: 'Gāndharvaveda' }, style: { width: 100, height: 32, background: '#fff', border: '1px solid #388e3c', borderRadius: 6 } },
  { id: 'sthapathyaveda', position: { x: 800, y: 440 }, data: { label: 'Sthāpatyaveda' }, style: { width: 100, height: 32, background: '#fff', border: '1px solid #388e3c', borderRadius: 6 } },
  { id: 'arthashastra', position: { x: 800, y: 480 }, data: { label: 'Arthaśāstra' }, style: { width: 100, height: 32, background: '#fff', border: '1px solid #388e3c', borderRadius: 6 } },
  // VEDANGAS sub
  { id: 'kalpa', position: { x: 950, y: 320 }, data: { label: 'Kalpa\nritual details' }, style: { width: 110, height: 36, background: '#fff', border: '1px solid #388e3c', borderRadius: 6, whiteSpace: 'pre-line', fontSize: 13 } },
  { id: 'siksa', position: { x: 950, y: 360 }, data: { label: 'Śikṣā\npronunciation' }, style: { width: 110, height: 36, background: '#fff', border: '1px solid #388e3c', borderRadius: 6, whiteSpace: 'pre-line', fontSize: 13 } },
  { id: 'vyakarana', position: { x: 950, y: 400 }, data: { label: 'Vyākaraṇa\ngrammar' }, style: { width: 110, height: 36, background: '#fff', border: '1px solid #388e3c', borderRadius: 6, whiteSpace: 'pre-line', fontSize: 13 } },
  { id: 'nirukta', position: { x: 950, y: 440 }, data: { label: 'Nirukta\netymology' }, style: { width: 110, height: 36, background: '#fff', border: '1px solid #388e3c', borderRadius: 6, whiteSpace: 'pre-line', fontSize: 13 } },
  { id: 'chandas', position: { x: 950, y: 480 }, data: { label: 'Chandas\nmeters' }, style: { width: 110, height: 36, background: '#fff', border: '1px solid #388e3c', borderRadius: 6, whiteSpace: 'pre-line', fontSize: 13 } },
  { id: 'jyotisa', position: { x: 950, y: 520 }, data: { label: 'Jyotiṣa\nAstronomy' }, style: { width: 110, height: 52, background: '#fff', border: '1px solid #388e3c', borderRadius: 6, whiteSpace: 'pre-line', fontSize: 13 } },
  // SMRTI children
  { id: 'darshanas', position: { x: 980, y: 240 }, data: { label: 'ṢAḌ DARŚANAS' }, style: { width: 150, height: 40, background: 'linear-gradient(90deg,#e3f0ff 60%,#c7e0ff 100%)', border: '2px solid #1976d2', borderRadius: 10, color: '#1a237e', fontWeight: 'bold', fontSize: 15, boxShadow: '0 2px 8px #7bb0ff33' } },
  { id: 'puranas', position: { x: 1150, y: 240 }, data: { label: 'PURĀṆAS' }, style: { width: 120, height: 40, background: 'linear-gradient(90deg,#e3f0ff 60%,#c7e0ff 100%)', border: '2px solid #1976d2', borderRadius: 10, color: '#1a237e', fontWeight: 'bold', fontSize: 18, boxShadow: '0 2px 8px #7bb0ff33' } },
  { id: 'itihasas', position: { x: 1300, y: 240 }, data: { label: 'ITIHĀSAS' }, style: { width: 120, height: 40, background: 'linear-gradient(90deg,#e3f0ff 60%,#c7e0ff 100%)', border: '2px solid #1976d2', borderRadius: 10, color: '#1a237e', fontWeight: 'bold', fontSize: 18, boxShadow: '0 2px 8px #7bb0ff33' } },
  { id: 'tantras', position: { x: 1450, y: 240 }, data: { label: 'TANTRAS' }, style: { width: 120, height: 40, background: 'linear-gradient(90deg,#e3f0ff 60%,#c7e0ff 100%)', border: '2px solid #1976d2', borderRadius: 10, color: '#1a237e', fontWeight: 'bold', fontSize: 18, boxShadow: '0 2px 8px #7bb0ff33' } },
  { id: 'agamas', position: { x: 1600, y: 240 }, data: { label: 'ĀGAMAS' }, style: { width: 120, height: 40, background: 'linear-gradient(90deg,#e3f0ff 60%,#c7e0ff 100%)', border: '2px solid #1976d2', borderRadius: 10, color: '#1a237e', fontWeight: 'bold', fontSize: 18, boxShadow: '0 2px 8px #7bb0ff33' } },
  // SIX DARSHANAS sub
  { id: 'sankhya', position: { x: 1100, y: 320 }, data: { label: 'Sāṅkhya\n(Atheist Kapila)' }, style: { width: 130, height: 36, background: '#fffde7', border: '1px solid #fbc02d', borderRadius: 6, whiteSpace: 'pre-line', fontSize: 13 } },
  { id: 'yoga', position: { x: 1100, y: 360 }, data: { label: 'Yoga\n(Patañjali)' }, style: { width: 130, height: 36, background: '#fffde7', border: '1px solid #fbc02d', borderRadius: 6, whiteSpace: 'pre-line', fontSize: 13 } },
  { id: 'nyaya', position: { x: 1100, y: 400 }, data: { label: 'Nyāya\n(Gautama)' }, style: { width: 130, height: 36, background: '#e3f2fd', border: '1px solid #1976d2', borderRadius: 6, whiteSpace: 'pre-line', fontSize: 13 } },
  { id: 'vaisesika', position: { x: 1100, y: 440 }, data: { label: 'Vaiśeṣika\n(Kaṇāda)' }, style: { width: 130, height: 36, background: '#e3f2fd', border: '1px solid #1976d2', borderRadius: 6, whiteSpace: 'pre-line', fontSize: 13 } },
  { id: 'mimamsa', position: { x: 1100, y: 480 }, data: { label: 'Mīmāṃsā\n(Jaimini)' }, style: { width: 130, height: 36, background: '#ede7f6', border: '1px solid #7e57c2', borderRadius: 6, whiteSpace: 'pre-line', fontSize: 13 } },
  { id: 'vedanta', position: { x: 1100, y: 520 }, data: { label: 'Vedānta\n(Vyāsa)' }, style: { width: 130, height: 52, background: '#ede7f6', border: '1px solid #7e57c2', borderRadius: 6, whiteSpace: 'pre-line', fontSize: 13 } },
  // PURANAS sub
  { id: 'maha', position: { x: 1250, y: 320 }, data: { label: 'Mahā Purāṇas 18' }, style: { width: 120, height: 32, background: '#fff', border: '1px solid #fbc02d', borderRadius: 6 } },
  { id: 'upa', position: { x: 1250, y: 360 }, data: { label: 'Upa Purāṇas 18' }, style: { width: 120, height: 32, background: '#fff', border: '1px solid #fbc02d', borderRadius: 6 } },
  { id: 'aupa', position: { x: 1250, y: 400 }, data: { label: 'Aupa Purāṇas' }, style: { width: 120, height: 32, background: '#fff', border: '1px solid #fbc02d', borderRadius: 6 } },
  { id: 'aupupa', position: { x: 1250, y: 440 }, data: { label: 'Aupupa Purāṇas' }, style: { width: 120, height: 32, background: '#fff', border: '1px solid #fbc02d', borderRadius: 6 } },
  { id: 'sthala', position: { x: 1250, y: 480 }, data: { label: 'Sthala Purāṇas' }, style: { width: 120, height: 32, background: '#fff', border: '1px solid #fbc02d', borderRadius: 6 } },
  // ITIHASAS sub
  { id: 'ramayana', position: { x: 1400, y: 320 }, data: { label: 'Rāmāyaṇa' }, style: { width: 100, height: 32, background: '#fff', border: '1px solid #fbc02d', borderRadius: 6 } },
  { id: 'mahabharata', position: { x: 1400, y: 360 }, data: { label: 'Mahābhārata' }, style: { width: 100, height: 32, background: '#fff', border: '1px solid #fbc02d', borderRadius: 6 } },
  { id: 'visnu', position: { x: 1420, y: 400 }, data: { label: 'Viṣṇu Sahasranāma' }, style: { width: 120, height: 32, background: '#fff', border: '1px solid #fbc02d', borderRadius: 6 } },
   { id: 'gita', position: { x: 1420, y: 440 }, data: { label: 'Bhagavad Gītā' }, style: { width: 120, height: 36, background: '#c8e6c9', border: '2px solid #388e3c', borderRadius: 6, fontWeight: 'bold' } },
  // TANTRAS sub
  { id: 'tamasic', position: { x: 1550, y: 320 }, data: { label: 'Tāmasic' }, style: { width: 90, height: 32, background: '#fff', border: '1px solid #fbc02d', borderRadius: 6 } },
  { id: 'rajasic', position: { x: 1550, y: 360 }, data: { label: 'Rājasic' }, style: { width: 90, height: 32, background: '#fff', border: '1px solid #fbc02d', borderRadius: 6 } },
   { id: 'sattvic', position: { x: 1550, y: 400 }, data: { label: 'Sāttvic' }, style: { width: 90, height: 32, background: '#fff', border: '1px solid #fbc02d', borderRadius: 6 } },
  // AGAMAS sub (closer, vertically aligned)
  { id: 'shakta', position: { x: 1650, y: 300 }, data: { label: 'Śākta' }, style: { width: 90, height: 32, background: '#fff', border: '1px solid #fbc02d', borderRadius: 6 } },
  { id: 'shaiva', position: { x: 1650, y: 340 }, data: { label: 'Śaiva' }, style: { width: 90, height: 32, background: '#fff', border: '1px solid #fbc02d', borderRadius: 6 } },
  { id: 'vaisnava', position: { x: 1650, y: 380 }, data: { label: 'Vaiṣṇava' }, style: { width: 90, height: 32, background: '#fff', border: '1px solid #fbc02d', borderRadius: 6 } },
  { id: 'vaikhanasa', position: { x: 1720, y: 420 }, data: { label: 'Vaikhānasa' }, style: { width: 90, height: 32, background: '#fff', border: '1px solid #fbc02d', borderRadius: 6 } },
  { id: 'pancharatra', position: { x: 1720, y: 460 }, data: { label: 'Pāñcarātra' }, style: { width: 90, height: 32, background: '#fff', border: '1px solid #fbc02d', borderRadius: 6 } },
  // BOTTOM PHILOSOPHIES
  { id: 'advaita', position: { x: 800, y: 700 }, data: { label: 'Advaita' }, style: { width: 100, height: 36, background: '#ede7f6', border: '1px solid #7e57c2', borderRadius: 6, fontWeight: 'bold' } },
  { id: 'kevala', position: { x: 600, y: 860 }, data: { label: 'Kevala-Advaita (Śaṅkara)' }, style: { width: 160, height: 32, background: '#fff', border: '1px solid #7e57c2', borderRadius: 6, fontSize: 13 } },
  { id: 'siva', position: { x: 600, y: 900 }, data: { label: 'Śiva-advaita (Kashmir Śaivism)' }, style: { width: 180, height: 52, background: '#fff', border: '1px solid #7e57c2', borderRadius: 6, fontSize: 13 } },
  { id: 'suddha', position: { x: 800, y: 860 }, data: { label: 'Śuddha-advaita (Vallabha)' }, style: { width: 160, height: 32, background: '#fff', border: '1px solid #7e57c2', borderRadius: 6, fontSize: 13 } },
  { id: 'visita', position: { x: 800, y: 900 }, data: { label: 'Viśiṣṭa-Advaita (Rāmānuja)' }, style: { width: 160, height: 52, background: '#fff', border: '1px solid #7e57c2', borderRadius: 6, fontSize: 13 } },
  { id: 'bheda', position: { x: 1000, y: 700 }, data: { label: 'Bheda-abheda' }, style: { width: 120, height: 36, background: '#ede7f6', border: '1px solid #7e57c2', borderRadius: 6, fontWeight: 'bold' } },
  { id: 'bheda-bhaskara', position: { x: 1000, y: 860 }, data: { label: 'Bheda-abheda (Bhaskara)' }, style: { width: 160, height: 32, background: '#fff', border: '1px solid #7e57c2', borderRadius: 6, fontSize: 13 } },
  { id: 'bheda-nimbarka', position: { x: 1200, y: 860 }, data: { label: 'Bheda-abheda (Nimbarka)' }, style: { width: 160, height: 32, background: '#fff', border: '1px solid #7e57c2', borderRadius: 6, fontSize: 13 } },
  { id: 'acintya', position: { x: 1400, y: 860 }, data: { label: 'Acintya Bheda-abheda (Lord Caitanya)' }, style: { width: 220, height: 52, background: '#fff', border: '1px solid #7e57c2', borderRadius: 6, fontSize: 13 } },
  { id: 'dvaita', position: { x: 1200, y: 700 }, data: { label: 'Dvaita (Mādhva)' }, style: { width: 140, height: 36, background: '#ede7f6', border: '1px solid #7e57c2', borderRadius: 6, fontWeight: 'bold' } },
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
  const vedicRef = useRef<HTMLDivElement>(null);
  const vaisnavaRef = useRef<HTMLDivElement>(null);
  const classicalRef = useRef<HTMLDivElement>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

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
      if (typeof window !== 'undefined') {
        window.open(route, '_blank', 'noopener,noreferrer');
      }
    }
  };

  const openLibraryTree = (category: string, subcategory?: string) => {
    const params = new URLSearchParams({ category });
    if (subcategory) {
      params.set('subcategory', subcategory);
    }
    const targetUrl = `/library-tree?${params.toString()}`;
    if (typeof window !== 'undefined') {
      window.open(targetUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const onSecondaryNodeClick = (_: any, node: any) => {
    const map: Record<string, { category: string; subcategory?: string }> = {
      vaisnava: { category: 'Vaisnava Literature' },
      parampara: { category: 'Vaisnava Literature', subcategory: 'Parampara' },
      acharya: { category: 'Vaisnava Literature', subcategory: 'Acharya' },
      classical: { category: 'Classical Literature' },
      sanskrit: { category: 'Classical Literature', subcategory: 'Sanskrit' },
      regional: { category: 'Classical Literature', subcategory: 'Regional' },
    };

    const target = map[node.id];
    if (target) {
      openLibraryTree(target.category, target.subcategory);
    }
  };

  const handleNavigate = (section: 'vedic' | 'vaisnava' | 'classical') => {
    const refs = {
      vedic: vedicRef,
      vaisnava: vaisnavaRef,
      classical: classicalRef,
    };
    refs[section].current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setIsMobileMenuOpen(false); // Close mobile menu after navigation
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100%',
        maxWidth: '100%',
        overflowX: 'hidden',
        background: 'linear-gradient(135deg, #f5e6d3 0%, #e8d5b7 50%, #d4a574 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
      }}
    >
      
      {/* Fixed Navigation Bar */}
      <div
        style={{
          position: 'sticky',
          top: 0,
          width: '100%',
          zIndex: 100,
          background: 'linear-gradient(135deg, #2c3e50 0%, #34495e 100%)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        }}
      >
        <div
          style={{
            maxWidth: '1400px',
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            padding: '12px 16px',
            gap: '16px',
            position: 'relative',
          }}
        >
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: '#fff',
            fontSize: '16px',
            fontWeight: 600,
          }}>
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="18" 
              height="18" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
            </svg>
            <span style={{ fontSize: '14px' }}>Śāstra Nidhi</span>
          </div>
          
          {/* Desktop Navigation */}
          <nav 
            className="hidden md:flex"
            style={{
              gap: '16px',
              flex: 1,
            }}
          >
            <button
              onClick={() => handleNavigate('vedic')}
              style={{
                padding: '8px 12px',
                background: 'transparent',
                border: 'none',
                color: '#fff',
                fontSize: '14px',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                borderRadius: '6px',
                whiteSpace: 'nowrap',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
              }}
            >
              Vedic Literature
            </button>
            <button
              onClick={() => handleNavigate('vaisnava')}
              style={{
                padding: '8px 12px',
                background: 'transparent',
                border: 'none',
                color: '#fff',
                fontSize: '14px',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                borderRadius: '6px',
                whiteSpace: 'nowrap',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
              }}
            >
              Vaisnava Literature
            </button>
            <button
              onClick={() => handleNavigate('classical')}
              style={{
                padding: '8px 12px',
                background: 'transparent',
                border: 'none',
                color: '#fff',
                fontSize: '14px',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                borderRadius: '6px',
                whiteSpace: 'nowrap',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
              }}
            >
              Classical Literature
            </button>
          </nav>

          {/* Desktop Login Button */}
          <button
            onClick={() => router.push('/')}
            className="hidden md:block"
            style={{
              padding: '8px 20px',
              background: 'linear-gradient(90deg, #1abc9c 0%, #16a085 100%)',
              border: 'none',
              borderRadius: '8px',
              color: '#fff',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
              whiteSpace: 'nowrap',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'linear-gradient(90deg, #16a085 0%, #1abc9c 100%)';
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'linear-gradient(90deg, #1abc9c 0%, #16a085 100%)';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 6px rgba(0,0,0,0.2)';
            }}
          >
            Login / Sign Up
          </button>

          {/* Mobile Hamburger Menu */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden"
            style={{
              marginLeft: 'auto',
              background: 'transparent',
              border: 'none',
              color: '#fff',
              cursor: 'pointer',
              padding: '8px',
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {isMobileMenuOpen ? (
                <path d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path d="M3 12h18M3 6h18M3 18h18" />
              )}
            </svg>
          </button>
        </div>

      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div
          onClick={() => setIsMobileMenuOpen(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 110,
          }}
        />
      )}

      {/* Mobile Side Drawer Menu */}
      <div
        className="md:hidden"
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: '280px',
          background: 'linear-gradient(135deg, #2c3e50 0%, #34495e 100%)',
          boxShadow: '-4px 0 12px rgba(0,0,0,0.3)',
          zIndex: 120,
          transform: isMobileMenuOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.3s ease-in-out',
          display: 'flex',
          flexDirection: 'column',
          padding: '60px 0 20px 0',
        }}
      >
        <button
          onClick={() => handleNavigate('vedic')}
          style={{
            width: '100%',
            padding: '16px 24px',
            background: 'transparent',
            border: 'none',
            borderBottom: '1px solid rgba(255,255,255,0.1)',
            color: '#fff',
            fontSize: '15px',
            fontWeight: 500,
            cursor: 'pointer',
            textAlign: 'left',
            transition: 'background 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
          }}
        >
          Vedic Literature
        </button>
        <button
          onClick={() => handleNavigate('vaisnava')}
          style={{
            width: '100%',
            padding: '16px 24px',
            background: 'transparent',
            border: 'none',
            borderBottom: '1px solid rgba(255,255,255,0.1)',
            color: '#fff',
            fontSize: '15px',
            fontWeight: 500,
            cursor: 'pointer',
            textAlign: 'left',
            transition: 'background 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
          }}
        >
          Vaisnava Literature
        </button>
        <button
          onClick={() => handleNavigate('classical')}
          style={{
            width: '100%',
            padding: '16px 24px',
            background: 'transparent',
            border: 'none',
            borderBottom: '1px solid rgba(255,255,255,0.1)',
            color: '#fff',
            fontSize: '15px',
            fontWeight: 500,
            cursor: 'pointer',
            textAlign: 'left',
            transition: 'background 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
          }}
        >
          Classical Literature
        </button>
        <button
          onClick={() => router.push('/')}
          style={{
            margin: '24px 16px 16px 16px',
            padding: '12px 20px',
            background: 'linear-gradient(90deg, #1abc9c 0%, #16a085 100%)',
            border: 'none',
            borderRadius: '8px',
            color: '#fff',
            fontSize: '15px',
            fontWeight: 600,
            cursor: 'pointer',
            boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
          }}
        >
          Login / Sign Up
        </button>
      </div>
      <div
        style={{
          width: '100%',
          maxWidth: '1200px',
          margin: '0 auto',
          paddingTop: '16px',
          paddingBottom: 0,
          paddingLeft: '8px',
          paddingRight: '8px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <div
          style={{
            width: '100%',
            margin: '8px 0 16px 0',
            padding: '8px 12px',
            background: 'linear-gradient(90deg,#e3f0ff 60%,#c7e0ff 100%)',
            borderRadius: 12,
            boxShadow: '0 2px 12px #7bb0ff33',
            fontFamily: 'inherit',
            color: '#1a237e',
            fontSize: 14,
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
          <span style={{ color: '#6d4c00', fontSize: 14 }}>
            You can select any topic to read from the different literature. Without login you can read and if you login you get many advantages like bookmarks, reading progress, and more!
          </span>
        </div>
        <style>{`
          @keyframes marquee {
            0% { transform: translateX(0); }
            100% { transform: translateX(-100%); }
          }
        `}</style>
      </div>

        {/* Vedic Knowledge Section */}
        <div
          ref={vedicRef}
          style={{
            width: '100%',
            maxWidth: '1400px',
            height: window.innerWidth < 768 ? '500px' : '800px',
            background: 'linear-gradient(180deg,#fffde4 0%,#ffe9ca 100%)',
            borderRadius: 12,
            boxShadow: '0 2px 16px #e0c68a55',
            margin: 'auto',
            overflow: 'auto',
            cursor: 'default',
            WebkitOverflowScrolling: 'touch',
            touchAction: 'auto',
            scrollMarginTop: '70px',
          }}
        >
          {/* Set initial zoom to 1.3 for better readability */}
          <ReactFlow
            nodes={nodes}
            edges={edges}
            fitView
            minZoom={0.3}
            maxZoom={2.5}
            defaultViewport={{ x: 0, y: 0, zoom: window.innerWidth < 768 ? 0.5 : 1.3 }}
            panOnDrag={window.innerWidth < 768}
            zoomOnScroll={window.innerWidth < 768}
            zoomOnPinch={window.innerWidth < 768}
            panOnScroll={window.innerWidth < 768}
            nodesDraggable={false}
            nodesConnectable={false}
            elementsSelectable={true}
            selectionOnDrag={false}
            proOptions={{ hideAttribution: true }}
            defaultEdgeOptions={{ type: 'straight' }}
            onNodeClick={onNodeClick}
            style={{ minWidth: 700 }}
          >
            <Background color="#fbc02d22" gap={32} />
            {/* MiniMap removed as per request */}
            {/* Controls removed: no zoom in/out UI */}
          </ReactFlow>
        </div>


        {/* Vaisnava Literature React Flow Diagram */}
        <div
          style={{
            width: '100%',
            maxWidth: '1440px',
            minHeight: '320px',
            margin: '32px auto 0 auto',
            display: 'flex',
            flexDirection: window.innerWidth < 768 ? 'column' : 'row',
            gap: window.innerWidth < 768 ? '16px' : '0',
            justifyContent: 'flex-start',
            alignItems: 'flex-start',
          }}
        >
          {/* Vaisnava Literature Box (left) */}
          <div ref={vaisnavaRef} style={{
            scrollMarginTop: '70px',
            width: '100%',
            maxWidth: '1400px',
            height: '320px',
            background: 'linear-gradient(180deg,#fffde4 0%,#ffe9ca 100%)',
            border: '2px solid #1abc9c',
            borderRadius: 12,
            boxShadow: '0 2px 16px #e0c68a55',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 0,
          }}>
            <div style={{ width: '100%', height: '280px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ReactFlow
                nodes={[
                  {
                    id: 'vaisnava',
                    position: { x: 450, y: 0 },
                    data: { label: (
                      <span style={{ fontWeight: 700, fontSize: 24, color: '#1a237e' }}>
                        Vaishnava Manjusha <span style={{ fontWeight: 400, fontSize: 18 }}></span>
                      </span>
                    ) },
                    style: {
                      width: 340,
                      height: 80,
                      background: 'linear-gradient(90deg,#e3f0ff 60%,#c7e0ff 100%)',
                      border: '2.5px solid #1976d2',
                      borderRadius: 16,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 2px 12px #7bb0ff33',
                    },
                  },
                  {
                    id: 'parampara',
                    position: { x: 550, y: 120 },
                    data: { label: <span style={{ fontWeight: 600, fontSize: 20, color: '#1a237e' }}>Parampara</span> },
                    style: {
                      width: 140,
                      height: 48,
                      background: '#e8f5e9',
                      border: '2px solid #388e3c',
                      borderRadius: 12,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    },
                  },
                  {
                    id: 'sri',
                    position: { x: 250, y: 260 },
                    data: { label: <span style={{ fontWeight: 600, fontSize: 18, color: '#1a237e' }}>Sri Sampradaya</span> },
                    style: {
                      width: 200,
                      height: 40,
                      background: '#fff',
                      border: '2px solid #388e3c',
                      borderRadius: 12,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    },
                  },
                  {
                    id: 'madhava',
                    position: { x: 480, y: 260 },
                    data: { label: <span style={{ fontWeight: 600, fontSize: 18, color: '#1a237e' }}>Madhava Sampradaya</span> },
                    style: {
                      width: 200,
                      height: 40,
                      background: '#fff',
                      border: '2px solid #388e3c',
                      borderRadius: 12,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    },
                  },
                  {
                    id: 'rudra',
                    position: { x: 700, y: 260 },
                    data: { label: <span style={{ fontWeight: 600, fontSize: 18, color: '#1a237e' }}>Rudra Sampradaya</span> },
                    style: {
                      width: 200,
                      height: 40,
                      background: '#fff',
                      border: '2px solid #388e3c',
                      borderRadius: 12,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    },
                  },
                  {
                    id: 'kumara',
                    position: { x: 950, y: 260 },
                    data: { label: <span style={{ fontWeight: 600, fontSize: 18, color: '#1a237e' }}>Kumara Sampradaya</span> },
                    style: {
                      width: 200,
                      height: 40,
                      background: '#fff',
                      border: '2px solid #388e3c',
                      borderRadius: 12,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    },
                  },
                ]}
                edges={[
                  { id: 'e1', source: 'vaisnava', target: 'parampara', type: 'straight' },
                  { id: 'e2', source: 'parampara', target: 'sri', type: 'straight' },
                  { id: 'e3', source: 'parampara', target: 'madhava', type: 'straight' },
                  { id: 'e4', source: 'parampara', target: 'rudra', type: 'straight' },
                  { id: 'e5', source: 'parampara', target: 'kumara', type: 'straight' },
                ]}
                fitView
                panOnDrag={window.innerWidth < 768}
                zoomOnScroll={window.innerWidth < 768}
                zoomOnPinch={window.innerWidth < 768}
                panOnScroll={false}
                nodesDraggable={false}
                nodesConnectable={false}
                elementsSelectable={false}
                selectionOnDrag={false}
                proOptions={{ hideAttribution: true }}
                defaultEdgeOptions={{ type: 'straight' }}
                onNodeClick={onSecondaryNodeClick}
                style={{ width: '700px', height: '180px', margin: '0 auto' }}
              >
                <Background color="#fbc02d22" gap={32} />
              </ReactFlow>
            </div>
          </div>
        </div>
        
          {/* Classical Literature Box (right) */}
          <div ref={classicalRef} style={{
            scrollMarginTop: '70px',
            width: '100%',
            maxWidth: '1400px',
            height: '320px',
            margin: '32px auto 0 auto',
            background: 'linear-gradient(180deg,#fffde4 0%,#ffe9ca 100%)',
            border: '2px solid #1abc9c',
            borderRadius: 12,
            boxShadow: '0 2px 16px #e0c68a55',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 0,
          }}>
            <div style={{ width: '100%', height: '280px' }}>
              <ReactFlow
                nodes={[
                  {
                    id: 'classical',
                    position: { x: 450, y: 0 },
                    data: { label: (
                      <span style={{ fontWeight: 700, fontSize: 24, color: '#1a237e' }}>
                        Classical Literature
                      </span>
                    ) },
                    style: {
                      width: 200,
                      height: 150,
                      background: 'linear-gradient(90deg,#e3f0ff 60%,#c7e0ff 100%)',
                      border: '2.5px solid #1976d2',
                      borderRadius: 16,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 2px 12px #7bb0ff33',
                    },
                  },
                  {
                    id: 'sanskrit',
                    position: { x: 350, y: 220 },
                    data: { label: <span style={{ fontWeight: 600, fontSize: 20, color: '#1a237e' }}>Sanskrit</span> },
                    style: {
                      width: 140,
                      height: 48,
                      background: '#e8f5e9',
                      border: '2px solid #388e3c',
                      borderRadius: 12,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    },
                  },
                  {
                    id: 'regional',
                    position: { x: 650, y: 220 },
                    data: { label: <span style={{ fontWeight: 600, fontSize: 20, color: '#1a237e' }}>Regional</span> },
                    style: {
                      width: 120,
                      height: 48,
                      background: '#fff',
                      border: '2px solid #388e3c',
                      borderRadius: 12,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    },
                  },
                ]}
                edges={[
                  { id: 'e1', source: 'classical', target: 'sanskrit', type: 'straight' },
                  { id: 'e2', source: 'classical', target: 'regional', type: 'straight' },
                ]}
                fitView
                panOnDrag={window.innerWidth < 768}
                zoomOnScroll={window.innerWidth < 768}
                zoomOnPinch={window.innerWidth < 768}
                panOnScroll={false}
                nodesDraggable={false}
                nodesConnectable={false}
                elementsSelectable={false}
                selectionOnDrag={false}
                proOptions={{ hideAttribution: true }}
                defaultEdgeOptions={{ type: 'straight' }}
                onNodeClick={onSecondaryNodeClick}
                style={{ width: '100%', height: '180px' }}
              >
                <Background color="#fbc02d22" gap={32} />
              </ReactFlow>
            </div>
          </div>
        {/* Donor/Acknowledgment Section */}
        <div style={{
          maxWidth: '1400px',
          width: '100%',
          margin: '32px auto',
          display: 'flex',
          justifyContent: 'center',
          padding: window.innerWidth < 768 ? '0 8px' : '0',
        }}>
          <div style={{
            width: '100%',
            maxWidth: '1400px',
            background: 'linear-gradient(180deg,#fffde4 0%,#ffe9ca 100%)',
            border: '2px solid #1abc9c',
            padding: window.innerWidth < 768 ? '16px' : '20px 32px',
            borderRadius: 12,
            fontSize: window.innerWidth < 768 ? 14 : 18,
            color: '#1a237e',
            display: 'flex',
            flexDirection: window.innerWidth < 768 ? 'column' : 'row',
            alignItems: window.innerWidth < 768 ? 'stretch' : 'flex-start',
            gap: window.innerWidth < 768 ? 16 : 32,
            boxShadow: '0 2px 16px #e0c68a55',
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
              padding: window.innerWidth < 768 ? '12px 24px' : '14px 36px',
              fontSize: window.innerWidth < 768 ? 16 : 20,
              fontWeight: 700,
              cursor: 'pointer',
              marginLeft: window.innerWidth < 768 ? 0 : 16,
              boxShadow: '0 2px 12px #1976d233',
              letterSpacing: 0.5,
              transition: 'background 0.3s',
              position: 'relative',
              zIndex: 1,
              width: window.innerWidth < 768 ? '100%' : 'auto',
            }} onClick={() => router.push('/sastranidhi/donate')}
            >Donate</button>
          </div>
        </div>
      </div>
    </div>
  );
}
