import { useState, useEffect } from "react";

/* ─── GOOGLE FONTS ─── */
const fontLink = document.createElement("link");
fontLink.rel = "stylesheet";
fontLink.href = "https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=Lora:wght@400;500;600&display=swap";
document.head.appendChild(fontLink);

// Ensure proper mobile scaling
if (!document.querySelector('meta[name="viewport"]')) {
  const vp = document.createElement("meta");
  vp.name = "viewport";
  vp.content = "width=device-width, initial-scale=1.0";
  document.head.appendChild(vp);
}

/* ─── DESIGN TOKENS ─── */
const C = {
  rust:    "#B84A1E",
  rustDark:"#8B3415",
  rustLight:"#E8956D",
  cream:   "#FDF8F0",
  creamDark:"#F2EAD8",
  dark:    "#2A1A0D",
  brown:   "#6B4A2A",
  brownLight:"#A07850",
  sage:    "#5A7A4A",
  sageLt:  "#8AAA72",
  gold:    "#C4962A",
  white:   "#FFFCF7",
  shadow:  "rgba(42,26,13,0.12)",
};

const BASE_STYLE = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body, #root { background: ${C.cream}; width: 100%; min-height: 100vh; overflow-x: hidden; }
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(16px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes shimmer {
    0%,100% { opacity: 0.6; } 50% { opacity: 1; }
  }
  @media (max-width: 600px) {
    .grid-2 { grid-template-columns: 1fr !important; }
    .stat-grid { grid-template-columns: 1fr 1fr !important; }
    .hide-mobile { display: none !important; }
  }
`;

/* ─── SEED DATA ─── */
const INIT_SOEPEN = [
  { id: 1, naam: "Tomatensoep", beschrijving: "Zongerijpte tomaten, verse basilicum & een vleugje room", seizoen: "Herfst", emoji: "🍅" },
  { id: 2, naam: "Wortel-gembersoep", beschrijving: "Zoete wortel, verse gember & kokosmelk", seizoen: "Winter", emoji: "🥕" },
  { id: 3, naam: "Erwtensoep", beschrijving: "Klassieke snert met rookworst & gerookt spek", seizoen: "Winter", emoji: "🫛" },
  { id: 4, naam: "Courgette-munt", beschrijving: "Lichte zomersoep met verse munt & citroen", seizoen: "Zomer", emoji: "🥒" },
  { id: 5, naam: "Pompoensoep", beschrijving: "Romige pompoen met kaneel & nootmuskaat", seizoen: "Herfst", emoji: "🎃" },
];

const INIT_KLANTEN = [
  { id: 1, naam: "Marie Janssen",   email: "marie@mail.be",  tel: "0471 12 34 56", straat: "Kerkstraat 12",    gemeente: "Gent",      levering: "ochtend",  abonnee: true,  aantalPerWeek: 2, actief: true,  wachtwoord: "marie123" },
  { id: 2, naam: "Luc Peeters",     email: "luc@mail.be",    tel: "0486 98 76 54", straat: "Molenweg 5",       gemeente: "Gent",      levering: "namiddag", abonnee: false, aantalPerWeek: 1, actief: true,  wachtwoord: "luc123" },
  { id: 3, naam: "Els De Smedt",    email: "els@mail.be",    tel: "0479 55 44 33", straat: "Bloemenstraat 8",  gemeente: "Merelbeke", levering: "ochtend",  abonnee: true,  aantalPerWeek: 1, actief: true,  wachtwoord: "els123" },
  { id: 4, naam: "Jan Vermeersch",  email: "jan@mail.be",    tel: "0492 11 22 33", straat: "Gentsesteenweg 44",gemeente: "Melle",     levering: "namiddag", abonnee: false, aantalPerWeek: 2, actief: true,  wachtwoord: "jan123" },
];

const WEEK_NR = Math.ceil((new Date() - new Date(new Date().getFullYear(), 0, 1)) / 604800000);

/* ─── HELPERS ─── */
const prijs = (k) => k.abonnee ? 4.50 : 5.00;
const weekOmzetKlant = (k) => k.aantalPerWeek * prijs(k);

function formatWA(s1, s2, week) {
  return `🍲 *Soepen van de week – week ${week}*\n\nLieve klant,\n\nDeze week serveren wij:\n\n🥣 *${s1?.naam || "Soep 1"}*\n${s1?.beschrijving || ""}\n\n🥣 *${s2?.naam || "Soep 2"}*\n${s2?.beschrijving || ""}\n\n📦 Levering op *donderdag* (ochtend of namiddag)\n💶 Abonnee: €4,50 | Los: €5,00 per soep\n💳 Betaling via *Payconiq* of overschrijving\n\nBestellen? Antwoord op dit bericht! 🌿\nSmakelijk!`;
}

/* ─── SMALL COMPONENTS ─── */
function Tag({ children, color = "brown" }) {
  const map = {
    brown:  { bg: C.creamDark,   text: C.brown },
    rust:   { bg: "#FDE8DC",     text: C.rust },
    sage:   { bg: "#E4EFD9",     text: C.sage },
    gold:   { bg: "#FBF0D6",     text: C.gold },
  };
  const s = map[color] || map.brown;
  return <span style={{ background: s.bg, color: s.text, borderRadius: 20, padding: "3px 11px", fontSize: 12, fontWeight: 600, fontFamily: "Lora, serif", letterSpacing: .3 }}>{children}</span>;
}

function Btn({ children, onClick, variant = "primary", small, disabled, style: xtra }) {
  const base = {
    fontFamily: "Lora, serif", fontWeight: 600, border: "none", cursor: disabled ? "not-allowed" : "pointer",
    borderRadius: 10, transition: "all .18s", opacity: disabled ? .5 : 1,
    padding: small ? "7px 14px" : "12px 22px", fontSize: small ? 13 : 15,
    ...xtra,
  };
  const styles = {
    primary: { background: C.rust, color: "#fff", boxShadow: `0 2px 10px rgba(184,74,30,.3)` },
    secondary: { background: C.creamDark, color: C.dark, boxShadow: "none" },
    ghost: { background: "transparent", color: C.rust, border: `1.5px solid ${C.rustLight}` },
    green: { background: C.sage, color: "#fff" },
    whatsapp: { background: "#25D366", color: "#fff" },
  };
  return <button onClick={disabled ? undefined : onClick} style={{ ...base, ...styles[variant] }}>{children}</button>;
}

function Card({ children, style: xtra }) {
  return <div style={{ background: C.white, borderRadius: 16, padding: 22, boxShadow: `0 2px 18px ${C.shadow}`, ...xtra }}>{children}</div>;
}

function Modal({ open, onClose, title, children }) {
  if (!open) return null;
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(42,26,13,.5)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: C.white, borderRadius: 20, padding: 28, width: "100%", maxWidth: 480, boxShadow: `0 12px 50px rgba(42,26,13,.25)`, animation: "fadeUp .25s ease" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h3 style={{ fontFamily: "Playfair Display, serif", color: C.rust, fontSize: 20 }}>{title}</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: C.brownLight }}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function InputField({ label, value, onChange, type = "text", placeholder, options }) {
  const inputStyle = { width: "100%", padding: "10px 13px", borderRadius: 9, border: `1.5px solid ${C.creamDark}`, fontFamily: "Lora, serif", fontSize: 14, background: C.cream, color: C.dark, outline: "none" };
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: "block", fontSize: 12, color: C.brownLight, marginBottom: 5, fontFamily: "Lora, serif", textTransform: "uppercase", letterSpacing: .5 }}>{label}</label>
      {options
        ? <select value={value} onChange={e => onChange(e.target.value)} style={inputStyle}>{options.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}</select>
        : <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={inputStyle} />
      }
    </div>
  );
}

/* ══════════════════════════════════════════
   ADMIN PORTAL
══════════════════════════════════════════ */
function AdminPortal({ klanten, setKlanten, soepen, setSoepen, weekMenu, setWeekMenu, bestellingen, setBestellingen, onLogout }) {
  const [tab, setTab] = useState("dashboard");
  const [copied, setCopied] = useState(false);
  const [klantModal, setKlantModal] = useState(false);
  const [soepModal, setSoepModal] = useState(false);
  const [editKlant, setEditKlant] = useState(null);
  const [newK, setNewK] = useState({ naam:"", email:"", tel:"", straat:"", gemeente:"", levering:"ochtend", abonnee:false, aantalPerWeek:1, wachtwoord:"" });
  const [newS, setNewS] = useState({ naam:"", beschrijving:"", seizoen:"", emoji:"🥣" });

  const actief = klanten.filter(k => k.actief);
  const abonnees = actief.filter(k => k.abonnee);
  const ochtend = actief.filter(k => k.levering === "ochtend");
  const namiddag = actief.filter(k => k.levering === "namiddag");
  const totaal = actief.reduce((s,k) => s + weekOmzetKlant(k), 0);

  const s1 = soepen.find(s => s.id === weekMenu[0]);
  const s2 = soepen.find(s => s.id === weekMenu[1]);
  const s3 = soepen.find(s => s.id === weekMenu[2]);
  const waText = formatWA(s1, s2, WEEK_NR);

  function saveKlant() {
    if (editKlant) {
      setKlanten(klanten.map(k => k.id === editKlant.id ? { ...editKlant, ...newK } : k));
    } else {
      const id = Math.max(0, ...klanten.map(k=>k.id)) + 1;
      setKlanten([...klanten, { ...newK, id, actief: true }]);
    }
    setKlantModal(false); setEditKlant(null);
    setNewK({ naam:"", email:"", tel:"", straat:"", gemeente:"", levering:"ochtend", abonnee:false, aantalPerWeek:1, wachtwoord:"" });
  }

  function openEdit(k) {
    setEditKlant(k); setNewK({ ...k }); setKlantModal(true);
  }

  function saveSoep() {
    const id = Math.max(0, ...soepen.map(s=>s.id)) + 1;
    setSoepen([...soepen, { ...newS, id }]);
    setSoepModal(false);
    setNewS({ naam:"", beschrijving:"", seizoen:"", emoji:"🥣" });
  }

  const navItems = [
    { key:"dashboard",    icon:"📊", label:"Dashboard" },
    { key:"weekmenu",     icon:"🍲", label:"Weekmenu" },
    { key:"klanten",      icon:"👥", label:"Klanten" },
    { key:"bestellingen", icon:"🛍️", label:"Bestellingen" },
    { key:"levering",     icon:"🚚", label:"Levering" },
    { key:"whatsapp",     icon:"💬", label:"WhatsApp" },
  ];

  return (
    <div style={{ fontFamily: "Lora, serif", minHeight: "100vh", background: C.cream, width: "100%" }}>
      <style>{BASE_STYLE}</style>

      {/* Header */}
      <div style={{ background: `linear-gradient(135deg, ${C.rustDark} 0%, ${C.rust} 100%)`, padding: "16px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", boxShadow: "0 3px 20px rgba(139,52,21,.4)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ fontSize: 36 }}>🍵</div>
          <div>
            <div style={{ fontFamily: "Playfair Display, serif", color: "#fff", fontSize: 22, fontWeight: 700 }}>Soepronde</div>
            <div style={{ color: "rgba(255,255,255,.7)", fontSize: 12, letterSpacing: .5 }}>BEHEERPORTAAL • WEEK {WEEK_NR}</div>
          </div>
        </div>
        <Btn variant="ghost" small onClick={onLogout} style={{ color: "#fff", borderColor: "rgba(255,255,255,.4)" }}>Uitloggen</Btn>
      </div>

      {/* Nav */}
      <div style={{ background: C.dark, display: "flex", gap: 2, padding: "8px 12px", overflowX: "auto" }}>
        {navItems.map(n => (
          <button key={n.key} onClick={() => setTab(n.key)} style={{
            background: tab === n.key ? C.rust : "transparent",
            color: tab === n.key ? "#fff" : "rgba(255,255,255,.6)",
            border: "none", borderRadius: 9, padding: "8px 16px", cursor: "pointer",
            fontFamily: "Lora, serif", fontSize: 13, fontWeight: 600, whiteSpace: "nowrap", transition: "all .2s",
          }}>{n.icon} {n.label}</button>
        ))}
      </div>

      <div style={{ maxWidth: "100%", margin: "0 auto", padding: "16px 24px" }}>

        {/* ── DASHBOARD ── */}
        {tab === "dashboard" && (
          <div style={{ animation: "fadeUp .3s ease" }}>
            <h2 style={{ fontFamily: "Playfair Display, serif", color: C.rust, marginBottom: 6 }}>Goeiedag! 👋</h2>
            <p style={{ color: C.brownLight, marginBottom: 24, fontSize: 14 }}>Hier is een overzicht van je soepbusiness deze week.</p>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px,1fr))", gap: 12, marginBottom: 24 }}>
              {[
                { label: "Actieve klanten", val: actief.length,       icon: "👥", color: C.rust },
                { label: "Abonnees",         val: abonnees.length,    icon: "⭐", color: C.sage },
                { label: "Los klanten",      val: actief.length - abonnees.length, icon: "🛒", color: C.gold },
                { label: "Weekomzet (est.)", val: `€${totaal.toFixed(2)}`, icon: "💶", color: C.brown },
              ].map(c => (
                <Card key={c.label} style={{ borderLeft: `4px solid ${c.color}`, padding: "16px 18px" }}>
                  <div style={{ fontSize: 26, marginBottom: 6 }}>{c.icon}</div>
                  <div style={{ fontSize: 28, fontWeight: 700, color: c.color, fontFamily: "Playfair Display, serif" }}>{c.val}</div>
                  <div style={{ fontSize: 12, color: C.brownLight, marginTop: 2 }}>{c.label}</div>
                </Card>
              ))}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px,1fr))", gap: 16 }}>
              <Card>
                <h3 style={{ fontFamily: "Playfair Display, serif", color: C.dark, marginBottom: 14, fontSize: 17 }}>🍲 Soepen week {WEEK_NR}</h3>
                {s1 && s2 ? [s1, s2].map((s, i) => (
                  <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 10, padding: "10px 12px", background: C.cream, borderRadius: 10 }}>
                    <span style={{ fontSize: 24 }}>{s.emoji}</span>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{s.naam}</div>
                      <div style={{ fontSize: 12, color: C.brownLight }}>{s.beschrijving}</div>
                    </div>
                  </div>
                )) : <p style={{ color: C.brownLight, fontSize: 14 }}>Selecteer soepen in "Weekmenu"</p>}
              </Card>
              <Card>
                <h3 style={{ fontFamily: "Playfair Display, serif", color: C.dark, marginBottom: 14, fontSize: 17 }}>🚚 Donderdag</h3>
                <div style={{ display: "flex", gap: 10 }}>
                  {[
                    { label: "Ochtend", count: ochtend.length, color: C.rust, icon: "🌅" },
                    { label: "Namiddag", count: namiddag.length, color: C.sage, icon: "🌇" },
                  ].map(r => (
                    <div key={r.label} style={{ flex: 1, background: C.cream, borderRadius: 12, padding: 14, textAlign: "center" }}>
                      <div style={{ fontSize: 24 }}>{r.icon}</div>
                      <div style={{ fontSize: 28, fontWeight: 700, color: r.color, fontFamily: "Playfair Display, serif" }}>{r.count}</div>
                      <div style={{ fontSize: 12, color: C.brownLight }}>{r.label}</div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* ── WEEKMENU ── */}
        {tab === "weekmenu" && (
          <div style={{ animation: "fadeUp .3s ease" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h2 style={{ fontFamily: "Playfair Display, serif", color: C.rust }}>Weekmenu — Week {WEEK_NR}</h2>
              <Btn small onClick={() => setSoepModal(true)}>+ Soep toevoegen</Btn>
            </div>

            <Card style={{ marginBottom: 20 }}>
              <h3 style={{ fontFamily: "Playfair Display, serif", marginBottom: 16, color: C.dark }}>Kies soepen voor deze week</h3>
              {[0, 1, 2].map(idx => (
                <div key={idx} style={{ marginBottom: 14 }}>
                  <label style={{ display: "block", fontSize: 12, color: C.brownLight, marginBottom: 6, textTransform: "uppercase", letterSpacing: .5 }}>Soep {idx + 1} {idx === 2 ? "(optioneel)" : ""}</label>
                  <select value={weekMenu[idx] || ""}
                    onChange={e => { const m = [...weekMenu]; m[idx] = e.target.value ? +e.target.value : null; setWeekMenu(m); }}
                    style={{ width: "100%", padding: "11px 14px", borderRadius: 10, border: `1.5px solid ${C.creamDark}`, fontFamily: "Lora, serif", fontSize: 14, background: C.cream, color: C.dark }}>
                    {idx === 2 && <option value="">— Geen derde soep —</option>}
                    {soepen.map(s => <option key={s.id} value={s.id}>{s.emoji} {s.naam}</option>)}
                  </select>
                </div>
              ))}
              {s1 && s2 && (
                <div style={{ marginTop: 16, padding: 14, background: "#E4EFD9", borderRadius: 12, border: `1px solid ${C.sageLt}` }}>
                  <div style={{ fontSize: 13, color: C.sage, fontWeight: 600 }}>✅ Menu geselecteerd</div>
                  <div style={{ fontSize: 13, color: C.dark, marginTop: 4 }}>{s1.emoji} {s1.naam} · {s2.emoji} {s2.naam}{s3 ? ` · ${s3.emoji} ${s3.naam}` : ""}</div>
                </div>
              )}
            </Card>

            <Card>
              <h3 style={{ fontFamily: "Playfair Display, serif", marginBottom: 16, color: C.dark }}>Alle soepen ({soepen.length})</h3>
              {soepen.map((s, i) => (
                <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "13px 0", borderBottom: i < soepen.length - 1 ? `1px solid ${C.creamDark}` : "none" }}>
                  <span style={{ fontSize: 28 }}>{s.emoji}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600 }}>{s.naam}</div>
                    <div style={{ fontSize: 12, color: C.brownLight }}>{s.beschrijving}</div>
                  </div>
                  {s.seizoen && <Tag color="gold">{s.seizoen}</Tag>}
                  {(weekMenu[0] === s.id || weekMenu[1] === s.id || weekMenu[2] === s.id) && <Tag color="sage">Deze week</Tag>}
                </div>
              ))}
            </Card>
          </div>
        )}

        {/* ── KLANTEN ── */}
        {tab === "klanten" && (
          <div style={{ animation: "fadeUp .3s ease" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 10 }}>
              <h2 style={{ fontFamily: "Playfair Display, serif", color: C.rust }}>Klanten ({actief.length})</h2>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <Btn small variant="secondary" onClick={() => {
                  const data = JSON.stringify(klanten, null, 2);
                  const blob = new Blob([data], { type: "application/json" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url; a.download = "soepronde-klanten-backup.json"; a.click();
                }}>💾 Backup</Btn>
                <label style={{ cursor: "pointer" }}>
                  <input type="file" accept=".json" style={{ display: "none" }} onChange={(e) => {
                    const file = e.target.files[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = (ev) => {
                      try {
                        const data = JSON.parse(ev.target.result);
                        if (Array.isArray(data)) { setKlanten(data); alert("✅ Klanten hersteld!"); }
                        else alert("❌ Ongeldig bestand.");
                      } catch { alert("❌ Fout bij inlezen."); }
                    };
                    reader.readAsText(file);
                  }} />
                  <span style={{ background: C.creamDark, color: C.dark, borderRadius: 10, padding: "7px 14px", fontSize: 13, fontFamily: "Lora, serif", fontWeight: 600, cursor: "pointer" }}>📂 Herstel</span>
                </label>
                <Btn onClick={() => { setEditKlant(null); setNewK({ naam:"", email:"", tel:"", straat:"", gemeente:"", levering:"ochtend", abonnee:false, aantalPerWeek:1, wachtwoord:"" }); setKlantModal(true); }}>+ Nieuwe klant</Btn>
              </div>
            </div>

            {/* Filter tabs */}
            <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
              {["allen", "abonnees", "los"].map(f => (
                <Btn key={f} small variant="secondary" style={{ textTransform: "capitalize" }}>{f}</Btn>
              ))}
            </div>

            {actief.map(k => (
              <Card key={k.id} style={{ marginBottom: 12, display: "flex", alignItems: "flex-start", gap: 16, padding: "16px 20px", flexWrap: "wrap" }}>
                <div style={{ width: 44, height: 44, borderRadius: "50%", background: k.abonnee ? `linear-gradient(135deg,${C.sage},${C.sageLt})` : `linear-gradient(135deg,${C.rustLight},${C.rust})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>
                  {k.abonnee ? "⭐" : "🛒"}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 16, fontFamily: "Playfair Display, serif" }}>{k.naam}</div>
                  <div style={{ fontSize: 13, color: C.brownLight, marginBottom: 8 }}>{k.tel} • {k.straat}, {k.gemeente}</div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    <Tag color={k.abonnee ? "sage" : "brown"}>{k.abonnee ? "⭐ Abonnee €4,50" : "Los €5,00"}</Tag>
                    <Tag color="rust">{k.levering === "ochtend" ? "🌅 Ochtend" : "🌇 Namiddag"}</Tag>
                    <Tag color="gold">{k.aantalPerWeek}× per week · €{weekOmzetKlant(k).toFixed(2)}</Tag>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <Btn small variant="secondary" onClick={() => openEdit(k)}>✏️</Btn>
                  <Btn small variant="ghost" onClick={() => setKlanten(klanten.map(x => x.id === k.id ? { ...x, actief: false } : x))}>🗑</Btn>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* ── LEVERING ── */}
        {tab === "levering" && (
          <div style={{ animation: "fadeUp .3s ease" }}>
            <h2 style={{ fontFamily: "Playfair Display, serif", color: C.rust, marginBottom: 20 }}>Leveringsplanning — Donderdag Week {WEEK_NR}</h2>
            {[
              { label: "🌅 Ochtend", klanten: ochtend, color: C.rust },
              { label: "🌇 Namiddag", klanten: namiddag, color: C.sage },
            ].map(groep => (
              <Card key={groep.label} style={{ marginBottom: 20 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                  <h3 style={{ fontFamily: "Playfair Display, serif", color: groep.color }}>{groep.label} — {groep.klanten.length} stops</h3>
                  <Tag color={groep.color === C.rust ? "rust" : "sage"}>€{groep.klanten.reduce((s,k)=>s+weekOmzetKlant(k),0).toFixed(2)}</Tag>
                </div>
                {groep.klanten.length === 0 && <p style={{ color: C.brownLight, fontSize: 14 }}>Geen leveringen.</p>}
                {groep.klanten.map((k, i) => (
                  <div key={k.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 0", borderBottom: i < groep.klanten.length-1 ? `1px dashed ${C.creamDark}` : "none" }}>
                    <div style={{ width: 30, height: 30, borderRadius: "50%", background: groep.color, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, flexShrink: 0 }}>{i+1}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600 }}>{k.naam}</div>
                      <div style={{ fontSize: 13, color: C.brownLight }}>{k.straat}, {k.gemeente}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontWeight: 700, color: groep.color }}>€{weekOmzetKlant(k).toFixed(2)}</div>
                      <div style={{ fontSize: 12, color: C.brownLight }}>{k.aantalPerWeek}× soep</div>
                    </div>
                  </div>
                ))}
              </Card>
            ))}
            <div style={{ background: `linear-gradient(135deg,${C.rustDark},${C.rust})`, borderRadius: 16, padding: 22, color: "#fff", textAlign: "center" }}>
              <div style={{ fontSize: 14, opacity: .8, marginBottom: 4 }}>Totale weekomzet</div>
              <div style={{ fontFamily: "Playfair Display, serif", fontSize: 42, fontWeight: 700 }}>€{totaal.toFixed(2)}</div>
              <div style={{ fontSize: 13, opacity: .7, marginTop: 4 }}>Payconiq of overschrijving bij levering</div>
            </div>
          </div>
        )}

        {/* ── BESTELLINGEN ── */}
        {tab === "bestellingen" && (
          <div style={{ animation: "fadeUp .3s ease" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h2 style={{ fontFamily: "Playfair Display, serif", color: C.rust }}>🛍️ Bestellingen — Week {WEEK_NR}</h2>
              {bestellingen.filter(b => b.week === WEEK_NR).length > 0 && (
                <Btn small variant="secondary" onClick={() => setBestellingen(bestellingen.map(b => b.week === WEEK_NR ? {...b, afgehandeld: true} : b))}>
                  ✅ Alles afhandelen
                </Btn>
              )}
            </div>

            {bestellingen.filter(b => b.week === WEEK_NR && !b.afgehandeld).length === 0 && bestellingen.filter(b => b.week === WEEK_NR).length === 0 && (
              <Card style={{ textAlign: "center", padding: 40 }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>📭</div>
                <p style={{ color: C.brownLight }}>Nog geen bestellingen deze week.</p>
              </Card>
            )}

            {bestellingen.filter(b => b.week === WEEK_NR && !b.afgehandeld).length > 0 && (
              <Card style={{ marginBottom: 20 }}>
                <h3 style={{ fontFamily: "Playfair Display, serif", color: C.rust, marginBottom: 16 }}>
                  ⏳ Openstaand ({bestellingen.filter(b => b.week === WEEK_NR && !b.afgehandeld).length})
                </h3>
                {bestellingen.filter(b => b.week === WEEK_NR && !b.afgehandeld).map(b => (
                  <div key={b.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 0", borderBottom: `1px solid ${C.creamDark}`, flexWrap: "wrap" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700 }}>{b.klantnaam}</div>
                      <div style={{ fontSize: 13, color: C.brownLight }}>{b.soepen.join(" & ")} · {b.levering === "ochtend" ? "🌅 Ochtend" : "🌇 Namiddag"}</div>
                      <div style={{ fontSize: 12, color: C.brownLight }}>{b.datum}</div>
                    </div>
                    <div style={{ fontWeight: 700, color: C.rust }}>€{b.bedrag.toFixed(2)}</div>
                    <Btn small variant="green" onClick={() => setBestellingen(bestellingen.map(x => x.id === b.id ? {...x, afgehandeld: true} : x))}>✅</Btn>
                  </div>
                ))}
                <div style={{ marginTop: 14, padding: "10px 0", display: "flex", justifyContent: "space-between", fontWeight: 700 }}>
                  <span>Totaal openstaand</span>
                  <span style={{ color: C.rust }}>€{bestellingen.filter(b => b.week === WEEK_NR && !b.afgehandeld).reduce((s,b) => s + b.bedrag, 0).toFixed(2)}</span>
                </div>
              </Card>
            )}

            {bestellingen.filter(b => b.week === WEEK_NR && b.afgehandeld).length > 0 && (
              <Card>
                <h3 style={{ fontFamily: "Playfair Display, serif", color: C.sage, marginBottom: 16 }}>
                  ✅ Afgehandeld ({bestellingen.filter(b => b.week === WEEK_NR && b.afgehandeld).length})
                </h3>
                {bestellingen.filter(b => b.week === WEEK_NR && b.afgehandeld).map(b => (
                  <div key={b.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 0", borderBottom: `1px solid ${C.creamDark}`, opacity: 0.6, flexWrap: "wrap" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700 }}>{b.klantnaam}</div>
                      <div style={{ fontSize: 13, color: C.brownLight }}>{b.soepen.join(" & ")} · {b.levering === "ochtend" ? "🌅 Ochtend" : "🌇 Namiddag"}</div>
                    </div>
                    <div style={{ fontWeight: 700, color: C.sage }}>€{b.bedrag.toFixed(2)}</div>
                  </div>
                ))}
              </Card>
            )}
          </div>
        )}

        {/* ── WHATSAPP ── */}
        {tab === "whatsapp" && (
          <div style={{ animation: "fadeUp .3s ease" }}>
            <h2 style={{ fontFamily: "Playfair Display, serif", color: C.rust, marginBottom: 20 }}>💬 WhatsApp Bericht — Week {WEEK_NR}</h2>
            <Card style={{ marginBottom: 20 }}>
              <h3 style={{ fontFamily: "Playfair Display, serif", marginBottom: 14, color: C.dark }}>Voorbeeldbericht</h3>
              <pre style={{ background: "#E8F5DE", borderRadius: 12, padding: 18, fontSize: 13.5, fontFamily: "Lora, serif", whiteSpace: "pre-wrap", lineHeight: 1.8, color: C.dark, border: `1px solid ${C.sageLt}` }}>
                {waText}
              </pre>
              <div style={{ display: "flex", gap: 12, marginTop: 16, flexWrap: "wrap" }}>
                <Btn onClick={() => { navigator.clipboard.writeText(waText); setCopied(true); setTimeout(() => setCopied(false), 2500); }} variant={copied ? "green" : "primary"}>
                  {copied ? "✅ Gekopieerd!" : "📋 Kopieer bericht"}
                </Btn>
                <a href={`https://wa.me/?text=${encodeURIComponent(waText)}`} target="_blank" rel="noopener noreferrer"
                  style={{ background: "#25D366", color: "#fff", textDecoration: "none", borderRadius: 10, padding: "12px 22px", fontFamily: "Lora, serif", fontWeight: 600, fontSize: 15, display: "inline-flex", alignItems: "center", gap: 6 }}>
                  📱 Open WhatsApp
                </a>
              </div>
            </Card>

            <Card>
              <h3 style={{ fontFamily: "Playfair Display, serif", marginBottom: 16, color: C.dark }}>Stuur naar elke klant</h3>
              {actief.map(k => (
                <div key={k.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "11px 0", borderBottom: `1px solid ${C.creamDark}` }}>
                  <div>
                    <span style={{ fontWeight: 600 }}>{k.naam}</span>
                    <span style={{ color: C.brownLight, fontSize: 13 }}> · {k.tel}</span>
                  </div>
                  <a href={`https://wa.me/${k.tel.replace(/\s/g,"")}?text=${encodeURIComponent(waText)}`} target="_blank" rel="noopener noreferrer"
                    style={{ background: "#25D366", color: "#fff", textDecoration: "none", borderRadius: 8, padding: "6px 14px", fontSize: 13, fontFamily: "Lora, serif", fontWeight: 600 }}>
                    💬 Stuur
                  </a>
                </div>
              ))}
            </Card>
          </div>
        )}
      </div>

      {/* ── MODALS ── */}
      <Modal open={klantModal} onClose={() => setKlantModal(false)} title={editKlant ? "Klant bewerken" : "Nieuwe klant toevoegen"}>
        <InputField label="Volledige naam" value={newK.naam} onChange={v => setNewK(p=>({...p,naam:v}))} />
        <InputField label="E-mailadres" value={newK.email} onChange={v => setNewK(p=>({...p,email:v}))} type="email" />
        <InputField label="Telefoonnummer" value={newK.tel} onChange={v => setNewK(p=>({...p,tel:v}))} />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px,1fr))", gap: 12 }}>
          <InputField label="Straat + nr" value={newK.straat} onChange={v => setNewK(p=>({...p,straat:v}))} />
          <InputField label="Gemeente" value={newK.gemeente} onChange={v => setNewK(p=>({...p,gemeente:v}))} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <InputField label="Levering" value={newK.levering} onChange={v => setNewK(p=>({...p,levering:v}))}
            options={[{v:"ochtend",l:"🌅 Ochtend"},{v:"namiddag",l:"🌇 Namiddag"}]} />
          <InputField label="Soepen/week" value={newK.aantalPerWeek} onChange={v => setNewK(p=>({...p,aantalPerWeek:+v}))} type="number" />
        </div>
        <InputField label="Wachtwoord portaal" value={newK.wachtwoord} onChange={v => setNewK(p=>({...p,wachtwoord:v}))} type="password" />
        <label style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20, cursor: "pointer", fontSize: 14, color: C.dark }}>
          <input type="checkbox" checked={newK.abonnee} onChange={e => setNewK(p=>({...p,abonnee:e.target.checked}))} style={{ width: 18, height: 18, accentColor: C.sage }} />
          <div>
            <span style={{ fontWeight: 600 }}>Abonnement</span>
            <span style={{ color: C.brownLight }}> · €4,50 p.soep ipv €5,00</span>
          </div>
        </label>
        <div style={{ display: "flex", gap: 12 }}>
          <Btn variant="secondary" onClick={() => setKlantModal(false)} style={{ flex: 1 }}>Annuleren</Btn>
          <Btn disabled={!newK.naam} onClick={saveKlant} style={{ flex: 2 }}>✅ {editKlant ? "Opslaan" : "Toevoegen"}</Btn>
        </div>
      </Modal>

      <Modal open={soepModal} onClose={() => setSoepModal(false)} title="Nieuwe soep toevoegen">
        <InputField label="Naam soep" value={newS.naam} onChange={v => setNewS(p=>({...p,naam:v}))} />
        <InputField label="Beschrijving" value={newS.beschrijving} onChange={v => setNewS(p=>({...p,beschrijving:v}))} />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <InputField label="Seizoen" value={newS.seizoen} onChange={v => setNewS(p=>({...p,seizoen:v}))} placeholder="Herfst…" />
          <InputField label="Emoji" value={newS.emoji} onChange={v => setNewS(p=>({...p,emoji:v}))} />
        </div>
        <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
          <Btn variant="secondary" onClick={() => setSoepModal(false)} style={{ flex: 1 }}>Annuleren</Btn>
          <Btn disabled={!newS.naam} onClick={saveSoep} style={{ flex: 2 }}>✅ Toevoegen</Btn>
        </div>
      </Modal>
    </div>
  );
}

