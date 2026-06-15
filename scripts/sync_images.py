#!/usr/bin/env python3
"""Sync card images: TCGDex (Pokémon) + Scryfall (Magic) → Supabase.
Runs locally, writes directly to Supabase REST API.
Usage: python3 sync_images.py [--dry-run] [--game=pokemon]
"""

import json, urllib.request, urllib.parse, sys, os, time
from typing import Optional

SUPABASE_URL = "https://qzriethxpgcsvgzdzifp.supabase.co"
SERVICE_KEY = open(os.path.expanduser("/Users/rawfamily/code/tcghub/.supabase_key")).read().strip()
SKEY = SERVICE_KEY  # short alias

HEADERS = {"apikey": SKEY, "Authorization": "Bearer " + SKEY}

def supabase_get(path: str) -> list:
    url = f"{SUPABASE_URL}/rest/v1/{path}"
    req = urllib.request.Request(url, headers=HEADERS)
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.loads(resp.read())

def supabase_patch(table: str, filters: str, body: dict) -> bool:
    url = f"{SUPABASE_URL}/rest/v1/{table}?{filters}"
    data = json.dumps(body).encode()
    req = urllib.request.Request(url, data=data, method="PATCH", headers={
        **HEADERS, "Content-Type": "application/json", "Prefer": "return=minimal",
    })
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            return resp.status == 204
    except:
        return False

# ─── POKÉMON via TCGDex ──────────────────────────────────────────────

def sync_pokemon_images(dry_run=False):
    print("=== POKÉMON IMAGES (TCGDex) ===\n")
    
    # Step 1: Build TCGDex lookup (paginated)
    print("Building TCGDex index...")
    tcgdex_lookup = {}  # (collector_number, name_prefix) -> image_url
    page = 1
    total_tcg = 0
    with_img = 0
    
    while True:
        try:
            url = f"https://api.tcgdex.net/v2/en/cards?category=Pokemon&pagination:itemsPerPage=500&pagination:page={page}"
            req = urllib.request.Request(url, headers={"User-Agent": "TCGHub/1.0"})
            with urllib.request.urlopen(req, timeout=60) as resp:
                cards = json.loads(resp.read())
        except Exception as e:
            print(f"  TCGDex page {page} error: {e}")
            break
        
        if not cards:
            break
        
        total_tcg += len(cards)
        for c in cards:
            img = c.get("image")
            if not img:
                continue
            cn = c.get("localId") or c.get("number") or ""
            name = (c.get("name") or "").strip()
            if cn and name and len(name) >= 3:
                key = (cn, name[:30].lower())
                if key not in tcgdex_lookup:
                    tcgdex_lookup[key] = img
                    with_img += 1
        
        print(f"  Page {page}: {len(cards)} cards (total: {total_tcg}, with img: {with_img})")
        page += 1
        if page > 100:  # Safety limit
            break
        time.sleep(0.3)
    
    print(f"\nTCGDex index: {len(tcgdex_lookup)} unique cards with images\n")
    
    # Step 2: Match against Supabase cards without images
    print("Matching against Supabase...")
    offset = 0
    batch = 500
    total_synced = 0
    total_checked = 0
    
    while True:
        path = (f"cards?select=id,slug,name,collector_number"
                f"&game_id=eq.pokemon"
                f"&image_url=is.null"
                f"&order=id"
                f"&limit={batch}"
                f"&offset={offset}")
        
        try:
            cards = supabase_get(path)
        except Exception as e:
            print(f"  Supabase error: {e}")
            break
        
        if not cards:
            break
        
        synced = 0
        for c in cards:
            cn = (c.get("collector_number") or "").strip()
            name = (c.get("name") or "").strip()
            if not cn or not name:
                continue
            
            key = (cn, name[:30].lower())
            img = tcgdex_lookup.get(key)
            if not img:
                # Try without number (just name match)
                pass
                continue
            
            if not dry_run:
                ok = supabase_patch("cards", f"id=eq.{c['id']}", {"image_url": img})
                if ok:
                    synced += 1
            else:
                synced += 1
        
        total_synced += synced
        total_checked += len(cards)
        pct = synced / len(cards) * 100 if cards else 0
        print(f"  Batch {offset//batch + 1}: {synced}/{len(cards)} ({pct:.0f}%) — total: {total_synced}/{total_checked}")
        
        if len(cards) < batch:
            break
        offset += batch
        time.sleep(0.5)
    
    print(f"\nDONE Pokémon: {total_synced} images synced out of {total_checked} checked\n")
    return total_synced

