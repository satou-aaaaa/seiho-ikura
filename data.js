// 生命保険料控除いくら？の問題を作る（ブラウザと node の両方で使う）。
// 中身は、国税庁タックスアンサー No.1140「生命保険料控除」に書いてあることだけ（［令和8年4月1日現在法令等］。令和8年分以降の23歳未満の扶養親族の特例を含む。2026-11-17 に読んだ。要点は共有フォルダ games/seiho-ikura-research.md）。
// 1問は、1年に払った生命保険料・介護医療保険料・個人年金保険料（新契約か旧契約か）を読んで、生命保険料控除の額を選ぶ。正解したら2段目「どの決まり？」を選ぶ。
// 答えはコードで計算する：新契約（平成24年1月1日以後）は 2万円以下 全額・4万円以下 ×1/2+1万円・8万円以下 ×1/4+2万円・超 4万円。
//   旧契約（平成23年12月31日以前）は 2.5万円以下 全額・5万円以下 ×1/2+1.25万円・10万円以下 ×1/4+2.5万円・超 5万円。
//   新と旧の両方があるときは、新だけ・旧だけ・両方の合計（4万円まで）のうち多いほう。令和8年分から、23歳未満の扶養親族がいると新生命保険料は別の表（最高6万円。両方の合計も6万円まで）。
//   3つ（一般の生命保険料・介護医療保険料・個人年金保険料）の合計は12万円まで。支払保険料等は、払った額から剰余金・割戻金を引いた額。
// 金額はどれも4の倍数にして、1円未満の端数が出ないようにする（No.1140 に端数の決まりが書いていないため）。
// 税額・保険期間5年未満の貯蓄保険などの対象外・地方税（住民税）・申告の手続きは扱わない（画面に書く）。
// 乱数 R は呼ぶ回数が毎回同じになるように使う（sort の比較の中では引かない）。
// KINDS の並びは最後に足すだけにする（並べ替え・削除をすると過去の日の問題が変わる）。
(function (root) {
  "use strict";
  const LV = ["やさしい", "ふつう", "むずかしい"];
  const AS_OF = "令和8年4月1日現在法令等（令和8年分以降の23歳未満の扶養親族の特例を含む）";

  // 出典（画面の「なぜ」に出す）
  const SRC = {
    a: ["国税庁 タックスアンサー No.1140 生命保険料控除", "https://www.nta.go.jp/taxes/shiraberu/taxanswer/shotoku/1140.htm"],
  };
  const MEDIA = { a: "1年に払った保険料（令和8年分）" };
  const MAN = 10000;
  // 新契約・旧契約・23歳未満の扶養親族がいるときの新生命保険料の表（No.1140）
  function calcNew(x) { return x <= 20000 ? x : x <= 40000 ? x / 2 + 10000 : x <= 80000 ? x / 4 + 20000 : 40000; }
  function calcOld(x) { return x <= 25000 ? x : x <= 50000 ? x / 2 + 12500 : x <= 100000 ? x / 4 + 25000 : 50000; }
  function calcYoung(x) { return x <= 30000 ? x : x <= 60000 ? x / 2 + 15000 : x <= 120000 ? x / 4 + 30000 : 60000; }
  // 新と旧の両方：新だけ・旧だけ・合計（cap まで）のうち多いほう
  function pair(nv, ov, cap) { return Math.max(nv, ov, Math.min(nv + ov, cap)); }
  // ip 新の一般・ik 旧の一般・ka 介護医療・np 新の個人年金・nk 旧の個人年金・r 新の一般の剰余金・young 23歳未満の扶養親族
  function partsOf(p) {
    const ipn = Math.max((p.ip || 0) - (p.r || 0), 0);
    const ippan = p.young ? pair(calcYoung(ipn), calcOld(p.ik || 0), 60000) : pair(calcNew(ipn), calcOld(p.ik || 0), 40000);
    return [ippan, calcNew(p.ka || 0), pair(calcNew(p.np || 0), calcOld(p.nk || 0), 40000)];
  }
  function deductOf(p) { const [a, b, c] = partsOf(p); return Math.min(a + b + c, 120000); }

  // 2段目「どの決まり？」
  const GROUPS = {
    shin: { name: "新契約の表", sub: "2012年以後・最高4万円", set: "all" },
    kyu: { name: "旧契約の表", sub: "2011年以前・最高5万円", set: "all" },
    awase: { name: "新と旧の両方", sub: "合わせて4万円まで", set: "all" },
    wakai: { name: "23歳未満の扶養親族", sub: "新生命保険料・最高6万円", set: "all" },
    gokei: { name: "3つの合計", sub: "一般・介護医療・個人年金で12万円まで", set: "all" },
  };
  const GRP_WHY = {
    shin: "2012年1月1日以後の契約は新契約の表です。2万円まで全額、8万円を超えると4万円です。",
    kyu: "2011年12月31日以前の契約は旧契約の表です。2.5万円まで全額、10万円を超えると5万円です。旧契約の医療保険も旧生命保険料です。",
    awase: "新と旧の両方があると、新だけ・旧だけ・両方の合計（4万円まで）のうち多いほうです。旧が6万円を超えると旧だけが多くなります。",
    wakai: "令和8年分から、23歳未満の扶養親族がいると新生命保険料は別の表です。3万円まで全額、12万円を超えると6万円です。",
    gokei: "一般の生命保険料・介護医療保険料・個人年金保険料の控除を足します。合計は12万円までです。",
  };
  const KEY = {
    shin: "新契約：2万円まで全額・8万円超は4万円",
    kyu: "旧契約：2.5万円まで全額・10万円超は5万円",
    awase: "新と旧の両方は、合わせて4万円まで（旧だけが多ければ旧）",
    wakai: "23歳未満の扶養親族：3万円まで全額・12万円超は6万円",
    gokei: "3つの控除の合計は12万円まで",
  };

  // 種類：[id, 難しさ, 2段目, 場面（＄I 新の一般・＄J 旧の一般・＄K 介護医療・＄N 新の年金・＄O 旧の年金・＄R 剰余金）, 金額 {欄: [下限, 上限, 刻み]}, 23歳未満の扶養親族か, ヒント1]
  const D = [
    ["s_zen", 0, "shin", "2020年に入った生命保険の保険料を、1年に＄I払った。", { ip: [4000, 20000, 1000] }, 0, "2万円以下なら？"],
    ["s_half", 0, "shin", "2020年に入った生命保険の保険料を、1年に＄I払った。", { ip: [21000, 40000, 1000] }, 0, "2万円超4万円以下は、半分＋1万円。"],
    ["s_qtr", 0, "shin", "2019年に入った生命保険の保険料を、1年に＄I払った。", { ip: [41000, 80000, 1000] }, 0, "4万円超8万円以下は、4分の1＋2万円。"],
    ["s_max", 0, "shin", "2022年に入った生命保険の保険料を、1年に＄I払った。", { ip: [81000, 200000, 1000] }, 0, "8万円を超えると？"],
    ["k_kaigo", 0, "shin", "2018年に入った医療保険（介護医療保険料）を、1年に＄K払った。", { ka: [10000, 100000, 1000] }, 0, "介護医療保険料も新契約の表。"],
    ["o_zen", 0, "kyu", "2005年に入った生命保険の保険料を、1年に＄J払った。", { ik: [4000, 25000, 1000] }, 0, "旧契約は2.5万円まで全額。"],
    ["o_half", 0, "kyu", "2003年に入った生命保険の保険料を、1年に＄J払った。", { ik: [26000, 50000, 1000] }, 0, "2.5万円超5万円以下は、半分＋1.25万円。"],
    ["o_max", 0, "kyu", "2008年に入った生命保険の保険料を、1年に＄J払った。", { ik: [101000, 200000, 1000] }, 0, "旧契約で10万円を超えると？"],
    ["n_nenkin", 0, "shin", "2016年に入った個人年金保険の保険料を、1年に＄N払った。", { np: [10000, 100000, 1000] }, 0, "個人年金保険料も新契約の表。"],
    ["y_base", 0, "wakai", "19歳の子を扶養している。2019年に入った生命保険の保険料を、1年に＄I払った。", { ip: [31000, 150000, 1000] }, 1, "23歳未満の扶養親族がいると？"],
    ["o_qtr", 1, "kyu", "2010年に入った生命保険の保険料を、1年に＄J払った。", { ik: [51000, 100000, 1000] }, 0, "5万円超10万円以下は、4分の1＋2.5万円。"],
    ["w_20k", 1, "shin", "2021年に入った生命保険の保険料を、1年にちょうど＄I払った。", { ip: [20000, 20000, 1] }, 0, "2万円「以下」に入る？"],
    ["w_80k", 1, "shin", "2017年に入った生命保険の保険料を、1年にちょうど＄I払った。", { ip: [80000, 80000, 1] }, 0, "8万円「以下」の行。"],
    ["a_both", 1, "awase", "2020年に入った生命保険に＄I、2008年に入った生命保険に＄J払った。", { ip: [10000, 40000, 1000], ik: [10000, 40000, 1000] }, 0, "新と旧の両方。合わせると？"],
    ["a_kyu60", 1, "awase", "2015年に入った生命保険に＄I、2006年に入った生命保険に＄J払った。", { ip: [20000, 80000, 1000], ik: [61000, 150000, 1000] }, 0, "旧が6万円を超えると？"],
    ["a_nenkin", 1, "awase", "個人年金保険に、2018年の契約で＄N、2009年の契約で＄O払った。", { np: [10000, 40000, 1000], nk: [10000, 40000, 1000] }, 0, "個人年金も新と旧で合わせて4万円まで。"],
    ["g_two", 1, "gokei", "2020年に入った生命保険に＄I、2021年に入った医療保険（介護医療保険料）に＄K払った。", { ip: [10000, 100000, 1000], ka: [10000, 100000, 1000] }, 0, "2つの控除を足す。"],
    ["g_three", 1, "gokei", "2020年契約の生命保険に＄I、介護医療保険に＄K、個人年金保険に＄N払った。", { ip: [10000, 100000, 1000], ka: [10000, 100000, 1000], np: [10000, 100000, 1000] }, 0, "3つの控除を足す。"],
    ["y_max", 1, "wakai", "大学生の子（20歳）を扶養している。2020年に入った生命保険の保険料を、1年に＄I払った。", { ip: [121000, 200000, 1000] }, 1, "23歳未満の扶養親族の表の上限は？"],
    ["y_half", 1, "wakai", "高校生の子（17歳）を扶養している。2019年に入った生命保険の保険料を、1年に＄I払った。", { ip: [31000, 60000, 1000] }, 1, "3万円超6万円以下は、半分＋1.5万円。"],
    ["n_kyu", 1, "kyu", "2009年に入った個人年金保険の保険料を、1年に＄O払った。", { nk: [26000, 100000, 1000] }, 0, "旧契約の個人年金は旧の表。"],
    ["s_jouyo", 1, "shin", "2020年に入った生命保険の保険料を＄I払い、その年に剰余金を＄R受け取った。", { ip: [50000, 100000, 1000], r: [2000, 20000, 1000] }, 0, "剰余金を引いた額で計算する。"],
    ["w_40k", 2, "shin", "2023年に入った生命保険の保険料を、1年にちょうど＄I払った。", { ip: [40000, 40000, 1] }, 0, "4万円「以下」の行。"],
    ["w_25k", 2, "kyu", "2004年に入った生命保険の保険料を、1年にちょうど＄J払った。", { ik: [25000, 25000, 1] }, 0, "旧契約の2.5万円「以下」。"],
    ["w_100k", 2, "kyu", "2002年に入った生命保険の保険料を、1年にちょうど＄J払った。", { ik: [100000, 100000, 1] }, 0, "10万円「以下」の行。"],
    ["w_60k", 2, "awase", "2019年に入った生命保険に＄I、2007年に入った生命保険にちょうど＄J払った。", { ip: [20000, 60000, 1000], ik: [60000, 60000, 1] }, 0, "旧がちょうど6万円なら合わせて？"],
    ["w_61k", 2, "awase", "2016年に入った生命保険に＄I、2001年に入った生命保険に＄J払った。", { ip: [60000, 80000, 1000], ik: [61000, 64000, 1000] }, 0, "旧だけと合計の4万円、多いのは？"],
    ["g_cap", 2, "gokei", "2008年契約の生命保険に＄J、2009年契約の個人年金に＄O、2015年契約の介護医療保険に＄K払った。", { ik: [100000, 200000, 4000], nk: [100000, 200000, 4000], ka: [81000, 150000, 1000] }, 0, "合計が12万円を超えると？"],
    ["g_cap2", 2, "gokei", "21歳の子を扶養している。2019年契約の生命保険に＄I、介護医療保険に＄K、個人年金保険に＄N払った。", { ip: [121000, 200000, 1000], ka: [81000, 150000, 1000], np: [81000, 150000, 1000] }, 1, "6万＋4万＋4万は？"],
    ["y_old", 2, "wakai", "18歳の子を扶養している。2020年に入った生命保険に＄I、2010年に入った生命保険に＄J払った。", { ip: [32000, 60000, 1000], ik: [20000, 50000, 1000] }, 1, "23歳未満の扶養親族がいると、合わせて6万円まで。"],
    ["y_120", 2, "wakai", "16歳の子を扶養している。2021年に入った生命保険の保険料を、1年にちょうど＄I払った。", { ip: [120000, 120000, 1] }, 1, "12万円「以下」の行。"],
    ["y_30k", 2, "wakai", "22歳の子を扶養している。2022年に入った生命保険の保険料を、1年にちょうど＄I払った。", { ip: [30000, 30000, 1] }, 1, "3万円「以下」なら？"],
    ["o_iryo", 2, "kyu", "2010年に入った医療保険の保険料を、1年に＄J払った。", { ik: [30000, 120000, 1000] }, 0, "旧契約の医療保険は、どの保険料？"],
    ["a_nk61", 2, "awase", "個人年金保険に、2020年の契約で＄N、2010年の契約で＄O払った。", { np: [10000, 80000, 1000], nk: [61000, 150000, 1000] }, 0, "旧が6万円を超えると旧だけ。"],
    ["y_none", 2, "shin", "23歳の子を扶養している。2018年に入った生命保険の保険料を、1年に＄I払った。", { ip: [81000, 200000, 1000] }, 0, "23歳は「23歳未満」に入る？"],
  ];

  const FIELDS = ["ip", "ik", "ka", "np", "nk", "r"], MARK = { ip: "＄I", ik: "＄J", ka: "＄K", np: "＄N", nk: "＄O", r: "＄R" };
  const yen = (n) => n.toLocaleString("ja-JP") + "円";
  const man = (n) => (n !== 0 && n % MAN === 0 ? `${(n / MAN).toLocaleString("ja-JP")}万円` : yen(n));
  const label = (t) => yen(t);
  const ri = (R, a, b) => a + Math.floor(R() * (b - a + 1));
  const pickAmt = (R, lo, hi, step) => lo + ri(R, 0, Math.floor((hi - lo) / step)) * step;
  function shuffle(R, a) { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = ri(R, 0, i); [b[i], b[j]] = [b[j], b[i]]; } return b; }
  function pickN(R, a, n) { return shuffle(R, a).slice(0, n); }

  function maker(sent, spec, young) {
    return (R) => {
      const p = { young: !!young };
      for (const f of FIELDS) p[f] = spec[f] ? pickAmt(R, spec[f][0], spec[f][1], spec[f][2]) : 0;
      const ans = deductOf(p);
      let sentence = sent;
      for (const f of FIELDS) sentence = sentence.replace(MARK[f], man(p[f]));
      // 選び肢：新と旧の取りちがえ・23歳未満の特例の見落とし・4万円/12万円の上限の見落とし・剰余金の引き忘れ・払った額そのまま から3つ
      const sw = { ...p, ip: p.ik, ik: p.ip, np: p.nk, nk: p.np }, [a, b, c] = partsOf(p);
      const cand = new Set([deductOf(sw), deductOf({ ...p, young: !p.young }), a + b + c, deductOf({ ...p, r: 0 }), calcNew(p.ip) + calcOld(p.ik) + b + calcNew(p.np) + calcOld(p.nk),
        Math.min(p.ip + p.ik + p.ka + p.np + p.nk - p.r, 200000), deductOf({ ...p, ip: p.ip + p.ik, ik: 0, np: p.np + p.nk, nk: 0 }), deductOf({ ...p, ik: p.ip + p.ik, ip: 0, nk: p.np + p.nk, np: 0 })]);
      const ok = (v) => Number.isInteger(v) && v > 0 && v !== ans;
      const wrong0 = [...cand].filter(ok);
      for (const v of [40000, 50000, 60000, 120000, ans - 5000, ans + 5000, ans + 10000, ans - 2500, ans + 2500]) { if (wrong0.length >= 3) break; if (ok(v) && !wrong0.includes(v)) wrong0.push(v); }
      const wrong = pickN(R, [...new Set(wrong0)].sort((x, y) => x - y), 3);
      const opts = shuffle(R, [ans, ...wrong]).map(label);
      const full = `${sentence} → 一般${yen(a)}・介護医療${yen(b)}・個人年金${yen(c)}${a + b + c > 120000 ? "（合計は12万円まで）" : ""}：${label(ans)}`;
      return { type: "act", q: `${sentence}　控除はいくら？`, opts, ans: label(ans), rev: false, full, ...p, deduct: ans, v: FIELDS.map((f) => p[f]).join("/") };
    };
  }
  // 金額の組が6通りより少ない種類は lo=hi にする（QA の「6通り以上」から外す）
  const combos = (spec) => Object.values(spec).reduce((n, s) => n * (Math.floor((s[1] - s[0]) / s[2]) + 1), 1);
  const KINDS = D.map(([id, lv, grp, sent, spec, young, look]) => ({ id, lv, grp, col: "a", sent, lo: 0, hi: combos(spec) < 6 ? 0 : 1, look, src: ["a"], name: GROUPS[grp].name + "：" + sent.replace(/＄./g, "○円").slice(0, 22) + "…", key: KEY[grp], why: GRP_WHY[grp], make: maker(sent, spec, young) }));
  const BY = Object.fromEntries(KINDS.map((k) => [k.id, k]));
  const kindsOf = (lv) => KINDS.filter((k) => k.lv === lv).map((k) => k.id);
  const GRP_OF = Object.fromEntries(KINDS.map((k) => [k.id, k.grp]));
  const groupsOf = (g) => Object.keys(GROUPS).filter((x) => GROUPS[x].set === GROUPS[g].set);

  function seedOf(str) { let h = 2166136261; for (const ch of String(str)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }
  function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

  function make(tag) {
    const [kind] = String(tag).split("|"), k = BY[kind];
    if (!k) return null;
    const p = k.make(rng(seedOf(tag)), k.lv);
    return { tag, kind, lv: k.lv, name: k.name, look: k.look, key: k.key, why: k.why, grp: k.grp, gwhy: GRP_WHY[k.grp], media: MEDIA[k.col], src: k.src.map((s) => SRC[s]), ...p };
  }
  const keyOf = (P) => `${P.kind}:${P.q}:${P.opts.slice().sort().join("/")}`;

  function dailyTags(date) {
    const R = rng(seedOf("day:" + date)), e = pickN(R, kindsOf(0), 2), n = pickN(R, kindsOf(1), 2), h = pickN(R, kindsOf(2), 1);
    return [...e, ...n, ...h].map((id, i) => `${id}|${date}:d${i}`);
  }
  function hardTags(date) {
    const dh = dailyTags(date)[4].split("|")[0], R = rng(seedOf("hard:" + date)), h = pickN(R, kindsOf(2).filter((x) => x !== dh), 3);
    return h.map((id, i) => `${id}|${date}:h${i}`);
  }

  const SMH = { KINDS, BY, GROUPS, GRP_OF, GRP_WHY, LV, SRC, MEDIA, AS_OF, calcNew, calcOld, calcYoung, partsOf, deductOf, kindsOf, groupsOf, seedOf, rng, make, keyOf, dailyTags, hardTags, pickN };
  if (typeof module !== "undefined" && module.exports) module.exports = SMH; else root.SMH = SMH;
})(typeof self !== "undefined" ? self : this);
