# 시니햄 케이지 가구 픽셀 아트 생성.
# 저해상도로 직접 그린 뒤 NEAREST로 8배 확대해 기존 에셋과 같은 픽셀 룩을 맞춘다.
from PIL import Image, ImageDraw

SCALE = 8
OUT = r"C:\developer\2026\sini-ham\client\src\assets\cage-items"

OUTLINE = (74, 46, 30, 255)
SHADOW = (108, 72, 46, 255)

CREAM_D = (214, 197, 168, 255)
CREAM = (241, 231, 212, 255)
CREAM_L = (255, 252, 245, 255)

WOOD_DD = (132, 92, 52, 255)
WOOD_D = (168, 122, 74, 255)
WOOD = (201, 155, 101, 255)
WOOD_L = (226, 189, 138, 255)
WOOD_LL = (243, 216, 174, 255)

SAND_D = (198, 172, 124, 255)
SAND = (228, 206, 162, 255)
SAND_L = (244, 230, 199, 255)
SAND_LL = (253, 245, 226, 255)

SEED_D = (48, 46, 44, 255)
SEED = (86, 83, 80, 255)
SEED_L = (150, 147, 142, 255)
SEED_LL = (206, 203, 198, 255)


def new(w, h):
    img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    return img, ImageDraw.Draw(img)


def save(img, name):
    img.resize((img.width * SCALE, img.height * SCALE), Image.NEAREST).save(f"{OUT}\\{name}", "PNG")
    print(name, img.width * SCALE, "x", img.height * SCALE)


def dither(d, box, color, step=2, offset=0):
    """체크무늬로 찍어 두 색 사이를 부드럽게 잇는다. 기존 에셋의 계조 표현과 맞춘다."""
    x0, y0, x1, y1 = box
    for y in range(y0, y1 + 1):
        for x in range(x0, x1 + 1):
            if (x + y + offset) % step == 0:
                d.point((x, y), fill=color)


def seed(d, cx, cy, lean=0):
    """해바라기씨. 눕혀놓은 아몬드 형태 + 밝은 줄무늬. lean으로 기울기를 준다."""
    pts = [
        (cx - 5, cy + lean),
        (cx - 2, cy - 3),
        (cx + 2, cy - 3 - lean),
        (cx + 5, cy - lean),
        (cx + 2, cy + 3 - lean),
        (cx - 2, cy + 3),
    ]
    d.polygon(pts, fill=SEED, outline=OUTLINE)
    d.line([(cx - 2, cy - 1), (cx + 2, cy - 1 - lean)], fill=SEED_L)
    d.line([(cx - 1, cy + 1), (cx + 2, cy + 1 - lean)], fill=SEED_D)
    d.point((cx - 2, cy - 2), fill=SEED_LL)


# ---------------------------------------------------------------- 모래목욕통
def sand_bath():
    W, H = 108, 82
    img, d = new(W, H)

    left, right = 6, 101
    rim_top, rim_bot = 12, 40
    body_bot = 72

    # 통 몸체(앞판)
    d.polygon(
        [(left + 4, rim_top + 12), (right - 4, rim_top + 12), (right - 9, body_bot), (left + 9, body_bot)],
        fill=WOOD,
        outline=OUTLINE,
    )
    # 나무 판자 결
    for x in range(left + 16, right - 10, 13):
        d.line([(x, rim_top + 16), (x + 2, body_bot - 2)], fill=WOOD_D)
    # 바닥 그늘 + 좌우 명암
    dither(d, (left + 12, body_bot - 12, right - 12, body_bot - 2), WOOD_D, 3)
    d.polygon([(left + 4, rim_top + 14), (left + 12, rim_top + 14), (left + 15, body_bot - 2), (left + 9, body_bot - 2)], fill=WOOD_L)
    d.polygon([(right - 12, rim_top + 14), (right - 4, rim_top + 14), (right - 9, body_bot - 2), (right - 14, body_bot - 2)], fill=WOOD_D)

    # 금속 밴드 두 줄
    for by in (rim_top + 22, body_bot - 12):
        d.line([(left + 6, by), (right - 6, by)], fill=WOOD_DD)
        d.line([(left + 6, by + 1), (right - 6, by + 1)], fill=WOOD_LL)

    # 상단 테두리(도넛 모양 나무 링). 윗면만 밝게 해서 두께를 표현한다.
    d.ellipse([left, rim_top, right, rim_bot], fill=WOOD_L, outline=OUTLINE)
    d.ellipse([left, rim_top - 2, right, rim_bot - 2], fill=WOOD_LL, outline=OUTLINE)
    # 안쪽 구멍
    d.ellipse([left + 9, rim_top + 1, right - 9, rim_bot - 6], fill=SHADOW, outline=OUTLINE)

    # 모래
    d.ellipse([left + 10, rim_top + 3, right - 10, rim_bot - 7], fill=SAND_D)
    d.ellipse([left + 12, rim_top + 4, right - 12, rim_bot - 8], fill=SAND)
    # 가운데 봉긋한 모래 언덕
    d.ellipse([left + 24, rim_top + 4, right - 26, rim_bot - 11], fill=SAND_L)
    d.ellipse([left + 32, rim_top + 5, right - 36, rim_bot - 13], fill=SAND_LL)
    dither(d, (left + 16, rim_top + 8, right - 18, rim_bot - 9), SAND_L, 3, 1)
    # 모래알
    for x, y in [(30, 22), (48, 19), (66, 23), (78, 20), (40, 25), (58, 26), (86, 24)]:
        d.point((x, y), fill=SAND_D)

    save(img, "sand-bath.png")


