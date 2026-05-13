import { useState } from 'react'
import Header from '@/components/layout/Header'
import Icon from '@/components/ui/Icon'
import Modal from '@/components/ui/Modal'

/* ── Types ─────────────────────────────────────────────────────────────── */
type MDTab = 'medicines' | 'icd' | 'tests' | 'services' | 'insurance' | 'prefixes'

const TABS: { key: MDTab; label: string; icon: string }[] = [
  { key: 'medicines',  label: 'Medicine library', icon: 'pill'      },
  { key: 'icd',        label: 'ICD codes',         icon: 'clipboard' },
  { key: 'tests',      label: 'Test catalog',      icon: 'flask'     },
  { key: 'services',   label: 'Service catalog',   icon: 'receipt'   },
  { key: 'insurance',  label: 'Insurance',         icon: 'shield'    },
  { key: 'prefixes',   label: 'Token prefixes',    icon: 'ticket'    },
]

/* ── Sample data ────────────────────────────────────────────────────────── */
interface Medicine {
  id: number; name: string; generic: string; category: string; unit: string; dose: string
}
const MEDICINES: Medicine[] = [
  { id:  1, name: 'Amoxicillin 500mg',   generic: 'Amoxicillin',      category: 'Antibiotic',    unit: 'Capsule', dose: '1 cap TDS × 5d' },
  { id:  2, name: 'Paracetamol 500mg',   generic: 'Paracetamol',      category: 'Analgesic',     unit: 'Tablet',  dose: '1 tab QID PRN'  },
  { id:  3, name: 'Metformin 500mg',     generic: 'Metformin HCl',    category: 'Antidiabetic',  unit: 'Tablet',  dose: '1 tab BD'       },
  { id:  4, name: 'Atorvastatin 10mg',   generic: 'Atorvastatin',     category: 'Statin',        unit: 'Tablet',  dose: '1 tab OD HS'    },
  { id:  5, name: 'Amlodipine 5mg',      generic: 'Amlodipine',       category: 'Antihypertensive', unit: 'Tablet', dose: '1 tab OD'    },
  { id:  6, name: 'Omeprazole 20mg',     generic: 'Omeprazole',       category: 'PPI',           unit: 'Capsule', dose: '1 cap OD AC'    },
  { id:  7, name: 'Cetirizine 10mg',     generic: 'Cetirizine HCl',   category: 'Antihistamine', unit: 'Tablet',  dose: '1 tab OD'       },
  { id:  8, name: 'Azithromycin 500mg',  generic: 'Azithromycin',     category: 'Antibiotic',    unit: 'Tablet',  dose: '1 tab OD × 3d'  },
  { id:  9, name: 'Ibuprofen 400mg',     generic: 'Ibuprofen',        category: 'NSAID',         unit: 'Tablet',  dose: '1 tab TDS PC'   },
  { id: 10, name: 'Pantoprazole 40mg',   generic: 'Pantoprazole',     category: 'PPI',           unit: 'Tablet',  dose: '1 tab OD AC'    },
  { id: 11, name: 'Losartan 50mg',       generic: 'Losartan Potassium',category: 'ARB',          unit: 'Tablet',  dose: '1 tab OD'       },
  { id: 12, name: 'Levothyroxine 50mcg', generic: 'Levothyroxine',    category: 'Thyroid',       unit: 'Tablet',  dose: '1 tab OD empty stomach' },
  { id: 13, name: 'Metronidazole 400mg', generic: 'Metronidazole',    category: 'Antibiotic',    unit: 'Tablet',  dose: '1 tab TDS × 7d' },
  { id: 14, name: 'Salbutamol 100mcg',   generic: 'Salbutamol',       category: 'Bronchodilator',unit: 'Inhaler', dose: '2 puffs PRN'    },
  { id: 15, name: 'Vitamin D3 60K IU',   generic: 'Cholecalciferol',  category: 'Supplement',    unit: 'Sachet',  dose: '1 sachet weekly × 8wk' },
]

