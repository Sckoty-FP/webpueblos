from playwright.sync_api import sync_playwright
import time
import sys
import io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

PAGES = [
    ("home", "http://localhost:3000/alcocebre"),
    ("gastronomia", "http://localhost:3000/alcocebre/gastronomia"),
]

results = []

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)

    for name, url in PAGES:
        page = browser.new_page(viewport={"width": 1440, "height": 900})
        page.goto(url)
        page.wait_for_load_state("networkidle")

        # Screenshot inicial
        page.screenshot(path=f"/tmp/btn_{name}_initial.png", full_page=False)

        # Recopilar todos los botones y links clicables visibles
        clickables = page.locator("button, a[href]").all()
        print(f"\n=== {name.upper()} ({url}) ===")
        print(f"Total clicables encontrados: {len(clickables)}")

        errors = []
        ok = []

        for el in clickables:
            try:
                if not el.is_visible():
                    continue
                text = (el.inner_text() or "").strip()[:60]
                tag = el.evaluate("el => el.tagName")
                href = el.get_attribute("href") or ""

                # Filtrar links externos o de auth
                if href.startswith("http") and "localhost" not in href:
                    ok.append(f"  [EXTERNO] {tag} '{text}' → {href[:50]}")
                    continue
                if any(x in href for x in ["/auth/", "mailto:", "tel:"]):
                    ok.append(f"  [SKIP] {tag} '{text}' → {href[:50]}")
                    continue

                ok.append(f"  [OK] {tag} '{text}' href='{href[:50]}'")
            except Exception as e:
                errors.append(f"  [ERROR] {str(e)[:80]}")

        for line in ok[:40]:
            print(line)
        if errors:
            print(f"\n  ERRORES ({len(errors)}):")
            for e in errors[:10]:
                print(e)

        # Test hover en tarjetas
        cards = page.locator("a.group").all()
        print(f"\nTarjetas (.group): {len(cards)}")
        if cards:
            cards[0].hover()
            time.sleep(0.3)
            page.screenshot(path=f"/tmp/btn_{name}_hover_card.png", full_page=False)
            print("  Screenshot hover tarjeta tomado")

        # Test filtros en gastronomia
        if name == "gastronomia":
            # Click en checkbox "Abierto ahora"
            cb = page.locator("input[type=checkbox]").first
            if cb.is_visible():
                cb.check()
                time.sleep(0.3)
                page.screenshot(path=f"/tmp/btn_gastro_filter_check.png", full_page=False)
                print("  Screenshot filtro checkbox tomado")

            # Click botón Aplicar
            btn = page.locator("button", has_text="Aplicar")
            if btn.is_visible():
                btn.click()
                page.wait_for_load_state("networkidle")
                page.screenshot(path=f"/tmp/btn_gastro_filter_applied.png", full_page=False)
                print("  Screenshot filtro aplicado tomado")

        # Test nav links
        nav_links = page.locator("nav a, header a").all()
        print(f"\nNav links: {len(nav_links)}")
        for nl in nav_links:
            try:
                if nl.is_visible():
                    print(f"  {nl.inner_text().strip()[:30]} → {nl.get_attribute('href') or ''}")
            except:
                pass

        page.close()
        print(f"\nDone: {name}")

    browser.close()
    print("\n=== TEST COMPLETO ===")
