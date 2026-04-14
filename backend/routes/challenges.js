const express = require("express");
const Anthropic = require("@anthropic-ai/sdk");
const pool = require("../config/db");
const authMiddleware = require("../middleware/auth");

const router = express.Router();
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Bugungi sanani olish
const getToday = () => new Date().toISOString().split("T")[0];

// Daraja bo'yicha prompt
const getLevelPrompt = (level) => {
  const levels = {
    beginner:
      "yangi boshlovchi fotograf uchun (oddiy, kamera telefon bilan bajarish mumkin)",
    intermediate:
      "o'rta darajali fotograf uchun (kompozitsiya, yorug'lik bilan ishlash)",
    pro: "professional fotograf uchun (texnik murakkab, professional kamera kerak)",
  };
  return levels[level] || levels.beginner;
};

// Bugungi vazifalarni AI orqali generatsiya qilish
router.get("/daily", authMiddleware, async (req, res) => {
  const today = getToday();
  const level = req.user.level || "beginner";

  try {
    // Avval DB dan bugungi vazifalarni tekshir
    const existing = await pool.query(
      "SELECT * FROM daily_challenges WHERE user_level = $1 AND challenge_date = $2",
      [level, today],
    );

    if (existing.rows.length > 0) {
      // Foydalanuvchi bajargan vazifalarni ham olish
      const completed = await pool.query(
        "SELECT challenge_id FROM user_daily_challenges WHERE user_id = $1 AND challenge_date = $2",
        [req.user.id, today],
      );
      const completedIds = completed.rows.map((r) => r.challenge_id);
      const challenges = existing.rows.map((c) => ({
        ...c,
        completed: completedIds.includes(c.id),
      }));
      return res.json({ challenges, date: today });
    }

    // AI orqali yangi vazifalar generatsiya qilish
    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 800,
      messages: [
        {
          role: "user",
          content: `Bugun ${today} sanasi uchun ${getLevelPrompt(level)} 5 ta fotografiya vazifasi yarat.
FAQAT JSON qaytargil:
[
  {"id":"1","title":"Vazifa nomi","description":"Qisqa tavsif (1 jumla)","xp":15,"icon":"leaf-outline","color":"#1D9E75","difficulty":"oson"},
  ...
]
icon faqat Ionicons nomlaridan: sunny-outline, water-outline, git-merge-outline, color-palette-outline, leaf-outline, aperture, timer-outline, scan-outline, contrast-outline, prism-outline, telescope-outline, flame-outline, snow-outline, rose-outline, diamond-outline
color: #1D9E75 yoki #6C63FF yoki #EF9F27 yoki #E24B4A
xp: beginner=10-20, intermediate=20-35, pro=35-50
difficulty: oson/o'rta/qiyin`,
        },
      ],
    });

    const raw = response.content[0].text.replace(/```json|```/g, "").trim();
    const challenges = JSON.parse(raw);

    // DB ga saqlash
    for (const ch of challenges) {
      await pool.query(
        `INSERT INTO daily_challenges (id, user_level, challenge_date, title, description, xp, icon, color, difficulty)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) ON CONFLICT DO NOTHING`,
        [
          ch.id + "_" + level + "_" + today,
          level,
          today,
          ch.title,
          ch.description,
          ch.xp,
          ch.icon,
          ch.color,
          ch.difficulty,
        ],
      );
    }

    // Saqlangan vazifalarni qaytarish
    const saved = await pool.query(
      "SELECT * FROM daily_challenges WHERE user_level = $1 AND challenge_date = $2",
      [level, today],
    );

    res.json({
      challenges: saved.rows.map((c) => ({ ...c, completed: false })),
      date: today,
    });
  } catch (err) {
    console.error("Daily challenges xato:", err.message);
    // Fallback vazifalar
    const fallback = getFallbackChallenges(level);
    res.json({ challenges: fallback, date: today });
  }
});