interface ICD { id: number; code: string; description: string; category: string; active: boolean }
const ICD_CODES: ICD[] = [
  { id:  1, code: 'J06.9',  description: 'Acute upper respiratory infection, unspecified', category: 'Respiratory', active: true  },
  { id:  2, code: 'E11.9',  description: 'Type 2 diabetes mellitus without complications', category: 'Endocrine',   active: true  },
  { id:  3, code: 'I10',    description: 'Essential (primary) hypertension',               category: 'Circulatory', active: true  },
  { id:  4, code: 'K21.0',  description: 'Gastro-oesophageal reflux disease with oesophagitis', category: 'Digestive', active: true },
  { id:  5, code: 'L50.0',  description: 'Allergic urticaria',                             category: 'Skin',        active: true  },
  { id:  6, code: 'M54.5',  description: 'Low back pain',                                  category: 'Musculoskeletal', active: true },
  { id:  7, code: 'J45.9',  description: 'Asthma, unspecified',                            category: 'Respiratory', active: true  },
  { id:  8, code: 'E78.5',  description: 'Hyperlipidaemia, unspecified',                   category: 'Endocrine',   active: true  },
  { id:  9, code: 'F41.1',  description: 'Generalized anxiety disorder',                   category: 'Mental',      active: false },
  { id: 10, code: 'N39.0',  description: 'Urinary tract infection, site not specified',    category: 'Genitourinary', active: true },
]

interface TestCatalog { id: number; name: string; category: string; sample: string; tat: string; price: number }
const TESTS: TestCatalog[] = [
  { id:  1, name: 'Complete Blood Count (CBC)',    category: 'Haematology',    sample: 'EDTA blood',   tat: '4 hrs',   price: 350  },
  { id:  2, name: 'HbA1c',                         category: 'Biochemistry',   sample: 'EDTA blood',   tat: '6 hrs',   price: 550  },
  { id:  3, name: 'Lipid Profile',                 category: 'Biochemistry',   sample: 'Serum',        tat: '6 hrs',   price: 600  },
  { id:  4, name: 'Thyroid Function Test (TFT)',   category: 'Endocrinology',  sample: 'Serum',        tat: '12 hrs',  price: 850  },
  { id:  5, name: 'Liver Function Test (LFT)',     category: 'Biochemistry',   sample: 'Serum',        tat: '6 hrs',   price: 700  },
  { id:  6, name: 'Kidney Function Test (KFT)',    category: 'Biochemistry',   sample: 'Serum + Urine',tat: '6 hrs',   price: 700  },
  { id:  7, name: 'Urine Routine & Microscopy',    category: 'Urine',          sample: 'Mid-stream urine', tat: '2 hrs', price: 180 },
  { id:  8, name: 'Chest X-ray PA view',           category: 'Radiology',      sample: 'N/A',          tat: 'Immediate', price: 400 },
  { id:  9, name: 'ECG 12-lead',                   category: 'Cardiology',     sample: 'N/A',          tat: 'Immediate', price: 250 },
  { id: 10, name: 'COVID-19 RT-PCR',               category: 'Microbiology',   sample: 'NP swab',      tat: '24 hrs',  price: 700  },
]

interface ServiceCatalog { id: number; name: string; category: string; code: string; price: number; gst: number }
const SERVICES: ServiceCatalog[] = [
  { id:  1, name: 'General OPD Consultation',  category: 'Consultation', code: 'CONS-GEN',  price: 400,  gst: 0  },
  { id:  2, name: 'Specialist Consultation',   category: 'Consultation', code: 'CONS-SPEC', price: 800,  gst: 0  },
  { id:  3, name: 'Follow-up Consultation',    category: 'Consultation', code: 'CONS-FUP',  price: 300,  gst: 0  },
  { id:  4, name: 'Minor Surgical Procedure',  category: 'Procedure',    code: 'PROC-MIN',  price: 2500, gst: 18 },
  { id:  5, name: 'IV Cannula Insertion',      category: 'Nursing',      code: 'NURS-IVCN', price: 350,  gst: 18 },
  { id:  6, name: 'Dressing & Wound Care',     category: 'Nursing',      code: 'NURS-DRSS', price: 250,  gst: 18 },
  { id:  7, name: 'Nebulisation',              category: 'Procedure',    code: 'PROC-NEB',  price: 300,  gst: 18 },
  { id:  8, name: 'Vaccination (single dose)', category: 'Vaccine',      code: 'VACC-SGL',  price: 150,  gst: 5  },
  { id:  9, name: 'ECG Interpretation',        category: 'Diagnostic',   code: 'DIAG-ECG',  price: 200,  gst: 18 },
  { id: 10, name: 'Medical Certificate',       category: 'Document',     code: 'DOC-CERT',  price: 200,  gst: 0  },
]

