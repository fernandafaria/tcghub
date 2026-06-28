#!/usr/bin/env python3
"""
Crawl completo do ligalorcana.com.br e ligapokemon.com.br usando Crawl4AI.

Extrai TODAS as páginas de cards, produtos, leilões, decks em markdown.
Salva em estrutura de diretórios por site.

Uso:
  source /tmp/crawl4ai-venv/bin/activate
  
  # Teste rápido (10 páginas)
  python3 crawl_liga.py --test
  
  # Crawl LigaLorcana completo (~5000 páginas)
  python3 crawl_liga.py --site lorcana --max-pages 5000
  
  # Crawl LigaPokemon completo (~15000 páginas)
  python3 crawl_liga.py --site pokemon --max-pages 15000
  
  # Ambos
  python3 crawl_liga.py --all --max-pages 6000
"""

import asyncio
import json
import os
import sys
import argparse
import time
from datetime import datetime
from urllib.parse import urlparse, urljoin

# Importa do venv
sys.path.insert(0, "/tmp/crawl4ai-venv/lib/python3.14/site-packages")
from crawl4ai import *

# ─── Config ──────────────────────────────────────────────────────────────

OUTPUT_DIR = os.path.expanduser("~/code/tcghub/scrapers/data")
os.makedirs(OUTPUT_DIR, exist_ok=True)

SITES = {
    "lorcana": {
        "name": "LigaLorcana",
        "start_url": "https://www.ligalorcana.com.br/",
        "domain": "ligalorcana.com.br",
        "max_pages_default": 5000,
        "exclude_patterns": [
            r"/b/", r"view=user", r"view=forum", r"logout", r"login", r"cadastre-se",
            r"view=logar", r"view=newuser", r"view=recuperar",
            r"\.(jpg|png|gif|svg|css|js|ico|woff|ttf)$",
        ],
    },
    "pokemon": {
        "name": "LigaPokemon",
        "start_url": "https://www.ligapokemon.com.br/",
        "domain": "ligapokemon.com.br",
        "max_pages_default": 15000,
        "exclude_patterns": [
            r"/b/", r"view=user", r"view=forum", r"logout", r"login", r"cadastre-se",
            r"view=logar", r"view=newuser", r"view=recuperar",
            r"\.(jpg|png|gif|svg|css|js|ico|woff|ttf)$",
        ],
    },
}


# ─── Crawl Engine ────────────────────────────────────────────────────────

