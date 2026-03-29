'use client';
import React, { useRef } from 'react';
import ReactFlow, { Background } from 'reactflow';
import 'reactflow/dist/style.css';
import { useRouter } from 'next/navigation';
import dagre from 'dagre';

// ─── Dagre layout ────────────────────────────────────────────────────────────
const NODE_W = 180;
const NODE_H = 52;

function layout(nodes: any[], edges: any[], dir = 'LR') {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: dir, nodesep: 28, ranksep: 90, marginx: 30, marginy: 30 });
  nodes.forEach((n) => g.setNode(n.id, { width: n._w ?? NODE_W, height: n._h ?? NODE_H }));
  edges.forEach((e) => g.setEdge(e.source, e.target));
  dagre.layout(g);

  const isLR = dir === 'LR';
  return {
    nodes: nodes.map((n) => {
      const p = g.node(n.id);
      return {
        ...n,
        position: { x: p.x - (n._w ?? NODE_W) / 2, y: p.y - (n._h ?? NODE_H) / 2 },
        // Tell ReactFlow exactly which side handles sit on
        sourcePosition: isLR ? 'right'  : 'bottom',
        targetPosition: isLR ? 'left'   : 'top',
      };
    }),
    // Use 'step' so edges bend at right angles — clean orthogonal routing
    edges: edges.map((e) => ({ ...e, type: 'step' })),
  };
}

// ─── Level colour palette ─────────────────────────────────────────────────────
// Each depth in the LR tree gets a consistent bg + border + text colour
// L0 = root | L1 = ŚRUTI/SMṚTI | L2 = category headers | L3 = leaf children
// L4 = Vedānta school headers  | L5 = Vedānta sub-school leaves
const C = {
  L0: { bg: 'linear-gradient(135deg,#1a237e 0%,#283593 100%)', border: '#7986cb', text: '#fff'    },
  L1: { bg: 'linear-gradient(135deg,#0d47a1 0%,#1565c0 100%)', border: '#64b5f6', text: '#fff'    },
  L2: { bg: 'linear-gradient(135deg,#1b5e20 0%,#2e7d32 100%)', border: '#81c784', text: '#fff'    },
  L3: { bg: '#e8f5e9',                                          border: '#43a047', text: '#1b5e20' },
  L4: { bg: 'linear-gradient(135deg,#4a148c 0%,#6a1b9a 100%)', border: '#ce93d8', text: '#fff'    },
  L5: { bg: '#f3e5f5',                                          border: '#9c27b0', text: '#4a148c' },
  gita: { bg: 'linear-gradient(135deg,#b71c1c 0%,#c62828 100%)', border: '#ef9a9a', text: '#fff'  },
};

// ─── Style helpers — fonts are 1.5× the originals ────────────────────────────
// originals: root 20 → 30 | section 16 → 24 | category 14 → 21
//            leaf 13 → 19.5 (~20) | philo 14 → 21 | philoSub 13 → 20

const base = (extra: React.CSSProperties = {}): React.CSSProperties => ({
  borderRadius: 8,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  textAlign: 'center' as const,
  padding: '6px 10px',
  lineHeight: 1.35,
  boxSizing: 'border-box' as const,
  ...extra,
});