interface Insurance { id: number; name: string; policies: string; cashless: boolean; contact: string }
const INSURERS: Insurance[] = [
  { id: 1, name: 'Star Health Insurance',        policies: 'Family Health, Senior, Accident', cashless: true,  contact: '1800-425-2255' },
  { id: 2, name: 'Niva Bupa Health Insurance',   policies: 'ReAssure, Health Companion',      cashless: true,  contact: '1800-200-4040' },
  { id: 3, name: 'HDFC Ergo Health',             policies: 'Optima Secure, My Health',        cashless: true,  contact: '1800-266-0700' },
  { id: 4, name: 'ICICI Lombard',                policies: 'Complete Health, iHealth',        cashless: true,  contact: '1800-2666' },
  { id: 5, name: 'Bajaj Allianz Health',         policies: 'Health Guard, Silver Health',     cashless: false, contact: '1800-209-0144' },
  { id: 6, name: 'Government CGHS',              policies: 'Central Govt Health Scheme',      cashless: true,  contact: '1800-11-4477' },
  { id: 7, name: 'Reliance General Insurance',   policies: 'Health Infinity, Group Health',   cashless: false, contact: '1800-3009' },
]

const PREFIX_COLORS: Record<string, string> = {
  A: '#3b82f6', B: '#8b5cf6', C: '#f59e0b', D: '#10b981', E: '#ef4444', F: '#ec4899',
}
interface TokenPrefix { id: number; prefix: string; dept: string; color: string; doctor: string }
const TOKEN_PREFIXES: TokenPrefix[] = [
  { id: 1, prefix: 'A', dept: 'General Medicine',  color: '#3b82f6', doctor: 'Dr. Ananya Rao'   },
  { id: 2, prefix: 'B', dept: 'Cardiology',        color: '#8b5cf6', doctor: 'Dr. Vikram Mehta' },
  { id: 3, prefix: 'C', dept: 'Dermatology',       color: '#f59e0b', doctor: 'Dr. Priya Iyer'   },
  { id: 4, prefix: 'D', dept: 'Pediatrics',        color: '#10b981', doctor: 'Dr. Rahul Khanna' },
  { id: 5, prefix: 'E', dept: 'Emergency',         color: '#ef4444', doctor: 'All on-call'       },
  { id: 6, prefix: 'F', dept: 'Orthopedics',       color: '#ec4899', doctor: 'Dr. Arjun Desai'   },
]

