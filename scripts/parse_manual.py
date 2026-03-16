#!/usr/bin/env python3
"""
parse_manual.py
Parseia apps/web/public/manual_onboarding.html e gera
apps/web/src/data/manual_onboarding_data.json com as seções estruturadas.

Uso: .venv/bin/python3 scripts/parse_manual.py
"""

import json
import os
import re
import sys
from bs4 import BeautifulSoup, Comment

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
HTML_PATH = os.path.join(ROOT, "apps", "web", "public", "manual_onboarding.html")
OUT_PATH  = os.path.join(ROOT, "apps", "web", "src", "data", "manual_onboarding_data.json")

# Cores canônicas por seção (extraídas do TOC do HTML)
SECTION_COLORS = {
    "sec1": "#141042",
    "sec2": "#3B82F6",
    "sec3": "#6366F1",
    "sec4": "#0891B2",
    "sec5": "#10B981",
    "sec6": "#E11D48",
    "sec7": "#D97706",
    "sec8": "#7C3AED",
    "sec9": "#0F766E",
}

# Ícones SVG path por seção
SECTION_ICONS = {
    "sec1": "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6",
    "sec2": "M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z",
    "sec3": "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
    "sec4": "M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9",
    "sec5": "M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z",
    "sec6": "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z",
    "sec7": "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
    "sec8": "M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
    "sec9": "M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
}

def clean_html(tag):
    """Remove comentários HTML e retorna o inner HTML limpo."""
    for comment in tag.find_all(string=lambda t: isinstance(t, Comment)):
        comment.extract()
    return str(tag)

def extract_title(sec):
    """Extrai título e subtítulo do bloco .st dentro da seção."""
    st = sec.find(class_="st")
    if st:
        h2 = st.find("h2")
        p  = st.find("p")
        title    = h2.get_text(strip=True) if h2 else ""
        subtitle = p.get_text(strip=True)  if p  else ""
        return title, subtitle
    # Fallback: primeiro h2
    h2 = sec.find("h2")
    return (h2.get_text(strip=True) if h2 else sec.get("id", ""), "")

def extract_subsections(sec):
    """Extrai sub-seções (.ss) como lista de dicts {title, html}."""
    subs = []
    for ss in sec.find_all(class_="ss", recursive=True):
        ss_t = ss.find(class_="ss-t")
        title = ss_t.get_text(strip=True) if ss_t else ""
        # Remove o elemento de título do conteúdo para não duplicar
        ss_copy = BeautifulSoup(str(ss), "html.parser")
        t_el = ss_copy.find(class_="ss-t")
        if t_el:
            t_el.decompose()
        subs.append({
            "title": title,
            "html": ss_copy.decode_contents().strip(),
        })
    return subs

def parse():
    with open(HTML_PATH, encoding="utf-8") as f:
        soup = BeautifulSoup(f, "html.parser")

    sections = []
    for sec in soup.find_all("div", class_="sec"):
        sec_id = sec.get("id", "")
        if not sec_id:
            continue

        title, subtitle = extract_title(sec)
        number = int(re.sub(r"\D", "", sec_id)) if re.search(r"\d", sec_id) else 0
        subsections = extract_subsections(sec)

        # Remove .ss dos filhos diretos para não duplicar no html principal
        # Remove também .sh (cabeçalho de seção) — já exibido na barra do modal
        sec_copy = BeautifulSoup(str(sec), "html.parser")
        for ss in sec_copy.find_all(class_="ss"):
            ss.decompose()
        for sh in sec_copy.find_all(class_="sh"):
            sh.decompose()

        # HTML completo = conteúdo principal + sub-seções inline
        full_html = sec_copy.decode_contents().strip()
        for sub in subsections:
            full_html += f'\n<div class="ss"><div class="ss-t"><span class="sdot"></span>{sub["title"]}</div>{sub["html"]}</div>'

        sections.append({
            "id": sec_id,
            "number": number,
            "title": title,
            "subtitle": subtitle,
            "color": SECTION_COLORS.get(sec_id, "#141042"),
            "icon": SECTION_ICONS.get(sec_id, ""),
            "html": full_html,
            "subsections": subsections,
        })

    # Metadados gerais extraídos da capa
    cover = soup.find("div", class_="cover")
    version_el = cover.find(class_="cver") if cover else None
    version = version_el.get_text(strip=True) if version_el else "v1.0"

    result = {
        "version": version,
        "totalSections": len(sections),
        "sections": sections,
    }

    os.makedirs(os.path.dirname(OUT_PATH), exist_ok=True)
    with open(OUT_PATH, "w", encoding="utf-8") as f:
        json.dump(result, f, ensure_ascii=False, indent=2)

    print(f"✅ {len(sections)} seções extraídas → {OUT_PATH}")
    for s in sections:
        subs = f" ({len(s['subsections'])} sub-seções)" if s["subsections"] else ""
        print(f"   {s['number']}. {s['title']}{subs}")

if __name__ == "__main__":
    try:
        parse()
    except FileNotFoundError:
        print(f"❌ Arquivo não encontrado: {HTML_PATH}", file=sys.stderr)
        sys.exit(1)
