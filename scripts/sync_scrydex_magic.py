#!/usr/bin/env python3
"""Scrydex → Supabase: Magic prices + images (fixed)."""

import json, urllib.request, urllib.parse, os, time, sys

SCRYDEX_KEY = "49df48b91bac9ad4ded20597193089508596a01a78ae488e822f5820880873fe"
SKEY = open(os.path.expanduser("/Users/rawfamily/code/tcghub/.supabase_key")).read().strip()
SUPABASE_URL = "https://qzriethxpgcsvgzdzifp.supabase.co"
BRL = 5.80
TODAY = time.strftime("%Y-%m-%d")

SH = {"X-Api-Key": SCRYDEX_KEY, "X-Team-ID": "tcghub1", "User-Agent": "TCGHub/1.0"}
SB = {"apikey": SKEY, "Authorization": "Bearer " + SKEY}

def sb_get(path):
    url = f"{SUPABASE_URL}/rest/v1/{path}"
    req = urllib.request.Request(url, headers=SB)
    with urllib.request.urlopen(req, timeout=15) as resp:
        return json.loads(resp.read())

def sb_patch_card(cid, body):
    url = f"{SUPABASE_URL}/rest/v1/cards?id=eq.{cid}"
    data = json.dumps(body).encode()
    req = urllib.request.Request(url, data=data, method="PATCH",
        headers={**SB, "Content-Type": "application/json", "Prefer": "return=minimal"})
    with urllib.request.urlopen(req, timeout=10) as resp:
        return resp.status == 204

def sb_insert_prices(rows):
    url = f"{SUPABASE_URL}/rest/v1/card_prices"
    data = json.dumps(rows).encode()
    req = urllib.request.Request(url, data=data, method="POST",
        headers={**SB, "Content-Type": "application/json", "Prefer": "return=minimal"})
    with urllib.request.urlopen(req, timeout=20) as resp:
        return resp.status

print("=== SCRYDEX MAGIC SYNC (fixed) ===\n")

# Build lookup: (set_code_lower, collector_number) → card
print("Building Magic lookup...")
lookup = {}
offset = 0
while True:
    path = f"cards?select=id,slug,name,collector_number,set_code,image_url&game_id=eq.mtg&limit=1000&offset={offset}"
    try:
        cards = sb_get(path)
    except Exception as e:
        print(f"  SB error @ {offset}: {e}")
        break
    if not cards: break
    for c in cards:
        sc = (c.get("set_code") or "").strip().lower()
        cn = (c.get("collector_number") or "").strip()
        if sc and cn:
            lookup[(sc, cn)] = {
                "id": c["id"], "slug": c.get("slug", ""),
                "name": c.get("name", ""), "has_img": bool(c.get("image_url"))
            }
    offset += 1000
    if offset % 10000 == 0:
        print(f"  {len(lookup)} indexed...", flush=True)
print(f"  {len(lookup)} cards indexed\n")

# Sync
print("Syncing from Scrydex...")
page = 1
imgs = 0
prices = 0
matched = 0
checked = 0
retries = 0

while True:
    url = f"https://api.scrydex.com/magicthegathering/v1/cards?page={page}&page_size=250&include=prices"
    req = urllib.request.Request(url, headers=SH)
    try:
        data = json.loads(urllib.request.urlopen(req, timeout=30).read())
    except Exception as e:
        retries += 1
        if retries > 3:
            print(f"  Scrydex error pg {page} after 3 retries: {e}")
            break
        print(f"  Retry pg {page} ({retries}/3)...")
        time.sleep(3)
        continue
    
    retries = 0
    cards = data.get("data", [])
    if not cards: break
    
    for card in cards:
        checked += 1
        number = (card.get("number") or "").strip()
        set_code = (card.get("expansion", {}).get("code") or "").strip().lower()
        if not number or not set_code: continue
        
        match = lookup.get((set_code, number))
        if not match: continue
        
        matched += 1
        
        # Image
        if not match["has_img"]:
            images = card.get("images", [])
            if images:
                img_url = images[0].get("large") or images[0].get("medium", "")
                if img_url:
                    try:
                        ok = sb_patch_card(match["id"], {"image_url": img_url})
                        if ok:
                            imgs += 1
                            match["has_img"] = True
                    except Exception as e:
                        pass
        
        # Price (NM normal, first variant)
        for variant in card.get("variants", []):
            if variant.get("name") != "normal": continue
            for p in variant.get("prices", []):
                if p.get("condition") != "NM" or p.get("type") != "raw": continue
                usd = p.get("market", 0)
                if usd <= 0: continue
                
                brl_mid = round(usd * BRL, 2)
                brl_low = round(usd * 0.85 * BRL, 2)
                brl_high = round(usd * 1.15 * BRL, 2)
                
                row = {
                    "slug": match["slug"],
                    "game_id": "mtg",
                    "name": match["name"],
                    "set_code": card.get("expansion", {}).get("code", ""),
                    "collector_number": number,
                    "price_usd": round(usd, 2),
                    "price_brl_low": brl_low,
                    "price_brl_mid": brl_mid,
                    "price_brl_high": brl_high,
                    "price_brl_source": "scrydex",
                    "price_date": TODAY,
                }
                
                try:
                    sb_insert_prices([row])
                    prices += 1
                except Exception as e:
                    pass
                break  # One price per card
    
    if page % 20 == 0:
        pct = matched/checked*100 if checked else 0
        print(f"  pg {page}: {imgs} imgs, {prices} prices | {pct:.0f}% match ({matched}/{checked})", flush=True)
    
    total = data.get("total_count", 0)
    if page * 250 >= total: break
    page += 1
    time.sleep(0.15)

pct = matched/checked*100 if checked else 0
print(f"\nDONE Magic: {imgs} imgs, {prices} prices | {pct:.0f}% match ({matched}/{checked})", flush=True)
