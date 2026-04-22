import { useState, useEffect, useRef } from "react";

/* ─── Constants ─────────────────────────────────────────── */
const FREE_LIMIT = 3;
const API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY;

const CATEGORIES = [
  { label: "Breakfast", emoji: "🍳" },
  { label: "Pasta", emoji: "🍝" },
  { label: "Salads", emoji: "🥗" },
  { label: "Soups", emoji: "🍲" },
  { label: "Grilling", emoji: "🔥" },
  { label: "Seafood", emoji: "🦞" },
  { label: "Desserts", emoji: "🍮" },
  { label: "Vegan", emoji: "🌿" },
  { label: "Baking", emoji: "🥐" },
  { label: "Quick & Easy", emoji: "⚡" },
  { label: "Asian", emoji: "🥢" },
  { label: "Mexican", emoji: "🌮" },
];

const TRENDING = [
  "Marry Me Chicken", "Brown Butter Pasta", "Birria Tacos",
  "Japanese Milk Bread", "Smash Burgers", "Tahini Cookies",
];

const FONTS = `@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=DM+Sans:wght@300;400;500;600&display=swap');`;

/* ─── Helpers ────────────────────────────────────────────── */
const getSearchCount = () => parseInt(localStorage.getItem("folio_sc") || "0");
const incSearchCount = () => localStorage.setItem("folio_sc", getSearchCount() + 1);
const getBookmarks = () => JSON.parse(localStorage.getItem("folio_bm") || "[]");
const saveBookmarks = (bm) => localStorage.setItem("folio_bm", JSON.stringify(bm));

const parseJSON = (text) => {
  try { return JSON.parse(text.replace(/```json|```/g, "").trim()); }
  catch { return null; }
};

async function generateRecipes(query) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": API_KEY,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      messages: [{
        role: "user",
        content: `You are an expert culinary database. Return ONLY a valid JSON array of exactly 12 unique recipes for: "${query}".
Each object must have: title (string), emoji (single emoji), tagline (short evocative 1-sentence description max 12 words), time (e.g. "25 min"), difficulty ("Easy"|"Medium"|"Advanced"), servings (number), calories (approx number), tags (array of 2 strings), cuisine (string), ingredients (array of 8-12 strings), steps (array of 5-7 strings).
Vary difficulty and cuisine. Return ONLY the JSON array. No markdown, no extra text.`
      }]
    })
  });
  const data = await res.json();
  const text = (data.content || []).map(b => b.text || "").join("");
  return parseJSON(text) || [];
}

/* ─── Small Components ───────────────────────────────────── */
const Tag = ({ label }) => (
  <span style={{
    fontSize: "10px", fontWeight: 600, letterSpacing: "0.08em",
    textTransform: "uppercase", padding: "3px 10px", borderRadius: "20px",
    background: "#F0EDE8", color: "#6B6560", fontFamily: "'DM Sans', sans-serif",
  }}>{label}</span>
);

const DiffBadge = ({ d }) => {
  const map = { Easy: ["#D4EDDA", "#1A6B30"], Medium: ["#FFF3CD", "#856404"], Advanced: ["#F8D7DA", "#721C24"] };
  const [bg, fg] = map[d] || map.Easy;
  return (
    <span style={{
      fontSize: "10px", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase",
      padding: "3px 10px", borderRadius: "20px", background: bg, color: fg,
      fontFamily: "'DM Sans', sans-serif",
    }}>{d}</span>
  );
};

