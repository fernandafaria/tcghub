#!/usr/bin/env python3
"""Sync Magic: The Gathering images via Scryfall API → Supabase."""

import json, urllib.request, urllib.parse, os, re, time, sys

SKEY = open(os.path.expanduser("/Users/rawfamily/code/tcghub/.supabase_key")).read().strip()
HEADERS = {"apikey": SKEY, "Authorization": "Bearer " + SKEY, "Content-Type": "application/json"}
SUPABASE_URL = "https://qzriethxpgcsvgzdzifp.supabase.co"
SCRYFALL = "https://api.scryfall.com"
UA = {"User-Agent": "TCGHub/1.0", "Accept": "application/json"}

def supabase_get(path):
    req = urllib.request.Request(f"{SUPABASE_URL}/rest/v1/{path}", headers=HEADERS)
    with urllib.request.urlopen(req, timeout=15) as resp:
        return json.loads(resp.read())

def supabase_patch(filters, body):
    url = f"{SUPABASE_URL}/rest/v1/cards?{filters}"
    data = json.dumps(body).encode()
    req = urllib.request.Request(url, data=data, method="PATCH",
        headers={**HEADERS, "Prefer": "return=minimal"})
    with urllib.request.urlopen(req, timeout=10) as resp:
        return resp.status == 204

def scryfall_search(query):
    url = f"{SCRYFALL}/cards/search?q={urllib.parse.quote(query)}&unique=prints"
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=10) as resp:
        data = json.loads(resp.read())
    return data.get("data", [{}])[0].get("image_uris", {}).get("normal")

def scryfall_named(name):
    url = f"{SCRYFALL}/cards/named?exact={urllib.request.quote(name)}"
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=10) as resp:
        data = json.loads(resp.read())
    return data.get("image_uris", {}).get("normal")

print("=== MAGIC IMAGES (Scryfall) ===\n")

offset = 0
batch = 100
total_synced = 0
total_checked = 0

while True:
    path = (f"cards?select=id,name,collector_number,set_code"
            f"&game_id=eq.mtg"
            f"&image_url=is.null"
            f"&order=id"
            f"&limit={batch}"
            f"&offset={offset}")
    
    try:
        cards = supabase_get(path)
    except Exception as e:
        print(f"  Supabase error @ {offset}: {e}")
        break
    
    if not cards:
        break
    
    synced = 0
    for c in cards:
        cid = c["id"]
        name = (c.get("name") or "").strip()
        set_code = (c.get("set_code") or "").strip().lower()
        cn = (c.get("collector_number") or "").strip()
        
        if not name:
            continue
        
        img = None
        
        # Strategy 1: set + collector number
        if set_code and cn:
            try:
                img = scryfall_search(f'set:{set_code} cn:"{cn}"')
            except:
                pass
        
        # Strategy 2: named exact match
        if not img:
            try:
                img = scryfall_named(name)
            except:
                pass
        
        # Strategy 3: search by name (fuzzy)
        if not img:
            try:
                img = scryfall_search(f'!"{name}"')
            except:
                pass
        
        if img:
            try:
                supabase_patch(f"id=eq.{cid}", {"image_url": img})
                synced += 1
            except:
                pass
        
        # Rate limit: ~8 req/s
        time.sleep(0.13)
    
    total_synced += synced
    total_checked += len(cards)
    pct = synced / len(cards) * 100 if cards else 0
    print(f"  offset={offset}: {synced}/{len(cards)} ({pct:.0f}%) — total: {total_synced}/{total_checked}")
    
    if len(cards) < batch:
        break
    offset += batch

print(f"\nDONE Magic: {total_synced} images synced out of {total_checked}")
