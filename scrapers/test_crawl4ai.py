#!/usr/bin/env python3
"""
Teste Crawl4AI — ligalorcana.com.br e ligapokemon.com.br
Testa se o stealth mode passa pelo Cloudflare + Turnstile.

Uso:
  source /tmp/crawl4ai-venv/bin/activate
  python3 test_crawl4ai.py
"""

import asyncio
import sys
import os
from crawl4ai import *

VENV_PYTHON = "/tmp/crawl4ai-venv/bin/python3"


async def test_single_page(url: str, name: str):
    """Testa scrape de uma página com stealth mode."""
    print(f"\n{'='*60}")
    print(f"TESTE: {name}")
    print(f"URL:  {url}")
    print(f"{'='*60}")

    async with AsyncWebCrawler() as crawler:
        result = await crawler.arun(
            url=url,
            bypass_cache=True,
            # Stealth mode — anti-bot
            magic=True,
            # Simular navegador real
            user_agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36",
        )

        success = result.success
        status_code = result.status_code
        content_len = len(result.markdown) if result.markdown else 0
        error = result.error_message if hasattr(result, 'error_message') else ''

        print(f"\n  ✅ Sucesso: {success}")
        print(f"  Status:   {status_code}")
        print(f"  Markdown: {content_len} chars")
        if error:
            print(f"  ⚠️ Erro:   {error[:200]}")

        if success and content_len > 100:
            print(f"\n  Preview (primeiros 500 chars):")
            print(f"  {result.markdown[:500]}")
            print(f"  ...")
            return True
        else:
            print(f"\n  ❌ Falha ou conteúdo vazio")
            return False


async def test_deep_crawl(start_url: str, name: str, max_pages: int = 20):
    """Testa crawl BFS com limite pequeno."""
    print(f"\n{'='*60}")
    print(f"CRAWL TESTE: {name}")
    print(f"URL:  {start_url}")
    print(f"MAX:  {max_pages} páginas")
    print(f"{'='*60}")

    async with AsyncWebCrawler() as crawler:
        result = await crawler.arun(
            url=start_url,
            bypass_cache=True,
            magic=True,
            deep_crawl=True,
            max_pages=max_pages,
            exclude_content_regex=r"(/b/|/decks/|/dks/|view=user|view=forum|logout|login|cadastre-se)",
        )

        pages = len(result.markdown) if hasattr(result, 'markdown') and result.markdown else 0
        print(f"\n  Páginas crawleadas: {pages}")
        print(f"  Sucesso: {result.success}")

        # Tentar extrair links descobertos
        if hasattr(result, 'links') and result.links:
            print(f"  Links descobertos: {len(result.links)}")
            for link in list(result.links)[:10]:
                print(f"    - {link}")

        return result.success


async def main():
    print("Crawl4AI Test Suite — Liga Sites")
    print(f"Versão Python: {sys.version}")
    print(f"Venv: {VENV_PYTHON}")
    print()

    # Fase 1: Teste de página única — homepage
    lorcana_ok = await test_single_page(
        "https://www.ligalorcana.com.br/",
        "LigaLorcana — Homepage"
    )

    pokemon_ok = await test_single_page(
        "https://www.ligapokemon.com.br/",
        "LigaPokemon — Homepage"
    )

    # Fase 2: Se passou Cloudflare, testar páginas internas
    if lorcana_ok:
        await test_single_page(
            "https://www.ligalorcana.com.br/?view=cards/search",
            "LigaLorcana — Busca de Cards"
        )

    if pokemon_ok:
        await test_single_page(
            "https://www.ligapokemon.com.br/?view=leilao/listar",
            "LigaPokemon — Leilões"
        )

    # Fase 3: Deep crawl teste (limitado)
    if lorcana_ok:
        await test_deep_crawl(
            "https://www.ligalorcana.com.br/",
            "LigaLorcana — Deep Crawl (teste)",
            max_pages=10
        )

    print(f"\n{'='*60}")
    print("RESUMO:")
    print(f"  Lorcana homepage: {'✅ OK' if lorcana_ok else '❌ FALHOU'}")
    print(f"  Pokémon homepage: {'✅ OK' if pokemon_ok else '❌ FALHOU'}")


if __name__ == "__main__":
    asyncio.run(main())
