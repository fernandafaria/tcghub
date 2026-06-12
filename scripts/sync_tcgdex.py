#!/usr/bin/env python3
"""Sync Pokemon prices from TCGDex -> Supabase card_prices"""

import json, urllib.request, urllib.parse, sys, os
from datetime import date

SUPABASE_URL = "https://qzriethxpgcsvgzdzifp.supabase.co"
SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF6cmlldGh4cGdjc3ZnemR6aWZwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzU5ODcwNiwiZXhwIjoyMDkzMTc0NzA2fQ.rpSJQOW2CUBtPXa0JqQFEe2kfypvF6SCa58B2qhWn2g"
TCGDEX = "https://api.tcgdex.net/v2/en"
BRL = 5.80
TODAY = date.today().isoformat()
GAME = "pokemon"

def supabase_get(path):
    url = f"{SUPABASE_URL}/rest/v1/{path}"
    req = urllib.request.Request(url)
    req.add_header("apikey", SERVICE_KEY)
    req.add_header("Authorization", f"Bearer {SERVICE_KEY}")
    return json.loads(urllib.request.urlopen(req).read())

def supabase_post(path, body):
    url = f"{SUPABASE_URL}/rest/v1/{path}"
    data = json.dumps(body).encode()
    req = urllib.request.Request(url, data=data, method="POST")
    req.add_header("apikey", SERVICE_KEY)
    req.add_header("Authorization", f"Bearer {SERVICE_KEY}")
    req.add_header("Content-Type", "application/json")
    req.add_header("Prefer", "return=minimal")
    resp = urllib.request.urlopen(req)
    return resp.status

def supabase_patch(path, body):
    url = f"{SUPABASE_URL}/rest/v1/{path}"
    data = json.dumps(body).encode()
    req = urllib.request.Request(url, data=data, method="PATCH")
    req.add_header("apikey", SERVICE_KEY)
    req.add_header("Authorization", f"Bearer {SERVICE_KEY}")
    req.add_header("Content-Type", "application/json")
    req.add_header("Prefer", "return=minimal")
    resp = urllib.request.urlopen(req)
    return resp.status

print("Fetching TCGDex Pokemon cards with pricing...")
cards = json.loads(urllib.request.urlopen(f"{TCGDEX}/cards?category=Pokemon&pricing=yes").read())
print(f"TCGDex returned {len(cards)} cards (some are Trainers/Energy)")

synced = skipped = error = 0
for i, card in enumerate(cards):
    try:
        pricing = card.get("data", {}).get("pricing", {})
        tcgp = pricing.get("tcgplayer", {})
        cm = pricing.get("cardmarket", {})
        price_usd = (tcgp.get("holofoil", {}).get("marketPrice") or 
                     tcgp.get("normal", {}).get("marketPrice") or 
                     cm.get("avgPrice") or 0)
        if not price_usd or price_usd <= 0:
            skipped += 1
            continue

        card_num = card.get("localId") or card.get("number") or ""
        name = card.get("name", "")
        if not card_num or not name:
            skipped += 1
            continue
        
        # Find match in our DB
        try:
            matches = supabase_get(
                f"cards?select=slug,name,set_code,collector_number"
                f"&game_id=eq.{GAME}"
                f"&collector_number=eq.{urllib.parse.quote(card_num)}"
                f"&name=ilike.{urllib.parse.quote(name + '%')}"
                f"&limit=1"
            )
        except Exception:
            skipped += 1
            continue
        
        if not matches:
            skipped += 1
            continue
        
        m = matches[0]
        brl_mid = round(price_usd * BRL, 2)
        brl_low = round(price_usd * 0.85 * BRL, 2)
        brl_high = round(price_usd * 1.15 * BRL, 2)
        
        row = {
            "slug": m["slug"],
            "game_id": GAME,
            "name": m["name"],
            "set_code": m.get("set_code", ""),
            "collector_number": m.get("collector_number", ""),
            "price_usd": round(price_usd, 2),
            "price_brl_low": brl_low,
            "price_brl_mid": brl_mid,
            "price_brl_high": brl_high,
            "price_brl_source": "tcgdex",
            "price_date": TODAY,
            "variant": "normal",
        }
        
        # Check if exists -> update, else insert
        try:
            existing = supabase_get(
                f"card_prices?select=id"
                f"&slug=eq.{urllib.parse.quote(m['slug'])}"
                f"&game_id=eq.{GAME}"
                f"&price_date=eq.{TODAY}"
                f"&variant=eq.normal"
                f"&limit=1"
            )
            if existing:
                supabase_patch(f"card_prices?id=eq.{existing[0]['id']}", {
                    "price_usd": round(price_usd, 2),
                    "price_brl_low": brl_low,
                    "price_brl_mid": brl_mid,
                    "price_brl_high": brl_high,
                })
            else:
                supabase_post("card_prices", row)
            synced += 1
        except Exception as e:
            error += 1
            if error <= 3:
                print(f"  DB error ({m['slug']}): {e}")
        
        if synced % 50 == 0:
            print(f"  {synced}/{len(cards)} synced ({skipped} skipped)...")
            
    except Exception as e:
        error += 1
        if error <= 3:
            print(f"  Card error {i}: {e}")

print(f"\n=== DONE ===\n{synced} synced, {skipped} skipped, {error} errors, {len(cards)} total")