// Vazifani bajarish
router.post("/daily/:id/complete", authMiddleware, async (req, res) => {
  const today = getToday();
  try {
    await pool.query(
      `INSERT INTO user_daily_challenges (user_id, challenge_id, challenge_date)
       VALUES ($1, $2, $3) ON CONFLICT DO NOTHING`,
      [req.user.id, req.params.id, today],
    );
    // XP qo'shish
    const ch = await pool.query(
      "SELECT xp FROM daily_challenges WHERE id = $1",
      [req.params.id],
    );
    if (ch.rows[0]) {
      await pool.query("UPDATE users SET xp = xp + $1 WHERE id = $2", [
        ch.rows[0].xp,
        req.user.id,
      ]);
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Daraja bo'yicha maslahatlar
router.get("/tips", authMiddleware, async (req, res) => {
  const level = req.user.level || "beginner";
  const tips = getTipsByLevel(level);
  res.json({ tips, level });
});

// Fallback vazifalar (AI ishlamasa)
function getFallbackChallenges(level) {
  const all = {
    beginner: [
      {
        id: "b1",
        title: "Birinchi portret",
        description: "Do'stingiz yoki oila a'zosini suratga oling",
        xp: 15,
        icon: "person-outline",
        color: "#6C63FF",
        difficulty: "oson",
        completed: false,
      },
      {
        id: "b2",
        title: "Tabiat rasmi",
        description: "Gul yoki o'simlik yaqindan oling",
        xp: 12,
        icon: "leaf-outline",
        color: "#1D9E75",
        difficulty: "oson",
        completed: false,
      },
      {
        id: "b3",
        title: "Ufq chizig'i",
        description: "Teng ufq chizig'i bor manzara oling",
        xp: 10,
        icon: "remove-outline",
        color: "#EF9F27",
        difficulty: "oson",
        completed: false,
      },
      {
        id: "b4",
        title: "Soya va yorug'lik",
        description: "Quyosh nuri va soyali rasm oling",
        xp: 14,
        icon: "sunny-outline",
        color: "#EF9F27",
        difficulty: "oson",
        completed: false,
      },
      {
        id: "b5",
        title: "Simmetriya",
        description: "Simmetrik ob'ektni markazga qo'ying",
        xp: 18,
        icon: "git-merge-outline",
        color: "#E24B4A",
        difficulty: "oson",
        completed: false,
      },
    ],
    intermediate: [
      {
        id: "i1",
        title: "Oltin soat",
        description: "Quyosh botayotganda keng manzara oling",
        xp: 30,
        icon: "sunny-outline",
        color: "#EF9F27",
        difficulty: "o'rta",
        completed: false,
      },
      {
        id: "i2",
        title: "Harakat effekti",
        description: "Harakatdagi ob'ektni sekin pardada oling",
        xp: 28,
        icon: "timer-outline",
        color: "#6C63FF",
        difficulty: "o'rta",
        completed: false,
      },
      {
        id: "i3",
        title: "Aks sado",
        description: "Suvda yoki ko'zguda aks etgan rasm",
        xp: 25,
        icon: "water-outline",
        color: "#1D9E75",
        difficulty: "o'rta",
        completed: false,
      },
      {
        id: "i4",
        title: "Ramka ichida ramka",
        description: "Eshik yoki deraza orqali rasm oling",
        xp: 30,
        icon: "scan-outline",
        color: "#E24B4A",
        difficulty: "o'rta",
        completed: false,
      },
      {
        id: "i5",
        title: "Bir rang",
        description: "Bitta rang ustunlik qiladigan rasm",
        xp: 22,
        icon: "color-palette-outline",
        color: "#6C63FF",
        difficulty: "o'rta",
        completed: false,
      },
    ],
    pro: [
      {
        id: "p1",
        title: "Long exposure",
        description: "Suv yoki yulduzlarni uzun exposure bilan oling",
        xp: 45,
        icon: "timer-outline",
        color: "#6C63FF",
        difficulty: "qiyin",
        completed: false,
      },
      {
        id: "p2",
        title: "Silhouette",
        description: "Orqa yorug'likda siluet rasmi",
        xp: 40,
        icon: "contrast-outline",
        color: "#1a1a1a",
        difficulty: "qiyin",
        completed: false,
      },
      {
        id: "p3",
        title: "Bokeh effekti",
        description: "f/1.8 yoki pastroq diafragma bilan bokeh",
        xp: 42,
        icon: "aperture",
        color: "#E24B4A",
        difficulty: "qiyin",
        completed: false,
      },
      {
        id: "p4",
        title: "Street photography",
        description: "Odamlar hayotidan hujjatli rasm",
        xp: 50,
        icon: "people-outline",
        color: "#EF9F27",
        difficulty: "qiyin",
        completed: false,
      },
      {
        id: "p5",
        title: "Minimal kompozitsiya",
        description: "Bo'sh maydon bilan minimal rasm",
        xp: 38,
        icon: "remove-circle-outline",
        color: "#6C63FF",
        difficulty: "qiyin",
        completed: false,
      },
    ],
  };
  return all[level] || all.beginner;
}

// Daraja bo'yicha maslahatlar
function getTipsByLevel(level) {
  const tips = {
    beginner: [
      {
        id: "1",
        icon: "grid-outline",
        title: "Uchinchilar qoidasi",
        desc: "Rasmni 9 teng qismga bo'ling. Ob'ektni chiziqlar kesishgan joylarga qo'ying.",
        example: "Portretda ko'zlar yuqori chiziqda bo'lsin.",
        color: "#6C63FF",
      },
      {
        id: "2",
        icon: "sunny-outline",
        title: "Yorug'lik yo'nalishi",
        desc: "Yorug'lik oldidan tushsa ob'ekt aniq ko'rinadi.",
        example: "Ertalab yoki kechqurun quyosh eng yaxshi.",
        color: "#EF9F27",
      },
      {
        id: "3",
        icon: "remove-outline",
        title: "Gorizontal chiziq",
        desc: "Ufq chizig'i doim to'g'ri bo'lsin.",
        example: "Dengiz yoki tog' rasmlarida e'tibor bering.",
        color: "#1D9E75",
      },
      {
        id: "4",
        icon: "phone-portrait-outline",
        title: "Barqaror ushlab turing",
        desc: "Telefonni ikki qo'l bilan ushlab, tirsaklarni tanaga tegizing.",
        example: "Devorga suyanib yanada barqaror bo'ladi.",
        color: "#E24B4A",
      },
      {
        id: "5",
        icon: "search-outline",
        title: "Yaqindan oling",
        desc: "Asosiy ob'ektga yaqinlashing, ortiqcha narsalar chiqmasin.",
        example: "Gulni yaqindan olib fon xira bo'lsin.",
        color: "#6C63FF",
      },
    ],
    intermediate: [
      {
        id: "1",
        icon: "aperture",
        title: "Diafragma (f-stop)",
        desc: "Kichik f-raqam (f/1.8) — fon xira. Katta f-raqam (f/16) — hamma narsa aniq.",
        example: "Portretda f/1.8, landshaftda f/11.",
        color: "#6C63FF",
        iconLib: "Feather",
      },
      {
        id: "2",
        icon: "timer-outline",
        title: "Parda tezligi",
        desc: "Tez harakatni to'xtatish uchun tez parda (1/1000s).",
        example: "Sport rasmida 1/1000s, suv oqimida 1/10s.",
        color: "#EF9F27",
      },
      {
        id: "3",
        icon: "options-outline",
        title: "ISO sozlamasi",
        desc: "Past ISO (100-200) — aniq. Yuqori ISO — qorong'uda yordam beradi.",
        example: "Kunduzi ISO 100, kechasi ISO 800-1600.",
        color: "#1D9E75",
      },
      {
        id: "4",
        icon: "scan-outline",
        title: "Ramka ichida ramka",
        desc: "Eshik, deraza, daraxt shoxlarini ramka sifatida ishlating.",
        example: "Daraxt shoxlari orasidan ko'ringan tog'.",
        color: "#E24B4A",
      },
      {
        id: "5",
        icon: "color-palette-outline",
        title: "Rang nazariyasi",
        desc: "Qo'shimcha ranglar (Ko'k-To'q sariq) ajralib turadi.",
        example: "Ko'k osmon va sariq dalani birlashtirib oling.",
        color: "#6C63FF",
      },
    ],
    pro: [
      {
        id: "1",
        icon: "contrast-outline",
        title: "HDR texnikasi",
        desc: "Turli ekspozitsiyada 3-5 rasm olib birlashtiring.",
        example: "Yorqin quyosh va qorong'u ichki manzara.",
        color: "#1a1a1a",
      },
      {
        id: "2",
        icon: "aperture",
        title: "Hyperfocal masofasi",
        desc: "Maksimal chuqurlik uchun to'g'ri fokus masofasini toping.",
        example: "Landshaftda f/8 va hyperfocal masofasi.",
        color: "#6C63FF",
        iconLib: "Feather",
      },
      {
        id: "3",
        icon: "flame-outline",
        title: "Light painting",
        desc: "Qorong'uda uzun exposure bilan chiroq bilan rasm chizish.",
        example: "Qorong'u xonada LED bilan spiral chizish.",
        color: "#E24B4A",
      },
      {
        id: "4",
        icon: "telescope-outline",
        title: "Perspektiva siqilishi",
        desc: "Uzoq focal length bilan ob'ektlarni yaqinlashtirish effekti.",
        example: "200mm+ lens bilan shahar ko'chasi.",
        color: "#EF9F27",
      },
      {
        id: "5",
        icon: "prism-outline",
        title: "Prizma effekti",
        desc: "Shisha prizma orqali ranglarni sindirib chiroyli effet hosil qiling.",
        example: "Portretda prizma bilan rangli lens flare.",
        color: "#6C63FF",
      },
    ],
  };
  return tips[level] || tips.beginner;
}

module.exports = router;
