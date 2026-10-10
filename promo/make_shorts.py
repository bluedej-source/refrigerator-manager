"""냉장고 안심 매니저 홍보 쇼츠 (1080x1920, 30fps) 생성 스크립트."""
import math
import os
import subprocess
import sys
import wave
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

HERE = Path(__file__).parent
# Pretendard 폰트(github.com/orioncactus/pretendard)의 public/static 폴더 경로
FONT_DIR = Path(os.environ.get("PRETENDARD_DIR", HERE / "fonts/public/static"))
EMOJI_FONT = "/usr/share/fonts/truetype/noto/NotoColorEmoji.ttf"
CHEF = Path(sys.argv[1]) if len(sys.argv) > 1 else None
OUT = Path(sys.argv[2]) if len(sys.argv) > 2 else HERE / "shorts.mp4"

W, H, FPS = 1080, 1920, 30

# 장면: (이름, 길이초)
SCENES = [
    ("hook", 3.0),
    ("problem", 3.0),
    ("scan", 4.5),
    ("expiry", 4.5),
    ("notify", 4.0),
    ("report", 4.0),
    ("cta", 4.0),
]
TOTAL = sum(d for _, d in SCENES)

_fonts = {}


def font(weight, size):
    key = (weight, size)
    if key not in _fonts:
        _fonts[key] = ImageFont.truetype(str(FONT_DIR / f"Pretendard-{weight}.otf"), size)
    return _fonts[key]


_emoji_cache = {}


def emoji(ch, size):
    key = (ch, size)
    if key not in _emoji_cache:
        f = ImageFont.truetype(EMOJI_FONT, 109)
        im = Image.new("RGBA", (140, 140), (0, 0, 0, 0))
        ImageDraw.Draw(im).text((70, 70), ch, font=f, embedded_color=True, anchor="mm")
        im = im.crop(im.getbbox()).resize((size, size), Image.LANCZOS)
        _emoji_cache[key] = im
    return _emoji_cache[key]


# ---------- easing ----------
def clamp(x, a=0.0, b=1.0):
    return max(a, min(b, x))


def ease_out(x):
    x = clamp(x)
    return 1 - (1 - x) ** 3


def ease_back(x):
    x = clamp(x)
    c1, c3 = 1.70158, 2.70158
    return 1 + c3 * (x - 1) ** 3 + c1 * (x - 1) ** 2


def prog(t, start, dur):
    return clamp((t - start) / dur)


# ---------- drawing helpers ----------
def gradient(top, bottom):
    arr = np.linspace(0, 1, H)[:, None]
    top, bottom = np.array(top), np.array(bottom)
    col = (top * (1 - arr) + bottom * arr).astype(np.uint8)
    img = np.repeat(col[:, None, :], W, axis=1)
    return Image.fromarray(img, "RGB").convert("RGBA")


BG = {
    "hook": gradient((255, 236, 236), (255, 205, 205)),
    "problem": gradient((240, 244, 255), (214, 224, 255)),
    "scan": gradient((232, 250, 242), (200, 238, 222)),
    "expiry": gradient((255, 250, 235), (255, 236, 200)),
    "notify": gradient((236, 244, 255), (205, 225, 255)),
    "report": gradient((236, 252, 240), (200, 240, 214)),
    "cta": gradient((34, 160, 110), (16, 110, 80)),
}

INK = (28, 33, 45)
SUB = (90, 98, 115)
GREEN = (34, 160, 110)
RED = (232, 72, 72)
YELLOW = (240, 170, 30)


