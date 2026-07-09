#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Produktfixaren prospect bot.

Finds Swedish small-business websites, estimates whether they may need simple
AI/text help, and writes a report with personalized outreach drafts.

It intentionally does not send email. Use the report to approve candidates
before creating Gmail drafts or sending anything.
"""

from __future__ import annotations

import argparse
import base64
import csv
import html
import json
import re
import time
from dataclasses import dataclass, field
from datetime import datetime
from html.parser import HTMLParser
from pathlib import Path
from typing import Iterable
from urllib.parse import parse_qs, quote_plus, unquote, urljoin, urlparse
from urllib.request import Request, urlopen


ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "prospekt"

DEFAULT_LOCATIONS = [
    "Växjö",
    "Alvesta",
    "Kalmar",
    "Jönköping",
    "Värnamo",
    "Ljungby",
    "Halmstad",
    "Göteborg",
    "Malmö",
    "Helsingborg",
    "Linköping",
    "Norrköping",
    "Örebro",
    "Västerås",
    "Uppsala",
    "Stockholm",
    "Sundsvall",
    "Umeå",
]

DEFAULT_SECTORS = [
    "butik",
    "cykelbutik",
    "blomsterbutik",
    "frisör",
    "salong",
    "café",
    "restaurang",
    "bageri",
    "verkstad",
    "byggfirma",
    "snickeri",
    "inredning",
    "second hand",
    "presentbutik",
    "event butik",
]

DIRECTORY_DOMAINS = {
    "facebook.com",
    "instagram.com",
    "linkedin.com",
    "youtube.com",
    "tiktok.com",
    "google.com",
    "maps.google.com",
    "hitta.se",
    "eniro.se",
    "allabolag.se",
    "merinfo.se",
    "ratsit.se",
    "reco.se",
    "bokadirekt.se",
    "tripadvisor.se",
    "tripadvisor.com",
    "wikipedia.org",
    "vaxjocity.com",
    "visitstockholm.com",
    "visitsmaland.se",
}

EMAIL_RE = re.compile(r"[A-Z0-9._%+\-]+@[A-Z0-9.\-]+\.[A-Z]{2,}", re.I)
COPYRIGHT_RE = re.compile(r"(?:©|copyright|\(c\))\s*(20[0-2][0-9])", re.I)
TAG_RE = re.compile(r"<[^>]+>")
SPACE_RE = re.compile(r"\s+")


@dataclass
class Candidate:
    company: str
    url: str
    domain: str
    title: str = ""
    email: str = ""
    location: str = ""
    sector: str = ""
    score: int = 0
    reasons: list[str] = field(default_factory=list)
    draft_subject: str = "Förslag på tydligare texter och AI-hjälp"
    draft_body: str = ""


class LinkParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.links: list[tuple[str, str]] = []
        self._href: str | None = None
        self._text: list[str] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        if tag.lower() == "a":
            attr = dict(attrs)
            self._href = attr.get("href")
            self._text = []

    def handle_data(self, data: str) -> None:
        if self._href:
            self._text.append(data)

    def handle_endtag(self, tag: str) -> None:
        if tag.lower() == "a" and self._href:
            text = html.unescape(" ".join(self._text)).strip()
            self.links.append((self._href, text))
            self._href = None
            self._text = []


def fetch(url: str, timeout: int = 15) -> str:
    req = Request(
        url,
        headers={
            "User-Agent": "Mozilla/5.0 ProduktfixarenProspektBot/1.0",
            "Accept-Language": "sv-SE,sv;q=0.9,en;q=0.5",
        },
    )
    with urlopen(req, timeout=timeout) as response:
        raw = response.read(800_000)
        charset = response.headers.get_content_charset() or "utf-8"
        return raw.decode(charset, "ignore")


def clean_text(raw_html: str) -> str:
    raw_html = re.sub(r"<(script|style).*?</\1>", " ", raw_html, flags=re.I | re.S)
    text = TAG_RE.sub(" ", raw_html)
    return SPACE_RE.sub(" ", html.unescape(text)).strip()


def domain_of(url: str) -> str:
    host = urlparse(url).netloc.lower()
    if host.startswith("www."):
        host = host[4:]
    return host


def base_domain(host: str) -> str:
    parts = host.split(".")
    if len(parts) >= 2:
        return ".".join(parts[-2:])
    return host


def is_directory_or_social(url: str) -> bool:
    host = domain_of(url)
    return base_domain(host) in DIRECTORY_DOMAINS or host in DIRECTORY_DOMAINS


def unwrap_ddg_url(href: str) -> str | None:
    if href.startswith("//"):
        href = "https:" + href
    if href.startswith("/l/"):
        parsed = urlparse(href)
        params = parse_qs(parsed.query)
        if "uddg" in params:
            return unquote(params["uddg"][0])
    if "duckduckgo.com/l/" in href:
        params = parse_qs(urlparse(href).query)
        if "uddg" in params:
            return unquote(params["uddg"][0])
    if href.startswith("http://") or href.startswith("https://"):
        return href
    return None


def unwrap_bing_url(href: str) -> str:
    parsed = urlparse(href)
    if domain_of(href) != "bing.com" or not parsed.path.startswith("/ck/"):
        return href
    params = parse_qs(parsed.query)
    encoded = params.get("u", [""])[0]
    if not encoded:
        return href
    if encoded.startswith("a1"):
        encoded = encoded[2:]
    padding = "=" * (-len(encoded) % 4)
    try:
        decoded = base64.urlsafe_b64decode(encoded + padding).decode("utf-8", "ignore")
    except Exception:
        return href
    return decoded if decoded.startswith(("http://", "https://")) else href


def search_duckduckgo(query: str, limit: int) -> list[tuple[str, str]]:
    url = f"https://lite.duckduckgo.com/lite/?q={quote_plus(query)}"
    page = fetch(url)
    parser = LinkParser()
    parser.feed(page)
    results: list[tuple[str, str]] = []
    seen: set[str] = set()
    for href, text in parser.links:
        target = unwrap_ddg_url(href)
        if not target or is_directory_or_social(target):
            continue
        host = domain_of(target)
        if not host or host in seen:
            continue
        seen.add(host)
        results.append((target, text))
        if len(results) >= limit:
            break
    return results


def search_bing(query: str, limit: int) -> list[tuple[str, str]]:
    url = f"https://www.bing.com/search?q={quote_plus(query)}"
    page = fetch(url)
    results: list[tuple[str, str]] = []
    seen: set[str] = set()
    for match in re.finditer(
        r'<li class="b_algo"[\s\S]*?<h2[^>]*>\s*<a[^>]+href="([^"]+)"[^>]*>([\s\S]*?)</a>',
        page,
        flags=re.I,
    ):
        target = unwrap_bing_url(html.unescape(match.group(1)))
        title = clean_text(match.group(2))
        if not target.startswith(("http://", "https://")):
            continue
        if is_directory_or_social(target):
            continue
        host = domain_of(target)
        if not host or host in seen:
            continue
        seen.add(host)
        results.append((target, title))
        if len(results) >= limit:
            break
    return results


def search_web(query: str, limit: int) -> list[tuple[str, str]]:
    try:
        results = search_bing(query, limit)
        if results:
            return results
    except Exception:
        pass
    try:
        return search_duckduckgo(query, limit)
    except Exception:
        return []


def find_title(raw_html: str) -> str:
    match = re.search(r"<title[^>]*>(.*?)</title>", raw_html, flags=re.I | re.S)
    if not match:
        return ""
    return SPACE_RE.sub(" ", html.unescape(match.group(1))).strip()


def find_meta_description(raw_html: str) -> str:
    match = re.search(
        r'<meta[^>]+name=["\']description["\'][^>]+content=["\'](.*?)["\']',
        raw_html,
        flags=re.I | re.S,
    )
    if not match:
        match = re.search(
            r'<meta[^>]+content=["\'](.*?)["\'][^>]+name=["\']description["\']',
            raw_html,
            flags=re.I | re.S,
        )
    if not match:
        return ""
    return SPACE_RE.sub(" ", html.unescape(match.group(1))).strip()


def extract_emails(raw_html: str, text: str) -> list[str]:
    found = set(EMAIL_RE.findall(html.unescape(raw_html + " " + text)))
    return sorted(e for e in found if not e.lower().endswith((".png", ".jpg", ".webp")))


def contact_links(base_url: str, raw_html: str) -> list[str]:
    parser = LinkParser()
    parser.feed(raw_html)
    out: list[str] = []
    for href, text in parser.links:
        label = f"{href} {text}".lower()
        if any(key in label for key in ["kontakt", "contact", "om oss", "about"]):
            out.append(urljoin(base_url, href))
    return out[:3]


def guess_company(title: str, domain: str) -> str:
    if title:
        title = re.split(r"\s[|\-–]\s", title)[0].strip()
        if 2 <= len(title) <= 80:
            return title
    return domain.split(".")[0].replace("-", " ").title()


def score_site(url: str, raw_html: str, text: str, emails: list[str]) -> tuple[int, list[str]]:
    reasons: list[str] = []
    score = 0
    words = len(text.split())
    meta = find_meta_description(raw_html)
    lower = text.lower()

    if emails:
        score += 25
        reasons.append("hittad e-post")

    if words < 450:
        score += 20
        reasons.append("väldigt lite text på startsidan")
    elif words < 900:
        score += 12
        reasons.append("ganska tunn startsida")

    if not meta or len(meta) < 60:
        score += 12
        reasons.append("svag eller saknad metabeskrivning")

    if not url.startswith("https://"):
        score += 8
        reasons.append("sidan använder inte https i träffen")

    cta_words = ["kontakta", "boka", "beställ", "köp", "offert", "skicka", "ring", "maila"]
    if not any(word in lower for word in cta_words):
        score += 12
        reasons.append("ingen tydlig uppmaning att kontakta eller köpa")

    sales_words = ["produkt", "butik", "erbjudande", "kampanj", "sortiment", "tjänst", "pris"]
    if any(word in lower for word in sales_words):
        score += 8
        reasons.append("har produkter/tjänster där bättre text kan hjälpa")

    old_years = [int(y) for y in COPYRIGHT_RE.findall(raw_html)]
    if old_years and max(old_years) <= 2023:
        score += 10
        reasons.append(f"gammal copyright ({max(old_years)})")

    if any(key in lower for key in ["under konstruktion", "kommer snart", "lorem ipsum"]):
        score += 25
        reasons.append("tydlig signal att sidan behöver arbete")

    return score, reasons


def make_draft(candidate: Candidate) -> str:
    reason_line = ""
    if candidate.reasons:
        reason_line = f" Jag såg särskilt att det kan finnas möjlighet kring {candidate.reasons[0]}."

    return f"""Hej!