async def crawl_site(site_key: str, max_pages: int = None, test_mode: bool = False):
    """Crawleia um site inteiro."""
    site = SITES[site_key]
    domain = site["domain"]
    start_url = site["start_url"]
    name = site["name"]

    if max_pages is None:
        max_pages = site["max_pages_default"]
    if test_mode:
        max_pages = 10

    # Diretório de saída
    site_dir = os.path.join(OUTPUT_DIR, site_key)
    pages_dir = os.path.join(site_dir, "pages")
    os.makedirs(pages_dir, exist_ok=True)

    print(f"\n{'='*60}")
    print(f"CRAWL: {name}")
    print(f"URL:  {start_url}")
    print(f"MAX:  {max_pages} páginas")
    print(f"OUT:  {site_dir}")
    print(f"{'='*60}")

    # Log do crawl
    log = {
        "site": site_key,
        "start_url": start_url,
        "max_pages": max_pages,
        "started_at": datetime.now().isoformat(),
        "pages": [],
        "results": {"success": 0, "failed": 0, "skipped": 0},
    }

    async with AsyncWebCrawler(
        verbose=True,
        # Anti-bot: stealth mode
        magic=True,
    ) as crawler:

        # Mapa de URLs já visitadas para evitar duplicatas
        visited = set()
        queue = [start_url]
        page_count = 0

        while queue and page_count < max_pages:
            url = queue.pop(0)
            if url in visited:
                continue
            visited.add(url)

            # Rate limiting: esperar 1-2s entre requests
            if page_count > 0:
                await asyncio.sleep(1.5)

            try:
                result = await crawler.arun(
                    url=url,
                    bypass_cache=True,
                    magic=True,
                    # Extrair links para continuar o crawl
                    exclude_external_links=True,
                    exclude_social_media_links=True,
                )

                if result.success and result.markdown:
                    # Salvar markdown
                    page_id = f"page_{page_count:05d}"
                    filename = f"{page_id}.md"
                    filepath = os.path.join(pages_dir, filename)
                    with open(filepath, "w") as f:
                        f.write(f"<!-- source: {url} -->\n")
                        f.write(f"<!-- crawled: {datetime.now().isoformat()} -->\n\n")
                        f.write(result.markdown)

                    # Salvar metadados
                    meta_path = os.path.join(pages_dir, f"{page_id}.meta.json")
                    with open(meta_path, "w") as f:
                        json.dump({
                            "id": page_id,
                            "url": url,
                            "status": result.status_code,
                            "content_length": len(result.markdown),
                            "crawled_at": datetime.now().isoformat(),
                            "success": True,
                        }, f, indent=2)

                    page_count += 1
                    log["results"]["success"] += 1
                    log["pages"].append({"url": url, "file": filename, "success": True})

                    # Extrair novos links da página para continuar o crawl
                    if hasattr(result, 'links') and result.links:
                        for link_url in result.links:
                            if domain in link_url and link_url not in visited:
                                queue.append(link_url)

                    print(f"  [{page_count}/{max_pages}] ✅ {url[:80]}... ({len(result.markdown)} chars)")

                else:
                    log["results"]["failed"] += 1
                    print(f"  ❌ Falha: {url[:80]}")

            except Exception as e:
                log["results"]["failed"] += 1
                print(f"  ❌ Erro: {url[:80]} — {str(e)[:80]}")

            # Salvar checkpoint a cada 100 páginas
            if page_count % 100 == 0 and page_count > 0:
                checkpoint(log, site_dir)
                print(f"\n  ⚡ Checkpoint: {page_count} páginas salvas")

    log["finished_at"] = datetime.now().isoformat()
    log["total_visited"] = len(visited)
    checkpoint(log, site_dir, final=True)

    print(f"\n{'='*60}")
    print(f"RESULTADO {name}:")
    print(f"  ✅ Sucesso: {log['results']['success']}")
    print(f"  ❌ Falhas:  {log['results']['failed']}")
    print(f"  🌐 Visitadas: {log['total_visited']}")
    print(f"  📁 Diretório: {site_dir}")
    print(f"{'='*60}")

    return log


def checkpoint(log, site_dir, final=False):
    """Salva checkpoint do crawl."""
    name = "crawl_complete.json" if final else "crawl_checkpoint.json"
    path = os.path.join(site_dir, name)
    with open(path, "w") as f:
        json.dump(log, f, indent=2)
    print(f"  💾 Checkpoint salvo: {path}")


def generate_index(site_key: str):
    """Gera um index.json consolidado das páginas crawleadas."""
    site_dir = os.path.join(OUTPUT_DIR, site_key)
    pages_dir = os.path.join(site_dir, "pages")

    if not os.path.exists(pages_dir):
        print(f"  Nada para indexar em {pages_dir}")
        return

    index = []
    for fname in sorted(os.listdir(pages_dir)):
        if fname.endswith(".meta.json"):
            with open(os.path.join(pages_dir, fname)) as f:
                data = json.load(f)
                index.append(data)

    with open(os.path.join(site_dir, "index.json"), "w") as f:
        json.dump(index, f, indent=2)

    print(f"  Index gerado: {len(index)} entradas")


# ─── Main ────────────────────────────────────────────────────────────────

async def main():
    parser = argparse.ArgumentParser(description="Crawl Liga sites com Crawl4AI")
    parser.add_argument("--site", choices=["lorcana", "pokemon"], help="Qual site crawlear")
    parser.add_argument("--all", action="store_true", help="Crawlear ambos")
    parser.add_argument("--max-pages", type=int, default=None, help="Máx páginas por site")
    parser.add_argument("--test", action="store_true", help="Modo teste (10 páginas)")
    parser.add_argument("--index-only", action="store_true", help="Só gerar index")

    args = parser.parse_args()

    if args.index_only:
        if args.site:
            generate_index(args.site)
        else:
            for key in SITES:
                generate_index(key)
        return

    sites_to_crawl = []
    if args.all:
        sites_to_crawl = list(SITES.keys())
    elif args.site:
        sites_to_crawl = [args.site]
    else:
        parser.print_help()
        return

    for key in sites_to_crawl:
        log = await crawl_site(key, max_pages=args.max_pages, test_mode=args.test)
        # Gerar index depois de cada crawl
        generate_index(key)


if __name__ == "__main__":
    asyncio.run(main())