const styles = {
  // L0 — root
  root: base({
    width: 280, height: 76,
    background: C.L0.bg, border: `3px solid ${C.L0.border}`,
    borderRadius: 18, fontWeight: 800, fontSize: 30, color: C.L0.text,
    boxShadow: '0 3px 16px #0003',
  }),

  // L1 — ŚRUTI / SMṚTI (both same level colour)
  section: () => base({
    width: 165, height: 60,
    background: C.L1.bg, border: `2.5px solid ${C.L1.border}`,
    borderRadius: 10, fontWeight: 700, fontSize: 24, color: C.L1.text,
    boxShadow: '0 2px 10px #0002',
  }),

  // L2 — category headers (UPAVEDAS, VEDĀṄGAS, DARŚANAS, PURĀṆAS, ITIHĀSAS, TANTRAS, ĀGAMAS + VEDAS)
  category: () => base({
    width: 210, height: 60,
    background: C.L2.bg, border: `2.5px solid ${C.L2.border}`,
    borderRadius: 10, fontWeight: 700, fontSize: 21, color: C.L2.text,
    boxShadow: '0 2px 10px #0002',
  }),

  // L3 — leaf children of L2 categories
  leaf: () => base({
    width: 240, height: 66,
    background: C.L3.bg, border: `2px solid ${C.L3.border}`,
    borderRadius: 8, fontSize: 20, color: C.L3.text,
    whiteSpace: 'pre-line' as const,
  }),

  // L4 — Vedānta school headers
  philo: () => base({
    width: 210, height: 60,
    background: C.L4.bg, border: `2.5px solid ${C.L4.border}`,
    borderRadius: 10, fontWeight: 700, fontSize: 21, color: C.L4.text,
    boxShadow: '0 2px 10px #0002',
  }),

  // L5 — Vedānta sub-school leaves
  philoSub: () => base({
    width: 255, height: 66,
    background: C.L5.bg, border: `2px solid ${C.L5.border}`,
    borderRadius: 8, fontSize: 20, color: C.L5.text,
    whiteSpace: 'pre-line' as const,
  }),

  // Special — Bhagavad Gītā
  gita: base({
    width: 240, height: 60,
    background: C.gita.bg, border: `2.5px solid ${C.gita.border}`,
    borderRadius: 10, fontWeight: 700, fontSize: 21, color: C.gita.text,
    boxShadow: '0 2px 10px #0002',
  }),
};