/* ── Action buttons ─────────────────────────────────────────────────────── */
function RowActions({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  return (
    <div className="row-actions" style={{ justifyContent: 'flex-end' }}>
      <button className="act" onClick={onEdit} title="Edit"><Icon name="edit" size={14} /></button>
      <button className="act danger" onClick={onDelete} title="Delete"><Icon name="trash" size={14} /></button>
    </div>
  )
}

/* ── Tab content components ─────────────────────────────────────────────── */
function MedicinesTab() {
  const [rows, setRows]           = useState<Medicine[]>(MEDICINES)
  const [modalOpen, setModalOpen] = useState(false)
  const empty: Omit<Medicine,'id'> = { name:'', generic:'', category:'', unit:'Tablet', dose:'' }
  const [form, setForm]           = useState(empty)

  const add = () => {
    setRows(r => [...r, { ...form, id: r.length + 1 }])
    setModalOpen(false); setForm(empty)
  }

  return (
    <>
      <div className="table-card">
        <div className="table-toolbar">
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--fg-primary)' }}>
            Medicine library <span className="badge muted" style={{ marginLeft: 6 }}>{rows.length}</span>
          </div>
          <button className="btn btn-primary btn-sm" onClick={() => setModalOpen(true)}>
            <Icon name="plus" size={14} /> Add medicine
          </button>
        </div>
        <table className="data">
          <thead>
            <tr><th>Medicine name</th><th>Generic name</th><th>Category</th><th>Unit</th><th>Standard dose</th><th style={{ textAlign:'right' }}>Actions</th></tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.id}>
                <td style={{ fontWeight: 600, color: 'var(--fg-primary)' }}>{r.name}</td>
                <td style={{ fontSize: 13, color: 'var(--fg-secondary)' }}>{r.generic}</td>
                <td><span className="badge muted">{r.category}</span></td>
                <td style={{ fontSize: 13 }}>{r.unit}</td>
                <td style={{ fontSize: 12.5, color: 'var(--fg-secondary)', fontFamily: 'var(--font-mono)' }}>{r.dose}</td>
                <td><RowActions onEdit={() => {}} onDelete={() => setRows(rs => rs.filter(x => x.id !== r.id))} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {modalOpen && (
        <Modal title="Add medicine" onClose={() => setModalOpen(false)} size="md"
          footer={<div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
            <button className="btn btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={add}>Add</button>
          </div>}
        >
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
            {(['name','generic','category','unit','dose'] as const).map(k => (
              <div key={k} className="form-group" style={k === 'dose' ? { gridColumn:'1/-1' } : undefined}>
                <label className="form-label">{k.charAt(0).toUpperCase()+k.slice(1)}</label>
                <input className="form-input" value={form[k]} onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))} />
              </div>
            ))}
          </div>
        </Modal>
      )}
    </>
  )
}

function ICDTab() {
  const [rows, setRows]           = useState<ICD[]>(ICD_CODES)
  const [modalOpen, setModalOpen] = useState(false)
  const empty = { code:'', description:'', category:'', active: true }
  const [form, setForm]           = useState(empty)

  const add = () => {
    setRows(r => [...r, { ...form, id: r.length + 1 }])
    setModalOpen(false); setForm(empty)
  }

  return (
    <>
      <div className="table-card">
        <div className="table-toolbar">
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--fg-primary)' }}>ICD-10 codes</div>
          <button className="btn btn-primary btn-sm" onClick={() => setModalOpen(true)}>
            <Icon name="plus" size={14} /> Add code
          </button>
        </div>
        <table className="data">
          <thead>
            <tr><th>ICD code</th><th>Description</th><th>Category</th><th>Active</th><th style={{ textAlign:'right' }}>Actions</th></tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.id}>
                <td><code style={{ fontFamily:'var(--font-mono)', fontSize:13, background:'var(--bg-surface-alt)', padding:'2px 8px', borderRadius:4 }}>{r.code}</code></td>
                <td style={{ fontSize:13 }}>{r.description}</td>
                <td><span className="badge muted">{r.category}</span></td>
                <td><span className={`badge ${r.active ? 'success' : 'gray'}`}>{r.active ? 'Active' : 'Inactive'}</span></td>
                <td><RowActions onEdit={() => {}} onDelete={() => setRows(rs => rs.filter(x => x.id !== r.id))} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {modalOpen && (
        <Modal title="Add ICD code" onClose={() => setModalOpen(false)} size="md"
          footer={<div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
            <button className="btn btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={add}>Add</button>
          </div>}
        >
          <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
            {(['code','description','category'] as const).map(k => (
              <div key={k} className="form-group">
                <label className="form-label">{k.charAt(0).toUpperCase()+k.slice(1)}</label>
                <input className="form-input" value={form[k]} onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))} />
              </div>
            ))}
          </div>
        </Modal>
      )}
    </>
  )
}