/* ══════════════════════════════════════════
   KLANT PORTAL
══════════════════════════════════════════ */
function KlantPortal({ klant, setKlant, soepen, weekMenu, setKlanten, klanten, bestellingen, setBestellingen, onLogout }) {
  const [tab, setTab] = useState("weekmenu");
  const [aantal, setAantal] = useState({ s1: 0, s2: 0, s3: 0 });
  const [bestellingGedaan, setBestellingGedaan] = useState(false);

  const s1 = soepen.find(s => s.id === weekMenu[0]);
  const s2 = soepen.find(s => s.id === weekMenu[1]);
  const s3 = soepen.find(s => s.id === weekMenu[2]);
  const aantalBesteld = aantal.s1 + aantal.s2 + (aantal.s3 || 0);
  const kostenBestelling = aantalBesteld * prijs(klant);

  function bevestigBestelling() {
    const soepNamen = [
      ...Array(aantal.s1).fill(s1?.naam).filter(Boolean),
      ...Array(aantal.s2).fill(s2?.naam).filter(Boolean),
      ...Array(aantal.s3 || 0).fill(s3?.naam).filter(Boolean),
    ];
    const bestelling = {
      id: Date.now(),
      klantid: klant.id,
      klantnaam: klant.naam,
      soepen: soepNamen,
      levering: klant.levering,
      bedrag: kostenBestelling,
      week: WEEK_NR,
      datum: new Date().toLocaleDateString("nl-BE"),
      afgehandeld: false,
    };
    setBestellingen([...bestellingen, bestelling]);
    setBestellingGedaan(true);
  }

  function toggleAbonnement() {
    const updated = { ...klant, abonnee: !klant.abonnee };
    setKlant(updated);
    setKlanten(klanten.map(k => k.id === klant.id ? updated : k));
  }

  function wisselLevering() {
    const updated = { ...klant, levering: klant.levering === "ochtend" ? "namiddag" : "ochtend" };
    setKlant(updated);
    setKlanten(klanten.map(k => k.id === klant.id ? updated : k));
  }

  const navItems = [
    { key: "weekmenu", icon: "🍲", label: "Weekmenu" },
    { key: "bestellen", icon: "🛒", label: "Bestellen" },
    { key: "profiel",   icon: "👤", label: "Mijn profiel" },
  ];

  return (
    <div style={{ fontFamily: "Lora, serif", minHeight: "100vh", background: C.cream, width: "100%" }}>
      <style>{BASE_STYLE}</style>

      {/* Header */}
      <div style={{ background: `linear-gradient(135deg, ${C.sage} 0%, ${C.sageLt} 100%)`, padding: "16px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", boxShadow: `0 3px 20px rgba(90,122,74,.4)` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ fontSize: 36 }}>🍵</div>
          <div>
            <div style={{ fontFamily: "Playfair Display, serif", color: "#fff", fontSize: 20, fontWeight: 700 }}>Goeiedag, {klant.naam.split(" ")[0]}!</div>
            <div style={{ color: "rgba(255,255,255,.75)", fontSize: 12, letterSpacing: .5 }}>KLANTENPORTAAL • WEEK {WEEK_NR}</div>
          </div>
        </div>
        <Btn variant="ghost" small onClick={onLogout} style={{ color: "#fff", borderColor: "rgba(255,255,255,.5)" }}>Uitloggen</Btn>
      </div>

      {/* Nav */}
      <div style={{ background: "#3D5530", display: "flex", gap: 2, padding: "8px 12px" }}>
        {navItems.map(n => (
          <button key={n.key} onClick={() => setTab(n.key)} style={{
            background: tab === n.key ? C.sage : "transparent",
            color: tab === n.key ? "#fff" : "rgba(255,255,255,.6)",
            border: "none", borderRadius: 9, padding: "8px 16px", cursor: "pointer",
            fontFamily: "Lora, serif", fontSize: 13, fontWeight: 600, transition: "all .2s",
          }}>{n.icon} {n.label}</button>
        ))}
      </div>

      <div style={{ maxWidth: "100%", margin: "0 auto", padding: "16px 24px" }}>

        {/* ── WEEKMENU ── */}
        {tab === "weekmenu" && (
          <div style={{ animation: "fadeUp .3s ease" }}>
            <h2 style={{ fontFamily: "Playfair Display, serif", color: C.sage, marginBottom: 6 }}>Menu van de week</h2>
            <p style={{ color: C.brownLight, marginBottom: 24, fontSize: 14 }}>Levering donderdag · {klant.levering === "ochtend" ? "🌅 Ochtend" : "🌇 Namiddag"}</p>
            {[s1, s2, s3].filter(Boolean).map((s, i) => (
              <Card key={i} style={{ marginBottom: 16, display: "flex", gap: 18, alignItems: "center", padding: "20px 22px" }}>
                <div style={{ fontSize: 52 }}>{s.emoji}</div>
                <div>
                  <div style={{ fontFamily: "Playfair Display, serif", fontSize: 20, color: C.dark, fontWeight: 700 }}>{s.naam}</div>
                  <div style={{ color: C.brownLight, fontSize: 14, marginTop: 4, lineHeight: 1.5 }}>{s.beschrijving}</div>
                  {s.seizoen && <Tag color="gold" style={{ marginTop: 8 }}>{s.seizoen}</Tag>}
                  <div style={{ marginTop: 10, fontWeight: 600, color: klant.abonnee ? C.sage : C.rust }}>
                    {klant.abonnee ? "⭐ Abonneeprijs: €4,50" : "💶 Losse prijs: €5,00"}
                  </div>
                </div>
              </Card>
            ))}

            {klant.abonnee && (
              <div style={{ background: "#E4EFD9", border: `1px solid ${C.sageLt}`, borderRadius: 14, padding: 16, textAlign: "center" }}>
                <div style={{ fontWeight: 700, color: C.sage, marginBottom: 4 }}>⭐ Je bent abonnee!</div>
                <div style={{ fontSize: 13, color: C.sage }}>Je geniet van €0,50 korting per soep ten opzichte van losse aankoop.</div>
              </div>
            )}
          </div>
        )}

        {/* ── BESTELLEN ── */}
        {tab === "bestellen" && (
          <div style={{ animation: "fadeUp .3s ease" }}>
            <h2 style={{ fontFamily: "Playfair Display, serif", color: C.sage, marginBottom: 20 }}>Bestellen — Week {WEEK_NR}</h2>

            {bestellingGedaan ? (
              <Card style={{ textAlign: "center", padding: 40 }}>
                <div style={{ fontSize: 60, marginBottom: 16 }}>✅</div>
                <h3 style={{ fontFamily: "Playfair Display, serif", color: C.sage, fontSize: 22, marginBottom: 10 }}>Bestelling ontvangen!</h3>
                <p style={{ color: C.brownLight, marginBottom: 20, lineHeight: 1.6 }}>
                  Je soep{aantalBesteld > 1 ? "en worden" : " wordt"} donderdag geleverd <strong>{klant.levering === "ochtend" ? "in de ochtend" : "in de namiddag"}</strong>.<br />
                  Betaling via Payconiq of overschrijving bij levering.
                </p>
                <div style={{ background: C.cream, borderRadius: 12, padding: "14px 20px", display: "inline-block", marginBottom: 20 }}>
                  <div style={{ fontWeight: 700, color: C.dark }}>Te betalen: <span style={{ color: C.rust }}>€{kostenBestelling.toFixed(2)}</span></div>
                </div>
                <br />
                <Btn variant="secondary" onClick={() => { setBesteld({s1:false,s2:false}); setBestellingGedaan(false); }}>Nieuwe bestelling</Btn>
              </Card>
            ) : (
              <>
                <Card style={{ marginBottom: 16 }}>
                  <h3 style={{ fontFamily: "Playfair Display, serif", marginBottom: 16, color: C.dark }}>Selecteer je soepen</h3>
                  {[
                    { key: "s1", soep: s1 },
                    { key: "s2", soep: s2 },
                    { key: "s3", soep: s3 },
                  ].filter(x => x.soep).map(({ key, soep }) => (
                    <div key={key} style={{ display: "flex", alignItems: "center", gap: 16, padding: "14px 16px", borderRadius: 12, marginBottom: 10, border: `2px solid ${aantal[key] > 0 ? C.sage : C.creamDark}`, background: aantal[key] > 0 ? "#E4EFD9" : C.cream, transition: "all .2s" }}>
                      <span style={{ fontSize: 32 }}>{soep.emoji}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600 }}>{soep.naam}</div>
                        <div style={{ fontSize: 12, color: C.brownLight }}>{soep.beschrijving}</div>
                        <div style={{ fontWeight: 700, color: klant.abonnee ? C.sage : C.rust, marginTop: 4 }}>€{prijs(klant).toFixed(2)} / stuk</div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <button onClick={() => setAantal(p => ({ ...p, [key]: Math.max(0, p[key] - 1) }))}
                          style={{ width: 32, height: 32, borderRadius: "50%", border: `2px solid ${C.brownLight}`, background: "white", cursor: "pointer", fontSize: 18, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", color: C.dark }}>−</button>
                        <span style={{ fontWeight: 700, fontSize: 18, minWidth: 20, textAlign: "center" }}>{aantal[key]}</span>
                        <button onClick={() => setAantal(p => ({ ...p, [key]: p[key] + 1 }))}
                          style={{ width: 32, height: 32, borderRadius: "50%", border: "none", background: C.sage, cursor: "pointer", fontSize: 18, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", color: "white" }}>+</button>
                      </div>
                    </div>
                  ))}
                </Card>

                <Card style={{ marginBottom: 16 }}>
                  <h3 style={{ fontFamily: "Playfair Display, serif", marginBottom: 12, color: C.dark }}>Leveringsmoment</h3>
                  <div style={{ display: "flex", gap: 10 }}>
                    {["ochtend", "namiddag"].map(l => (
                      <div key={l} onClick={() => { const updated = {...klant, levering: l}; setKlant(updated); setKlanten(klanten.map(k=>k.id===klant.id?updated:k)); }}
                        style={{ flex: 1, padding: 14, borderRadius: 12, border: `2px solid ${klant.levering === l ? C.sage : C.creamDark}`, background: klant.levering === l ? "#E4EFD9" : C.cream, cursor: "pointer", textAlign: "center", transition: "all .2s" }}>
                        <div style={{ fontSize: 24 }}>{l === "ochtend" ? "🌅" : "🌇"}</div>
                        <div style={{ fontWeight: 600, fontSize: 14, marginTop: 6, textTransform: "capitalize" }}>{l}</div>
                      </div>
                    ))}
                  </div>
                </Card>

                <Card style={{ marginBottom: 20, background: "#FDE8DC", border: `1px solid ${C.rustLight}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ fontWeight: 700, color: C.dark }}>Totaal</div>
                      <div style={{ fontSize: 13, color: C.brownLight }}>{aantalBesteld} portie{aantalBesteld !== 1 ? "s" : ""} · {klant.abonnee ? "abonneeprijs" : "losse prijs"}</div>
                    </div>
                    <div style={{ fontFamily: "Playfair Display, serif", fontSize: 28, fontWeight: 700, color: C.rust }}>€{kostenBestelling.toFixed(2)}</div>
                  </div>
                  <div style={{ marginTop: 10, fontSize: 12, color: C.brownLight }}>💳 Betaling via Payconiq of overschrijving bij levering</div>
                </Card>

                <Btn disabled={aantalBesteld === 0} onClick={bevestigBestelling} style={{ width: "100%" }}>
                  🛒 Bestelling bevestigen (€{kostenBestelling.toFixed(2)})
                </Btn>
              </>
            )}
          </div>
        )}

        {/* ── PROFIEL ── */}
        {tab === "profiel" && (
          <div style={{ animation: "fadeUp .3s ease" }}>
            <h2 style={{ fontFamily: "Playfair Display, serif", color: C.sage, marginBottom: 20 }}>Mijn profiel</h2>

            <Card style={{ marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
                <div style={{ width: 60, height: 60, borderRadius: "50%", background: `linear-gradient(135deg,${C.sage},${C.sageLt})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28 }}>
                  {klant.naam.charAt(0)}
                </div>
                <div>
                  <div style={{ fontFamily: "Playfair Display, serif", fontSize: 20, fontWeight: 700 }}>{klant.naam}</div>
                  <div style={{ color: C.brownLight, fontSize: 13 }}>{klant.email}</div>
                </div>
              </div>
              {[
                { label: "Telefoon", val: klant.tel, icon: "📞" },
                { label: "Adres", val: `${klant.straat}, ${klant.gemeente}`, icon: "📍" },
                { label: "Levering", val: klant.levering === "ochtend" ? "🌅 Ochtend" : "🌇 Namiddag", icon: "🚚" },
              ].map(row => (
                <div key={row.label} style={{ display: "flex", gap: 12, padding: "11px 0", borderBottom: `1px solid ${C.creamDark}` }}>
                  <span style={{ fontSize: 18, width: 24 }}>{row.icon}</span>
                  <div>
                    <div style={{ fontSize: 11, color: C.brownLight, textTransform: "uppercase", letterSpacing: .5 }}>{row.label}</div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{row.val}</div>
                  </div>
                </div>
              ))}
            </Card>

            <Card style={{ marginBottom: 16 }}>
              <h3 style={{ fontFamily: "Playfair Display, serif", marginBottom: 14, color: C.dark }}>Abonnement</h3>
              <div style={{ background: klant.abonnee ? "#E4EFD9" : C.creamDark, borderRadius: 12, padding: 16, marginBottom: 14 }}>
                <div style={{ fontWeight: 700, color: klant.abonnee ? C.sage : C.brownLight, fontSize: 16, marginBottom: 6 }}>
                  {klant.abonnee ? "⭐ Abonnee" : "🛒 Losse klant"}
                </div>
                <div style={{ fontSize: 13, color: klant.abonnee ? C.sage : C.brownLight }}>
                  {klant.abonnee
                    ? "Je betaalt €4,50 per soep. Dat is €0,50 korting ten opzichte van de losse prijs!"
                    : "Los kopen: €5,00 per soep. Abonneer je en bespaar €0,50 per soep."}
                </div>
              </div>
              <Btn variant={klant.abonnee ? "secondary" : "green"} onClick={toggleAbonnement} style={{ width: "100%" }}>
                {klant.abonnee ? "❌ Abonnement opzeggen" : "⭐ Abonnement nemen"}
              </Btn>
            </Card>

            <Card>
              <h3 style={{ fontFamily: "Playfair Display, serif", marginBottom: 12, color: C.dark }}>Betaling</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div style={{ background: C.cream, borderRadius: 10, padding: 14, textAlign: "center" }}>
                  <div style={{ fontSize: 28 }}>📱</div>
                  <div style={{ fontWeight: 600, fontSize: 14, marginTop: 6 }}>Payconiq</div>
                  <div style={{ fontSize: 12, color: C.brownLight }}>Bij levering</div>
                </div>
                <div style={{ background: C.cream, borderRadius: 10, padding: 14, textAlign: "center" }}>
                  <div style={{ fontSize: 28 }}>🏦</div>
                  <div style={{ fontWeight: 600, fontSize: 14, marginTop: 6 }}>Overschrijving</div>
                  <div style={{ fontSize: 12, color: C.brownLight }}>Bij levering</div>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   LOGIN SCREEN
══════════════════════════════════════════ */
function LoginScreen({ klanten, setKlanten, onLogin }) {
  const [mode, setMode] = useState("keuze"); // keuze | admin | klant | registreren
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [fout, setFout] = useState("");
  const [regNaam, setRegNaam] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPass, setRegPass] = useState("");
  const [regTel, setRegTel] = useState("");
  const [regSuccess, setRegSuccess] = useState(false);

  function loginAdmin() {
    if (pass === "admin123") onLogin("admin", null);
    else setFout("Fout wachtwoord. (Hint: admin123)");
  }

  function loginKlant() {
    const k = klanten.find(k => k.email === email && k.wachtwoord === pass && k.actief && !k.wachtend);
    if (k) onLogin("klant", k);
    else setFout("E-mail of wachtwoord niet herkend.");
  }

  function registreer() {
    if (!regNaam || !regEmail || !regPass) { setFout("Vul alle velden in."); return; }
    if (klanten.find(k => k.email === regEmail)) { setFout("Dit e-mailadres is al geregistreerd."); return; }
    const id = Math.max(0, ...klanten.map(k => k.id)) + 1;
    const nieuw = { id, naam: regNaam, email: regEmail, wachtwoord: regPass, tel: regTel, straat: "", gemeente: "", levering: "ochtend", abonnee: false, aantalPerWeek: 1, actief: true, wachtend: false };
    setKlanten([...klanten, nieuw]);
    setRegSuccess(true);
  }

  return (
    <div style={{ fontFamily: "Lora, serif", minHeight: "100vh", width: "100%", background: `linear-gradient(160deg, ${C.rustDark} 0%, ${C.cream} 55%, ${C.creamDark} 100%)`, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <style>{BASE_STYLE}</style>

      <div style={{ width: "100%", maxWidth: 420, animation: "fadeUp .4s ease" }}>
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{ fontSize: 64, marginBottom: 12 }}>🍵</div>
          <h1 style={{ fontFamily: "Playfair Display, serif", color: C.white, fontSize: 36, fontWeight: 700, textShadow: "0 2px 12px rgba(0,0,0,.2)" }}>Soepronde</h1>
          <p style={{ color: "rgba(255,255,255,.8)", marginTop: 6, fontSize: 15, fontStyle: "italic" }}>Ambachtelijke soep aan huis</p>
        </div>

        <div style={{ background: C.white, borderRadius: 20, padding: 32, boxShadow: "0 16px 60px rgba(42,26,13,.25)" }}>

          {mode === "keuze" && (
            <>
              <h2 style={{ fontFamily: "Playfair Display, serif", color: C.dark, marginBottom: 8, fontSize: 22 }}>Welkom!</h2>
              <p style={{ color: C.brownLight, fontSize: 14, marginBottom: 24, lineHeight: 1.6 }}>Kies hieronder hoe je wil inloggen.</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <button onClick={() => setMode("admin")} style={{ background: `linear-gradient(135deg,${C.rustDark},${C.rust})`, color: "#fff", border: "none", borderRadius: 12, padding: "16px 20px", cursor: "pointer", fontFamily: "Lora, serif", fontSize: 15, fontWeight: 600, textAlign: "left", display: "flex", alignItems: "center", gap: 14, boxShadow: `0 4px 18px rgba(184,74,30,.3)` }}>
                  <span style={{ fontSize: 28 }}>🔑</span>
                  <div>
                    <div>Beheerder</div>
                    <div style={{ fontSize: 12, opacity: .8 }}>Klanten, weekmenu & leveringen</div>
                  </div>
                </button>
                <button onClick={() => setMode("klant")} style={{ background: `linear-gradient(135deg,${C.sage},${C.sageLt})`, color: "#fff", border: "none", borderRadius: 12, padding: "16px 20px", cursor: "pointer", fontFamily: "Lora, serif", fontSize: 15, fontWeight: 600, textAlign: "left", display: "flex", alignItems: "center", gap: 14, boxShadow: `0 4px 18px rgba(90,122,74,.3)` }}>
                  <span style={{ fontSize: 28 }}>👤</span>
                  <div>
                    <div>Klant</div>
                    <div style={{ fontSize: 12, opacity: .8 }}>Weekmenu bekijken & bestellen</div>
                  </div>
                </button>
              </div>
            </>
          )}

          {mode === "admin" && (
            <>
              <button onClick={() => { setMode("keuze"); setFout(""); setPass(""); }} style={{ background: "none", border: "none", cursor: "pointer", color: C.brownLight, fontSize: 13, marginBottom: 16, fontFamily: "Lora, serif" }}>← Terug</button>
              <h2 style={{ fontFamily: "Playfair Display, serif", color: C.dark, marginBottom: 20, fontSize: 20 }}>🔑 Beheerder inloggen</h2>
              <InputField label="Wachtwoord" value={pass} onChange={setPass} type="password" placeholder="admin123" />
              {fout && <div style={{ color: C.rust, fontSize: 13, marginBottom: 12 }}>⚠️ {fout}</div>}
              <Btn onClick={loginAdmin} style={{ width: "100%" }}>Inloggen</Btn>
            </>
          )}

          {mode === "klant" && (
            <>
              <button onClick={() => { setMode("keuze"); setFout(""); setEmail(""); setPass(""); }} style={{ background: "none", border: "none", cursor: "pointer", color: C.brownLight, fontSize: 13, marginBottom: 16, fontFamily: "Lora, serif" }}>← Terug</button>
              <h2 style={{ fontFamily: "Playfair Display, serif", color: C.dark, marginBottom: 20, fontSize: 20 }}>👤 Klant inloggen</h2>
              <InputField label="E-mailadres" value={email} onChange={setEmail} type="email" placeholder="jouw@email.be" />
              <InputField label="Wachtwoord" value={pass} onChange={setPass} type="password" placeholder="••••••" />
              {fout && <div style={{ color: C.rust, fontSize: 13, marginBottom: 12 }}>⚠️ {fout}</div>}
              <Btn variant="green" onClick={loginKlant} style={{ width: "100%", marginBottom: 12 }}>Inloggen</Btn>
              <div style={{ textAlign: "center", fontSize: 13, color: C.brownLight, marginBottom: 4 }}>Nog geen account?</div>
              <Btn variant="ghost" onClick={() => { setMode("registreren"); setFout(""); }} style={{ width: "100%" }}>✍️ Nieuw account aanmaken</Btn>
            </>
          )}

          {mode === "registreren" && (
            <>
              <button onClick={() => { setMode("klant"); setFout(""); setRegSuccess(false); }} style={{ background: "none", border: "none", cursor: "pointer", color: C.brownLight, fontSize: 13, marginBottom: 16, fontFamily: "Lora, serif" }}>← Terug</button>
              <h2 style={{ fontFamily: "Playfair Display, serif", color: C.dark, marginBottom: 20, fontSize: 20 }}>✍️ Account aanmaken</h2>
              {regSuccess ? (
                <div style={{ textAlign: "center", padding: "20px 0" }}>
                  <div style={{ fontSize: 48, marginBottom: 12 }}>🎉</div>
                  <h3 style={{ fontFamily: "Playfair Display, serif", color: C.sage, marginBottom: 10 }}>Account aangemaakt!</h3>
                  <p style={{ fontSize: 14, color: C.brownLight, lineHeight: 1.6 }}>Je account is aangemaakt! Je kan nu meteen inloggen met je e-mail en wachtwoord.</p>
                  <Btn variant="green" onClick={() => { setMode("klant"); setRegSuccess(false); setRegNaam(""); setRegEmail(""); setRegPass(""); setRegTel(""); }} style={{ marginTop: 20 }}>Naar inloggen</Btn>
                </div>
              ) : (
                <>
                  <InputField label="Volledige naam" value={regNaam} onChange={setRegNaam} placeholder="Jan Janssen" />
                  <InputField label="E-mailadres" value={regEmail} onChange={setRegEmail} type="email" placeholder="jouw@email.be" />
                  <InputField label="Telefoonnummer" value={regTel} onChange={setRegTel} placeholder="0471 00 00 00" />
                  <InputField label="Wachtwoord" value={regPass} onChange={setRegPass} type="password" placeholder="Kies een wachtwoord" />
                  {fout && <div style={{ color: C.rust, fontSize: 13, marginBottom: 12 }}>⚠️ {fout}</div>}
                  <Btn variant="green" onClick={registreer} style={{ width: "100%" }}>✍️ Aanvraag indienen</Btn>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   SUPABASE CONFIG
══════════════════════════════════════════ */
const SB_URL = "https://creatittinunrfbjgsih.supabase.co";
const SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNyZWF0aXR0aW51bnJmYmpnc2loIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI1Njc0MTcsImV4cCI6MjA4ODE0MzQxN30.BMX3GHKAoKUGkVsHuwZlQl3Uw3GF7lPfcwhELoCLQ_E";
const SB_HDR = { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}`, "Content-Type": "application/json" };

async function sbGet(table) {
  const r = await fetch(`${SB_URL}/rest/v1/${table}?select=*`, { headers: SB_HDR });
  return r.json();
}
async function sbUpsert(table, data) {
  await fetch(`${SB_URL}/rest/v1/${table}`, {
    method: "POST", headers: { ...SB_HDR, Prefer: "resolution=merge-duplicates" },
    body: JSON.stringify(data)
  });
}
async function sbPatch(table, id, data) {
  await fetch(`${SB_URL}/rest/v1/${table}?id=eq.${id}`, {
    method: "PATCH", headers: SB_HDR, body: JSON.stringify(data)
  });
}

/* ══════════════════════════════════════════
   MAIN APP  — met Supabase opslag
══════════════════════════════════════════ */
export default function App() {
  const [session, setSession] = useState(null);
  const [klanten, setKlanten] = useState([]);
  const [soepen,  setSoepen]  = useState([]);
  const [weekMenu, setWeekMenuRaw] = useState([1, 2, null]);
  const [bestellingen, setBestellingen] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    async function laad() {
      try {
        const [k, b, w, sp] = await Promise.all([sbGet("klanten"), sbGet("bestellingen"), sbGet("weekmenu"), sbGet("soepen")]);
        setKlanten(Array.isArray(k) && k.length > 0 ? k.map(x => ({...x, aantalPerWeek: x.aantalperweek || 1})) : INIT_KLANTEN);
        if (Array.isArray(b)) setBestellingen(b);
        if (Array.isArray(w) && w.length > 0) setWeekMenuRaw([w[0].soep1, w[0].soep2, w[0].soep3 || null]);
        if (Array.isArray(sp) && sp.length > 0) setSoepen(sp);
        else {
          setSoepen(INIT_SOEPEN);
          for (const s of INIT_SOEPEN) await sbUpsert("soepen", s);
        }
      } catch(e) { console.error(e); setKlanten(INIT_KLANTEN); }
      setLoaded(true);
    }
    laad();
  }, []);

  async function saveKlanten(val) {
    setKlanten(val);
    for (const k of val) {
      await sbUpsert("klanten", { id: k.id, naam: k.naam, email: k.email, tel: k.tel || "", straat: k.straat || "", gemeente: k.gemeente || "", levering: k.levering || "ochtend", abonnee: k.abonnee || false, aantalperweek: k.aantalPerWeek || 1, actief: k.actief !== false, wachtwoord: k.wachtwoord || "" });
    }
  }

  async function saveSoepen(val) {
    setSoepen(val);
    for (const s of val) {
      await sbUpsert("soepen", { id: s.id, naam: s.naam, beschrijving: s.beschrijving, seizoen: s.seizoen || "", emoji: s.emoji });
    }
  }

  async function saveWeekMenu(val) {
    setWeekMenuRaw(val);
    await sbUpsert("weekmenu", { id: 1, soep1: val[0], soep2: val[1], soep3: val[2] || null });
  }

  async function saveBestellingen(val) {
    const nieuw = val.find(b => !bestellingen.find(x => x.id === b.id));
    if (nieuw) await sbUpsert("bestellingen", nieuw);
    else {
      const gewijzigd = val.find(b => { const o = bestellingen.find(x => x.id === b.id); return o && o.afgehandeld !== b.afgehandeld; });
      if (gewijzigd) await sbPatch("bestellingen", gewijzigd.id, { afgehandeld: gewijzigd.afgehandeld });
    }
    setBestellingen(val);
  }

  if (!loaded) return (
    <div style={{ fontFamily: "Lora, serif", minHeight: "100vh", width: "100%", background: C.cream, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 }}>
      <style>{BASE_STYLE}</style>
      <div style={{ fontSize: 56, animation: "shimmer 1.2s infinite" }}>🍵</div>
      <div style={{ color: C.brownLight, fontSize: 15 }}>Gegevens laden…</div>
    </div>
  );

  function handleLogin(role, klant) {
    setSession(role === "admin" ? { role } : { role: "klant", klantId: klant.id });
  }
  function handleLogout() { setSession(null); }

  if (!session) return <LoginScreen klanten={klanten} setKlanten={saveKlanten} onLogin={handleLogin} />;

  if (session.role === "admin") {
    return <AdminPortal klanten={klanten} setKlanten={saveKlanten} soepen={soepen} setSoepen={saveSoepen} weekMenu={weekMenu} setWeekMenu={saveWeekMenu} bestellingen={bestellingen} setBestellingen={saveBestellingen} onLogout={handleLogout} />;
  }

  const liveKlant = klanten.find(k => k.id === session.klantId);
  if (!liveKlant) return <LoginScreen klanten={klanten} setKlanten={saveKlanten} onLogin={handleLogin} />;

  return <KlantPortal
    klant={liveKlant}
    setKlant={(updated) => saveKlanten(klanten.map(k => k.id === updated.id ? updated : k))}
    soepen={soepen}
    weekMenu={weekMenu}
    setKlanten={saveKlanten}
    klanten={klanten}
    bestellingen={bestellingen}
    setBestellingen={saveBestellingen}
    onLogout={handleLogout}
  />;
}