// ─── Nodes ────────────────────────────────────────────────────────────────────
const rawNodes: any[] = [
  // L0
  { id: 'vedic',           data: { label: 'Vedic Literature' },                       style: styles.root,        _w: 280, _h: 76  },

  // L1
  { id: 'sruti',           data: { label: 'ŚRUTI' },                                  style: styles.section(),   _w: 165, _h: 60  },
  { id: 'smrti',           data: { label: 'SMṚTI' },                                  style: styles.section(),   _w: 165, _h: 60  },

  // L2 — SRUTI branch (VEDAS treated as a category since it has children)
  { id: 'vedas',           data: { label: 'VEDAS\nṚg · Yajur · Sāma · Atharva' },    style: styles.category(),  _w: 210, _h: 60  },

  // L3 — VEDAS children
  { id: 'samhitas',        data: { label: 'Saṃhitās\nmantras' },                      style: styles.leaf(),      _w: 240, _h: 66  },
  { id: 'brahmanas',       data: { label: 'Brāhmaṇas\nRitual explanation' },          style: styles.leaf(),      _w: 240, _h: 66  },
  { id: 'aranyakas',       data: { label: 'Āraṇyakas\nEsoteric explanation' },        style: styles.leaf(),      _w: 240, _h: 66  },
  { id: 'upanishads',      data: { label: 'Upaniṣads\nJñāna-kāṇḍa' },                style: styles.leaf(),      _w: 240, _h: 66  },

  // L2 — SMṚTI categories
  { id: 'upvedas',         data: { label: 'UPAVEDAS' },                               style: styles.category(),  _w: 210, _h: 60  },
  { id: 'vedangas',        data: { label: 'VEDĀṄGAS' },                               style: styles.category(),  _w: 210, _h: 60  },
  { id: 'darshanas',       data: { label: 'ṢAḌ DARŚANAS' },                           style: styles.category(),  _w: 210, _h: 60  },
  { id: 'puranas',         data: { label: 'PURĀṆAS' },                                style: styles.category(),  _w: 210, _h: 60  },
  { id: 'itihasas',        data: { label: 'ITIHĀSAS' },                               style: styles.category(),  _w: 210, _h: 60  },
  { id: 'tantras',         data: { label: 'TANTRAS' },                                style: styles.category(),  _w: 210, _h: 60  },
  { id: 'agamas',          data: { label: 'ĀGAMAS' },                                 style: styles.category(),  _w: 210, _h: 60  },

  // L3 — Upavedas children
  { id: 'ayurveda',        data: { label: 'Āyurveda' },                               style: styles.leaf(),      _w: 240, _h: 66  },
  { id: 'dhanurveda',      data: { label: 'Dhanurveda' },                             style: styles.leaf(),      _w: 240, _h: 66  },
  { id: 'gandharvaveda',   data: { label: 'Gāndharvaveda' },                          style: styles.leaf(),      _w: 240, _h: 66  },
  { id: 'sthapathyaveda',  data: { label: 'Sthāpatyaveda' },                          style: styles.leaf(),      _w: 240, _h: 66  },
  { id: 'arthashastra',    data: { label: 'Arthaśāstra' },                            style: styles.leaf(),      _w: 240, _h: 66  },

  // L3 — Vedangas children
  { id: 'kalpa',           data: { label: 'Kalpa\nritual details' },                  style: styles.leaf(),      _w: 240, _h: 66  },
  { id: 'siksa',           data: { label: 'Śikṣā\npronunciation' },                   style: styles.leaf(),      _w: 240, _h: 66  },
  { id: 'vyakarana',       data: { label: 'Vyākaraṇa\ngrammar' },                     style: styles.leaf(),      _w: 240, _h: 66  },
  { id: 'nirukta',         data: { label: 'Nirukta\netymology' },                     style: styles.leaf(),      _w: 240, _h: 66  },
  { id: 'chandas',         data: { label: 'Chandas\nmeters' },                        style: styles.leaf(),      _w: 240, _h: 66  },
  { id: 'jyotisa',         data: { label: 'Jyotiṣa\nastronomy' },                     style: styles.leaf(),      _w: 240, _h: 66  },

  // L3 — Darshanas children
  { id: 'sankhya',         data: { label: 'Sāṅkhya\n(Kapila)' },                      style: styles.leaf(),      _w: 240, _h: 66  },
  { id: 'yoga',            data: { label: 'Yoga\n(Patañjali)' },                      style: styles.leaf(),      _w: 240, _h: 66  },
  { id: 'nyaya',           data: { label: 'Nyāya\n(Gautama)' },                       style: styles.leaf(),      _w: 240, _h: 66  },
  { id: 'vaisesika',       data: { label: 'Vaiśeṣika\n(Kaṇāda)' },                    style: styles.leaf(),      _w: 240, _h: 66  },
  { id: 'mimamsa',         data: { label: 'Mīmāṃsā\n(Jaimini)' },                     style: styles.leaf(),      _w: 240, _h: 66  },
  { id: 'vedanta',         data: { label: 'Vedānta\n(Vyāsa)' },                       style: styles.leaf(),      _w: 240, _h: 66  },

  // L3 — Puranas children
  { id: 'maha',            data: { label: 'Mahā Purāṇas 18' },                        style: styles.leaf(),      _w: 240, _h: 66  },
  { id: 'upa',             data: { label: 'Upa Purāṇas 18' },                         style: styles.leaf(),      _w: 240, _h: 66  },
  { id: 'aupa',            data: { label: 'Aupa Purāṇas' },                           style: styles.leaf(),      _w: 240, _h: 66  },
  { id: 'aupupa',          data: { label: 'Aupupa Purāṇas' },                         style: styles.leaf(),      _w: 240, _h: 66  },
  { id: 'sthala',          data: { label: 'Sthala Purāṇas' },                         style: styles.leaf(),      _w: 240, _h: 66  },

  // L3 — Itihasas children
  { id: 'ramayana',        data: { label: 'Rāmāyaṇa' },                               style: styles.leaf(),      _w: 240, _h: 66  },
  { id: 'mahabharata',     data: { label: 'Mahābhārata' },                            style: styles.leaf(),      _w: 240, _h: 66  },
  { id: 'visnu',           data: { label: 'Viṣṇu Sahasranāma' },                      style: styles.leaf(),      _w: 240, _h: 66  },
  { id: 'gita',            data: { label: 'Bhagavad Gītā' },                          style: styles.gita,        _w: 240, _h: 60  },

  // L3 — Tantras children
  { id: 'tamasic',         data: { label: 'Tāmasic' },                                style: styles.leaf(),      _w: 240, _h: 66  },
  { id: 'rajasic',         data: { label: 'Rājasic' },                                style: styles.leaf(),      _w: 240, _h: 66  },
  { id: 'sattvic',         data: { label: 'Sāttvic' },                                style: styles.leaf(),      _w: 240, _h: 66  },

  // L3 — Agamas children
  { id: 'shakta',          data: { label: 'Śākta' },                                  style: styles.leaf(),      _w: 240, _h: 66  },
  { id: 'shaiva',          data: { label: 'Śaiva' },                                  style: styles.leaf(),      _w: 240, _h: 66  },
  { id: 'vaisnava',        data: { label: 'Vaiṣṇava' },                               style: styles.leaf(),      _w: 240, _h: 66  },
  { id: 'vaikhanasa',      data: { label: 'Vaikhānasa' },                             style: styles.leaf(),      _w: 240, _h: 66  },
  { id: 'pancharatra',     data: { label: 'Pāñcarātra' },                             style: styles.leaf(),      _w: 240, _h: 66  },

  // L4 — Vedānta school headers
  { id: 'advaita',         data: { label: 'Advaita' },                                style: styles.philo(),     _w: 210, _h: 60  },
  { id: 'bheda',           data: { label: 'Bheda-abheda' },                           style: styles.philo(),     _w: 210, _h: 60  },
  { id: 'dvaita',          data: { label: 'Dvaita\n(Mādhva)' },                       style: styles.philo(),     _w: 210, _h: 60  },

  // L5 — Advaita sub-schools
  { id: 'kevala',          data: { label: 'Kevala-Advaita\n(Śaṅkara)' },             style: styles.philoSub(),  _w: 255, _h: 66  },
  { id: 'siva_adv',        data: { label: 'Śiva-advaita\n(Kashmir Śaivism)' },        style: styles.philoSub(),  _w: 255, _h: 66  },
  { id: 'suddha',          data: { label: 'Śuddha-advaita\n(Vallabha)' },            style: styles.philoSub(),  _w: 255, _h: 66  },
  { id: 'visita',          data: { label: 'Viśiṣṭādvaita\n(Rāmānuja)' },             style: styles.philoSub(),  _w: 255, _h: 66  },

  // L5 — Bheda-abheda sub-schools
  { id: 'bheda_bhaskara',  data: { label: 'Bheda-abheda\n(Bhāskara)' },              style: styles.philoSub(),  _w: 255, _h: 66  },
  { id: 'bheda_nimbarka',  data: { label: 'Bheda-abheda\n(Nimbārka)' },              style: styles.philoSub(),  _w: 255, _h: 66  },
  { id: 'acintya',         data: { label: 'Acintya Bheda-abheda\n(Lord Caitanya)' }, style: styles.philoSub(),  _w: 255, _h: 66  },
];

