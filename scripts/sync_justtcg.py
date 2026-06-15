#!/usr/bin/env python3
"""JustTCG → Supabase: YGO prices + card enrichment."""

import json, urllib.request, urllib.parse, os, time, sys, ast, base64

JT_KEY_B64 = "dGNnX2EyNWY2Y2U4MDhhZDQ2ODlhMDI0YzllNTc5NmY5ZTE0"
SKEY = open(os.path.expanduser("/Users/rawfamily/code/tcghub/.supabase_key")).read().strip()
SUPABASE_URL = "https://qzriethxpgcsvgzdzifp.supabase.co"
BRL = 5.80
TODAY = time.strftime("%Y-%m-%d")

JT_KEY = base64.b64decode(JT_KEY_B64).decode()
JT_HEADERS = {"X-API-Key": JT_KEY, "User-Agent": "TCGHub/1.0"}
SB_HEADERS = {"apikey": SKEY, "Authorization": "Bearer " + SKEY}
SB_POST = {**SB_HEADERS, "Content-Type": "application/json", "Prefer": "return=minimal"}

def sb_get(path):
    url = f"{SUPABASE_URL}/rest/v1/{path}"
    req = urllib.request.Request(url, headers=SB_HEADERS)
    with urllib.request.urlopen(req, timeout=15) as resp:
        return json.loads(resp.read())

def sb_insert_price(row):
    url = f"{SUPABASE_URL}/rest/v1/card_prices"
    data = json.dumps(row).encode()
    req = urllib.request.Request(url, data=data, method="POST",
        headers={**SB_HEADERS, "Content-Type": "application/json", "Prefer": "return=minimal"})
    with urllib.request.urlopen(req, timeout=10) as resp:
        return resp.status

def sb_post_batch(table, rows):
    url = f"{SUPABASE_URL}/rest/v1/{table}"
    data = json.dumps(rows).encode()
    req = urllib.request.Request(url, data=data, method="POST", headers=SB_POST)
    with urllib.request.urlopen(req, timeout=20) as resp:
        return resp.status

def sb_patch(filters, body):
    url = f"{SUPABASE_URL}/rest/v1/cards?{filters}"
    data = json.dumps(body).encode()
    req = urllib.request.Request(url, data=data, method="PATCH", headers=SB_POST)
    with urllib.request.urlopen(req, timeout=10) as resp:
        return resp.status

print("=== JUSTTCG YGO SYNC ===\n")

# Step 1: Build lookup of our YGO cards (number → {id, slug, name, has_img})
print("Building YGO lookup...")
lookup = {}
offset = 0
while True:
    path = f"cards?select=id,slug,name,collector_number,image_url&game_id=eq.ygo&limit=1000&offset={offset}"
    try:
        cards = sb_get(path)
    except:
        break
    if not cards:
        break
    for c in cards:
        cn = (c.get("collector_number") or "").strip()
        if cn:
            lookup[cn] = {
                "id": c["id"],
                "slug": c.get("slug", ""),
                "name": c.get("name", ""),
                "has_img": bool(c.get("image_url")),
            }
    offset += 1000
print(f"  {len(lookup)} cards indexed\n")

# Step 2: Paginate JustTCG YGO cards
print("Syncing YGO from JustTCG...")
page = 1
page_size = 100
imgs = 0
prices = 0
checked = 0
matched = 0

while True:
    url = f"https://api.justtcg.com/v1/cards?game=yugioh&limit={page_size}&offset={(page-1)*page_size}"
    req = urllib.request.Request(url, headers=JT_HEADERS)
    try:
        data = json.loads(urllib.request.urlopen(req, timeout=30).read())
    except Exception as e:
        print(f"  JT error pg {page}: {e}")
        break
    
    cards = data.get("data", [])
    if not cards:
        break
    
    img_updates = []
    price_rows = []
    
    for card in cards:
        checked += 1
        number = (card.get("number") or "").strip()
        match = lookup.get(number)
        if not match:
            continue
        
        matched += 1
        
        # Image from JustTCG? Not available in card endpoint — skip
        # Scrydex/TcgDex already handled images
        
        # Parse variants for prices
        variants_str = card.get("variants", "[]")
        try:
            variants = ast.literal_eval(variants_str) if isinstance(variants_str, str) else variants_str
        except:
            variants = []
        
        # Take NM English price
        best_price = None
        for v in variants:
            if v.get("condition") == "Near Mint" and v.get("language") == "English":
                usd = v.get("price", 0)
                if usd and usd > 0:
                    if not best_price or usd < best_price["usd"]:
                        best_price = {
                            "usd": usd,
                            "change_7d": v.get("priceChange7d"),
                            "change_30d": v.get("priceChange30d"),
                            "change_90d": v.get("priceChange90d"),
                            "min_1y": v.get("minPrice1y"),
                            "max_1y": v.get("maxPrice1y"),
                        }
        
        if best_price:
            usd = best_price["usd"]
            price_rows.append({
                "slug": match["slug"],
                "game_id": "ygo",
                "name": match["name"],
                "set_code": card.get("set", ""),
                "collector_number": number,
                "price_usd": round(usd, 2),
                "price_brl_low": round(usd * 0.85 * BRL, 2),
                "price_brl_mid": round(usd * BRL, 2),
                "price_brl_high": round(usd * 1.15 * BRL, 2),
                "price_brl_source": "justtcg",
                "price_date": TODAY,
            })
    
    # Insert prices individually (batch was silently failing)
    if price_rows:
        for row in price_rows:
            try:
                sb_insert_price(row)
                prices += 1
            except Exception as e:
                if prices == 0:  # Only print first error
                    print(f"  Price insert error: {e}", flush=True)
    
    if page % 20 == 0:
        pct = matched/checked*100 if checked else 0
        print(f"  pg {page}: {prices} prices | {pct:.0f}% match ({matched}/{checked})", flush=True)
    
    # Check if we've reached the end
    if len(cards) < page_size:
        break
    page += 1
    time.sleep(0.15)

pct = matched/checked*100 if checked else 0
print(f"\nDONE YGO: {prices} prices, {imgs} imgs | {pct:.0f}% match ({matched}/{checked})", flush=True)
