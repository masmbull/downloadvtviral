"""Stdlib self-check for host detection and the Videy resolver.
Run: python test_resolvers.py  (no network required)
"""

from main import detect_platform, resolve_videy, _is_public_http_url, PLATFORM_HOSTS


def check_detection():
    cases = {
        "https://www.youtube.com/watch?v=x": "youtube",
        "https://youtu.be/x": "youtube",
        "https://vm.tiktok.com/x": "tiktok",
        "https://www.instagram.com/reel/x": "instagram",
        "https://x.com/u/status/1": "twitter",
        "https://fb.watch/x": "facebook",
        "https://www.reddit.com/r/x": "reddit",
        "https://videy.co/v?id=abc123": "videy",
        "https://vidara.to/e/WJ0DOTFNCx4cg": "vidara",
        "https://dood.to/e/x": "doodstream",
        "https://d000d.com/e/x": "doodstream",
        "https://streamtape.com/v/x": "streamtape",
        "https://example.com/video": "unknown",
    }
    for url, expected in cases.items():
        got = detect_platform(url)
        assert got == expected, f"{url}: expected {expected}, got {got}"
    print(f"ok: detect_platform ({len(cases)} cases)")


def check_videy():
    r = resolve_videy("https://videy.co/v?id=abc123")
    assert r is not None
    assert r["downloads"][0]["url"] == "https://cdn.videy.co/abc123.mp4", r
    assert r["platform"] == "videy"

    assert resolve_videy("https://videy.co/") is None
    print("ok: resolve_videy")


def check_host_lists_are_unique():
    seen = {}
    for platform, hosts in PLATFORM_HOSTS.items():
        for h in hosts:
            assert h not in seen, f"{h} in both {seen[h]} and {platform}"
            seen[h] = platform
    print(f"ok: host lists unique ({len(seen)} hosts)")


def check_url_safety():
    blocked = [
        "file:///etc/passwd",
        "file:///x.m3u8",
        "http://localhost:8000/health",
        "http://127.0.0.1/",
        "http://169.254.169.254/latest/meta-data/",
        "http://10.0.0.1/",
        "http://192.168.1.1/",
        "http://172.16.0.1/",
        "http://[::1]/",
        "gopher://x/",
        "ftp://example.com/x",
        "",
    ]
    for u in blocked:
        assert not _is_public_http_url(u), f"should be blocked: {u}"

    assert _is_public_http_url("http://8.8.8.8/x")  # public literal IP, no DNS needed
    assert _is_public_http_url("https://[2001:4860:4860::8888]/x")
    print(f"ok: _is_public_http_url ({len(blocked)} blocked cases)")


if __name__ == "__main__":
    check_detection()
    check_videy()
    check_host_lists_are_unique()
    check_url_safety()
    print("all checks passed")