# ─── MAGIC via Scryfall ──────────────────────────────────────────────

def sync_magic_images(dry_run=False):
    print("=== MAGIC IMAGES (Scryfall) ===\n")
    
    offset = 0
    batch = 200
    total_synced = 0
    total_checked = 0
    
    while True:
        path = (f"cards?select=id,slug,name,collector_number,set_code"
                f"&game_id=eq.mtg"
                f"&image_url=is.null"
                f"&order=id"
                f"&limit={batch}"
                f"&offset={offset}")
        
        try:
            cards = supabase_get(path)
        except Exception as e:
            print(f"  Error: {e}")
            break
        
        if not cards:
            break
        
        synced = 0
        for c in cards:
            name = (c.get("name") or "").strip()
            set_code = (c.get("set_code") or "").strip()
            cn = (c.get("collector_number") or "").strip()
            
            if not name:
                continue
            
            img = None
            try:
                # Try by name + set + number
                query = f'set:{set_code} cn:"{cn}"' if set_code and cn else f'!"{name}"'
                url = f"https://api.scryfall.com/cards/search?q={urllib.parse.quote(query)}&unique=prints"
                req = urllib.request.Request(url, headers={"User-Agent": "TCGHub/1.0"})
                with urllib.request.urlopen(req, timeout=15) as resp:
                    data = json.loads(resp.read())
                scry = data.get("data", [{}])[0]
                img = scry.get("image_uris", {}).get("normal")
            except:
                pass
            
            if not img:
                # Fallback: named search
                try:
                    url = f"https://api.scryfall.com/cards/named?exact={urllib.parse.quote(name)}"
                    req = urllib.request.Request(url, headers={"User-Agent": "TCGHub/1.0"})
                    with urllib.request.urlopen(req, timeout=10) as resp:
                        scry = json.loads(resp.read())
                    img = scry.get("image_uris", {}).get("normal")
                except:
                    pass
            
            if img and not dry_run:
                supabase_patch("cards", f"id=eq.{c['id']}", {"image_url": img})
            
            if img:
                synced += 1
            
            # Scryfall rate limit: 10 req/s, be conservative
            time.sleep(0.12)
        
        total_synced += synced
        total_checked += len(cards)
        pct = synced / len(cards) * 100 if cards else 0
        print(f"  Batch {offset//batch + 1}: {synced}/{len(cards)} ({pct:.0f}%) — total: {total_synced}/{total_checked}")
        
        if len(cards) < batch:
            break
        offset += batch
    
    print(f"\nDONE Magic: {total_synced} images synced out of {total_checked} checked\n")
    return total_synced

# ─── MAIN ────────────────────────────────────────────────────────────

if __name__ == "__main__":
    dry_run = "--dry-run" in sys.argv
    game = "all"
    for a in sys.argv:
        if a.startswith("--game="):
            game = a.split("=", 1)[1]
    
    print(f"TCGHub Image Sync{' (DRY RUN)' if dry_run else ''} | Game: {game}\n")
    
    if game in ("pokemon", "all"):
        sync_pokemon_images(dry_run)
    
    if game in ("mtg", "all"):
        print("\n⚠️  Magic via Scryfall é 1 req/carta (lento). ⚠️\n")
        sync_magic_images(dry_run)
    
    print("Done.")
