#!/usr/bin/env python3
"""Fill the instagram: field in _spaces/*.md by scraping each venue's website.

Run from the repo root:  python3 enrich_instagram.py
Re-runnable: skips files that already have a handle. Only the instagram line
is rewritten; the rest of each file is left byte-identical.

Requires:  pip install requests
"""
import os, re, sys, time
import requests

SPACES_DIR = "_spaces"
UA = {"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                    "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36"}

# instagram.com/<handle> — excludes shared posts/reels and meta pages
IG_RE = re.compile(
    r"instagram\.com/([A-Za-z0-9._]{2,30})/?(?:[\"'?#/ )]|$)", re.I)
NOT_HANDLES = {"p", "reel", "reels", "tv", "stories", "explore", "accounts",
               "share", "about", "developer", "legal", "directory", "web", "embed.js"}


def find_handle(html: str) -> str | None:
    counts: dict[str, int] = {}
    for m in IG_RE.finditer(html):
        h = m.group(1).rstrip(".")
        if h.lower() in NOT_HANDLES or h.lower().endswith(".js"):
            continue
        counts[h] = counts.get(h, 0) + 1
    if not counts:
        return None
    # most frequently linked handle on the page wins
    return max(counts, key=counts.get)


def fetch(url: str) -> str | None:
    for candidate in (url, url.replace("http://", "https://")):
        try:
            r = requests.get(candidate, headers=UA, timeout=20, allow_redirects=True)
            if r.ok and r.text:
                return r.text
        except requests.RequestException:
            continue
    return None


def main():
    found, already, missing, no_site = [], [], [], []
    files = sorted(f for f in os.listdir(SPACES_DIR) if f.endswith(".md"))
    for i, fn in enumerate(files, 1):
        path = os.path.join(SPACES_DIR, fn)
        with open(path, encoding="utf-8") as f:
            text = f.read()

        ig_m = re.search(r'^instagram:\s*"([^"]*)"\s*$', text, re.M)
        web_m = re.search(r'^website:\s*"([^"]*)"\s*$', text, re.M)

        if ig_m and ig_m.group(1).strip():
            already.append(fn)
            continue
        if not web_m or not web_m.group(1).strip():
            no_site.append(fn)
            continue
        if not ig_m:
            # no instagram line at all — insert one after the website line
            text = text.replace(web_m.group(0), web_m.group(0) + '\ninstagram: ""', 1)
            ig_m = re.search(r'^instagram:\s*"([^"]*)"\s*$', text, re.M)

        url = web_m.group(1).strip()
        print(f"[{i}/{len(files)}] {fn} -> {url}", flush=True)
        html = fetch(url)
        handle = find_handle(html) if html else None

        if handle:
            text = text.replace(ig_m.group(0), f'instagram: "{handle}"', 1)
            with open(path, "w", encoding="utf-8") as f:
                f.write(text)
            found.append((fn, handle))
            print(f"         @{handle}")
        else:
            missing.append(fn)
            print("         (none found)")
        time.sleep(0.5)  # be polite

    print("\n" + "=" * 60)
    print(f"Found:        {len(found)}")
    print(f"Already set:  {len(already)}")
    print(f"No handle:    {len(missing)}")
    print(f"No website:   {len(no_site)}")
    if missing:
        print("\nManual review needed (no IG link on site):")
        for fn in missing:
            print("  -", fn)
    if no_site:
        print("\nNo website in frontmatter:")
        for fn in no_site:
            print("  -", fn)


if __name__ == "__main__":
    if not os.path.isdir(SPACES_DIR):
        sys.exit("Run this from the repo root (where _spaces/ lives).")
    main()
