#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""DataForSEO toplu SERP çekici: "{dizi} izle" sorgularının ilk 10 organik sonucu.

Ahrefs serp-overview keyword başına bir çağrı ister; 200+ dizi için pratik değil.
DataForSEO SERP API istek başına 100 görev kabul eder, sonuçlar tam URL'yi verir.
Sayfa trafiği ayrı adımda Ahrefs top-pages ile eşleştirilir (scripts/serp_birlestir.py).

    python3 scripts/dfs_serp.py <hedef.json> <cikti.jsonl> [min_aylik_hacim]
"""
import sys, json, base64, time, os, subprocess, tempfile

API = "https://api.dataforseo.com/v3/serp/google/organic/live/advanced"
LOCATION_TR, LANG_TR = 2792, "tr"
BATCH = 1           # live/advanced istek başına TEK görev işliyor: 20 gönderildiğinde
                    # ilk görev dönüyor, kalan 19 sessizce düşüyordu.

def creds():
    for p in (os.path.expanduser("~/.claude/settings.json"), os.path.expanduser("~/.claude.json")):
        try: d = json.load(open(p))
        except Exception: continue
        stack = [d]
        while stack:
            o = stack.pop()
            if isinstance(o, dict):
                if "DATAFORSEO_USERNAME" in o and "DATAFORSEO_PASSWORD" in o:
                    return o["DATAFORSEO_USERNAME"], o["DATAFORSEO_PASSWORD"]
                stack.extend(o.values())
            elif isinstance(o, list): stack.extend(o)
    sys.exit("DataForSEO kimlik bilgisi bulunamadi.")

def post(payload, auth):
    with tempfile.NamedTemporaryFile("w", suffix=".json", delete=False, encoding="utf-8") as tf:
        json.dump(payload, tf, ensure_ascii=False); body = tf.name
    try:
        for deneme in range(4):
            r = subprocess.run(["curl","-sS","--max-time","600","-X","POST",API,
                "-H","Authorization: Basic "+auth,"-H","Content-Type: application/json",
                "--data-binary","@"+body,"-w","\n%{http_code}"], capture_output=True, text=True)
            out = r.stdout.rsplit("\n",1); code = out[-1].strip() if len(out)>1 else "000"
            if code == "200":
                try: veri = json.loads(out[0])
                except json.JSONDecodeError: veri = None
                if veri is not None:
                    gd = veri.get("status_code")
                    if gd not in (20000, None):
                        sys.exit(f"DataForSEO govde hatasi {gd}: {veri.get('status_message')}")
                    return veri
            if deneme < 3: time.sleep(10*(deneme+1)); continue
            sys.exit(f"HTTP {code}: {(out[0] or r.stderr)[:400]}")
    finally: os.unlink(body)

hedef_p, cikti_p = sys.argv[1], sys.argv[2]
esik = float(sys.argv[3]) if len(sys.argv) > 3 else 0
hedef = [h for h in json.load(open(hedef_p, encoding="utf-8")) if h["ay"] >= esik]
auth = base64.b64encode(":".join(creds()).encode()).decode()

yazildi, maliyet = 0, 0.0
with open(cikti_p, "w", encoding="utf-8") as f:
    for i in range(0, len(hedef), BATCH):
        dilim = hedef[i:i+BATCH]
        payload = [{"keyword": h["kw"], "location_code": LOCATION_TR, "language_code": LANG_TR,
                    "depth": 10, "device": "desktop"} for h in dilim]
        veri = post(payload, auth)
        maliyet += veri.get("cost", 0) or 0
        for gorev in veri.get("tasks", []) or []:
            kw = (gorev.get("data") or {}).get("keyword")
            h = next((x for x in dilim if x["kw"] == kw), None)
            if not h: continue
            sonuc = []
            for res in (gorev.get("result") or []):
                for it in (res.get("items") or []):
                    if it.get("type") != "organic": continue
                    sonuc.append({"poz": it.get("rank_absolute"), "url": it.get("url"),
                                  "domain": it.get("domain"), "baslik": it.get("title")})
            if sonuc:
                f.write(json.dumps({**h, "sonuc": sonuc[:10]}, ensure_ascii=False) + "\n")
                yazildi += 1
        if (i+1) % 20 == 0 or i+1 == len(hedef):
            print(f"  {i+1}/{len(hedef)} · yazilan {yazildi}", flush=True)
        time.sleep(0.3)

print(f"\n{yazildi} keyword yazildi · DFS maliyeti ${maliyet:.4f} · cikti {cikti_p}")