const RecipeCard = ({ recipe, onOpen, bookmarked, onBookmark, idx }) => (
  <div
    onClick={onOpen}
    style={{
      background: "#fff", borderRadius: "20px", overflow: "hidden",
      cursor: "pointer",
      boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)",
      transition: "transform 0.25s ease, box-shadow 0.25s ease",
      animation: `fadeUp 0.4s ease both`,
      animationDelay: `${(idx % 12) * 40}ms`,
      position: "relative",
    }}
    onMouseEnter={e => {
      e.currentTarget.style.transform = "translateY(-5px)";
      e.currentTarget.style.boxShadow = "0 12px 40px rgba(0,0,0,0.10)";
    }}
    onMouseLeave={e => {
      e.currentTarget.style.transform = "";
      e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)";
    }}
  >
    <div style={{
      height: "120px",
      background: "linear-gradient(135deg, #F8F5F0 0%, #EDE8E1 100%)",
      display: "flex", alignItems: "center", justifyContent: "center", fontSize: "52px",
    }}>
      {recipe.emoji}
    </div>

    <button
      onClick={e => { e.stopPropagation(); onBookmark(); }}
      style={{
        position: "absolute", top: "10px", right: "10px",
        background: "rgba(255,255,255,0.9)", backdropFilter: "blur(8px)",
        border: "none", borderRadius: "50%", width: "34px", height: "34px",
        cursor: "pointer", fontSize: "15px", display: "flex",
        alignItems: "center", justifyContent: "center",
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)", transition: "transform 0.2s",
      }}
      onMouseEnter={e => e.currentTarget.style.transform = "scale(1.15)"}
      onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
    >
      {bookmarked ? "♥" : "♡"}
    </button>

    <div style={{ padding: "16px 18px 18px" }}>
      <div style={{
        fontFamily: "'Cormorant Garamond', serif",
        fontSize: "17px", fontWeight: 600, lineHeight: 1.3,
        marginBottom: "5px", color: "#0A0A0A",
      }}>
        {recipe.title}
      </div>
      <div style={{
        fontFamily: "'DM Sans', sans-serif",
        fontSize: "12px", color: "#9B9690", lineHeight: 1.5, marginBottom: "12px",
      }}>
        {recipe.tagline}
      </div>
      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", alignItems: "center" }}>
        <DiffBadge d={recipe.difficulty} />
        {(recipe.tags || []).slice(0, 1).map(t => <Tag key={t} label={t} />)}
        <span style={{
          marginLeft: "auto", fontFamily: "'DM Sans', sans-serif",
          fontSize: "11px", color: "#B0AAA4",
        }}>
          ⏱ {recipe.time}
        </span>
      </div>
    </div>
  </div>
);

const Paywall = ({ onUpgrade, onDismiss }) => (
  <div style={{
    position: "fixed", inset: 0, background: "rgba(10,10,10,0.6)",
    backdropFilter: "blur(12px)", zIndex: 999,
    display: "flex", alignItems: "center", justifyContent: "center", padding: "24px",
  }}>
    <div style={{
      background: "#fff", borderRadius: "28px", padding: "48px 40px",
      maxWidth: "420px", width: "100%", textAlign: "center",
      boxShadow: "0 32px 80px rgba(0,0,0,0.2)",
      animation: "scaleIn 0.3s ease",
    }}>
      <div style={{ fontSize: "48px", marginBottom: "16px" }}>🌿</div>
      <div style={{
        fontFamily: "'Cormorant Garamond', serif",
        fontSize: "28px", fontWeight: 600, color: "#0A0A0A",
        marginBottom: "10px", lineHeight: 1.2,
      }}>
        You've reached your free limit
      </div>
      <div style={{
        fontFamily: "'DM Sans', sans-serif",
        fontSize: "14px", color: "#9B9690", lineHeight: 1.7, marginBottom: "28px",
      }}>
        Free members get 3 searches per day. Upgrade to Folio Pro for unlimited recipes, saved collections, and more.
      </div>

      {["Unlimited AI recipe searches", "Save & organise collections", "Nutritional info & meal planning", "New recipes added weekly"].map(p => (
        <div key={p} style={{
          display: "flex", alignItems: "center", gap: "10px",
          textAlign: "left", marginBottom: "10px",
          fontFamily: "'DM Sans', sans-serif", fontSize: "13px", color: "#3A3530",
        }}>
          <span style={{ color: "#C9963F", fontSize: "15px" }}>✓</span> {p}
        </div>
      ))}

      <button
        onClick={onUpgrade}
        style={{
          width: "100%", marginTop: "24px", padding: "16px",
          background: "#0A0A0A", color: "#fff", border: "none", borderRadius: "14px",
          fontFamily: "'DM Sans', sans-serif", fontSize: "15px", fontWeight: 600,
          cursor: "pointer", transition: "background 0.2s",
        }}
        onMouseEnter={e => e.currentTarget.style.background = "#2A2A2A"}
        onMouseLeave={e => e.currentTarget.style.background = "#0A0A0A"}
      >
        Upgrade to Pro — $4.99 / mo
      </button>
      <button
        onClick={onDismiss}
        style={{
          width: "100%", marginTop: "10px", padding: "12px",
          background: "none", color: "#B0AAA4", border: "none",
          fontFamily: "'DM Sans', sans-serif", fontSize: "13px", cursor: "pointer",
        }}
      >
        Maybe later
      </button>
    </div>
  </div>
);