def text_center(img, y, s, f, fill=INK, alpha=1.0, dy=0, stroke=0, stroke_fill=None):
    if alpha <= 0:
        return
    layer = Image.new("RGBA", img.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    d.text((W // 2, y + dy), s, font=f, fill=fill + (255,), anchor="mm",
           stroke_width=stroke, stroke_fill=stroke_fill)
    if alpha < 1:
        a = layer.getchannel("A").point(lambda v: int(v * alpha))
        layer.putalpha(a)
    img.alpha_composite(layer)


def shadow_card(img, box, radius=36, fill=(255, 255, 255), alpha=1.0, shadow=True):
    x0, y0, x1, y1 = [int(v) for v in box]
    layer = Image.new("RGBA", img.size, (0, 0, 0, 0))
    if shadow:
        sh = Image.new("RGBA", img.size, (0, 0, 0, 0))
        ImageDraw.Draw(sh).rounded_rectangle((x0, y0 + 14, x1, y1 + 14), radius,
                                             fill=(0, 0, 0, int(45 * alpha)))
        sh = sh.filter(ImageFilter.GaussianBlur(18))
        layer.alpha_composite(sh)
    ImageDraw.Draw(layer).rounded_rectangle((x0, y0, x1, y1), radius,
                                            fill=fill + (int(255 * alpha),))
    img.alpha_composite(layer)


def paste_emoji(img, ch, cx, cy, size, alpha=1.0):
    e = emoji(ch, size)
    if alpha < 1:
        e = e.copy()
        e.putalpha(e.getchannel("A").point(lambda v: int(v * alpha)))
    img.alpha_composite(e, (int(cx - size / 2), int(cy - size / 2)))


def pill(img, cx, cy, label, color, f):
    d = ImageDraw.Draw(img)
    w = d.textlength(label, font=f) + 44
    h = f.size + 24
    d.rounded_rectangle((cx - w / 2, cy - h / 2, cx + w / 2, cy + h / 2), h / 2, fill=color + (255,))
    d.text((cx, cy), label, font=f, fill=(255, 255, 255, 255), anchor="mm")


def caption(img, t, dur, title, sub=None, y=330):
    """장면 상단 큰 자막 (튀어나오며 등장)."""
    p = ease_back(prog(t, 0.05, 0.45))
    a = clamp(prog(t, 0.05, 0.3))
    text_center(img, y, title, font("Black", 92), alpha=a, dy=(1 - p) * 60)
    if sub:
        a2 = clamp(prog(t, 0.35, 0.35))
        text_center(img, y + 110, sub, font("Medium", 50), fill=SUB, alpha=a2, dy=(1 - ease_out(prog(t, 0.35, 0.4))) * 30)


def food_row(img, x0, y, w, emo, name, sub, badge=None, badge_color=None, alpha=1.0):
    shadow_card(img, (x0, y, x0 + w, y + 150), radius=32, alpha=alpha)
    if alpha < 0.05:
        return
    paste_emoji(img, emo, x0 + 85, y + 75, 84, alpha)
    d = ImageDraw.Draw(img)
    a = int(255 * alpha)
    d.text((x0 + 150, y + 52), name, font=font("Bold", 50), fill=INK + (a,), anchor="lm")
    d.text((x0 + 150, y + 108), sub, font=font("Medium", 34), fill=SUB + (a,), anchor="lm")
    if badge and alpha > 0.5:
        pill(img, x0 + w - 110, y + 75, badge, badge_color, font("Bold", 36))


# ---------- scenes ----------
def scene_hook(img, t, dur):
    # 흔들리는 우유 + 질문
    shake = math.sin(t * 28) * 10 * (1 - prog(t, 0.6, 0.8))
    s = ease_back(prog(t, 0.0, 0.5))
    paste_emoji(img, "🥛", W / 2 + shake, 900, max(1, int(380 * s)))
    paste_emoji(img, "🗑️", W / 2 + 230, 1080, max(1, int(170 * ease_back(prog(t, 0.9, 0.4)))))
    caption(img, t, dur, "냉장고 속 우유,", None, y=420)
    a = clamp(prog(t, 0.5, 0.3))
    text_center(img, 540, "또 버렸나요?", font("Black", 110), fill=RED, alpha=a,
                dy=(1 - ease_back(prog(t, 0.5, 0.45))) * 50)
    a3 = clamp(prog(t, 1.4, 0.3))
    text_center(img, 1380, "유통기한 지난 줄 몰랐다면…", font("Bold", 56), fill=SUB, alpha=a3)


def scene_problem(img, t, dur):
    caption(img, t, dur, "기억은 한계가 있어요", "뭘 언제 샀는지, 다 외울 순 없잖아요")
    items = [("🥚", -260, 820), ("🧀", 0, 760), ("🥬", 260, 840), ("🍖", -150, 1080), ("🍓", 170, 1100), ("🥫", 0, 1300)]
    for i, (e, dx, y) in enumerate(items):
        p = ease_back(prog(t, 0.3 + i * 0.12, 0.4))
        bob = math.sin(t * 3 + i) * 12
        paste_emoji(img, e, W / 2 + dx, y + bob, max(1, int(170 * p)))
    # 물음표
    for i, (dx, y) in enumerate([(-330, 700), (330, 980), (-320, 1250)]):
        a = clamp(prog(t, 1.2 + i * 0.15, 0.3))
        if a:
            # text_center는 가운데 정렬이므로 x 이동용으로 별도 처리
            pass
    for i, (dx, y) in enumerate([(-360, 720), (360, 980), (-340, 1290)]):
        a = clamp(prog(t, 1.2 + i * 0.15, 0.3))
        if a:
            d = ImageDraw.Draw(img)
            d.text((W / 2 + dx, y), "?", font=font("Black", 130), fill=(120, 140, 220, int(255 * a)), anchor="mm")


def phone(img, top, alpha=1.0):
    x0, x1 = 150, W - 150
    shadow_card(img, (x0, top, x1, top + 1180), radius=70, fill=(30, 33, 40), alpha=alpha)
    shadow_card(img, (x0 + 22, top + 22, x1 - 22, top + 1158), radius=52, fill=(246, 248, 250), alpha=alpha, shadow=False)
    return x0 + 22, top + 22, x1 - 22


def scene_scan(img, t, dur):
    caption(img, t, dur, "영수증 한 장이면 끝", "AI가 식품을 자동으로 등록해요", y=300)
    rise = (1 - ease_out(prog(t, 0.2, 0.6))) * 500
    px0, py0, px1 = phone(img, 560 + rise)
    # 영수증
    rp = prog(t, 0.6, 0.5)
    if rp > 0:
        rx0, rx1 = px0 + 90, px1 - 90
        ry0 = py0 + 60
        shadow_card(img, (rx0, ry0, rx1, ry0 + 420), radius=12, alpha=clamp(rp * 2))
        d = ImageDraw.Draw(img)
        d.text(((rx0 + rx1) / 2, ry0 + 50), "RECEIPT", font=font("Black", 40), fill=INK + (255,), anchor="mm")
        lines = ["우유 1L ........ 2,980", "계란 10구 ...... 5,480", "두부 ............ 1,500", "삼겹살 500g ... 12,900"]
        for i, ln in enumerate(lines):
            d.text((rx0 + 40, ry0 + 120 + i * 62), ln, font=font("Medium", 34), fill=SUB + (255,), anchor="lm")
        # 스캔 라인
        sp = prog(t, 1.1, 1.0)
        if 0 < sp < 1:
            yy = ry0 + 20 + sp * 380
            glow = Image.new("RGBA", img.size, (0, 0, 0, 0))
            ImageDraw.Draw(glow).rectangle((rx0 - 10, yy - 6, rx1 + 10, yy + 6), fill=GREEN + (230,))
            glow = glow.filter(ImageFilter.GaussianBlur(6))
            img.alpha_composite(glow)
            ImageDraw.Draw(img).rectangle((rx0 - 10, yy - 3, rx1 + 10, yy + 3), fill=GREEN + (255,))
        if 1.1 < t < 2.2:
            dots = "." * (int(t * 4) % 4)
            d.text(((px0 + px1) / 2, ry0 + 470), "AI가 영수증을 분석하는 중" + dots,
                   font=font("Bold", 36), fill=GREEN + (255,), anchor="mm")
    foods = [("🥛", "서울우유 1L", "냉장 · 7일 남음"), ("🥚", "계란 10구", "냉장 · 14일 남음"),
             ("🧈", "두부", "냉장 · 3일 남음"), ("🥓", "삼겹살 500g", "냉동 · 30일 남음")]
    for i, (e, n, s) in enumerate(foods):
        p = ease_out(prog(t, 2.2 + i * 0.25, 0.4))
        if p > 0:
            food_row(img, px0 + 30 + (1 - p) * 300, py0 + 560 + i * 135, px1 - px0 - 60, e, n, s,
                     alpha=p) if False else None
    # 공간이 좁아 행 높이를 줄여 다시 그림
    for i, (e, n, s) in enumerate(foods):
        p = ease_out(prog(t, 2.2 + i * 0.25, 0.4))
        if p <= 0:
            continue
        x = px0 + 30 + (1 - p) * 300
        y = py0 + 560 + i * 140
        w = px1 - px0 - 60
        shadow_card(img, (x, y, x + w, y + 120), radius=28, alpha=p)
        paste_emoji(img, e, x + 70, y + 60, 70, p)
        d = ImageDraw.Draw(img)
        d.text((x + 130, y + 42), n, font=font("Bold", 42), fill=INK + (int(255 * p),), anchor="lm")
        d.text((x + 130, y + 88), s, font=font("Medium", 30), fill=SUB + (int(255 * p),), anchor="lm")
        ck = ease_back(prog(t, 2.5 + i * 0.25, 0.3))
        if ck > 0:
            r = 30 * ck
            cx, cy = x + w - 60, y + 60
            d.ellipse((cx - r, cy - r, cx + r, cy + r), fill=GREEN + (255,))
            if ck > 0.6:
                d.line([(cx - 13, cy), (cx - 3, cy + 11), (cx + 15, cy - 11)], fill=(255, 255, 255, 255), width=7)


def scene_expiry(img, t, dur):
    caption(img, t, dur, "유통기한, 색으로 한눈에", "급한 것부터 먼저 보여줘요")
    rows = [("🧈", "두부", "오늘 마감", "위험", RED),
            ("🥛", "서울우유 1L", "2일 남음", "주의", YELLOW),
            ("🥬", "상추", "3일 남음", "주의", YELLOW),
            ("🥚", "계란 10구", "14일 남음", "신선", GREEN)]
    for i, (e, n, s, b, c) in enumerate(rows):
        p = ease_out(prog(t, 0.4 + i * 0.2, 0.45))
        if p <= 0:
            continue
        x0 = 90 + (1 - p) * -400
        y = 640 + i * 200
        food_row(img, x0, y, W - 180, e, n, s, b, c, alpha=p)
    # 위험 카드 펄스
    if t > 1.6:
        pulse = (math.sin((t - 1.6) * 6) + 1) / 2
        layer = Image.new("RGBA", img.size, (0, 0, 0, 0))
        ImageDraw.Draw(layer).rounded_rectangle((90 - 8, 640 - 8, W - 90 + 8, 640 + 158), 38,
                                                outline=RED + (int(120 + 135 * pulse),), width=6)
        img.alpha_composite(layer)
    a = clamp(prog(t, 2.4, 0.4))
    text_center(img, 1520, "🔴 위험   🟡 주의   🟢 신선", font("Bold", 50), alpha=0) if False else None
    if a:
        for j, (lbl, c) in enumerate([("위험", RED), ("주의", YELLOW), ("신선", GREEN)]):
            cx = W / 2 + (j - 1) * 260
            d = ImageDraw.Draw(img)
            d.ellipse((cx - 70, 1500, cx - 40, 1530), fill=c + (int(255 * a),))
            d.text((cx - 25, 1515), lbl, font=font("Bold", 48), fill=INK + (int(255 * a),), anchor="lm")


def scene_notify(img, t, dur):
    caption(img, t, dur, "매일 아침 9시 알림", "오늘 먹어야 할 식품을 알려줘요", y=300)
    # 잠금화면 느낌
    shadow_card(img, (150, 580, W - 150, 1700), radius=70, fill=(30, 33, 40))
    lock = Image.new("RGBA", img.size, (0, 0, 0, 0))
    ld = ImageDraw.Draw(lock)
    ld.rounded_rectangle((172, 602, W - 172, 1678), 52, fill=(52, 70, 110, 255))
    img.alpha_composite(lock)
    d = ImageDraw.Draw(img)
    d.text((W / 2, 760), "9:00", font=font("Bold", 150), fill=(255, 255, 255, 255), anchor="mm")
    d.text((W / 2, 870), "10월 10일 토요일", font=font("Medium", 40), fill=(220, 228, 245, 255), anchor="mm")
    p = ease_back(prog(t, 0.6, 0.5))
    if p > 0:
        y = 960 + (1 - p) * -260
        a = clamp(prog(t, 0.6, 0.2))
        shadow_card(img, (200, y, W - 200, y + 230), radius=36, fill=(250, 250, 252), alpha=a)
        d = ImageDraw.Draw(img)
        paste_emoji(img, "🧊", 265, y + 60, 54, a)
        d.text((310, y + 60), "냉장고 안심 매니저", font=font("Bold", 34), fill=SUB + (int(255 * a),), anchor="lm")
        d.text((W - 230, y + 60), "지금", font=font("Medium", 30), fill=SUB + (int(255 * a),), anchor="rm")
        d.text((240, y + 128), "오늘 마감 식품이 있어요!", font=font("Bold", 42), fill=INK + (int(255 * a),), anchor="lm")
        d.text((240, y + 182), "두부 · 서울우유 — 오늘 요리해 보세요", font=font("Medium", 34), fill=SUB + (int(255 * a),), anchor="lm")
    # 벨 흔들기
    if t > 0.6:
        ang = math.sin(t * 18) * 18 * max(0, 1 - (t - 0.6) / 1.5)
        b = emoji("🔔", 150).rotate(ang, resample=Image.BICUBIC, expand=True)
        img.alpha_composite(b, (int(W / 2 - b.width / 2), int(1400 - b.height / 2)))


def scene_report(img, t, dur):
    caption(img, t, dur, "절약 리포트", "버린 식품이 줄어드는 걸 확인해요")
    shadow_card(img, (110, 640, W - 110, 1560), radius=48)
    d = ImageDraw.Draw(img)
    d.text((170, 720), "월별 버린 식품", font=font("Bold", 46), fill=INK + (255,), anchor="lm")
    months = ["7월", "8월", "9월", "10월"]
    vals = [12, 8, 5, 2]
    base = 1400
    for i, (m, v) in enumerate(zip(months, vals)):
        p = ease_out(prog(t, 0.5 + i * 0.2, 0.6))
        x = 230 + i * 190
        h = v * 45 * p
        c = GREEN if i == 3 else (200, 210, 225)
        d.rounded_rectangle((x, base - h, x + 120, base), 20, fill=c + (255,))
        d.text((x + 60, base + 50), m, font=font("Medium", 38), fill=SUB + (255,), anchor="mm")
        if p > 0.9:
            d.text((x + 60, base - h - 40), f"{v}개", font=font("Bold", 38), fill=INK + (255,), anchor="mm")
    a = clamp(prog(t, 1.9, 0.4))
    if a:
        text_center(img, 1700, "버리는 음식 ↓  아끼는 돈 ↑", font("Black", 66), fill=GREEN, alpha=a,
                    dy=(1 - ease_back(prog(t, 1.9, 0.4))) * 40)


def scene_cta(img, t, dur):
    s = ease_back(prog(t, 0.0, 0.6))
    r = int(230 * s)
    if r > 2:
        circ = Image.new("RGBA", img.size, (0, 0, 0, 0))
        ImageDraw.Draw(circ).ellipse((W / 2 - r, 760 - r, W / 2 + r, 760 + r), fill=(255, 255, 255, 255))
        img.alpha_composite(circ)
        if CHEF and CHEF.exists():
            chef = Image.open(CHEF).convert("RGBA")
            sz = int(380 * s)
            chef = chef.resize((int(sz * chef.width / chef.height), sz), Image.LANCZOS)
            img.alpha_composite(chef, (int(W / 2 - chef.width / 2), int(760 - chef.height / 2)))
        else:
            paste_emoji(img, "🧑‍🍳", W / 2, 760, int(300 * s))
    white = (255, 255, 255)
    a = clamp(prog(t, 0.4, 0.3))
    text_center(img, 1130, "냉장고 안심 매니저", font("Black", 100), fill=white, alpha=a,
                dy=(1 - ease_back(prog(t, 0.4, 0.45))) * 50)
    a2 = clamp(prog(t, 0.8, 0.3))
    text_center(img, 1250, "음식은 끝까지, 걱정은 0까지", font("Bold", 54), fill=(210, 245, 228), alpha=a2)
    p = ease_back(prog(t, 1.3, 0.5))
    if p > 0:
        bw, bh = 640 * p, 140 * p
        pulse = 1 + 0.03 * math.sin(t * 6)
        bw, bh = bw * pulse, bh * pulse
        cy = 1530
        shadow_card(img, (W / 2 - bw / 2, cy - bh / 2, W / 2 + bw / 2, cy + bh / 2), radius=int(bh / 2), fill=(255, 214, 60))
        if p > 0.6:
            ImageDraw.Draw(img).text((W / 2, cy), "지금 바로 시작하기 →", font=font("Black", int(56 * min(p, 1))),
                                     fill=INK + (255,), anchor="mm")


RENDER = {
    "hook": scene_hook, "problem": scene_problem, "scan": scene_scan, "expiry": scene_expiry,
    "notify": scene_notify, "report": scene_report, "cta": scene_cta,
}


def render_frame(gt):
    acc = 0.0
    for idx, (name, dur) in enumerate(SCENES):
        if gt < acc + dur or idx == len(SCENES) - 1:
            t = gt - acc
            break
        acc += dur
    img = BG[name].copy()
    RENDER[name](img, t, dur)
    # 진행 바
    d = ImageDraw.Draw(img)
    bar_col = (255, 255, 255, 200) if name == "cta" else GREEN + (220,)
    d.rectangle((0, 0, int(W * gt / TOTAL), 10), fill=bar_col)
    # 장면 전환: 앞뒤 0.2초 페이드
    fade = min(prog(t, 0, 0.2), 1 - prog(t, dur - 0.2, 0.2)) if idx not in (0,) else 1 - prog(t, dur - 0.2, 0.2)
    if idx == len(SCENES) - 1:
        fade = prog(t, 0, 0.2)
    if fade < 1:
        black = Image.new("RGBA", img.size, (255, 255, 255, int(255 * (1 - fade))))
        img.alpha_composite(black)
    return img.convert("RGB")


def make_music(path, seconds, sr=44100):
    """밝은 느낌의 간단한 배경음 (피치카토 아르페지오 + 킥)."""
    n = int(seconds * sr)
    out = np.zeros(n)
    bpm = 112
    beat = 60 / bpm
    chords = [[261.63, 329.63, 392.0], [220.0, 261.63, 329.63], [174.61, 220.0, 261.63], [196.0, 246.94, 293.66]]
    step = beat / 2
    i = 0
    while i * step < seconds:
        chord = chords[int(i * step / (beat * 4)) % 4]
        f = chord[i % 3] * (2 if i % 4 == 3 else 1)
        start = int(i * step * sr)
        L = int(0.35 * sr)
        tt = np.arange(L) / sr
        tone = (np.sin(2 * np.pi * f * tt) + 0.3 * np.sin(4 * np.pi * f * tt)) * np.exp(-tt * 9)
        end = min(n, start + L)
        out[start:end] += 0.22 * tone[: end - start]
        # 베이스
        if i % 2 == 0:
            bf = chord[0] / 2
            tone_b = np.sin(2 * np.pi * bf * tt) * np.exp(-tt * 5)
            out[start:end] += 0.18 * tone_b[: end - start]
        # 킥
        if i % 2 == 0:
            Lk = int(0.15 * sr)
            tk = np.arange(Lk) / sr
            kick = np.sin(2 * np.pi * (110 * np.exp(-tk * 25) + 45) * tk) * np.exp(-tk * 22)
            e2 = min(n, start + Lk)
            out[start:e2] += 0.35 * kick[: e2 - start]
        i += 1
    # 페이드 인/아웃
    fi, fo = int(0.3 * sr), int(1.2 * sr)
    out[:fi] *= np.linspace(0, 1, fi)
    out[-fo:] *= np.linspace(1, 0, fo)
    out = out / (np.abs(out).max() + 1e-9) * 0.7
    data = (out * 32767).astype(np.int16)
    stereo = np.repeat(data[:, None], 2, axis=1)
    with wave.open(str(path), "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(sr)
        w.writeframes(stereo.tobytes())


def main():
    music = HERE / "bgm.wav"
    make_music(music, TOTAL)
    frames = int(TOTAL * FPS)
    cmd = ["ffmpeg", "-y", "-loglevel", "error",
           "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-",
           "-i", str(music), "-shortest",
           "-c:v", "libx264", "-preset", "medium", "-crf", "20", "-pix_fmt", "yuv420p",
           "-c:a", "aac", "-b:a", "160k", "-movflags", "+faststart", str(OUT)]
    proc = subprocess.Popen(cmd, stdin=subprocess.PIPE)
    for f in range(frames):
        proc.stdin.write(render_frame(f / FPS).tobytes())
    proc.stdin.close()
    proc.wait()
    print("done", OUT)


if __name__ == "__main__":
    if len(sys.argv) > 3 and sys.argv[3] == "preview":
        times = [2.5, 5.5, 9.8, 14.0, 18.0, 22.5, 26.5]
        for i, tt in enumerate(times):
            render_frame(tt).resize((360, 640)).save(HERE / f"prev_{i}.png")
    else:
        main()
