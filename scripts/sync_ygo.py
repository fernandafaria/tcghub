#!/usr/bin/env python3
"""Sync Yu-Gi-Oh! cards + images from YGOPRODeck → Supabase."""

import json, urllib.request, urllib.parse, os, time, re

SKEY = open(os.path.expanduser("/Users/rawfamily/code/tcghub/.supabase_key")).read().strip()
HEADERS = {"apikey": SKEY, "Authorization": "Bearer " + SKEY, "Content-Type": "application/json"}
SUPABASE_URL = "https://qzriethxpgcsvgzdzifp.supabase.co"
YGOPRO = "https://db.ygoprodeck.com/api/v7"
GAME = "ygo"

def supabase_post(table, body):
    url = f"{SUPABASE_URL}/rest/v1/{table}"
    data = json.dumps(body).encode()
    req = urllib.request.Request(url, data=data, method="POST",
        headers={**HEADERS, "Prefer": "return=minimal"})
    with urllib.request.urlopen(req, timeout=15) as resp:
        return resp.status == 201

def fetch_json(url):
    req = urllib.request.Request(url, headers={"User-Agent": "TCGHub/1.0"})
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.loads(resp.read())

def slugify(text):
    return re.sub(r'[^a-z0-9-]', '', text.lower().replace(' ', '-').replace("'", "")[:80])

print("=== YU-GI-OH! SYNC (YGOPRODeck) ===\n")

# Fetch all cards (paginated, 500 per page)
all_cards = []
offset = 0
batch = 500
while True:
    url = f"{YGOPRO}/cardinfo.php?num={batch}&offset={offset}"
    print(f"  Fetching offset={offset}...", end=" ", flush=True)
    data = fetch_json(url)
    cards = data.get("data", [])
    all_cards.extend(cards)
    print(f"{len(cards)} cards (total: {len(all_cards)})")
    if len(cards) < batch:
        break
    offset += batch
    time.sleep(0.3)

print(f"\nTotal YGO cards: {len(all_cards)}\n")

# Insert cards (skip if already exist)
inserted = 0
skipped = 0
errors = 0

for i, card in enumerate(all_cards):
    try:
        name = card.get("name", "").strip()
        if not name:
            skipped += 1
            continue
        
        card_id = str(card.get("id", ""))
        card_type = card.get("type", "")
        race = card.get("race", "")
        archetype = card.get("archetype", "")
        desc = card.get("desc", "")[:500]
        
        # Card number (e.g., "LOB-001")
        card_sets = card.get("card_sets", [])
        set_code = card_sets[0].get("set_code", "") if card_sets else ""
        set_name = card_sets[0].get("set_name", "") if card_sets else ""
        collector_number = card_sets[0].get("set_code", "") if card_sets else ""
        
        # Image
        card_images = card.get("card_images", [])
        image_url = card_images[0].get("image_url", "") if card_images else ""
        
        # Prices
        card_prices = card.get("card_prices", [{}])[0]
        price_usd = float(card_prices.get("cardmarket_price", 0) or 0)
        
        # Slug
        slug = slugify(name)
        if card_id:
            slug = f"{slug}-{card_id}"
        
        # Build tags
        tags = []
        if race: tags.append(race)
        if archetype: tags.append(archetype)
        if card_type: tags.append(card_type)
        
        row = {
            "game_id": GAME,
            "slug": slug,
            "name": name,
            "collector_number": collector_number,
            "set_code": set_code,
            "rarity": card_sets[0].get("set_rarity", "") if card_sets else "",
            "color": card_type,
            "image_url": image_url,
            "body_text": desc,
            "classifications": tags,
        }
        
        supabase_post("cards", row)
        inserted += 1
        
    except Exception as e:
        errors += 1
        if errors <= 3:
            print(f"  Error on card {i}: {e}")
    
    if inserted % 500 == 0:
        print(f"  {inserted}/{len(all_cards)} inserted ({skipped} skipped, {errors} errors)")
    
    time.sleep(0.05)  # Rate limit

print(f"\nDONE YGO: {inserted} inserted, {skipped} skipped, {errors} errors")
