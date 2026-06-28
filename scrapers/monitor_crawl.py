#!/usr/bin/env python3
"""
Monitor simples para o crawl Liga — executa e mostra progresso.
Pode ser chamado via cron no DO.
"""

import subprocess
import json
import os
import sys
from datetime import datetime

VENV = "/tmp/crawl4ai-venv/bin/python3"
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
CRAWL_SCRIPT = os.path.join(SCRIPT_DIR, "crawl_liga.py")
DATA_DIR = os.path.join(SCRIPT_DIR, "data")


def status():
    """Mostra status atual do crawl."""
    print(f"\n📊 Status Crawl Liga — {datetime.now().strftime('%d/%m/%Y %H:%M')}")
    print("=" * 50)

    for site in ["lorcana", "pokemon"]:
        site_dir = os.path.join(DATA_DIR, site)
        
        # Verificar checkpoint
        checkpoint = os.path.join(site_dir, "crawl_checkpoint.json")
        complete = os.path.join(site_dir, "crawl_complete.json")

        if os.path.exists(complete):
            with open(complete) as f:
                data = json.load(f)
            print(f"\n✅ {site.upper()} — COMPLETO")
            print(f"   Páginas: {data['results']['success']}")
            print(f"   Falhas:  {data['results']['failed']}")
            print(f"   Finalizado: {data.get('finished_at', '?')[:19]}")

        elif os.path.exists(checkpoint):
            with open(checkpoint) as f:
                data = json.load(f)
            print(f"\n🔄 {site.upper()} — EM ANDAMENTO")
            print(f"   Páginas: {data['results']['success']}")
            print(f"   Falhas:  {data['results']['failed']}")
            print(f"   Visitadas: {data.get('total_visited', '?')}")

        else:
            # Contar arquivos no diretório de páginas
            pages_dir = os.path.join(site_dir, "pages")
            if os.path.exists(pages_dir):
                count = len([f for f in os.listdir(pages_dir) if f.endswith(".md")])
                print(f"\n⚠️  {site.upper()} — {count} páginas (sem checkpoint)")
            else:
                print(f"\n⏳ {site.upper()} — não iniciado")

    # Tamanho total dos dados
    if os.path.exists(DATA_DIR):
        total_size = sum(
            os.path.getsize(os.path.join(dp, f))
            for dp, dn, filenames in os.walk(DATA_DIR)
            for f in filenames
            if f.endswith(".md") or f.endswith(".json")
        )
        total_files = sum(
            1 for dp, dn, filenames in os.walk(DATA_DIR)
            for f in filenames if f.endswith(".md")
        )
        print(f"\n💾 Total: {total_files} arquivos, {total_size / 1024 / 1024:.1f} MB")


if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "--status":
        status()
    else:
        print("Uso: python3 monitor_crawl.py --status")