// ─── Edges ────────────────────────────────────────────────────────────────────
const rawEdges: any[] = [
  { id: 'e-root-sruti',  source: 'vedic',       target: 'sruti' },
  { id: 'e-root-smrti',  source: 'vedic',       target: 'smrti' },
  { id: 'e-sruti-vedas', source: 'sruti',       target: 'vedas' },
  { id: 'e-v-sam',       source: 'vedas',       target: 'samhitas' },
  { id: 'e-v-bra',       source: 'vedas',       target: 'brahmanas' },
  { id: 'e-v-ara',       source: 'vedas',       target: 'aranyakas' },
  { id: 'e-v-upa',       source: 'vedas',       target: 'upanishads' },
  { id: 'e-s-upv',       source: 'smrti',       target: 'upvedas' },
  { id: 'e-s-vga',       source: 'smrti',       target: 'vedangas' },
  { id: 'e-s-dar',       source: 'smrti',       target: 'darshanas' },
  { id: 'e-s-pur',       source: 'smrti',       target: 'puranas' },
  { id: 'e-s-iti',       source: 'smrti',       target: 'itihasas' },
  { id: 'e-s-tan',       source: 'smrti',       target: 'tantras' },
  { id: 'e-s-aga',       source: 'smrti',       target: 'agamas' },
  { id: 'e-uv-ay',       source: 'upvedas',     target: 'ayurveda' },
  { id: 'e-uv-dh',       source: 'upvedas',     target: 'dhanurveda' },
  { id: 'e-uv-ga',       source: 'upvedas',     target: 'gandharvaveda' },
  { id: 'e-uv-st',       source: 'upvedas',     target: 'sthapathyaveda' },
  { id: 'e-uv-ar',       source: 'upvedas',     target: 'arthashastra' },
  { id: 'e-vg-ka',       source: 'vedangas',    target: 'kalpa' },
  { id: 'e-vg-si',       source: 'vedangas',    target: 'siksa' },
  { id: 'e-vg-vy',       source: 'vedangas',    target: 'vyakarana' },
  { id: 'e-vg-ni',       source: 'vedangas',    target: 'nirukta' },
  { id: 'e-vg-ch',       source: 'vedangas',    target: 'chandas' },
  { id: 'e-vg-jy',       source: 'vedangas',    target: 'jyotisa' },
  { id: 'e-d-sa',        source: 'darshanas',   target: 'sankhya' },
  { id: 'e-d-yo',        source: 'darshanas',   target: 'yoga' },
  { id: 'e-d-ny',        source: 'darshanas',   target: 'nyaya' },
  { id: 'e-d-va',        source: 'darshanas',   target: 'vaisesika' },
  { id: 'e-d-mi',        source: 'darshanas',   target: 'mimamsa' },
  { id: 'e-d-ve',        source: 'darshanas',   target: 'vedanta' },
  { id: 'e-p-ma',        source: 'puranas',     target: 'maha' },
  { id: 'e-p-up',        source: 'puranas',     target: 'upa' },
  { id: 'e-p-au',        source: 'puranas',     target: 'aupa' },
  { id: 'e-p-aup',       source: 'puranas',     target: 'aupupa' },
  { id: 'e-p-st',        source: 'puranas',     target: 'sthala' },
  { id: 'e-i-ra',        source: 'itihasas',    target: 'ramayana' },
  { id: 'e-i-mb',        source: 'itihasas',    target: 'mahabharata' },
  { id: 'e-mb-vi',       source: 'mahabharata', target: 'visnu' },
  { id: 'e-mb-gi',       source: 'mahabharata', target: 'gita' },
  { id: 'e-t-ta',        source: 'tantras',     target: 'tamasic' },
  { id: 'e-t-ra',        source: 'tantras',     target: 'rajasic' },
  { id: 'e-t-sa',        source: 'tantras',     target: 'sattvic' },
  { id: 'e-a-sh',        source: 'agamas',      target: 'shakta' },
  { id: 'e-a-sv',        source: 'agamas',      target: 'shaiva' },
  { id: 'e-a-va',        source: 'agamas',      target: 'vaisnava' },
  { id: 'e-va-vk',       source: 'vaisnava',    target: 'vaikhanasa' },
  { id: 'e-va-pa',       source: 'vaisnava',    target: 'pancharatra' },
  { id: 'e-ve-ad',       source: 'vedanta',     target: 'advaita' },
  { id: 'e-ve-bh',       source: 'vedanta',     target: 'bheda' },
  { id: 'e-ve-dv',       source: 'vedanta',     target: 'dvaita' },
  { id: 'e-ad-ke',       source: 'advaita',     target: 'kevala' },
  { id: 'e-ad-si',       source: 'advaita',     target: 'siva_adv' },
  { id: 'e-ad-su',       source: 'advaita',     target: 'suddha' },
  { id: 'e-ad-vi',       source: 'advaita',     target: 'visita' },
  { id: 'e-bh-bh',       source: 'bheda',       target: 'bheda_bhaskara' },
  { id: 'e-bh-ni',       source: 'bheda',       target: 'bheda_nimbarka' },
  { id: 'e-bh-ac',       source: 'bheda',       target: 'acintya' },
];

