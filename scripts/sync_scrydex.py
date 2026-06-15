#!/usr/bin/env python3
"""Scrydex → Supabase sync: images + prices. Batch-optimized."""

import json, urllib.request, urllib.parse, os, time, sys

SCRYDEX_KEY = "49df48b91bac9ad4ded20597193089508596a01a78ae488e822f5820880873fe"
SKEY = open(os.path.expanduser("/Users/rawfamily/code/tcghub/.supabase_key")).read().strip()
SUPABASE_URL = "https://qzriethxpgcsvgzdzifp.supabase.co"
BRL = 5.80
TODAY = time.strftime("%Y-%m-%d")

SH = {"X-Api-Key": SCRYDEX_KEY, "X-Team-ID": "tcghub1", "User-Agent": "TCGHub/1.0"}
SB = {"apikey": SKEY, "Authorization": "Bearer " + SKEY}

GAMES = {"magicthegathering": "mtg", "onepiece": "onepiece", "pokemon": "pokemon"}

def sb_get(path):
    url = f"{SUPABASE_URL}/rest/v1/{path}"
    req = urllib.request.Request(url, headers=SB)
    with urllib.request.urlopen(req, timeout=15) as resp:
        return json.loads(resp.read())

def sb_patch(filters, body):
    url = f"{SUPABASE_URL}/rest/v1/cards?{filters}"
    data = json.dumps(body).encode()
    req = urllib.request.Request(url, data=data, method="PATCH",
        headers={**SB, "Content-Type": "application/json", "Prefer": "return=minimal"})
    with urllib.request.urlopen(req, timeout=10) as resp:
        return resp.status

def sb_post_batch(rows):
    url = f"{SUPABASE_URL}/rest/v1/card_prices"
    data = json.dumps(rows).encode()
    req = urllib.request.Request(url, data=data, method="POST",
        headers={**SB, "Content-Type": "application/json", "Prefer": "return=minimal"})
    with urllib.request.urlopen(req, timeout=20) as resp:
        return resp.status

def sync(scry_game, our_game, dry_run=False):
    print(f"\n{'='*50}")
    print(f"SCRYDEX {scry_game} → {our_game}")
    print(f"{'='*50}\n")
    
    page = 1
    imgs = 0
    prices = 0
    checked = 0
    matched = 0
    
    while True:
        # Fetch Scrydex page
        url = f"https://api.scrydex.com/{scry_game}/v1/cards?page={page}&page_size=250&include=prices"
        req = urllib.request.Request(url, headers=SH)
        try:
            data = json.loads(urllib.request.urlopen(req, timeout=30).read())
        except Exception as e:
            print(f"  Scrydex error pg {page}: {e}")
            break
        
        cards = data.get("data", [])
        if not cards:
            break
        
        # Build batch lookup: (set_code, number) pairs
        pairs = set()
        scry_map = {}  # (set_code, number) → card data
        for c in cards:
            number = (c.get("number") or "").strip()
            set_code = (c.get("expansion", {}).get("code") or "").strip().lower()
            if number and set_code:
                key = f"{set_code}|{number}"
                pairs.add(key)
                scry_map[key] = c
        
        if not pairs:
            page += 1
            continue
        
        # Batch query Supabase — one in-memory lookup
        # Since Supabase REST has limits on `in.` filter size, we chunk
        pair_list = list(pairs)
        sb_cards = {}
        
        for i in range(0, len(pair_list), 50):
            chunk = pair_list[i:i+50]
            # Build OR conditions for set_code+number pairs
            # Supabase doesn't support OR across columns easily, so query by set_code
            # and filter in memory
            set_codes = set()
            numbers = set()
            for p in chunk:
                sc, num = p.split("|", 1)
                set_codes.add(sc)
                numbers.add(num)
            
            # Query: all cards from these set_codes, filter in memory
            sc_list = ",".join(f'"{sc}"' for sc in set_codes)
            # Actually, use a simpler approach: query all with matching set_code
            for sc in set_codes:
                path = (f"cards?select=id,slug,name,collector_number,set_code,image_url"
                        f"&game_id=eq.{our_game}"
                        f"&set_code=eq.{urllib.parse.quote(sc)}"
                        f"&limit=500")
                try:
                    result = sb_get(path)
                    for r in result:
                        cn = (r.get("collector_number") or "").strip()
                        key = f"{sc}|{cn}"
                        sb_cards[key] = r
                except:
                    pass
        
        # Match and update
        img_updates = []  # [{id, image_url}, ...]
        price_rows = []   # [{slug, game_id, ...}, ...]
        
        for c in cards:
            checked += 1
            number = (c.get("number") or "").strip()
            set_code = (c.get("expansion", {}).get("code") or "").strip().lower()
            if not number or not set_code:
                continue
            
            key = f"{set_code}|{number}"
            match = sb_cards.get(key)
            if not match:
                continue
            
            matched += 1
            
            # Image update
            if not match.get("image_url"):
                images = c.get("images", [])
                if images:
                    img_url = images[0].get("large") or images[0].get("medium", "")
                    if img_url:
                        img_updates.append({"id": match["id"], "image_url": img_url})
            
            # Price
            for variant in c.get("variants", []):
                if variant.get("name") != "normal":
                    continue
                for p in variant.get("prices", []):
                    if p.get("condition") != "NM" or p.get("type") != "raw":
                        continue
                    usd = p.get("market", 0)
                    if usd <= 0:
                        continue
                    
                    price_rows.append({
                        "slug": match.get("slug", ""),
                        "game_id": our_game,
                        "name": match.get("name", ""),
                        "set_code": set_code,
                        "collector_number": number,
                        "price_usd": round(usd, 2),
                        "price_brl_low": round(usd * 0.85 * BRL, 2),
                        "price_brl_mid": round(usd * BRL, 2),
                        "price_brl_high": round(usd * 1.15 * BRL, 2),
                        "price_brl_source": "scrydex",
                        "price_date": TODAY,
                        "variant": "normal",
                    })
                    break
        
        # Apply updates
        if img_updates and not dry_run:
            for u in img_updates:
                try:
                    sb_patch(f"id=eq.{u['id']}", {"image_url": u["image_url"]})
                    imgs += 1
                except:
                    pass
        
        if price_rows and not dry_run:
            for i in range(0, len(price_rows), 100):
                chunk = price_rows[i:i+100]
                try:
                    sb_post_batch(chunk)
                    prices += len(chunk)
                except:
                    pass
        elif price_rows and dry_run:
            prices += len(price_rows)
        
        if page % 20 == 0:
            pct = matched/checked*100 if checked else 0
            print(f"  pg {page}: {imgs} imgs, {prices} prices | {pct:.0f}% match", flush=True)
        
        total = data.get("total_count", 0)
        if page * 250 >= total:
            break
        page += 1
        time.sleep(0.15)
    
    pct = matched/checked*100 if checked else 0
    print(f"\nDONE: {imgs} imgs, {prices} prices | {pct:.0f}% match ({matched}/{checked})", flush=True)

if __name__ == "__main__":
    dry = "--dry-run" in sys.argv
    game = "all"
    for a in sys.argv:
        if a.startswith("--game="):
            game = a.split("=", 1)[1]
    
    targets = list(GAMES.items()) if game == "all" else [(game, GAMES.get(game, game))]
    for sg, og in targets:
        sync(sg, og, dry)