function TestsTab() {
  const [rows, setRows]           = useState<TestCatalog[]>(TESTS)
  const [modalOpen, setModalOpen] = useState(false)
  const empty: Omit<TestCatalog,'id'> = { name:'', category:'', sample:'', tat:'', price:0 }
  const [form, setForm]           = useState(empty)

  const add = () => {
    setRows(r => [...r, { ...form, id: r.length + 1 }])
    setModalOpen(false); setForm(empty)
  }

  return (
    <>
      <div className="table-card">
        <div className="table-toolbar">
          <div style={{ fontSize:14, fontWeight:700, color:'var(--fg-primary)' }}>Test catalog</div>
          <button className="btn btn-primary btn-sm" onClick={() => setModalOpen(true)}>
            <Icon name="plus" size={14} /> Add test
          </button>
        </div>
        <table className="data">
          <thead>
            <tr><th>Test name</th><th>Category</th><th>Sample type</th><th>TAT</th><th>Price (₹)</th><th style={{ textAlign:'right' }}>Actions</th></tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.id}>
                <td style={{ fontWeight:600 }}>{r.name}</td>
                <td><span className="badge muted">{r.category}</span></td>
                <td style={{ fontSize:13, color:'var(--fg-secondary)' }}>{r.sample}</td>
                <td style={{ fontSize:13 }}>{r.tat}</td>
                <td style={{ fontWeight:600 }}>₹{r.price}</td>
                <td><RowActions onEdit={() => {}} onDelete={() => setRows(rs => rs.filter(x => x.id !== r.id))} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {modalOpen && (
        <Modal title="Add test" onClose={() => setModalOpen(false)} size="md"
          footer={<div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
            <button className="btn btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={add}>Add</button>
          </div>}
        >
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
            {(['name','category','sample','tat'] as const).map(k => (
              <div key={k} className="form-group" style={k === 'name' ? { gridColumn:'1/-1' } : undefined}>
                <label className="form-label">{k.charAt(0).toUpperCase()+k.slice(1)}</label>
                <input className="form-input" value={String(form[k])} onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))} />
              </div>
            ))}
            <div className="form-group">
              <label className="form-label">Price (₹)</label>
              <input className="form-input" type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: Number(e.target.value) }))} />
            </div>
          </div>
        </Modal>
      )}
    </>
  )
}

function ServicesTab() {
  const [rows, setRows]           = useState<ServiceCatalog[]>(SERVICES)
  const [modalOpen, setModalOpen] = useState(false)
  const empty: Omit<ServiceCatalog,'id'> = { name:'', category:'', code:'', price:0, gst:18 }
  const [form, setForm]           = useState(empty)

  const add = () => {
    setRows(r => [...r, { ...form, id: r.length + 1 }])
    setModalOpen(false); setForm(empty)
  }

  return (
    <>
      <div className="table-card">
        <div className="table-toolbar">
          <div style={{ fontSize:14, fontWeight:700, color:'var(--fg-primary)' }}>Service catalog</div>
          <button className="btn btn-primary btn-sm" onClick={() => setModalOpen(true)}>
            <Icon name="plus" size={14} /> Add service
          </button>
        </div>
        <table className="data">
          <thead>
            <tr><th>Service name</th><th>Category</th><th>Code</th><th>Price (₹)</th><th>GST %</th><th style={{ textAlign:'right' }}>Actions</th></tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.id}>
                <td style={{ fontWeight:600 }}>{r.name}</td>
                <td><span className="badge muted">{r.category}</span></td>
                <td><code style={{ fontFamily:'var(--font-mono)', fontSize:12, background:'var(--bg-surface-alt)', padding:'2px 6px', borderRadius:4 }}>{r.code}</code></td>
                <td style={{ fontWeight:600 }}>₹{r.price}</td>
                <td style={{ fontSize:13 }}>{r.gst}%</td>
                <td><RowActions onEdit={() => {}} onDelete={() => setRows(rs => rs.filter(x => x.id !== r.id))} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {modalOpen && (
        <Modal title="Add service" onClose={() => setModalOpen(false)} size="md"
          footer={<div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
            <button className="btn btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={add}>Add</button>
          </div>}
        >
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
            <div className="form-group" style={{ gridColumn:'1/-1' }}>
              <label className="form-label">Service name</label>
              <input className="form-input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            {(['category','code'] as const).map(k => (
              <div key={k} className="form-group">
                <label className="form-label">{k.charAt(0).toUpperCase()+k.slice(1)}</label>
                <input className="form-input" value={form[k]} onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))} />
              </div>
            ))}
            <div className="form-group">
              <label className="form-label">Price (₹)</label>
              <input className="form-input" type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: Number(e.target.value) }))} />
            </div>
            <div className="form-group">
              <label className="form-label">GST %</label>
              <input className="form-input" type="number" value={form.gst} onChange={e => setForm(f => ({ ...f, gst: Number(e.target.value) }))} />
            </div>
          </div>
        </Modal>
      )}
    </>
  )
}