const DetailView = ({ recipe, bookmarked, onBookmark, onBack }) => {
  const [activeTab, setActiveTab] = useState("ingredients");
  return (
    <div style={{ maxWidth: "760px", margin: "0 auto", padding: "32px 24px 80px", animation: "fadeUp 0.35s ease" }}>
      <button onClick={onBack} style={{
        background: "#F0EDE8", border: "none", borderRadius: "10px",
        padding: "10px 18px", cursor: "pointer", marginBottom: "32px",
        fontFamily: "'DM Sans', sans-serif", fontSize: "13px", color: "#3A3530",
      }}>
        ← Back
      </button>

      <div style={{
        height: "220px",
        background: "linear-gradient(135deg, #F8F5F0 0%, #EDE8E1 100%)",
        borderRadius: "24px", display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: "90px", marginBottom: "32px",
        boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
      }}>
        {recipe.emoji}
      </div>

      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "16px", marginBottom: "8px" }}>
        <div style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: "clamp(28px, 5vw, 40px)", fontWeight: 600,
          color: "#0A0A0A", lineHeight: 1.15,
        }}>
          {recipe.title}
        </div>
        <button onClick={onBookmark} style={{
          background: bookmarked ? "#0A0A0A" : "#F0EDE8",
          border: "none", borderRadius: "50%", width: "44px", height: "44px", flexShrink: 0,
          cursor: "pointer", fontSize: "18px", display: "flex", alignItems: "center", justifyContent: "center",
          transition: "background 0.2s", color: bookmarked ? "#fff" : "#3A3530",
        }}>
          {bookmarked ? "♥" : "♡"}
        </button>
      </div>

      <div style={{
        fontFamily: "'DM Sans', sans-serif", fontSize: "15px", color: "#9B9690",
        marginBottom: "28px", lineHeight: 1.6,
      }}>
        {recipe.tagline}
      </div>

      <div style={{
        display: "grid", gridTemplateColumns: "repeat(4, 1fr)",
        gap: "1px", background: "#EDE8E1", borderRadius: "16px", overflow: "hidden",
        marginBottom: "36px",
      }}>
        {[
          { label: "Time", value: recipe.time },
          { label: "Servings", value: recipe.servings },
          { label: "Calories", value: recipe.calories ? `~${recipe.calories}` : "—" },
          { label: "Difficulty", value: recipe.difficulty },
        ].map(m => (
          <div key={m.label} style={{ background: "#FDFCFB", padding: "16px 12px", textAlign: "center" }}>
            <div style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: "20px", fontWeight: 600, color: "#0A0A0A", marginBottom: "2px",
            }}>{m.value}</div>
            <div style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.08em", color: "#B0AAA4",
            }}>{m.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: "4px", background: "#F0EDE8", borderRadius: "12px", padding: "4px", marginBottom: "28px" }}>
        {["ingredients", "steps"].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{
            flex: 1, padding: "10px", border: "none", borderRadius: "9px",
            background: activeTab === tab ? "#fff" : "transparent",
            fontFamily: "'DM Sans', sans-serif", fontSize: "13px", fontWeight: 600,
            color: activeTab === tab ? "#0A0A0A" : "#9B9690",
            cursor: "pointer", textTransform: "capitalize",
            boxShadow: activeTab === tab ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
            transition: "all 0.2s",
          }}>{tab}</button>
        ))}
      </div>

      {activeTab === "ingredients" && (
        <div>
          {(recipe.ingredients || []).map((ing, i) => (
            <div key={i} style={{
              display: "flex", alignItems: "center", gap: "14px",
              padding: "14px 0", borderBottom: "1px solid #F0EDE8",
              fontFamily: "'DM Sans', sans-serif", fontSize: "14px", color: "#3A3530",
              animation: `fadeUp 0.3s ease both`, animationDelay: `${i * 30}ms`,
            }}>
              <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#C9963F", flexShrink: 0 }} />
              {ing}
            </div>
          ))}
        </div>
      )}

      {activeTab === "steps" && (
        <div>
          {(recipe.steps || []).map((step, i) => (
            <div key={i} style={{
              display: "flex", gap: "18px", marginBottom: "24px",
              animation: `fadeUp 0.3s ease both`, animationDelay: `${i * 40}ms`,
            }}>
              <div style={{
                width: "32px", height: "32px", borderRadius: "50%",
                background: "#0A0A0A", color: "#fff", flexShrink: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontFamily: "'DM Sans', sans-serif", fontSize: "13px", fontWeight: 600,
              }}>{i + 1}</div>
              <div style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: "14px", color: "#3A3530", lineHeight: 1.75, paddingTop: "5px",
              }}>{step}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/* ─── Main App ───────────────────────────────────────────── */
export default function App() {
  useEffect(() => {
    if (!document.querySelector("#folio-fonts")) {
      const s = document.createElement("style");
      s.id = "folio-fonts";
      s.textContent = FONTS + `
        @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes scaleIn { from { opacity: 0; transform: scale(0.92); } to { opacity: 1; transform: scale(1); } }
        @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
      `;
      document.head.appendChild(s);
    }
  }, []);

  const [query, setQuery] = useState("");
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState("home");
  const [selected, setSelected] = useState(null);
  const [bookmarks, setBookmarks] = useState(getBookmarks);
  const [showPaywall, setShowPaywall] = useState(false);
  const [searchCount, setSearchCount] = useState(getSearchCount);

  const isBookmarked = (r) => bookmarks.some(b => b.title === r.title);
  const toggleBookmark = (r) => {
    const updated = isBookmarked(r)
      ? bookmarks.filter(b => b.title !== r.title)
      : [...bookmarks, r];
    setBookmarks(updated);
    saveBookmarks(updated);
  };

  const doSearch = async (term) => {
    const q = (term || query).trim();
    if (!q) return;
    if (searchCount >= FREE_LIMIT) { setShowPaywall(true); return; }
    setLoading(true);
    setView("results");
    setSelected(null);
    try {
      const results = await generateRecipes(q);
      setRecipes(results);
      incSearchCount();
      setSearchCount(getSearchCount());
    } finally {
      setLoading(false);
    }
  };

  const remaining = Math.max(0, FREE_LIMIT - searchCount);

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", background: "#FAFAF7", minHeight: "100vh", color: "#0A0A0A" }}>

      {showPaywall && (
        <Paywall
          onUpgrade={() => alert("Paystack integration coming soon!")}
          onDismiss={() => setShowPaywall(false)}
        />
      )}

      {/* Nav */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 90,
        background: "rgba(250,250,247,0.85)", backdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(0,0,0,0.06)",
        padding: "0 24px", height: "60px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div onClick={() => setView("home")} style={{ cursor: "pointer" }}>
          <span style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: "20px", fontWeight: 600, color: "#0A0A0A", letterSpacing: "-0.3px",
          }}>Folio</span>
          <span style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: "10px", color: "#C9963F", fontWeight: 600,
            letterSpacing: "0.15em", textTransform: "uppercase", marginLeft: "5px",
          }}>Recipes</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <button
            onClick={() => setView("bookmarks")}
            style={{
              background: view === "bookmarks" ? "#0A0A0A" : "#F0EDE8",
              color: view === "bookmarks" ? "#fff" : "#3A3530",
              border: "none", borderRadius: "20px", padding: "7px 16px", cursor: "pointer",
              fontFamily: "'DM Sans', sans-serif", fontSize: "12px", fontWeight: 600,
              transition: "all 0.2s",
            }}
          >
            ♥ Saved {bookmarks.length > 0 && `(${bookmarks.length})`}
          </button>
          <div style={{
            background: remaining > 0 ? "#D4EDDA" : "#F8D7DA",
            color: remaining > 0 ? "#1A6B30" : "#721C24",
            padding: "7px 14px", borderRadius: "20px",
            fontFamily: "'DM Sans', sans-serif", fontSize: "12px", fontWeight: 600,
          }}>
            {remaining} searches left
          </div>
        </div>
      </nav>

      {/* HOME */}
      {view === "home" && (
        <div>
          <div style={{
            padding: "80px 24px 60px", textAlign: "center",
            background: "linear-gradient(180deg, #FDFCFA 0%, #FAFAF7 100%)",
          }}>
            <div style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: "clamp(40px, 7vw, 68px)", fontWeight: 300,
              color: "#0A0A0A", lineHeight: 1.1, marginBottom: "16px",
              animation: "fadeUp 0.5s ease",
            }}>
              Every dish,<br />
              <em style={{ fontStyle: "italic", color: "#C9963F" }}>beautifully made.</em>
            </div>
            <div style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: "15px", color: "#9B9690", marginBottom: "40px",
              fontWeight: 300, animation: "fadeUp 0.5s ease 0.1s both",
            }}>
              AI-generated recipes tailored to exactly what you're craving
            </div>

            <div style={{
              maxWidth: "540px", margin: "0 auto", background: "#fff",
              borderRadius: "18px",
              boxShadow: "0 4px 24px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.05)",
              display: "flex", alignItems: "center", overflow: "hidden",
              animation: "fadeUp 0.5s ease 0.15s both",
              border: "1px solid rgba(0,0,0,0.06)",
            }}>
              <span style={{ padding: "0 14px 0 18px", fontSize: "18px" }}>🔍</span>
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => e.key === "Enter" && doSearch()}
                placeholder="Search any dish, ingredient, or mood..."
                style={{
                  flex: 1, border: "none", outline: "none", padding: "18px 0",
                  fontFamily: "'DM Sans', sans-serif", fontSize: "15px", background: "transparent",
                }}
              />
              <button
                onClick={() => doSearch()}
                style={{
                  background: "#0A0A0A", color: "#fff", border: "none",
                  margin: "6px", borderRadius: "12px", padding: "12px 22px",
                  cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
                  fontSize: "13px", fontWeight: 600, transition: "background 0.2s",
                }}
                onMouseEnter={e => e.currentTarget.style.background = "#333"}
                onMouseLeave={e => e.currentTarget.style.background = "#0A0A0A"}
              >
                Search
              </button>
            </div>

            <div style={{
              display: "flex", flexWrap: "wrap", gap: "8px", justifyContent: "center",
              marginTop: "20px", animation: "fadeUp 0.5s ease 0.2s both",
            }}>
              <span style={{
                fontFamily: "'DM Sans', sans-serif", fontSize: "11px",
                color: "#B0AAA4", textTransform: "uppercase", letterSpacing: "0.1em", alignSelf: "center",
              }}>Trending:</span>
              {TRENDING.map(t => (
                <button key={t} onClick={() => { setQuery(t); doSearch(t); }} style={{
                  background: "#F0EDE8", border: "none", borderRadius: "20px",
                  padding: "7px 14px", cursor: "pointer",
                  fontFamily: "'DM Sans', sans-serif", fontSize: "12px", color: "#3A3530",
                  transition: "all 0.2s",
                }}
                  onMouseEnter={e => { e.currentTarget.style.background = "#0A0A0A"; e.currentTarget.style.color = "#fff"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "#F0EDE8"; e.currentTarget.style.color = "#3A3530"; }}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div style={{ padding: "48px 24px", maxWidth: "1100px", margin: "0 auto" }}>
            <div style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: "26px", fontWeight: 600, marginBottom: "24px",
            }}>
              Browse by Category
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))", gap: "10px" }}>
              {CATEGORIES.map((c, i) => (
                <button key={c.label} onClick={() => { setQuery(c.label); doSearch(c.label); }} style={{
                  background: "#fff", border: "1px solid #EDE8E1",
                  borderRadius: "16px", padding: "18px 8px", textAlign: "center",
                  cursor: "pointer", transition: "all 0.2s",
                  animation: `fadeUp 0.4s ease both`, animationDelay: `${i * 30}ms`,
                }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = "#0A0A0A";
                    e.currentTarget.style.borderColor = "#0A0A0A";
                    e.currentTarget.querySelector("span").style.color = "#fff";
                    e.currentTarget.querySelector("p").style.color = "#fff";
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = "#fff";
                    e.currentTarget.style.borderColor = "#EDE8E1";
                    e.currentTarget.querySelector("span").style.color = "";
                    e.currentTarget.querySelector("p").style.color = "";
                  }}
                >
                  <span style={{ fontSize: "26px", display: "block", marginBottom: "6px" }}>{c.emoji}</span>
                  <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "11px", fontWeight: 600, color: "#3A3530", transition: "color 0.2s" }}>{c.label}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* RESULTS */}
      {view === "results" && (
        <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "32px 24px" }}>
          <div style={{
            background: "#fff", borderRadius: "14px",
            boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
            display: "flex", alignItems: "center", overflow: "hidden",
            marginBottom: "32px", border: "1px solid rgba(0,0,0,0.06)",
          }}>
            <span style={{ padding: "0 12px 0 16px", fontSize: "16px" }}>🔍</span>
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === "Enter" && doSearch()}
              style={{
                flex: 1, border: "none", outline: "none", padding: "14px 0",
                fontFamily: "'DM Sans', sans-serif", fontSize: "14px", background: "transparent",
              }}
            />
            <button onClick={() => doSearch()} style={{
              background: "#0A0A0A", color: "#fff", border: "none",
              margin: "5px", borderRadius: "10px", padding: "10px 18px",
              cursor: "pointer", fontFamily: "'DM Sans', sans-serif", fontSize: "12px", fontWeight: 600,
            }}>Search</button>
          </div>

          {loading ? (
            <div style={{ textAlign: "center", padding: "100px 0" }}>
              <div style={{ fontSize: "40px", marginBottom: "16px", animation: "pulse 1.2s ease infinite" }}>✦</div>
              <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "22px", color: "#9B9690" }}>
                Finding recipes for you...
              </div>
            </div>
          ) : (
            <>
              <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "28px", fontWeight: 600, marginBottom: "6px" }}>
                "{query}"
              </div>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "13px", color: "#9B9690", marginBottom: "28px" }}>
                {recipes.length} recipes generated
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "16px" }}>
                {recipes.map((r, i) => (
                  <RecipeCard
                    key={i} idx={i} recipe={r}
                    onOpen={() => { setSelected(r); setView("detail"); }}
                    bookmarked={isBookmarked(r)}
                    onBookmark={() => toggleBookmark(r)}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* BOOKMARKS */}
      {view === "bookmarks" && (
        <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "40px 24px" }}>
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "32px", fontWeight: 600, marginBottom: "8px" }}>
            Saved Recipes
          </div>
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "13px", color: "#9B9690", marginBottom: "32px" }}>
            {bookmarks.length} saved
          </div>
          {bookmarks.length === 0 ? (
            <div style={{ textAlign: "center", padding: "80px 0", color: "#B0AAA4" }}>
              <div style={{ fontSize: "48px", marginBottom: "16px" }}>♡</div>
              <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "22px" }}>No saved recipes yet</div>
              <button onClick={() => setView("home")} style={{
                marginTop: "20px", background: "#0A0A0A", color: "#fff", border: "none",
                borderRadius: "12px", padding: "12px 24px", cursor: "pointer",
                fontFamily: "'DM Sans', sans-serif", fontSize: "13px", fontWeight: 600,
              }}>Browse Recipes</button>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "16px" }}>
              {bookmarks.map((r, i) => (
                <RecipeCard
                  key={i} idx={i} recipe={r}
                  onOpen={() => { setSelected(r); setView("detail"); }}
                  bookmarked={true}
                  onBookmark={() => toggleBookmark(r)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* DETAIL */}
      {view === "detail" && selected && (
        <DetailView
          recipe={selected}
          bookmarked={isBookmarked(selected)}
          onBookmark={() => toggleBookmark(selected)}
          onBack={() => setView("results")}
        />
      )}
    </div>
  );
}