# ------------------------------------------------------------ 해바라기씨 접시
def snack_dish():
    W, H = 118, 60
    img, d = new(W, H)

    # 접시 옆면(두께)
    d.ellipse([4, 20, 113, 52], fill=CREAM_D, outline=OUTLINE)
    # 접시 윗면
    d.ellipse([4, 12, 113, 44], fill=CREAM, outline=OUTLINE)
    d.ellipse([6, 13, 111, 42], fill=CREAM_L)
    # 우묵한 안쪽
    d.ellipse([18, 17, 99, 39], fill=CREAM_D, outline=OUTLINE)
    d.ellipse([20, 18, 97, 37], fill=CREAM)
    dither(d, (24, 20, 94, 30), CREAM_L, 2)
    # 테두리 하이라이트와 그늘
    d.arc([4, 12, 113, 44], 190, 340, fill=CREAM_L)
    d.arc([4, 20, 113, 52], 20, 160, fill=CREAM_D)

    # 씨앗 더미. 뒤에서 앞 순서로 그려 겹침이 자연스럽게 보이도록 좌표를 흩어 놓는다.
    scatter = [
        (37, 22, 1), (50, 21, 0), (62, 22, -1), (75, 23, 1), (86, 25, 0),
        (31, 26, -1), (44, 25, 1), (57, 26, 0), (69, 27, -1), (81, 28, 1),
        (38, 30, 0), (51, 31, -1), (64, 30, 1), (76, 32, 0),
        (45, 34, 1), (58, 34, 0), (70, 35, -1),
    ]
    for cx, cy, lean in scatter:
        seed(d, cx, cy, lean)
    # 접시 가장자리로 굴러 나온 씨
    seed(d, 26, 34, -1)
    seed(d, 92, 32, 1)

    save(img, "snack-dish.png")


# ------------------------------------------------------------------- 전망대
# 낮은 나무 발판 + 오른쪽으로 내려오는 경사 사다리.
def lookout():
    W, H = 116, 84
    img, d = new(W, H)

    plat_l, plat_r = 6, 62
    plat_y = 22
    ground = 76

    # 다리 두 개
    for x in (plat_l + 6, plat_r - 14):
        d.rectangle([x, plat_y + 8, x + 7, ground], fill=WOOD, outline=OUTLINE)
        d.line([(x + 1, plat_y + 10), (x + 1, ground - 1)], fill=WOOD_L)
        d.line([(x + 6, plat_y + 10), (x + 6, ground - 1)], fill=WOOD_D)
    # 다리 사이 가로 보강대
    d.rectangle([plat_l + 8, ground - 16, plat_r - 9, ground - 12], fill=WOOD_D, outline=OUTLINE)

    # 상판
    d.rectangle([plat_l, plat_y, plat_r, plat_y + 5], fill=WOOD_LL, outline=OUTLINE)
    d.rectangle([plat_l, plat_y + 5, plat_r, plat_y + 9], fill=WOOD_D, outline=OUTLINE)
    for x in range(plat_l + 10, plat_r - 4, 12):
        d.line([(x, plat_y + 1), (x, plat_y + 4)], fill=WOOD)

    # 난간 (뒤쪽 기둥 + 가로대)
    for x in (plat_l + 2, plat_l + 24, plat_r - 8):
        d.rectangle([x, plat_y - 13, x + 4, plat_y], fill=WOOD, outline=OUTLINE)
        d.line([(x + 1, plat_y - 11), (x + 1, plat_y - 1)], fill=WOOD_L)
    d.rectangle([plat_l, plat_y - 17, plat_r - 4, plat_y - 13], fill=WOOD_L, outline=OUTLINE)
    d.line([(plat_l + 1, plat_y - 14), (plat_r - 5, plat_y - 14)], fill=WOOD_D)

    # 경사 사다리 (상판 오른쪽에서 바닥으로). 레일을 3픽셀 두께로 겹쳐 끊겨 보이지 않게 한다.
    rail = [(plat_r - 6, plat_y + 5), (104, ground - 6)]
    for dy in (0, 6):
        for t in range(3):
            d.line(
                [(rail[0][0], rail[0][1] + dy + t), (rail[1][0], rail[1][1] + dy + t)],
                fill=OUTLINE if t == 2 else WOOD,
            )
    # 발판
    for t in range(1, 7):
        px = int(rail[0][0] + (rail[1][0] - rail[0][0]) * t / 7)
        py = int(rail[0][1] + (rail[1][1] - rail[0][1]) * t / 7)
        d.rectangle([px - 5, py, px + 5, py + 3], fill=WOOD_L, outline=OUTLINE)
        d.line([(px - 4, py + 3), (px + 4, py + 3)], fill=WOOD_D)
    # 사다리가 바닥에 닿는 받침
    d.rectangle([97, ground - 7, 113, ground + 3], fill=WOOD_D, outline=OUTLINE)

    save(img, "lookout.png")


sand_bath()
snack_dish()
lookout()