const { nodes: lNodes, edges: lEdges } = layout(rawNodes, rawEdges, 'LR');

// ─── Component ────────────────────────────────────────────────────────────────
export default function VedicKnowledgeFlow() {
  const router = useRouter();
  const vedicRef     = useRef<HTMLDivElement>(null);
  const vaisnavaRef  = useRef<HTMLDivElement>(null);
  const classicalRef = useRef<HTMLDivElement>(null);
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const nodeRoutes: Record<string, string> = {
    ramayana:    '/category/ramayana',
    mahabharata: '/category/mahabharata',
    vedas:       '/category/vedas',
    upanishads:  '/category/upanishads',
    gita:        '/category/gita',
    puranas:     '/category/puranas',
  };

  const onNodeClick = (_: any, node: any) => {
    const route = nodeRoutes[node.id];
    if (route) window.open(route, '_blank', 'noopener,noreferrer');
  };

  const scrollTo = (ref: React.RefObject<HTMLDivElement>) => {
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setMobileOpen(false);
  };

  const navBtn: React.CSSProperties = {
    padding: '8px 14px', background: 'transparent', border: 'none',
    color: '#fff', fontSize: 14, fontWeight: 500, cursor: 'pointer',
    borderRadius: 6, whiteSpace: 'nowrap',
  };

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  // ─── Vaisnava sub-diagram ─────────────────────────────────────────────────
  const vNodes = [
    { id: 'vr',      position: { x: 0, y: 0 }, data: { label: 'Vaishnava Manjusha' }, style: { ...styles.root,      width: 260, fontSize: 22 }, _w: 260, _h: 76  },
    { id: 'pp',      position: { x: 0, y: 0 }, data: { label: 'Parampara' },           style: { ...styles.section(), width: 180, fontSize: 22 }, _w: 180, _h: 60  },
    { id: 's1',      position: { x: 0, y: 0 }, data: { label: 'Śrī Sampradāya' },      style: { ...styles.leaf(),    width: 220, fontSize: 20 }, _w: 220, _h: 66  },
    { id: 's2',      position: { x: 0, y: 0 }, data: { label: 'Mādhava Sampradāya' },  style: { ...styles.leaf(),    width: 230, fontSize: 20 }, _w: 230, _h: 66  },
    { id: 's3',      position: { x: 0, y: 0 }, data: { label: 'Rudra Sampradāya' },    style: { ...styles.leaf(),    width: 220, fontSize: 20 }, _w: 220, _h: 66  },
    { id: 's4',      position: { x: 0, y: 0 }, data: { label: 'Kumāra Sampradāya' },   style: { ...styles.leaf(),    width: 225, fontSize: 20 }, _w: 225, _h: 66  },
  ];
  const vEdges = [
    { id: 'ev1', source: 'vr', target: 'pp' },
    { id: 'ev2', source: 'pp', target: 's1' },
    { id: 'ev3', source: 'pp', target: 's2' },
    { id: 'ev4', source: 'pp', target: 's3' },
    { id: 'ev5', source: 'pp', target: 's4' },
  ];
  const { nodes: lvNodes, edges: lvEdges } = layout(vNodes, vEdges, 'TB');

  // ─── Classical sub-diagram ────────────────────────────────────────────────
  const cNodes = [
    { id: 'cl', position: { x: 0, y: 0 }, data: { label: 'Classical Literature' }, style: { ...styles.root,      width: 280, fontSize: 24 }, _w: 280, _h: 76  },
    { id: 'sk', position: { x: 0, y: 0 }, data: { label: 'Sanskrit' },             style: { ...styles.section(), width: 180, fontSize: 22 }, _w: 180, _h: 60  },
    { id: 're', position: { x: 0, y: 0 }, data: { label: 'Regional' },             style: { ...styles.section(), width: 180, fontSize: 22 }, _w: 180, _h: 60  },
  ];
  const cEdges = [
    { id: 'ec1', source: 'cl', target: 'sk' },
    { id: 'ec2', source: 'cl', target: 're' },
  ];
  const { nodes: lcNodes, edges: lcEdges } = layout(cNodes, cEdges, 'TB');

  const flowProps = {
    fitView: true,
    nodesDraggable: false,
    nodesConnectable: false,
    elementsSelectable: true,
    selectionOnDrag: false,
    proOptions: { hideAttribution: true },
  };

  return (
    <div style={{ minHeight: '100vh', width: '100%', overflowX: 'hidden', background: 'linear-gradient(135deg,#f5e6d3,#e8d5b7 50%,#d4a574)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

      {/* Nav */}
      <div style={{ position: 'sticky', top: 0, width: '100%', zIndex: 100, background: 'linear-gradient(135deg,#2c3e50,#34495e)', boxShadow: '0 2px 8px rgba(0,0,0,.15)' }}>
        <div style={{ maxWidth: 1400, margin: '0 auto', display: 'flex', alignItems: 'center', padding: '10px 16px', gap: 12 }}>
          <span style={{ color: '#fff', fontWeight: 600, fontSize: 15, whiteSpace: 'nowrap' }}>📖 Śāstra Nidhi</span>
          <nav style={{ display: isMobile ? 'none' : 'flex', gap: 4, flex: 1 }}>
            {[['Vedic Literature', vedicRef], ['Vaisnava Literature', vaisnavaRef], ['Classical Literature', classicalRef]].map(([label, ref]) => (
              <button key={label as string} style={navBtn} onClick={() => scrollTo(ref as React.RefObject<HTMLDivElement>)}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,.12)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                {label as string}
              </button>
            ))}
          </nav>
          <button onClick={() => router.push('/')} style={{ padding: '7px 18px', background: 'linear-gradient(90deg,#1abc9c,#16a085)', border: 'none', borderRadius: 8, color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: isMobile ? 'none' : 'block' }}>
            Login / Sign Up
          </button>
          {isMobile && (
            <button onClick={() => setMobileOpen(!mobileOpen)} style={{ marginLeft: 'auto', background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', padding: 8 }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                {mobileOpen ? <path d="M6 18L18 6M6 6l12 12" /> : <path d="M3 12h18M3 6h18M3 18h18" />}
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && <div onClick={() => setMobileOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 110 }} />}
      <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: 260, background: 'linear-gradient(135deg,#2c3e50,#34495e)', zIndex: 120, transform: mobileOpen ? 'translateX(0)' : 'translateX(100%)', transition: 'transform .3s', display: 'flex', flexDirection: 'column', padding: '60px 0 20px' }}>
        {[['Vedic Literature', vedicRef], ['Vaisnava Literature', vaisnavaRef], ['Classical Literature', classicalRef]].map(([label, ref]) => (
          <button key={label as string} onClick={() => scrollTo(ref as React.RefObject<HTMLDivElement>)} style={{ ...navBtn, padding: '15px 20px', borderBottom: '1px solid rgba(255,255,255,.1)', textAlign: 'left' }}>{label as string}</button>
        ))}
        <button onClick={() => router.push('/')} style={{ margin: '20px 16px', padding: '11px 20px', background: 'linear-gradient(90deg,#1abc9c,#16a085)', border: 'none', borderRadius: 8, color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Login / Sign Up</button>
      </div>

      {/* Content */}
      <div style={{ width: '100%', maxWidth: 1400, padding: '14px 10px 0', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

        {/* Marquee */}
        <div style={{ width: '100%', margin: '0 0 12px', padding: '7px 12px', background: 'linear-gradient(90deg,#e3f0ff,#c7e0ff)', borderRadius: 10, border: '2px solid #1abc9c', overflow: 'hidden', whiteSpace: 'nowrap', position: 'relative' }}>
          <div style={{ display: 'inline-block', animation: 'marquee 60s linear infinite' }}>
            <span style={{ color: '#6d4c00', fontSize: 13 }}>You can select any topic to read from the different literature. Without login you can read — login for bookmarks, reading progress, and more!</span>
          </div>
          <style>{`@keyframes marquee { 0%{transform:translateX(0)} 100%{transform:translateX(-100%)} }`}</style>
        </div>

        {/* Legend */}
        <div style={{ width: '100%', marginBottom: 14, padding: '8px 16px', background: 'rgba(255,255,255,0.65)', borderRadius: 10, border: '1px solid #d7ccc8', display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
          {[
            { label: 'Root',             bg: C.L0.bg, text: C.L0.text },
            { label: 'ŚRUTI / SMṚTI',   bg: C.L1.bg, text: C.L1.text },
            { label: 'Categories',       bg: C.L2.bg, text: C.L2.text },
            { label: 'Texts / Branches', bg: C.L3.bg, text: C.L3.text },
            { label: 'Vedānta Schools',  bg: C.L4.bg, text: C.L4.text },
            { label: 'Sub-schools',      bg: C.L5.bg, text: C.L5.text },
            { label: 'Bhagavad Gītā',    bg: C.gita.bg, text: C.gita.text },
          ].map(({ label, bg, text }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 18, height: 18, borderRadius: 4, background: bg, flexShrink: 0 }} />
              <span style={{ fontSize: 12, color: '#5d4037', fontWeight: 500 }}>{label}</span>
            </div>
          ))}
        </div>

        {/* Vedic Flow */}
        <div ref={vedicRef} style={{ scrollMarginTop: 68, width: '100%', height: isMobile ? 520 : 1800, background: 'linear-gradient(180deg,#fffde4,#ffe9ca)', borderRadius: 12, boxShadow: '0 2px 16px #e0c68a55', overflow: 'hidden' }}>
          <ReactFlow
            {...flowProps}
            nodes={lNodes}
            edges={lEdges}
            onNodeClick={onNodeClick}
            minZoom={0.1}
            maxZoom={2.5}
            defaultViewport={{ x: 0, y: 0, zoom: isMobile ? 0.25 : 0.55 }}
            panOnDrag
            zoomOnScroll
            zoomOnPinch
          >
            <Background color="#fbc02d22" gap={32} />
          </ReactFlow>
        </div>

        {/* Vaisnava Flow */}
        <div ref={vaisnavaRef} style={{ scrollMarginTop: 68, width: '100%', height: 420, margin: '28px 0 0', background: 'linear-gradient(180deg,#fffde4,#ffe9ca)', border: '2px solid #1abc9c', borderRadius: 12, boxShadow: '0 2px 16px #e0c68a55', overflow: 'hidden' }}>
          <ReactFlow {...flowProps} nodes={lvNodes} edges={lvEdges} minZoom={0.2} maxZoom={2} panOnDrag zoomOnPinch zoomOnScroll>
            <Background color="#fbc02d22" gap={32} />
          </ReactFlow>
        </div>

        {/* Classical Flow */}
        <div ref={classicalRef} style={{ scrollMarginTop: 68, width: '100%', height: 340, margin: '28px 0 0', background: 'linear-gradient(180deg,#fffde4,#ffe9ca)', border: '2px solid #1abc9c', borderRadius: 12, boxShadow: '0 2px 16px #e0c68a55', overflow: 'hidden' }}>
          <ReactFlow {...flowProps} nodes={lcNodes} edges={lcEdges} minZoom={0.2} maxZoom={2} panOnDrag zoomOnPinch zoomOnScroll>
            <Background color="#fbc02d22" gap={32} />
          </ReactFlow>
        </div>

        {/* Donor strip */}
        <div style={{ width: '100%', margin: '28px 0 32px', background: 'linear-gradient(180deg,#fffde4,#ffe9ca)', border: '2px solid #1abc9c', borderRadius: 12, padding: '18px 24px', display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'stretch' : 'center', gap: 20, boxShadow: '0 2px 16px #e0c68a55', fontSize: isMobile ? 13 : 15, color: '#1a237e' }}>
          <div style={{ flex: 1 }}>
            Thanks to donors: Ananya Sharma; Rohan Patel; Priya Singh; Vikram Das; Meera Joshi; Suresh Kumar; Kavita Rao; Amit Verma; Sneha Gupta; Rahul Mehta; Sunita Reddy; Arjun Nair; Deepa Chawla; Mohan Iyer; Pooja Sethi; Ajay Malhotra; Neha Jain; and all others for{' '}
            <span style={{ color: '#d2691e', fontWeight: 700 }}>supporting</span> this site.
          </div>
          <button onClick={() => router.push('/sastranidhi/donate')} style={{ padding: '12px 28px', background: 'linear-gradient(90deg,#1976d2,#ffd700)', border: 'none', borderRadius: 10, color: '#fff', fontSize: 16, fontWeight: 700, cursor: 'pointer', boxShadow: '0 2px 10px #1976d233', whiteSpace: 'nowrap' }}>
            Donate
          </button>
        </div>
      </div>
    </div>
  );
}
