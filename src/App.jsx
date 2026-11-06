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
  { id: 1, naam: "Tomatensoep", beschrijving: "Zongerijpte tomaten, verse basilicum & een vleugje room", seizoen: "Herfst", emoji: "🍅", categorie: "Soep", eenheid: "portie", prijs_los: 5.00, prijs_abonnee: 4.50 },
  { id: 2, naam: "Wortel-gembersoep", beschrijving: "Zoete wortel, verse gember & kokosmelk", seizoen: "Winter", emoji: "🥕", categorie: "Soep", eenheid: "portie", prijs_los: 5.00, prijs_abonnee: 4.50 },
  { id: 3, naam: "Erwtensoep", beschrijving: "Klassieke snert met rookworst & gerookt spek", seizoen: "Winter", emoji: "🫛", categorie: "Soep", eenheid: "portie", prijs_los: 5.00, prijs_abonnee: 4.50 },
  { id: 4, naam: "Courgette-munt", beschrijving: "Lichte zomersoep met verse munt & citroen", seizoen: "Zomer", emoji: "🥒", categorie: "Soep", eenheid: "portie", prijs_los: 5.00, prijs_abonnee: 4.50 },
  { id: 5, naam: "Pompoensoep", beschrijving: "Romige pompoen met kaneel & nootmuskaat", seizoen: "Herfst", emoji: "🎃", categorie: "Soep", eenheid: "portie", prijs_los: 5.00, prijs_abonnee: 4.50 },
];



/* ─── TIJDSLOTEN ─── */
function genereerSloten(startUur, startMin, eindUur, eindMin) {
  const sloten = [];
  let u = startUur, m = startMin;
  while (u < eindUur || (u === eindUur && m <= eindMin)) {
    sloten.push(`${String(u).padStart(2,"0")}:${String(m).padStart(2,"0")}`);
    m += 30;
    if (m >= 60) { m = 0; u++; }
  }
  return sloten;
}
const SLOTEN_OCHTEND  = genereerSloten(8, 0, 12, 0);   // 08:00 – 12:00
const SLOTEN_NAMIDDAG = genereerSloten(13, 0, 17, 30);  // 13:00 – 17:30
const ALLE_SLOTEN     = [...SLOTEN_OCHTEND, ...SLOTEN_NAMIDDAG];

function isOchtend(slot) { return slot && slot < "13:00"; }
function slotLabel(slot) {
  if (!slot) return "?";
  return (isOchtend(slot) ? "🌅 " : "🌇 ") + slot;
}

const WEEK_NR = Math.ceil((new Date() - new Date(new Date().getFullYear(), 0, 1)) / 604800000);

/* ─── HELPERS ─── */
/* ─── AANBOD ─── */
const CATEGORIEEN = ["Soep", "Snack", "Hoofdgerecht", "Dessert", "Andere"];
const CAT_ICOON = { Soep: "🥣", Snack: "🥟", Hoofdgerecht: "🍛", Dessert: "🍰", Andere: "🛍️" };
const LEEG_PRODUCT = { naam: "", beschrijving: "", seizoen: "", emoji: "🥣", categorie: "Soep", eenheid: "portie", prijs_los: 5.00, prijs_abonnee: 4.50 };
const leeg = (v) => v === null || v === undefined || v === "";
const prijsLos = (p) => leeg(p?.prijs_los) ? 5.00 : Number(p.prijs_los);
const prijsAbonnee = (p) => leeg(p?.prijs_abonnee) ? prijsLos(p) : Number(p.prijs_abonnee);
const prijs = (k, p) => p ? (k?.abonnee ? prijsAbonnee(p) : prijsLos(p)) : (k?.abonnee ? 4.50 : 5.00);
const eenheidVan = (p) => p?.eenheid || "portie";
const eur = (n) => "€" + Number(n || 0).toFixed(2).replace(".", ",");
const weekOmzetKlant = (k) => (k.aantalPerWeek || 1) * prijs(k);

// Groepeert producten per categorie, in een vaste volgorde
function perCategorie(producten) {
  const cats = [...CATEGORIEEN, ...new Set(producten.map(p => p.categorie || "Soep").filter(c => !CATEGORIEEN.includes(c)))];
  return cats.map(c => [c, producten.filter(p => (p.categorie || "Soep") === c)]).filter(([, lijst]) => lijst.length > 0);
}

function bestellingTekst(b) {
  if (Array.isArray(b.items) && b.items.length) return b.items.map(i => `${i.aantal}× ${i.naam}`).join(", ");
  return (b.soepen || []).join(" & ");
}
function aantalStuks(b) {
  if (Array.isArray(b.items) && b.items.length) return b.items.reduce((s, i) => s + (i.aantal || 0), 0);
  return (b.soepen || []).length;
}
// prijs is per kg / per liter voor g, kg, ml, l — en per stuk voor stuk, el, tl
const ingredientKost = (ing) => {
  const p = parseFloat(String(ing.prijs_per_eenheid).replace(",", ".")) || 0;
  const h = parseFloat(String(ing.hoeveelheid).replace(",", ".")) || 0;
  return ["g", "ml"].includes(ing.eenheid) ? p * h / 1000 : p * h;
};

function formatWA(producten, week) {
  const blokken = perCategorie(producten).map(([cat, lijst]) =>
    `${CAT_ICOON[cat] || "•"} *${cat}*\n` + lijst.map(p => {
      const extra = prijsAbonnee(p) !== prijsLos(p) ? ` (abonnee ${eur(prijsAbonnee(p))})` : "";
      return `• *${p.naam}* – ${eur(prijsLos(p))} per ${eenheidVan(p)}${extra}${p.beschrijving ? `\n   ${p.beschrijving}` : ""}`;
    }).join("\n")
  ).join("\n\n");
  return `🍲 *Menu van de week – week ${week}*\n\nLieve klant,\n\nDeze week kan je bestellen:\n\n${blokken || "(nog geen producten gekozen)"}\n\n📦 Levering op *donderdag* (ochtend of namiddag)\n💳 Betaling via *Payconiq* of overschrijving\n\nBestellen? Antwoord op dit bericht of bestel in de app! 🌿\nSmakelijk!`;
}

