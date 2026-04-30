import { useState, useEffect, useMemo } from 'react';
import API from '../../api/axios';
import * as Ic from '../../components/icons';

const expiryInfo = (date) => {
  const diff = (new Date(date) - new Date()) / (1000 * 60 * 60 * 24);
  if (diff < 0) return { color: '#f43f5e', bg: 'rgba(244,63,94,0.12)', border: 'rgba(244,63,94,0.25)', label: 'Expired', status: 'critical' };
  if (diff < 30) return { color: '#fb923c', bg: 'rgba(251,146,60,0.12)', border: 'rgba(251,146,60,0.25)', label: `${Math.ceil(diff)}d left`, status: 'warning' };
  return { color: '#10b981', bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.25)', label: 'Secure', status: 'safe' };
};

export default function DrugsPage() {
  const [drugs, setDrugs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [wards, setWards] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [hospital, setHospital] = useState('');
  const [ward, setWard] = useState('');
  const [search, setSearch] = useState('');

  const fetchDrugs = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      let url = '/drugs?';
      if (hospital) url += `hospital=${encodeURIComponent(hospital)}&`;
      if (ward) url += `ward=${encodeURIComponent(ward)}&`;
      const { data } = await API.get(url);
      setDrugs(Array.isArray(data) ? data : []);
    } catch { setDrugs([]); } finally { if (!silent) setLoading(false); }
  };

  const filteredWards = useMemo(() => {
    if (!hospital) return wards;
    return wards.filter(w => w.hospital === hospital);
  }, [wards, hospital]);

  useEffect(() => { fetchDrugs(); }, [hospital, ward]);

  useEffect(() => {
    API.get('/hospitals').then(r => setHospitals(Array.isArray(r.data) ? r.data : [])).catch(() => {});
    API.get('/wards').then(r => setWards(Array.isArray(r.data) ? r.data : [])).catch(() => {});
  }, []);

  useEffect(() => {
    setWard('');
  }, [hospital]);

  const filtered = useMemo(() => {
    return drugs.filter(d =>
      (!search || d.name.toLowerCase().includes(search.toLowerCase()) || (d.ward || '').toLowerCase().includes(search.toLowerCase()))
    );
  }, [drugs, search]);

  const stats = useMemo(() => {
    const today = new Date();
    return {
      expired: drugs.filter(d => new Date(d.expiryDate) < today).length,
      expiringSoon: drugs.filter(d => {
        const diff = (new Date(d.expiryDate) - today) / (1000 * 60 * 60 * 24);
        return diff > 0 && diff < 30;
      }).length,
    };
  }, [drugs]);

  return (
    <div style={{ animation: 'screen-entry 0.4s ease-out' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 32 }}>
        <div>
          <div style={{ fontSize: '0.75rem', fontWeight: 900, color: '#ec4899', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 6 }}>Clinical Resources</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: 15 }}>
             <div style={{ width: 44, height: 44, borderRadius: 14, background: 'linear-gradient(135deg, #ec4899, #d946ef)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
               <Ic.Pill size={24} color="#fff" />
             </div>
             Pharmaceutical Stock
          </div>
        </div>
      </div>

      {/* ── Security Stats ── */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 32, overflowX: 'auto', paddingBottom: 8 }}>
        {[
          { label: 'Total Inventory', value: drugs.length, color: '#6366f1', Icon: Ic.Inbox },
          { label: 'Critical Expiring', value: stats.expiringSoon, color: '#fb923c', Icon: Ic.AlertTriangle },
          { label: 'Expired SKUs', value: stats.expired, color: '#f43f5e', Icon: Ic.X },
        ].map(s => (
          <div 
            key={s.label}
            style={{ 
              display: 'flex', alignItems: 'center', gap: 12, 
              padding: '12px 20px', borderRadius: 16, background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.06)',
              transition: 'all 0.2s', whiteSpace: 'nowrap'
            }}
          >
            <div style={{ width: 32, height: 32, borderRadius: 10, background: `${s.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.color }}>
              <s.Icon size={16} />
            </div>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#94a3b8' }}>{s.label}</span>
            <span style={{ fontSize: '1.1rem', fontWeight: 900, color: s.color }}>{s.value}</span>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 28, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 280 }}>
          <Ic.Search size={16} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
          <input 
            className="form-input" 
            style={{ paddingLeft: 48, background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.1)', height: 52, borderRadius: 16 }} 
            placeholder="Search medication, SKU, or active salts..." 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
          />
        </div>
        <select
          className="form-select"
          style={{ width: 240, height: 52, background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: 16 }}
          value={hospital}
          onChange={e => setHospital(e.target.value)}
        >
          <option value="">All Hospitals</option>
          {hospitals.map(h => <option key={h._id} value={h.name}>{h.name}</option>)}
        </select>
        <select
          className="form-select"
          style={{ width: 240, height: 52, background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: 16 }}
          value={ward}
          onChange={e => setWard(e.target.value)}
        >
          <option value="">All Hospital Wards</option>
          {filteredWards.map(w => <option key={w._id} value={w.name}>{w.name}</option>)}
        </select>
      </div>

      {/* ── Inventory Grid ── */}
      {loading ? (
        <div className="grid-3">
          {Array.from({ length: 9 }).map((_, i) => <div key={i} className="skeleton-card" style={{ height: 100, borderRadius: 18 }} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ padding: 100, textAlign: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: 24, border: '1px dashed rgba(255,255,255,0.1)' }}>
          <Ic.Inbox size={48} style={{ opacity: 0.1, marginBottom: 20 }} />
          <div style={{ fontSize: '1rem', color: '#94a3b8' }}>Inventory search returned no clinical matches.</div>
        </div>
      ) : (
        <div className="grid-3">
          {filtered.map(d => {
            const exp = expiryInfo(d.expiryDate);
            const isLowStock = d.quantity < 10;
            
            return (
              <div key={d._id} style={{ 
                background: 'rgba(30, 41, 59, 0.4)', border: '1px solid rgba(255,255,255,0.06)', 
                borderRadius: 20, padding: '20px', display: 'flex', alignItems: 'center', gap: 20,
                transition: 'all 0.3s ease', backdropFilter: 'blur(20px)',
                position: 'relative', overflow: 'hidden'
              }}
              onMouseEnter={el => { el.currentTarget.style.transform = 'translateY(-4px)'; el.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; }}
              onMouseLeave={el => { el.currentTarget.style.transform = 'translateY(0)'; el.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; }}
              >
                <div style={{ 
                  width: 52, height: 52, borderRadius: 14, background: isLowStock ? 'rgba(244,63,94,0.1)' : 'rgba(255,255,255,0.03)', 
                  border: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', 
                  justifyContent: 'center', color: isLowStock ? '#f43f5e' : '#fff', flexShrink: 0
                }}>
                  <Ic.Pill size={24} />
                </div>
                
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '1rem', fontWeight: 800, color: '#fff', marginBottom: 4 }}>{d.name}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: '0.75rem', color: '#64748b' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Ic.Hospital size={12} /> {d.ward}</span>
                    <span>•</span>
                    <span style={{ fontWeight: 800, color: isLowStock ? '#f43f5e' : '#94a3b8' }}>{d.quantity} {d.unit}</span>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                   <div style={{ 
                     fontSize: '0.6rem', fontWeight: 900, textTransform: 'uppercase', 
                     color: exp.color, background: `${exp.color}15`, padding: '4px 8px', 
                     borderRadius: 6, border: `1px solid ${exp.border}`, marginBottom: 6,
                     display: 'inline-block'
                   }}>
                     {exp.label}
                   </div>
                   <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
                      Exp: {new Date(d.expiryDate).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
                   </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <style>{`
        @keyframes screen-entry { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}