Jag heter Daniel och driver Produktfixaren. Jag hjälper småföretag att använda AI på ett praktiskt sätt, till exempel för produkttexter, kampanjtexter, kundmail, annonser och enklare arbetsflöden.

Jag hittade {candidate.company} när jag gick igenom lokala företag.{reason_line}

För att göra det enkelt kan jag ta fram 3 konkreta förbättringsförslag som ett litet test. Det kan vara bättre text till en produkt/tjänst, en kort annons eller några AI-mallar ni kan använda själva.

Här är min sida:
https://produktfixaren-daniel.netlify.app/

Om det låter intressant kan jag skicka ett enkelt exempel.

Om det inte är relevant behöver ni inte svara, då kontaktar jag er inte igen.

Vanliga hälsningar,
Daniel
"""


def inspect_site(url: str, location: str, sector: str) -> Candidate | None:
    try:
        raw = fetch(url)
    except Exception:
        return None

    text = clean_text(raw)
    emails = extract_emails(raw, text)

    if not emails:
        for link in contact_links(url, raw):
            try:
                contact_raw = fetch(link)
            except Exception:
                continue
            contact_text = clean_text(contact_raw)
            emails = extract_emails(contact_raw, contact_text)
            if emails:
                raw = raw + "\n" + contact_raw
                text = text + " " + contact_text
                break
            time.sleep(0.5)

    title = find_title(raw)
    domain = domain_of(url)
    score, reasons = score_site(url, raw, text, emails)
    candidate = Candidate(
        company=guess_company(title, domain),
        url=url,
        domain=domain,
        title=title,
        email=emails[0] if emails else "",
        location=location,
        sector=sector,
        score=score,
        reasons=reasons,
    )
    candidate.draft_body = make_draft(candidate)
    return candidate


def write_outputs(candidates: list[Candidate]) -> None:
    OUT_DIR.mkdir(exist_ok=True)
    csv_path = OUT_DIR / "kandidater.csv"
    md_path = OUT_DIR / "rapport.md"
    json_path = OUT_DIR / "kandidater.json"

    with csv_path.open("w", newline="", encoding="utf-8-sig") as f:
        writer = csv.DictWriter(
            f,
            fieldnames=[
                "score",
                "company",
                "email",
                "url",
                "location",
                "sector",
                "reasons",
            ],
        )
        writer.writeheader()
        for c in candidates:
            writer.writerow(
                {
                    "score": c.score,
                    "company": c.company,
                    "email": c.email,
                    "url": c.url,
                    "location": c.location,
                    "sector": c.sector,
                    "reasons": "; ".join(c.reasons),
                }
            )

    with json_path.open("w", encoding="utf-8") as f:
        json.dump([c.__dict__ for c in candidates], f, ensure_ascii=False, indent=2)

    lines = [
        "# Prospektbot rapport",
        "",
        f"Skapad: {datetime.now().strftime('%Y-%m-%d %H:%M')}",
        "",
        "Botten har inte skickat några mail. Den har bara hittat kandidater och skrivit utkast.",
        "",
    ]
    for i, c in enumerate(candidates, start=1):
        lines.extend(
            [
                f"## {i}. {c.company}",
                "",
                f"- Poäng: {c.score}",
                f"- E-post: {c.email or 'Ingen e-post hittad'}",
                f"- Hemsida: {c.url}",
                f"- Plats/bransch: {c.location} / {c.sector}",
                f"- Varför kandidat: {', '.join(c.reasons) if c.reasons else 'svaga signaler'}",
                "",
                "### Mailutkast",
                "",
                f"Ämne: {c.draft_subject}",
                "",
                c.draft_body,
                "---",
                "",
            ]
        )
    md_path.write_text("\n".join(lines), encoding="utf-8")


def unique_candidates(candidates: Iterable[Candidate]) -> list[Candidate]:
    out: list[Candidate] = []
    seen: set[str] = set()
    for c in sorted(candidates, key=lambda item: item.score, reverse=True):
        if c.domain in seen:
            continue
        seen.add(c.domain)
        out.append(c)
    return out


def parse_list(value: str | None, fallback: list[str]) -> list[str]:
    if not value:
        return fallback
    return [part.strip() for part in value.split(",") if part.strip()]


def main() -> int:
    parser = argparse.ArgumentParser(description="Find Swedish prospects for Produktfixaren.")
    parser.add_argument("--max", type=int, default=20, help="Maximum candidates in final report.")
    parser.add_argument("--per-search", type=int, default=4, help="Results to inspect per search query.")
    parser.add_argument("--locations", type=str, help="Comma-separated locations. Default: Sweden-wide city list.")
    parser.add_argument("--sectors", type=str, help="Comma-separated sectors. Default: practical small-business sectors.")
    parser.add_argument("--min-score", type=int, default=25, help="Minimum score to include.")
    args = parser.parse_args()

    locations = parse_list(args.locations, DEFAULT_LOCATIONS)
    sectors = parse_list(args.sectors, DEFAULT_SECTORS)
    found: list[Candidate] = []
    inspected_domains: set[str] = set()

    for location in locations:
        for sector in sectors:
            if len(found) >= args.max * 3:
                break
            query = f'site:.se "{sector}" "{location}" kontakt'
            print(f"Soker: {query}")
            results = search_web(query, args.per_search)
            if not results:
                print("  Inga sökresultat eller tillfälligt blockerad sökning.")
                time.sleep(1.5)
                continue

            for url, _title in results:
                domain = domain_of(url)
                if domain in inspected_domains:
                    continue
                inspected_domains.add(domain)
                print(f"  Kollar: {domain}")
                candidate = inspect_site(url, location, sector)
                if candidate and candidate.score >= args.min_score:
                    found.append(candidate)
                    print(f"    Kandidat: {candidate.company} ({candidate.score})")
                time.sleep(0.8)
            time.sleep(1.5)
        if len(found) >= args.max * 3:
            break

    candidates = unique_candidates(found)[: args.max]
    write_outputs(candidates)
    print()
    print(f"Klar. {len(candidates)} kandidater sparade i: {OUT_DIR}")
    print(f"Rapport: {OUT_DIR / 'rapport.md'}")
    print(f"CSV: {OUT_DIR / 'kandidater.csv'}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
