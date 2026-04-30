import { useState, useEffect, useMemo } from 'react';
import API from '../../api/axios';
import SearchableSelect from '../../components/SearchableSelect';
import * as Ic from '../../components/icons';
import { notify } from '../../utils/toast';
import { useConfirm } from '../../context/ConfirmContext';

const STATUS_CFG = {
  available:   { color: '#34d399', bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.3)', Icon: Ic.Check, label: 'Available' },
  maintenance: { color: '#fbbf24', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.3)', Icon: Ic.Wrench, label: 'Maintenance' },
  unavailable: { color: '#f87171', bg: 'rgba(239,68,68,0.12)',  border: 'rgba(239,68,68,0.3)',  Icon: Ic.X, label: 'Unavailable' },
};

const getCfg = s => STATUS_CFG[s] || { color: '#94a3b8', bg: 'rgba(148,163,184,0.1)', border: 'rgba(148,163,184,0.2)', Icon: Ic.Info, label: s };

export default function EquipmentPage() {
  const confirm = useConfirm();
  const [equipment, setEquipment] = useState([]);
  const [loading, setLoading] = useState(true);
  const [wards, setWards] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [hospital, setHospital] = useState('');
  const [ward, setWard] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchEquipment = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      let url = '/equipment?';
      if (hospital) url += `hospital=${encodeURIComponent(hospital)}&`;
      if (ward) url += `ward=${encodeURIComponent(ward)}&`;
      const { data } = await API.get(url);
      setEquipment(Array.isArray(data) ? data : []);
    } catch { setEquipment([]); } finally { if (!silent) setLoading(false); }
  };

  const filteredWards = useMemo(() => {
    if (!hospital) return wards;
    return wards.filter(w => w.hospital === hospital);
  }, [wards, hospital]);

  useEffect(() => { fetchEquipment(); }, [hospital, ward]);

  useEffect(() => {
    API.get('/hospitals').then(r => setHospitals(Array.isArray(r.data) ? r.data : [])).catch(() => {});
    API.get('/wards').then(r => setWards(Array.isArray(r.data) ? r.data : [])).catch(() => {});
  }, []);

  useEffect(() => {
    setWard('');
  }, [hospital]);

  const handleReportFault = async (item) => {
    const isConfirmed = await confirm({
      title: 'Report Equipment Fault',
      message: `Are you flagging ${item.name} as faulty? This will move it to maintenance status and alert the tech team.`,
      confirmText: 'Report Fault',
      confirmStyle: { background: '#f59e0b' }
    });
    if (!isConfirmed) return;
    try {
      await API.put(`/equipment/${item._id}`, { status: 'maintenance' });
      notify.success("Fault reported. Maintenance ticket created.");
      fetchEquipment(true);
    } catch (err) {
      notify.error("Failed to submit report.");
    }
  };

  const filtered = useMemo(() => {
    return equipment.filter(e =>
      (statusFilter === 'all' || e.status === statusFilter) &&
      (!search || 
        e.name.toLowerCase().includes(search.toLowerCase()) || 
        (e.ward || '').toLowerCase().includes(search.toLowerCase()) ||
        (e.serialNumber || '').toLowerCase().includes(search.toLowerCase())
      )
    );
  }, [equipment, search, statusFilter]);

  const counts = useMemo(() => {
    const c = { total: equipment.length, available: 0, maintenance: 0, unavailable: 0 };
    equipment.forEach(e => { if (c[e.status] !== undefined) c[e.status]++; });
    return c;
  }, [equipment]);

  return (
    <div style={{ animation: 'screen-entry 0.4s ease-out' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 32 }}>
        <div>
          <div style={{ fontSize: '0.75rem', fontWeight: 900, color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 6 }}>Facility Resources</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: 15 }}>
             <div style={{ width: 44, height: 44, borderRadius: 14, background: 'linear-gradient(135deg, #0ea5e9, #6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
               <Ic.Wrench size={24} color="#fff" />
             </div>
             Asset & Gear Hub
          </div>
        </div>
      </div>

      {/* ── Status KPIs ── */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 32, overflowX: 'auto', paddingBottom: 8 }}>
        {[
          { label: 'Total Assets', value: counts.total, color: '#6366f1', id: 'all', Icon: Ic.Inbox },
          { label: 'Ready to Use', value: counts.available, color: '#10b981', id: 'available', Icon: Ic.Check },
          { label: 'In Repair', value: counts.maintenance, color: '#f59e0b', id: 'maintenance', Icon: Ic.Wrench },
          { label: 'Down', value: counts.unavailable, color: '#ef4444', id: 'unavailable', Icon: Ic.X },
        ].map(s => (
          <button 
            key={s.id}
            onClick={() => setStatusFilter(s.id)}
            style={{ 
              all: 'unset', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, 
              padding: '12px 20px', borderRadius: 16, background: statusFilter === s.id ? `${s.color}15` : 'rgba(255,255,255,0.03)',
              border: `1px solid ${statusFilter === s.id ? s.color : 'rgba(255,255,255,0.06)'}`,
              transition: 'all 0.2s', whiteSpace: 'nowrap'
            }}
          >
            <div style={{ width: 32, height: 32, borderRadius: 10, background: `${s.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.color }}>
              <s.Icon size={16} />
            </div>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: statusFilter === s.id ? '#fff' : '#94a3b8' }}>{s.label}</span>
            <span style={{ fontSize: '1rem', fontWeight: 900, color: s.color }}>{s.value}</span>
          </button>
        ))}
      </div>

      {/* ── Search & Filters ── */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 28, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 280 }}>
          <Ic.Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
          <input 
            className="form-input" 
            style={{ paddingLeft: 42, background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.1)', height: 48, borderRadius: 14 }} 
            placeholder="Search by name, serial number or model..." 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
          />
        </div>
        <select
          className="form-select"
          style={{ width: 220, height: 48, background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: 14 }}
          value={hospital}
          onChange={e => setHospital(e.target.value)}
        >
          <option value="">All Hospitals</option>
          {hospitals.map(h => <option key={h._id} value={h.name}>{h.name}</option>)}
        </select>
        <SearchableSelect
          className="compact premium"
          style={{ width: 240, height: 48, borderRadius: 14 }}
          options={filteredWards.map(w => ({ value: w.name, label: w.name }))}
          value={ward}
          onChange={setWard}
          placeholder={hospital ? "Filter by Ward" : "Select Hospital First"}
          disabled={!hospital}
        />
      </div>

      {/* ── Asset Grid ── */}
      {loading ? (
        <div className="grid-3">
          {Array.from({ length: 8 }).map((_, i) => <div key={i} className="skeleton-card" style={{ height: 240, borderRadius: 24 }} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ padding: 100, textAlign: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: 24, border: '1px dashed rgba(255,255,255,0.1)' }}>
          <Ic.Wrench size={48} style={{ opacity: 0.1, marginBottom: 20 }} />
          <div style={{ fontSize: '1rem', color: '#94a3b8' }}>No equipment found in the current view.</div>
        </div>
      ) : (
        <div className="grid-3">
          {filtered.map(e => {
            const cfg = getCfg(e.status);
            const isAvailable = e.status === 'available';
            
            return (
              <div key={e._id} style={{ 
                background: 'rgba(30, 41, 59, 0.4)', border: '1px solid rgba(255,255,255,0.06)', 
                borderRadius: 24, padding: '24px', display: 'flex', flexDirection: 'column',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', backdropFilter: 'blur(20px)',
                position: 'relative', overflow: 'hidden'
              }}
              onMouseEnter={el => { el.currentTarget.style.transform = 'translateY(-6px)'; el.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; }}
              onMouseLeave={el => { el.currentTarget.style.transform = 'translateY(0)'; el.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; }}
              >
                {/* Visual Accent */}
                <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: 4, background: cfg.color, opacity: 0.2 }} />

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                  <div style={{ width: 48, height: 48, borderRadius: 14, background: `${cfg.color}15`, border: `1px solid ${cfg.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: cfg.color }}>
                    <cfg.Icon size={24} />
                  </div>
                  {isAvailable && (
                    <button 
                      onClick={() => handleReportFault(e)}
                      style={{ 
                        all: 'unset', cursor: 'pointer', fontSize: '0.65rem', fontWeight: 900, 
                        color: '#f59e0b', background: 'rgba(245,158,11,0.1)', padding: '6px 12px', 
                        borderRadius: 10, border: '1px solid rgba(245,158,11,0.2)',
                        textTransform: 'uppercase', letterSpacing: '0.05em'
                      }}
                      onMouseEnter={el => { el.currentTarget.style.background = 'rgba(245,158,11,0.2)'; }}
                      onMouseLeave={el => { el.currentTarget.style.background = 'rgba(245,158,11,0.1)'; }}
                    >
                      Report Fault
                    </button>
                  )}
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#fff', marginBottom: 6 }}>{e.name}</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#94a3b8', fontSize: '0.8rem' }}>
                      <Ic.Hospital size={14} style={{ color: '#0ea5e9' }} /> 
                      <span style={{ fontWeight: 600, color: '#fff' }}>{e.hospital}</span>
                      <span>•</span>
                      <span>{e.ward || 'General Stock'}</span>
                    </div>
                    {e.serialNumber && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#64748b', fontSize: '0.75rem', fontWeight: 600 }}>
                        <Ic.Award size={14} /> <span>SN: {e.serialNumber}</span>
                      </div>
                    )}
                    {e.description && (
                      <div style={{ fontSize: '0.78rem', color: '#64748b', lineHeight: 1.5, background: 'rgba(255,255,255,0.02)', padding: '10px 14px', borderRadius: 12 }}>
                        {e.description}
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ 
                  marginTop: 20, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.05)',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                }}>
                   <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: cfg.color, boxShadow: `0 0 10px ${cfg.color}` }} />
                      <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#fff', textTransform: 'capitalize' }}>{cfg.label}</span>
                   </div>
                   {e.lastMaintenance && (
                      <span style={{ fontSize: '0.7rem', color: '#64748b' }}>Service: {new Date(e.lastMaintenance).toLocaleDateString()}</span>
                   )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <style>{`
        @keyframes screen-entry {
          from { opacity: 0; transform: translateY(15px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