function InsuranceTab() {
  const [rows, setRows]           = useState<Insurance[]>(INSURERS)
  const [modalOpen, setModalOpen] = useState(false)
  const empty: Omit<Insurance,'id'> = { name:'', policies:'', cashless: false, contact:'' }
  const [form, setForm]           = useState(empty)

  const add = () => {
    setRows(r => [...r, { ...form, id: r.length + 1 }])
    setModalOpen(false); setForm(empty)
  }

  return (
    <>
      <div className="table-card">
        <div className="table-toolbar">
          <div style={{ fontSize:14, fontWeight:700, color:'var(--fg-primary)' }}>Insurance providers</div>
          <button className="btn btn-primary btn-sm" onClick={() => setModalOpen(true)}>
            <Icon name="plus" size={14} /> Add insurer
          </button>
        </div>
        <table className="data">
          <thead>
            <tr><th>Insurer name</th><th>Policy types</th><th>Cashless</th><th>Contact</th><th style={{ textAlign:'right' }}>Actions</th></tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.id}>
                <td style={{ fontWeight:600 }}>{r.name}</td>
                <td style={{ fontSize:12.5, color:'var(--fg-secondary)' }}>{r.policies}</td>
                <td><span className={`badge ${r.cashless ? 'success' : 'gray'}`}>{r.cashless ? 'Yes' : 'No'}</span></td>
                <td style={{ fontSize:13, fontFamily:'var(--font-mono)' }}>{r.contact}</td>
                <td><RowActions onEdit={() => {}} onDelete={() => setRows(rs => rs.filter(x => x.id !== r.id))} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {modalOpen && (
        <Modal title="Add insurer" onClose={() => setModalOpen(false)} size="md"
          footer={<div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
            <button className="btn btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={add}>Add</button>
          </div>}
        >
          <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
            {(['name','policies','contact'] as const).map(k => (
              <div key={k} className="form-group">
                <label className="form-label">{k.charAt(0).toUpperCase()+k.slice(1)}</label>
                <input className="form-input" value={form[k] as string} onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))} />
              </div>
            ))}
            <div className="form-group">
              <label className="form-label">Cashless</label>
              <select className="form-select" value={form.cashless ? 'yes' : 'no'} onChange={e => setForm(f => ({ ...f, cashless: e.target.value === 'yes' }))}>
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
            </div>
          </div>
        </Modal>
      )}
    </>
  )
}

