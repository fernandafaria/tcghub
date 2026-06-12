#!/usr/bin/env python3
"""Small sync test — connect to Supabase directly using the service key"""

import json, urllib.request

SUPABASE_URL = "https://qzriethxpgcsvgzdzifp.supabase.co"
SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF6cmlldGh4cGdjc3ZnemR6aWZwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzU5ODcwNiwiZXhwIjoyMDkzMTc0NzA2fQ.rpSJQOW2CUBtPXa0JqQFEe2kfypvF6SCa58B2qhWn2g"

# Test connection
url = f"{SUPABASE_URL}/rest/v1/card_prices?limit=1"
req = urllib.request.Request(url)
req.add_header("apikey", SERVICE_KEY)
req.add_header("Authorization", f"Bearer {SERVICE_KEY}")
try:
    data = json.loads(urllib.request.urlopen(req).read())
    print(f"SUPABASE OK - card_prices count: got sample, first: {json.dumps(data[0] if data else 'empty', indent=2)[:200]}")
except Exception as e:
    print(f"SUPABASE ERROR: {e}")

# Fetch TCGDex data
TCGDEX = "https://api.tcgdex.net/v2/en/cards?category=Pokemon&pricing=yes&limit=3"
try:
    data = json.loads(urllib.request.urlopen(TCGDEX).read())
    print(f"\nTCGDEX OK - sample of {len(data)} cards:")
    for card in data[:2]:
        price = card.get("data",{}).get("pricing",{}).get("tcgplayer",{})
        print(f"  {card.get('name')} ({card.get('localId','?')}): holo={price.get('holofoil',{}).get('marketPrice','?')}, normal={price.get('normal',{}).get('marketPrice','?')}")
except Exception as e:
    print(f"TCGDEX ERROR: {e}")