// wa.me verwacht 32471123456 (zonder + of beginnende 0)
function waNummer(tel) {
  let n = String(tel || "").replace(/[^\d+]/g, "");
  if (n.startsWith("+")) n = n.slice(1);
  else if (n.startsWith("00")) n = n.slice(2);
  else if (n.startsWith("0")) n = "32" + n.slice(1);
  return n;
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
function AdminPortal({ klanten, setKlanten, soepen, setSoepen, deleteSoep, weekMenu, setWeekMenu, bestellingen, setBestellingen, recepten, setRecepten, onLogout }) {
  const [tab, setTab] = useState("dashboard");
  const [copied, setCopied] = useState(false);
  const [klantModal, setKlantModal] = useState(false);
  const [soepModal, setSoepModal] = useState(false);
  const [editSoep, setEditSoep] = useState(null);
  const [receptModal, setReceptModal] = useState(false);
  const [editRecept, setEditRecept] = useState(null);
  const [newR, setNewR] = useState({ naam:"", emoji:"🍲", beschrijving:"", porties:4, bereidingstijd:30, stappen:[], ingredienten:[] });
  const [newIngredient, setNewIngredient] = useState({ naam:"", hoeveelheid:"", eenheid:"g", prijs_per_eenheid:0 });
  const [newStap, setNewStap] = useState("");
  const [editKlant, setEditKlant] = useState(null);
  const [newK, setNewK] = useState({ naam:"", email:"", tel:"", straat:"", gemeente:"", levering:"08:00", abonnee:false, aantalPerWeek:1 });
  const [newS, setNewS] = useState(LEEG_PRODUCT);
  const [klantFilter, setKlantFilter] = useState("allen");

  const actief = klanten.filter(k => k.actief);
  const abonnees = actief.filter(k => k.abonnee);
  const ochtend = actief.filter(k => isOchtend(k.levering));
  const namiddag = actief.filter(k => !isOchtend(k.levering));
  const totaal = actief.reduce((s,k) => s + weekOmzetKlant(k), 0);

  const weekProducten = weekMenu.map(id => soepen.find(s => s.id === id)).filter(Boolean);
  const waText = formatWA(weekProducten, WEEK_NR);
  const weekBestellingen = bestellingen.filter(b => b.week === WEEK_NR);

  function saveKlant() {
    if (editKlant) {
      setKlanten(klanten.map(k => k.id === editKlant.id ? { ...editKlant, ...newK } : k));
    } else {
      const id = Math.max(0, ...klanten.map(k=>k.id)) + 1;
      setKlanten([...klanten, { ...newK, id, actief: true }]);
    }
    setKlantModal(false); setEditKlant(null);
    setNewK({ naam:"", email:"", tel:"", straat:"", gemeente:"", levering:"08:00", abonnee:false, aantalPerWeek:1 });
  }

  function openEdit(k) {
    setEditKlant(k); setNewK({ ...k }); setKlantModal(true);
  }

  function saveRecept() {
    const id = editRecept ? editRecept.id : Math.max(0, ...recepten.map(r => r.id)) + 1;
    const updated = editRecept ? recepten.map(r => r.id === id ? {...r, ...newR} : r) : [...recepten, {...newR, id}];
    setRecepten(updated);
    setReceptModal(false);
    setEditRecept(null);
    setNewR({ naam:"", emoji:"🍲", beschrijving:"", porties:4, bereidingstijd:30, stappen:[], ingredienten:[] });
  }

  function saveSoep() {
    if (editSoep) {
      setSoepen(soepen.map(s => s.id === editSoep.id ? { ...s, ...newS, id: editSoep.id } : s));
    } else {
      const id = Math.max(0, ...soepen.map(s=>s.id)) + 1;
      setSoepen([...soepen, { ...newS, id }]);
    }
    setSoepModal(false); setEditSoep(null);
    setNewS(LEEG_PRODUCT);
  }

  const navItems = [
    { key:"dashboard",    icon:"📊", label:"Dashboard" },
    { key:"weekmenu",     icon:"🍲", label:"Aanbod" },
    { key:"klanten",      icon:"👥", label:"Klanten" },
    { key:"bestellingen", icon:"🛍️", label:"Bestellingen" },
    { key:"levering",     icon:"🚚", label:"Levering" },
    { key:"whatsapp",     icon:"💬", label:"WhatsApp" },
    { key:"recepten",     icon:"📋", label:"Recepten" },
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
                <h3 style={{ fontFamily: "Playfair Display, serif", color: C.dark, marginBottom: 14, fontSize: 17 }}>🍲 Aanbod week {WEEK_NR}</h3>
                {weekProducten.length > 0 ? weekProducten.map(s => (
                  <div key={s.id} style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 10, padding: "10px 12px", background: C.cream, borderRadius: 10 }}>
                    <span style={{ fontSize: 24 }}>{s.emoji}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{s.naam}</div>
                      <div style={{ fontSize: 12, color: C.brownLight }}>{s.categorie || "Soep"} · {eur(prijsLos(s))} per {eenheidVan(s)}</div>
                    </div>
                  </div>
                )) : <p style={{ color: C.brownLight, fontSize: 14 }}>Kies je aanbod in "Aanbod"</p>}
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

        {/* ── AANBOD ── */}
        {tab === "weekmenu" && (
          <div style={{ animation: "fadeUp .3s ease" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 10 }}>
              <h2 style={{ fontFamily: "Playfair Display, serif", color: C.rust }}>Aanbod — Week {WEEK_NR}</h2>
              <Btn small onClick={() => { setEditSoep(null); setNewS(LEEG_PRODUCT); setSoepModal(true); }}>+ Product toevoegen</Btn>
            </div>

            <div style={{ marginBottom: 16, padding: 14, background: "#E4EFD9", borderRadius: 12, border: `1px solid ${C.sageLt}`, fontSize: 13, color: C.dark }}>
              ✅ Vink aan wat klanten deze week kunnen bestellen. <strong>{weekProducten.length}</strong> product{weekProducten.length !== 1 ? "en" : ""} geselecteerd.
            </div>

            {soepen.length === 0 && (
              <Card style={{ textAlign: "center", padding: 40 }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>🍲</div>
                <p style={{ color: C.brownLight }}>Nog geen producten. Voeg je eerste product toe!</p>
              </Card>
            )}

            {perCategorie(soepen).map(([cat, lijst]) => (
              <Card key={cat} style={{ marginBottom: 16 }}>
                <h3 style={{ fontFamily: "Playfair Display, serif", marginBottom: 10, color: C.dark }}>{CAT_ICOON[cat] || "•"} {cat} ({lijst.length})</h3>
                {lijst.map((s, i) => {
                  const aan = weekMenu.includes(s.id);
                  return (
                  <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0", borderBottom: i < lijst.length - 1 ? `1px solid ${C.creamDark}` : "none", flexWrap: "wrap" }}>
                    <input type="checkbox" checked={aan} aria-label={`${s.naam} deze week aanbieden`}
                      onChange={() => setWeekMenu(aan ? weekMenu.filter(id => id !== s.id) : [...weekMenu, s.id])}
                      style={{ width: 20, height: 20, accentColor: C.sage, cursor: "pointer", flexShrink: 0 }} />
                    <span style={{ fontSize: 28 }}>{s.emoji}</span>
                    <div style={{ flex: 1, minWidth: 140 }}>
                      <div style={{ fontWeight: 600 }}>{s.naam}</div>
                      {s.beschrijving && <div style={{ fontSize: 12, color: C.brownLight }}>{s.beschrijving}</div>}
                      <div style={{ fontSize: 12, color: C.brownLight, marginTop: 2 }}>
                        {eur(prijsLos(s))} per {eenheidVan(s)}{prijsAbonnee(s) !== prijsLos(s) ? ` · abonnee ${eur(prijsAbonnee(s))}` : ""}
                      </div>
                    </div>
                    {s.seizoen && <Tag color="gold">{s.seizoen}</Tag>}
                    {aan && <Tag color="sage">Deze week</Tag>}
                    <Btn small variant="secondary" onClick={() => { setEditSoep(s); setNewS({ ...LEEG_PRODUCT, ...s, prijs_abonnee: leeg(s.prijs_abonnee) ? "" : s.prijs_abonnee }); setSoepModal(true); }}>✏️</Btn>
                    <Btn small variant="secondary" onClick={() => deleteSoep(s)} style={{ color: C.rust }}>🗑️</Btn>
                  </div>
                )})}
              </Card>
            ))}
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
                <Btn onClick={() => { setEditKlant(null); setNewK({ naam:"", email:"", tel:"", straat:"", gemeente:"", levering:"08:00", abonnee:false, aantalPerWeek:1 }); setKlantModal(true); }}>+ Nieuwe klant</Btn>
              </div>
            </div>

            {/* Filter tabs */}
            <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
              {["allen", "abonnees", "los"].map(f => (
                <Btn key={f} small variant={klantFilter === f ? "primary" : "secondary"} onClick={() => setKlantFilter(f)} style={{ textTransform: "capitalize" }}>{f}</Btn>
              ))}
            </div>

            {actief.filter(k => klantFilter === "allen" || (klantFilter === "abonnees" ? k.abonnee : !k.abonnee)).map(k => (
              <Card key={k.id} style={{ marginBottom: 12, display: "flex", alignItems: "flex-start", gap: 16, padding: "16px 20px", flexWrap: "wrap" }}>
                <div style={{ width: 44, height: 44, borderRadius: "50%", background: k.abonnee ? `linear-gradient(135deg,${C.sage},${C.sageLt})` : `linear-gradient(135deg,${C.rustLight},${C.rust})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>
                  {k.abonnee ? "⭐" : "🛒"}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 16, fontFamily: "Playfair Display, serif" }}>{k.naam}</div>
                  <div style={{ fontSize: 13, color: C.brownLight, marginBottom: 8 }}>{k.tel} • {k.straat}, {k.gemeente}</div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    <Tag color={k.abonnee ? "sage" : "brown"}>{k.abonnee ? "⭐ Abonnee €4,50" : "Los €5,00"}</Tag>
                    <Tag color="rust">{slotLabel(k.levering)}</Tag>
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
            {weekBestellingen.length === 0 && (
              <Card style={{ textAlign: "center", padding: 40, marginBottom: 20 }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>📭</div>
                <p style={{ color: C.brownLight }}>Nog geen bestellingen om te leveren deze week.</p>
              </Card>
            )}
            {ALLE_SLOTEN.filter(slot => weekBestellingen.some(b => b.levering === slot)).map(slot => {
              const stops = weekBestellingen.filter(b => b.levering === slot);
              const color = isOchtend(slot) ? C.rust : C.sage;
              return (
              <Card key={slot} style={{ marginBottom: 20 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                  <h3 style={{ fontFamily: "Playfair Display, serif", color }}>{slotLabel(slot)} — {stops.length} stop{stops.length !== 1 ? "s" : ""}</h3>
                  <Tag color={isOchtend(slot) ? "rust" : "sage"}>€{stops.reduce((s,b)=>s+(b.bedrag||0),0).toFixed(2)}</Tag>
                </div>
                {stops.map((b, i) => {
                  const k = klanten.find(x => x.id === b.klantid) || {};
                  return (
                  <div key={b.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 0", borderBottom: i < stops.length-1 ? `1px dashed ${C.creamDark}` : "none", opacity: b.afgehandeld ? .55 : 1 }}>
                    <div style={{ width: 30, height: 30, borderRadius: "50%", background: color, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, flexShrink: 0 }}>{i+1}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600 }}>{b.klantnaam}{b.afgehandeld ? " ✅" : ""}</div>
                      <div style={{ fontSize: 13, color: C.brownLight }}>{k.straat ? `${k.straat}, ${k.gemeente}` : "Geen adres ingevuld"}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontWeight: 700, color }}>€{(b.bedrag||0).toFixed(2)}</div>
                      <div style={{ fontSize: 12, color: C.brownLight }}>{aantalStuks(b)} stuk{aantalStuks(b) !== 1 ? "s" : ""}</div>
                    </div>
                  </div>
                )})}
              </Card>
            )})}
            <div style={{ background: `linear-gradient(135deg,${C.rustDark},${C.rust})`, borderRadius: 16, padding: 22, color: "#fff", textAlign: "center" }}>
              <div style={{ fontSize: 14, opacity: .8, marginBottom: 4 }}>Totaal bestellingen deze week</div>
              <div style={{ fontFamily: "Playfair Display, serif", fontSize: 42, fontWeight: 700 }}>€{weekBestellingen.reduce((s,b)=>s+(b.bedrag||0),0).toFixed(2)}</div>
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
                      <div style={{ fontSize: 13, color: C.brownLight }}>{bestellingTekst(b)} · {slotLabel(b.levering)}</div>
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
                      <div style={{ fontSize: 13, color: C.brownLight }}>{bestellingTekst(b)} · {slotLabel(b.levering)}</div>
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
                  <a href={`https://wa.me/${waNummer(k.tel)}?text=${encodeURIComponent(waText)}`} target="_blank" rel="noopener noreferrer"
                    style={{ background: "#25D366", color: "#fff", textDecoration: "none", borderRadius: 8, padding: "6px 14px", fontSize: 13, fontFamily: "Lora, serif", fontWeight: 600 }}>
                    💬 Stuur
                  </a>
                </div>
              ))}
            </Card>
          </div>
        )}

        {tab === "recepten" && (
          <div style={{ animation: "fadeUp .3s ease" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h2 style={{ fontFamily: "Playfair Display, serif", color: C.rust }}>Technische Fiches</h2>
              <Btn small onClick={() => { setEditRecept(null); setReceptModal(true); }}>+ Recept toevoegen</Btn>
            </div>
            {recepten.length === 0 && (
              <Card style={{ textAlign: "center", padding: 40 }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>📋</div>
                <div style={{ color: C.brownLight }}>Nog geen recepten. Voeg je eerste recept toe!</div>
              </Card>
            )}
            {recepten.map((r) => {
              const totaal = r.ingredienten.reduce((s, ing) => s + ingredientKost(ing), 0);
              const perPortie = r.porties > 0 ? totaal / r.porties : 0;
              return (
                <Card key={r.id} style={{ marginBottom: 16 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 12 }}>
                    <span style={{ fontSize: 36 }}>{r.emoji}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: "Playfair Display, serif", fontSize: 18, fontWeight: 700 }}>{r.naam}</div>
                      <div style={{ color: C.brownLight, fontSize: 13 }}>{r.beschrijving}</div>
                      <div style={{ display: "flex", gap: 8, marginTop: 6, flexWrap: "wrap" }}>
                        <Tag color="gold">⏱️ {r.bereidingstijd} min</Tag>
                        <Tag color="brown">👥 {r.porties} porties</Tag>
                        <Tag color="sage">💶 €{perPortie.toFixed(2)}/portie</Tag>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <Btn small variant="secondary" onClick={() => { setEditRecept(r); setNewR({...r}); setReceptModal(true); }}>✏️</Btn>
                      <Btn small variant="secondary" onClick={() => { if(window.confirm("Verwijderen?")) setRecepten(recepten.filter(x => x.id !== r.id)); }} style={{ color: C.rust }}>🗑️</Btn>
                    </div>
                  </div>
                  {r.ingredienten.length > 0 && (
                    <div style={{ marginBottom: 10 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: C.brown, marginBottom: 6 }}>🥕 Ingrediënten</div>
                      {r.ingredienten.map((ing, ii) => (
                        <div key={ii} style={{ display: "flex", justifyContent: "space-between", padding: "5px 10px", background: ii%2===0 ? C.creamDark : C.cream, borderRadius: 6, fontSize: 13, marginBottom: 2 }}>
                          <span>{ing.naam}</span>
                          <span style={{ color: C.brownLight }}>{ing.hoeveelheid} {ing.eenheid}</span>
                        </div>
                      ))}
                      <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 10px", fontWeight: 700, fontSize: 13, marginTop: 4 }}>
                        <span>Kostprijs</span>
                        <span style={{ color: C.sage }}>€{totaal.toFixed(2)} totaal · €{perPortie.toFixed(2)}/portie</span>
                      </div>
                    </div>
                  )}
                  {r.stappen.length > 0 && (
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: C.brown, marginBottom: 6 }}>📝 Bereiding</div>
                      {r.stappen.map((stap, si) => (
                        <div key={si} style={{ display: "flex", gap: 8, marginBottom: 6 }}>
                          <div style={{ background: C.rust, color: "white", borderRadius: "50%", width: 20, height: 20, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, flexShrink: 0 }}>{si+1}</div>
                          <div style={{ fontSize: 13, color: C.dark }}>{stap}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              );
            })}
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
          <InputField label="Tijdslot levering" value={newK.levering} onChange={v => setNewK(p=>({...p,levering:v}))}
            options={ALLE_SLOTEN.map(s => ({v:s, l:slotLabel(s)}))} />
          <InputField label="Soepen/week" value={newK.aantalPerWeek} onChange={v => setNewK(p=>({...p,aantalPerWeek:+v}))} type="number" />
        </div>
        <p style={{ fontSize: 12, color: C.brownLight, marginBottom: 14, lineHeight: 1.5 }}>🔒 De klant maakt zelf een account aan met dit e-mailadres en kiest daar zijn eigen wachtwoord. Het account wordt dan automatisch aan deze klant gekoppeld.</p>
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

      <Modal open={soepModal} onClose={() => { setSoepModal(false); setEditSoep(null); setNewS(LEEG_PRODUCT); }} title={editSoep ? "Product bewerken" : "Nieuw product toevoegen"}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 80px", gap: 12 }}>
          <InputField label="Naam" value={newS.naam} onChange={v => setNewS(p=>({...p,naam:v}))} placeholder="Coxinha, Feijoada…" />
          <InputField label="Emoji" value={newS.emoji} onChange={v => setNewS(p=>({...p,emoji:v}))} />
        </div>
        <InputField label="Beschrijving" value={newS.beschrijving} onChange={v => setNewS(p=>({...p,beschrijving:v}))} />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <InputField label="Categorie" value={newS.categorie || "Soep"} onChange={v => setNewS(p=>({...p,categorie:v, emoji: p.emoji === CAT_ICOON[p.categorie || "Soep"] ? (CAT_ICOON[v] || p.emoji) : p.emoji}))}
            options={CATEGORIEEN.map(c => ({ v: c, l: `${CAT_ICOON[c]} ${c}` }))} />
          <InputField label="Verkocht per" value={newS.eenheid || ""} onChange={v => setNewS(p=>({...p,eenheid:v}))} placeholder="portie, stuk, 10 stuks…" />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <InputField label="💶 Prijs los (€)" value={newS.prijs_los} onChange={v => setNewS(p=>({...p,prijs_los: v === "" ? "" : parseFloat(v.replace(",", "."))}))} placeholder="5.00" type="number" />
          <InputField label="⭐ Prijs abonnee (€)" value={newS.prijs_abonnee} onChange={v => setNewS(p=>({...p,prijs_abonnee: v === "" ? "" : parseFloat(v.replace(",", "."))}))} placeholder="leeg = zelfde prijs" type="number" />
        </div>
        <InputField label="Seizoen (optioneel)" value={newS.seizoen} onChange={v => setNewS(p=>({...p,seizoen:v}))} placeholder="Herfst…" />
        <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
          <Btn variant="secondary" onClick={() => { setSoepModal(false); setEditSoep(null); setNewS(LEEG_PRODUCT); }} style={{ flex: 1 }}>Annuleren</Btn>
          <Btn disabled={!newS.naam || leeg(newS.prijs_los)} onClick={saveSoep} style={{ flex: 2 }}>✅ {editSoep ? "Opslaan" : "Toevoegen"}</Btn>
        </div>
      </Modal>

      <Modal open={receptModal} onClose={() => setReceptModal(false)} title={editRecept ? "Recept bewerken" : "Nieuw recept"}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 80px", gap: 12 }}>
          <InputField label="Naam" value={newR.naam} onChange={v => setNewR(p => ({...p, naam:v}))} />
          <InputField label="Emoji" value={newR.emoji} onChange={v => setNewR(p => ({...p, emoji:v}))} />
        </div>
        <InputField label="Beschrijving" value={newR.beschrijving} onChange={v => setNewR(p => ({...p, beschrijving:v}))} />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <InputField label="Porties" value={newR.porties} onChange={v => setNewR(p => ({...p, porties:+v}))} type="number" />
          <InputField label="Bereidingstijd (min)" value={newR.bereidingstijd} onChange={v => setNewR(p => ({...p, bereidingstijd:+v}))} type="number" />
        </div>
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontWeight: 600, fontSize: 13, color: C.brown, marginBottom: 8 }}>Ingrediënten</div>
          {newR.ingredienten.map((ing, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "5px 10px", background: C.creamDark, borderRadius: 8, marginBottom: 4, fontSize: 13 }}>
              <span>{ing.naam} · {ing.hoeveelheid} {ing.eenheid}</span>
              <button onClick={() => setNewR(p => ({...p, ingredienten: p.ingredienten.filter((_,ii) => ii !== i)}))} style={{ background:"none", border:"none", cursor:"pointer", color:C.rust }}>×</button>
            </div>
          ))}
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr auto", gap: 6, marginTop: 6 }}>
            <input placeholder="Naam" value={newIngredient.naam} onChange={e => setNewIngredient(p => ({...p, naam:e.target.value}))} style={{ padding:"6px 8px", borderRadius:8, border:"1px solid #e8e0d0", fontFamily:"Lora,serif", fontSize:13 }} />
            <input placeholder="Hoev." value={newIngredient.hoeveelheid} onChange={e => setNewIngredient(p => ({...p, hoeveelheid:e.target.value}))} style={{ padding:"6px 8px", borderRadius:8, border:"1px solid #e8e0d0", fontFamily:"Lora,serif", fontSize:13 }} />
            <select value={newIngredient.eenheid} onChange={e => setNewIngredient(p => ({...p, eenheid:e.target.value}))} style={{ padding:"6px 4px", borderRadius:8, border:"1px solid #e8e0d0", fontFamily:"Lora,serif", fontSize:13 }}>
              {["g","kg","ml","l","stuk","el","tl"].map(e => <option key={e}>{e}</option>)}
            </select>
            <input placeholder={["g","kg","ml","l"].includes(newIngredient.eenheid) ? "€/kg of l" : "€/stuk"} value={newIngredient.prijs_per_eenheid} onChange={e => setNewIngredient(p => ({...p, prijs_per_eenheid:e.target.value}))} style={{ padding:"6px 8px", borderRadius:8, border:"1px solid #e8e0d0", fontFamily:"Lora,serif", fontSize:13 }} />
            <Btn small onClick={() => { if(newIngredient.naam) { setNewR(p => ({...p, ingredienten:[...p.ingredienten, {...newIngredient}]})); setNewIngredient({ naam:"", hoeveelheid:"", eenheid:"g", prijs_per_eenheid:0 }); } }}>+</Btn>
          </div>
        </div>
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontWeight: 600, fontSize: 13, color: C.brown, marginBottom: 8 }}>Bereidingsstappen</div>
          {newR.stappen.map((stap, i) => (
            <div key={i} style={{ display: "flex", gap: 8, marginBottom: 6 }}>
              <div style={{ background: C.rust, color:"white", borderRadius:"50%", width:20, height:20, display:"flex", alignItems:"center", justifyContent:"center", fontSize:10, fontWeight:700, flexShrink:0 }}>{i+1}</div>
              <div style={{ flex:1, fontSize:13, background:C.creamDark, borderRadius:8, padding:"5px 10px" }}>{stap}</div>
              <button onClick={() => setNewR(p => ({...p, stappen:p.stappen.filter((_,ii) => ii !== i)}))} style={{ background:"none", border:"none", cursor:"pointer", color:C.rust }}>×</button>
            </div>
          ))}
          <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
            <input placeholder="Voeg stap toe en druk Enter..." value={newStap} onChange={e => setNewStap(e.target.value)} onKeyDown={e => { if(e.key==="Enter" && newStap.trim()) { setNewR(p => ({...p, stappen:[...p.stappen, newStap.trim()]})); setNewStap(""); }}} style={{ flex:1, padding:"8px 10px", borderRadius:8, border:"1px solid #e8e0d0", fontFamily:"Lora,serif", fontSize:13 }} />
            <Btn small onClick={() => { if(newStap.trim()) { setNewR(p => ({...p, stappen:[...p.stappen, newStap.trim()]})); setNewStap(""); }}}>+</Btn>
          </div>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <Btn variant="secondary" onClick={() => setReceptModal(false)} style={{ flex:1 }}>Annuleren</Btn>
          <Btn disabled={!newR.naam} onClick={saveRecept} style={{ flex:2 }}>✅ {editRecept ? "Opslaan" : "Toevoegen"}</Btn>
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
  const [aantal, setAantal] = useState({});
  const [bestellingGedaan, setBestellingGedaan] = useState(false);

  const weekProducten = weekMenu.map(id => soepen.find(s => s.id === id)).filter(Boolean);
  const aantalVan = (p) => aantal[p.id] || 0;
  const aantalBesteld = weekProducten.reduce((s, p) => s + aantalVan(p), 0);
  const kostenBestelling = weekProducten.reduce((s, p) => s + aantalVan(p) * prijs(klant, p), 0);

  function bevestigBestelling() {
    const items = weekProducten.filter(p => aantalVan(p) > 0).map(p => ({
      id: p.id, naam: p.naam, aantal: aantalVan(p), eenheid: eenheidVan(p), prijs: prijs(klant, p),
    }));
    const bestelling = {
      id: Date.now(),
      klantid: klant.id,
      klantnaam: klant.naam,
      soepen: items.map(i => `${i.aantal}× ${i.naam}`),
      items,
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
    const huidigIdx = ALLE_SLOTEN.indexOf(klant.levering); const updated = { ...klant, levering: ALLE_SLOTEN[(huidigIdx + 1) % ALLE_SLOTEN.length] };
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
            <p style={{ color: C.brownLight, marginBottom: 24, fontSize: 14 }}>Levering donderdag · {slotLabel(klant.levering)}</p>
            {weekProducten.length === 0 && (
              <Card style={{ textAlign: "center", padding: 40, marginBottom: 16 }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>🍲</div>
                <p style={{ color: C.brownLight }}>Het menu van deze week komt binnenkort.</p>
              </Card>
            )}
            {perCategorie(weekProducten).map(([cat, lijst]) => (
              <div key={cat} style={{ marginBottom: 8 }}>
                <h3 style={{ fontFamily: "Playfair Display, serif", color: C.dark, fontSize: 17, margin: "8px 0 12px" }}>{CAT_ICOON[cat] || "•"} {cat}</h3>
                {lijst.map(s => (
                  <Card key={s.id} style={{ marginBottom: 14, display: "flex", gap: 18, alignItems: "center", padding: "18px 20px" }}>
                    <div style={{ fontSize: 48 }}>{s.emoji}</div>
                    <div>
                      <div style={{ fontFamily: "Playfair Display, serif", fontSize: 19, color: C.dark, fontWeight: 700 }}>{s.naam}</div>
                      {s.beschrijving && <div style={{ color: C.brownLight, fontSize: 14, marginTop: 4, lineHeight: 1.5 }}>{s.beschrijving}</div>}
                      <div style={{ marginTop: 8, fontWeight: 600, color: klant.abonnee ? C.sage : C.rust }}>
                        {klant.abonnee && prijsAbonnee(s) !== prijsLos(s) ? "⭐ Abonneeprijs: " : "💶 "}{eur(prijs(klant, s))} per {eenheidVan(s)}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ))}

            {klant.abonnee && (
              <div style={{ background: "#E4EFD9", border: `1px solid ${C.sageLt}`, borderRadius: 14, padding: 16, textAlign: "center" }}>
                <div style={{ fontWeight: 700, color: C.sage, marginBottom: 4 }}>⭐ Je bent abonnee!</div>
                <div style={{ fontSize: 13, color: C.sage }}>Je geniet van korting op de producten met een abonneeprijs.</div>
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
                  Je bestelling wordt donderdag geleverd <strong>{slotLabel(klant.levering)}</strong>.<br />
                  Betaling via Payconiq of overschrijving bij levering.
                </p>
                <div style={{ background: C.cream, borderRadius: 12, padding: "14px 20px", display: "inline-block", marginBottom: 20 }}>
                  <div style={{ fontWeight: 700, color: C.dark }}>Te betalen: <span style={{ color: C.rust }}>€{kostenBestelling.toFixed(2)}</span></div>
                </div>
                <br />
                <Btn variant="secondary" onClick={() => { setAantal({}); setBestellingGedaan(false); }}>Nieuwe bestelling</Btn>
              </Card>
            ) : (
              <>
                <Card style={{ marginBottom: 16 }}>
                  <h3 style={{ fontFamily: "Playfair Display, serif", marginBottom: 16, color: C.dark }}>Wat wil je bestellen?</h3>
                  {weekProducten.length === 0 && <p style={{ color: C.brownLight, fontSize: 14 }}>Het menu van deze week komt binnenkort.</p>}
                  {perCategorie(weekProducten).map(([cat, lijst]) => (
                    <div key={cat}>
                      <div style={{ fontSize: 12, color: C.brownLight, textTransform: "uppercase", letterSpacing: .5, margin: "6px 0 8px" }}>{CAT_ICOON[cat] || "•"} {cat}</div>
                      {lijst.map(soep => {
                        const n = aantalVan(soep);
                        return (
                        <div key={soep.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 14px", borderRadius: 12, marginBottom: 10, border: `2px solid ${n > 0 ? C.sage : C.creamDark}`, background: n > 0 ? "#E4EFD9" : C.cream, transition: "all .2s" }}>
                          <span style={{ fontSize: 30 }}>{soep.emoji}</span>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 600 }}>{soep.naam}</div>
                            {soep.beschrijving && <div style={{ fontSize: 12, color: C.brownLight }}>{soep.beschrijving}</div>}
                            <div style={{ fontWeight: 700, color: klant.abonnee ? C.sage : C.rust, marginTop: 4 }}>{eur(prijs(klant, soep))} per {eenheidVan(soep)}</div>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <button aria-label={`Minder ${soep.naam}`} onClick={() => setAantal(p => ({ ...p, [soep.id]: Math.max(0, (p[soep.id] || 0) - 1) }))}
                              style={{ width: 32, height: 32, borderRadius: "50%", border: `2px solid ${C.brownLight}`, background: "white", cursor: "pointer", fontSize: 18, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", color: C.dark }}>−</button>
                            <span style={{ fontWeight: 700, fontSize: 18, minWidth: 20, textAlign: "center" }}>{n}</span>
                            <button aria-label={`Meer ${soep.naam}`} onClick={() => setAantal(p => ({ ...p, [soep.id]: (p[soep.id] || 0) + 1 }))}
                              style={{ width: 32, height: 32, borderRadius: "50%", border: "none", background: C.sage, cursor: "pointer", fontSize: 18, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", color: "white" }}>+</button>
                          </div>
                        </div>
                      )})}
                    </div>
                  ))}
                </Card>

                <Card style={{ marginBottom: 16 }}>
                  <h3 style={{ fontFamily: "Playfair Display, serif", marginBottom: 12, color: C.dark }}>Leveringsmoment</h3>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(90px,1fr))", gap: 8 }}>
                    {ALLE_SLOTEN.map(slot => (
                      <div key={slot} onClick={() => { const updated = {...klant, levering: slot}; setKlant(updated); setKlanten(klanten.map(k=>k.id===klant.id?updated:k)); }}
                        style={{ padding: "10px 6px", borderRadius: 10, border: `2px solid ${klant.levering === slot ? C.sage : C.creamDark}`, background: klant.levering === slot ? "#E4EFD9" : C.cream, cursor: "pointer", textAlign: "center", transition: "all .2s" }}>
                        <div style={{ fontSize: 16 }}>{isOchtend(slot) ? "🌅" : "🌇"}</div>
                        <div style={{ fontWeight: 600, fontSize: 13, marginTop: 4 }}>{slot}</div>
                        <div style={{ fontSize: 10, color: C.brownLight }}>{isOchtend(slot) ? "ochtend" : "namiddag"}</div>
                      </div>
                    ))}
                  </div>
                </Card>

                <Card style={{ marginBottom: 20, background: "#FDE8DC", border: `1px solid ${C.rustLight}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ fontWeight: 700, color: C.dark }}>Totaal</div>
                      <div style={{ fontSize: 13, color: C.brownLight }}>{aantalBesteld} stuk{aantalBesteld !== 1 ? "s" : ""} · {klant.abonnee ? "abonneeprijs" : "losse prijs"}</div>
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
                { label: "Levering", val: slotLabel(klant.levering), icon: "🚚" },
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
                    ? "Je betaalt de abonneeprijs, bijvoorbeeld €4,50 in plaats van €5,00 per soep."
                    : "Je betaalt de losse prijs. Met een abonnement betaal je minder, bijvoorbeeld €4,50 in plaats van €5,00 per soep."}
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
function LoginScreen({ onLogin }) {
  const [mode, setMode] = useState("keuze"); // keuze | admin | klant | registreren
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [fout, setFout] = useState("");
  const [bezig, setBezig] = useState(false);
  const [regNaam, setRegNaam] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPass, setRegPass] = useState("");
  const [regTel, setRegTel] = useState("");
  const [regResultaat, setRegResultaat] = useState(null); // null | "klaar" | "bevestigen"

  async function inloggen(gewensteRol) {
    if (!email || !pass) { setFout("Vul je e-mailadres en wachtwoord in."); return; }
    setBezig(true); setFout("");
    try { await onLogin(email.trim(), pass, gewensteRol); }
    catch (e) { setFout(e.message); }
    setBezig(false);
  }

  async function registreer() {
    if (!regNaam || !regEmail || !regPass) { setFout("Vul alle velden in."); return; }
    if (regPass.length < 8) { setFout("Kies een wachtwoord van minstens 8 tekens."); return; }
    setBezig(true); setFout("");
    try {
      const d = await registreerAccount(regEmail.trim(), regPass, { naam: regNaam.trim(), tel: regTel.trim() });
      if (d.access_token) await uitloggen(); // eerst gewoon laten inloggen
      setRegResultaat(d.access_token ? "klaar" : "bevestigen");
    } catch (e) { setFout(e.message); }
    setBezig(false);
  }

  function terug(naar) {
    setMode(naar); setFout(""); setPass(""); setRegResultaat(null);
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
                <button onClick={() => terug("admin")} style={{ background: `linear-gradient(135deg,${C.rustDark},${C.rust})`, color: "#fff", border: "none", borderRadius: 12, padding: "16px 20px", cursor: "pointer", fontFamily: "Lora, serif", fontSize: 15, fontWeight: 600, textAlign: "left", display: "flex", alignItems: "center", gap: 14, boxShadow: `0 4px 18px rgba(184,74,30,.3)` }}>
                  <span style={{ fontSize: 28 }}>🔑</span>
                  <div>
                    <div>Beheerder</div>
                    <div style={{ fontSize: 12, opacity: .8 }}>Klanten, weekmenu & leveringen</div>
                  </div>
                </button>
                <button onClick={() => terug("klant")} style={{ background: `linear-gradient(135deg,${C.sage},${C.sageLt})`, color: "#fff", border: "none", borderRadius: 12, padding: "16px 20px", cursor: "pointer", fontFamily: "Lora, serif", fontSize: 15, fontWeight: 600, textAlign: "left", display: "flex", alignItems: "center", gap: 14, boxShadow: `0 4px 18px rgba(90,122,74,.3)` }}>
                  <span style={{ fontSize: 28 }}>👤</span>
                  <div>
                    <div>Klant</div>
                    <div style={{ fontSize: 12, opacity: .8 }}>Weekmenu bekijken & bestellen</div>
                  </div>
                </button>
              </div>
            </>
          )}

          {(mode === "admin" || mode === "klant") && (
            <>
              <button onClick={() => terug("keuze")} style={{ background: "none", border: "none", cursor: "pointer", color: C.brownLight, fontSize: 13, marginBottom: 16, fontFamily: "Lora, serif" }}>← Terug</button>
              <h2 style={{ fontFamily: "Playfair Display, serif", color: C.dark, marginBottom: 20, fontSize: 20 }}>{mode === "admin" ? "🔑 Beheerder inloggen" : "👤 Klant inloggen"}</h2>
              <InputField label="E-mailadres" value={email} onChange={setEmail} type="email" placeholder="jouw@email.be" />
              <InputField label="Wachtwoord" value={pass} onChange={setPass} type="password" placeholder="••••••••" />
              {fout && <div style={{ color: C.rust, fontSize: 13, marginBottom: 12 }}>⚠️ {fout}</div>}
              <Btn variant={mode === "admin" ? "primary" : "green"} disabled={bezig} onClick={() => inloggen(mode)} style={{ width: "100%", marginBottom: 12 }}>{bezig ? "Even geduld…" : "Inloggen"}</Btn>
              {mode === "klant" && (
                <>
                  <div style={{ textAlign: "center", fontSize: 13, color: C.brownLight, marginBottom: 4 }}>Nog geen account?</div>
                  <Btn variant="ghost" onClick={() => terug("registreren")} style={{ width: "100%" }}>✍️ Nieuw account aanmaken</Btn>
                </>
              )}
            </>
          )}

          {mode === "registreren" && (
            <>
              <button onClick={() => terug("klant")} style={{ background: "none", border: "none", cursor: "pointer", color: C.brownLight, fontSize: 13, marginBottom: 16, fontFamily: "Lora, serif" }}>← Terug</button>
              <h2 style={{ fontFamily: "Playfair Display, serif", color: C.dark, marginBottom: 20, fontSize: 20 }}>✍️ Account aanmaken</h2>
              {regResultaat ? (
                <div style={{ textAlign: "center", padding: "20px 0" }}>
                  <div style={{ fontSize: 48, marginBottom: 12 }}>{regResultaat === "bevestigen" ? "📧" : "🎉"}</div>
                  <h3 style={{ fontFamily: "Playfair Display, serif", color: C.sage, marginBottom: 10 }}>
                    {regResultaat === "bevestigen" ? "Bijna klaar!" : "Account aangemaakt!"}
                  </h3>
                  <p style={{ fontSize: 14, color: C.brownLight, lineHeight: 1.6 }}>
                    {regResultaat === "bevestigen"
                      ? "We stuurden je een e-mail. Klik op de link in die mail om je e-mailadres te bevestigen, en log daarna in."
                      : "Je kan nu inloggen met je e-mailadres en wachtwoord."}
                  </p>
                  <Btn variant="green" onClick={() => { setEmail(regEmail); setRegNaam(""); setRegEmail(""); setRegPass(""); setRegTel(""); terug("klant"); }} style={{ marginTop: 20 }}>Naar inloggen</Btn>
                </div>
              ) : (
                <>
                  <InputField label="Volledige naam" value={regNaam} onChange={setRegNaam} placeholder="Jan Janssen" />
                  <InputField label="E-mailadres" value={regEmail} onChange={setRegEmail} type="email" placeholder="jouw@email.be" />
                  <InputField label="Telefoonnummer" value={regTel} onChange={setRegTel} placeholder="0471 00 00 00" />
                  <InputField label="Wachtwoord (min. 8 tekens)" value={regPass} onChange={setRegPass} type="password" placeholder="Kies een wachtwoord" />
                  {fout && <div style={{ color: C.rust, fontSize: 13, marginBottom: 12 }}>⚠️ {fout}</div>}
                  <Btn variant="green" disabled={bezig} onClick={registreer} style={{ width: "100%" }}>{bezig ? "Even geduld…" : "✍️ Account aanmaken"}</Btn>
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
   De sleutel hieronder is de publieke "anon"-sleutel: die mag in de app staan.
   Wie wat mag zien, wordt geregeld in de database (zie supabase-beveiliging.sql).
══════════════════════════════════════════ */
const SB_URL = "https://creatittinunrfbjgsih.supabase.co";
const SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNyZWF0aXR0aW51bnJmYmpnc2loIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI1Njc0MTcsImV4cCI6MjA4ODE0MzQxN30.BMX3GHKAoKUGkVsHuwZlQl3Uw3GF7lPfcwhELoCLQ_E";

/* ─── LOGIN (Supabase Auth) ─── */
const SESSIE_KEY = "soepronde-sessie";
let sessie = null;
try { sessie = JSON.parse(localStorage.getItem(SESSIE_KEY)); } catch { sessie = null; }
let vernieuwBezig = null;

function bewaarSessie(s) {
  sessie = s;
  try { s ? localStorage.setItem(SESSIE_KEY, JSON.stringify(s)) : localStorage.removeItem(SESSIE_KEY); } catch { /* geen opslag */ }
}

function vertaalFout(d) {
  const m = String(d?.error_description || d?.msg || d?.message || d?.error || "").toLowerCase();
  if (m.includes("invalid login")) return "E-mail of wachtwoord niet herkend.";
  if (m.includes("not confirmed")) return "Bevestig eerst je e-mailadres via de link in je mailbox.";
  if (m.includes("already registered") || m.includes("already been registered")) return "Er bestaat al een account met dit e-mailadres.";
  if (m.includes("password")) return "Dit wachtwoord is niet sterk genoeg. Kies een langer wachtwoord.";
  if (m.includes("rate limit") || m.includes("too many")) return "Te veel pogingen. Probeer het over een paar minuten opnieuw.";
  if (m.includes("email")) return "Dit e-mailadres is niet geldig.";
  return "Er ging iets mis. Probeer het opnieuw.";
}

async function authCall(pad, body, token) {
  const r = await fetch(`${SB_URL}/auth/v1/${pad}`, {
    method: "POST",
    headers: { apikey: SB_KEY, "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(body || {}),
  });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(vertaalFout(d));
  return d;
}

function maakSessie(d) {
  return {
    access_token: d.access_token,
    refresh_token: d.refresh_token,
    expires_at: d.expires_at || Math.floor(Date.now() / 1000) + (d.expires_in || 3600),
    user: d.user,
  };
}

async function inloggenMetWachtwoord(email, wachtwoord) {
  const d = await authCall("token?grant_type=password", { email, password: wachtwoord });
  bewaarSessie(maakSessie(d));
}

async function registreerAccount(email, wachtwoord, gegevens) {
  const d = await authCall("signup", { email, password: wachtwoord, data: gegevens });
  if (d.access_token) bewaarSessie(maakSessie(d));
  return d;
}

async function uitloggen() {
  const t = sessie?.access_token;
  bewaarSessie(null);
  if (t) authCall("logout", {}, t).catch(() => {});
}

async function geldigToken() {
  if (!sessie) return null;
  if (sessie.expires_at - 60 > Date.now() / 1000) return sessie.access_token;
  if (!vernieuwBezig) {
    vernieuwBezig = authCall("token?grant_type=refresh_token", { refresh_token: sessie.refresh_token })
      .then(d => bewaarSessie(maakSessie(d)))
      .catch(() => bewaarSessie(null))
      .finally(() => { vernieuwBezig = null; });
  }
  await vernieuwBezig;
  return sessie?.access_token || null;
}

async function sbHeaders(extra = {}) {
  const t = await geldigToken();
  return { apikey: SB_KEY, Authorization: `Bearer ${t || SB_KEY}`, "Content-Type": "application/json", ...extra };
}

/* ─── DATABASE ─── */
async function sbCheck(r, wat) {
  if (!r.ok) {
    console.error(wat, r.status, await r.text().catch(() => ""));
    alert("⚠️ Opslaan is niet gelukt. Ben je nog ingelogd? Probeer opnieuw in te loggen.");
  }
}
async function sbInsert(table, data) {
  const r = await fetch(`${SB_URL}/rest/v1/${table}`, {
    method: "POST", headers: await sbHeaders(), body: JSON.stringify(data),
  });
  await sbCheck(r, `toevoegen ${table}`);
}
async function sbGet(table) {
  const r = await fetch(`${SB_URL}/rest/v1/${table}?select=*`, { headers: await sbHeaders() });
  return r.ok ? r.json() : [];
}
async function sbUpsert(table, data) {
  const r = await fetch(`${SB_URL}/rest/v1/${table}`, {
    method: "POST", headers: await sbHeaders({ Prefer: "resolution=merge-duplicates" }),
    body: JSON.stringify(data),
  });
  await sbCheck(r, `opslaan ${table}`);
}
async function sbPatch(table, id, data) {
  const r = await fetch(`${SB_URL}/rest/v1/${table}?id=eq.${id}`, {
    method: "PATCH", headers: await sbHeaders(), body: JSON.stringify(data),
  });
  await sbCheck(r, `wijzigen ${table}`);
}
async function sbDelete(table, id) {
  const r = await fetch(`${SB_URL}/rest/v1/${table}?id=eq.${id}`, {
    method: "DELETE", headers: await sbHeaders(),
  });
  await sbCheck(r, `verwijderen ${table}`);
}
async function sbIsAdmin() {
  const r = await fetch(`${SB_URL}/rest/v1/rpc/is_admin`, { method: "POST", headers: await sbHeaders(), body: "{}" });
  return r.ok ? (await r.json()) === true : false;
}

function klantRij(k) {
  return {
    id: k.id, naam: k.naam, email: k.email, tel: k.tel || "", straat: k.straat || "", gemeente: k.gemeente || "",
    levering: ALLE_SLOTEN.includes(k.levering) ? k.levering : "08:00",
    abonnee: k.abonnee || false, aantalperweek: k.aantalPerWeek || 1, actief: k.actief !== false,
  };
}

/* ══════════════════════════════════════════
   MAIN APP  — met Supabase opslag
══════════════════════════════════════════ */
export default function App() {
  const [session, setSession] = useState(null); // null | { role: "admin" } | { role: "klant", klantId }
  const [klanten, setKlanten] = useState([]);
  const [soepen,  setSoepen]  = useState([]);
  const [recepten, setReceptenRaw] = useState(() => {
    try { return JSON.parse(localStorage.getItem("soepronde-recepten")) || []; } catch { return []; }
  });
  function setRecepten(val) {
    setReceptenRaw(val);
    try { localStorage.setItem("soepronde-recepten", JSON.stringify(val)); } catch { /* opslag niet beschikbaar */ }
  }
  const [weekMenu, setWeekMenuRaw] = useState([]);
  const [bestellingen, setBestellingen] = useState([]);
  const [loaded, setLoaded] = useState(false);

  // Laadt alles wat de ingelogde persoon mag zien en geeft zijn rol terug.
  async function laadData() {
    const ingelogd = !!(await geldigToken());
    const admin = ingelogd && await sbIsAdmin();
    const [k, b, w, sp] = await Promise.all([
      ingelogd ? sbGet("klanten") : [],
      ingelogd ? sbGet("bestellingen") : [],
      sbGet("weekmenu"),
      sbGet("soepen"),
    ]);
    const lijst = Array.isArray(k) ? k.map(x => ({
      ...x,
      aantalPerWeek: x.aantalperweek || 1,
      levering: ALLE_SLOTEN.includes(x.levering) ? x.levering : (x.levering === "namiddag" ? "13:00" : "08:00"),
    })) : [];
    setKlanten(lijst);
    setBestellingen(Array.isArray(b) ? b : []);
    if (Array.isArray(w) && w.length > 0) {
      setWeekMenuRaw(Array.isArray(w[0].producten) ? w[0].producten : [w[0].soep1, w[0].soep2, w[0].soep3].filter(Boolean));
    }
    if (Array.isArray(sp) && sp.length > 0) setSoepen(sp);
    else {
      setSoepen(INIT_SOEPEN);
      if (admin) for (const s of INIT_SOEPEN) await sbUpsert("soepen", s);
    }

    if (!ingelogd) { setSession(null); return null; }
    if (admin) { setSession({ role: "admin" }); return "admin"; }
    const eigen = lijst.find(x => x.user_id === sessie?.user?.id);
    if (eigen && eigen.actief !== false) { setSession({ role: "klant", klantId: eigen.id }); return "klant"; }
    setSession(null);
    return eigen ? "inactief" : "onbekend";
  }

  useEffect(() => {
    laadData().catch(e => console.error(e)).finally(() => setLoaded(true));
  }, []);

  async function handleLogin(email, wachtwoord, gewensteRol) {
    await inloggenMetWachtwoord(email, wachtwoord);
    const rol = await laadData();
    if (rol === gewensteRol) return;
    await handleLogout();
    if (gewensteRol === "admin") throw new Error("Dit account heeft geen beheerdersrechten.");
    if (rol === "admin") throw new Error("Dit is een beheerdersaccount. Kies 'Beheerder' om in te loggen.");
    if (rol === "inactief") throw new Error("Dit account is niet meer actief. Neem contact met ons op.");
    throw new Error("Er is geen klantprofiel gevonden voor dit account. Neem contact met ons op.");
  }

  async function handleLogout() {
    await uitloggen();
    setSession(null); setKlanten([]); setBestellingen([]);
  }

  async function saveKlanten(val) {
    const oud = klanten;
    setKlanten(val);
    for (const k of val) {
      const vorige = oud.find(x => x.id === k.id);
      if (!vorige) await sbUpsert("klanten", klantRij(k));
      else if (JSON.stringify(klantRij(vorige)) !== JSON.stringify(klantRij(k))) await sbPatch("klanten", k.id, klantRij(k));
    }
  }

  async function deleteSoep(s) {
    if (!window.confirm(`"${s.naam}" verwijderen?`)) return;
    const updated = soepen.filter(x => x.id !== s.id);
    setSoepen(updated);
    await sbDelete("soepen", s.id);
  }

  async function saveSoepen(val) {
    setSoepen(val);
    for (const s of val) {
      await sbUpsert("soepen", { id: s.id, naam: s.naam, beschrijving: s.beschrijving || "", seizoen: s.seizoen || "", emoji: s.emoji, categorie: s.categorie || "Soep", eenheid: s.eenheid || "portie", prijs_los: prijsLos(s), prijs_abonnee: leeg(s.prijs_abonnee) ? null : Number(s.prijs_abonnee) });
    }
  }

  async function saveWeekMenu(val) {
    setWeekMenuRaw(val);
    await sbUpsert("weekmenu", { id: 1, producten: val, soep1: val[0] || null, soep2: val[1] || null, soep3: val[2] || null });
  }

  async function saveBestellingen(val) {
    const nieuw = val.find(b => !bestellingen.find(x => x.id === b.id));
    if (nieuw) await sbInsert("bestellingen", nieuw);
    else {
      const gewijzigd = val.filter(b => { const o = bestellingen.find(x => x.id === b.id); return o && o.afgehandeld !== b.afgehandeld; });
      for (const g of gewijzigd) await sbPatch("bestellingen", g.id, { afgehandeld: g.afgehandeld });
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

  if (!session) return <LoginScreen onLogin={handleLogin} />;

  if (session.role === "admin") {
    return <AdminPortal klanten={klanten} setKlanten={saveKlanten} soepen={soepen} setSoepen={saveSoepen} deleteSoep={deleteSoep} weekMenu={weekMenu} setWeekMenu={saveWeekMenu} bestellingen={bestellingen} setBestellingen={saveBestellingen} recepten={recepten} setRecepten={setRecepten} onLogout={handleLogout} />;
  }

  const liveKlant = klanten.find(k => k.id === session.klantId);
  if (!liveKlant) return <LoginScreen onLogin={handleLogin} />;

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