function PrefixesTab() {
  const [rows, setRows]           = useState<TokenPrefix[]>(TOKEN_PREFIXES)
  const [modalOpen, setModalOpen] = useState(false)
  const empty: Omit<TokenPrefix,'id'> = { prefix:'', dept:'', color:'#3b82f6', doctor:'' }
  const [form, setForm]           = useState(empty)

  const add = () => {
    setRows(r => [...r, { ...form, id: r.length + 1 }])
    setModalOpen(false); setForm(empty)
  }

  return (
    <>
      <div className="table-card">
        <div className="table-toolbar">
          <div style={{ fontSize:14, fontWeight:700, color:'var(--fg-primary)' }}>Token prefixes</div>
          <button className="btn btn-primary btn-sm" onClick={() => setModalOpen(true)}>
            <Icon name="plus" size={14} /> Add prefix
          </button>
        </div>
        <table className="data">
          <thead>
            <tr><th>Prefix</th><th>Department</th><th>Color</th><th>Doctor assignment</th><th style={{ textAlign:'right' }}>Actions</th></tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.id}>
                <td>
                  <span style={{
                    display:'inline-flex', alignItems:'center', justifyContent:'center',
                    width:32, height:32, borderRadius:8, fontWeight:800, fontSize:16,
                    background: `${r.color}22`, color: r.color,
                  }}>{r.prefix}</span>
                </td>
                <td style={{ fontWeight:600 }}>{r.dept}</td>
                <td>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <span style={{ width:20, height:20, borderRadius:5, background: r.color, display:'inline-block' }} />
                    <code style={{ fontSize:12, fontFamily:'var(--font-mono)', color:'var(--fg-secondary)' }}>{r.color}</code>
                  </div>
                </td>
                <td style={{ fontSize:13 }}>{r.doctor}</td>
                <td><RowActions onEdit={() => {}} onDelete={() => setRows(rs => rs.filter(x => x.id !== r.id))} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {modalOpen && (
        <Modal title="Add token prefix" onClose={() => setModalOpen(false)} size="md"
          footer={<div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
            <button className="btn btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={add}>Add</button>
          </div>}
        >
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
            <div className="form-group">
              <label className="form-label">Prefix letter</label>
              <input className="form-input" maxLength={2} value={form.prefix} onChange={e => setForm(f => ({ ...f, prefix: e.target.value.toUpperCase() }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Color</label>
              <input type="color" className="form-input" style={{ height:40, padding:4 }} value={form.color} onChange={e => setForm(f => ({ ...f, color: e.target.value }))} />
            </div>
            <div className="form-group" style={{ gridColumn:'1/-1' }}>
              <label className="form-label">Department</label>
              <input className="form-input" value={form.dept} onChange={e => setForm(f => ({ ...f, dept: e.target.value }))} />
            </div>
            <div className="form-group" style={{ gridColumn:'1/-1' }}>
              <label className="form-label">Doctor assignment</label>
              <input className="form-input" value={form.doctor} onChange={e => setForm(f => ({ ...f, doctor: e.target.value }))} />
            </div>
          </div>
        </Modal>
      )}
    </>
  )
}

/* ── Main ───────────────────────────────────────────────────────────────── */
export default function MasterData() {
  const [tab, setTab] = useState<MDTab>('medicines')

  const content: Record<MDTab, React.ReactNode> = {
    medicines: <MedicinesTab />,
    icd:       <ICDTab />,
    tests:     <TestsTab />,
    services:  <ServicesTab />,
    insurance: <InsuranceTab />,
    prefixes:  <PrefixesTab />,
  }

  return (
    <>
      <Header title="Master data" crumbs="System · Master data" />
      <div className="main">
        <div style={{ display:'flex', gap:24, alignItems:'flex-start' }}>
          {/* Sidebar */}
          <nav style={{
            width:210, flexShrink:0, background:'var(--bg-surface)',
            borderRadius:14, border:'1px solid var(--border-soft)',
            padding:'8px 0', boxShadow:'var(--shadow-sm)',
          }}>
            {TABS.map(t => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                style={{
                  width:'100%', display:'flex', alignItems:'center', gap:10,
                  padding:'10px 16px', border:'none', cursor:'pointer', textAlign:'left',
                  fontSize:13.5, fontWeight: tab === t.key ? 700 : 500,
                  color: tab === t.key ? 'var(--brand-primary)' : 'var(--fg-secondary)',
                  background: tab === t.key ? 'var(--brand-soft)' : 'transparent',
                  borderLeft: tab === t.key ? '3px solid var(--brand-primary)' : '3px solid transparent',
                  transition:'all 0.15s',
                }}
              >
                <Icon name={t.icon} size={15} />
                {t.label}
              </button>
            ))}
          </nav>

          {/* Content */}
          <div style={{ flex:1, minWidth:0 }}>
            {content[tab]}
          </div>
        </div>
      </div>
    </>
  )
}
