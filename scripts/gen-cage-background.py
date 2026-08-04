# 케이지 스테이지 배경(벽+바닥) 생성. 유리+나무 테두리 테라리움 느낌 - 참고 이미지(둥근 나무 모서리
# 기둥, 위쪽 철망 뚜껑, 옅은 유리 벽, 톱밥 바닥)를 이 게임의 저해상도 디더링 픽셀 스타일로 옮긴다.
#
# 화면에 거의 원본 크기로 표시되는 배경이라 "저해상도로 그려 확대"가 아니라 최종 해상도(1000x700)에
# 바로 그리고, 디더링도 1px 단위 스티플로 찍어야 체크무늬가 아니라 고운 질감으로 보인다.
from PIL import Image, ImageDraw

W, H = 1000, 700  # 10:7 비율 - CagePage의 aspect-[10/7]와 정확히 맞아야 100% 100%로 늘려도 안 찌그러진다.
OUT = r"C:\developer\2026\sini-ham\client\src\assets\cage\background.png"

POST_W = 30       # 좌우 나무 모서리 기둥 폭
TOP_TRIM_H = 46   # 위쪽 철망 뚜껑을 감싸는 나무 테두리(뚜껑 포함)
BOTTOM_TRIM_H = 20  # 바닥이 놓이는 나무 받침대
WALL_ROWS = 168   # 유리벽 구간(장식용, 햄스터 행동 반경 밖) - 위 나무 테두리 아래부터 이 높이까지

# 가구 스프라이트(gen-cage-items.py)와 같은 나무 팔레트를 그대로 써서 재질이 통일되게 한다.
WOOD_DD = (132, 92, 52, 255)
WOOD_D = (168, 122, 74, 255)
WOOD = (201, 155, 101, 255)
WOOD_L = (226, 189, 138, 255)
WOOD_LL = (243, 216, 174, 255)

GLASS = (233, 244, 246, 255)
GLASS_L = (245, 251, 252, 255)
GLASS_D = (214, 232, 235, 255)
GLASS_SHINE = (255, 255, 255, 255)

MESH_FRAME = (216, 224, 227, 255)
MESH = (233, 238, 240, 255)
MESH_WIRE = (184, 192, 198, 255)

FLOOR = (247, 214, 158, 255)
FLOOR_L = (252, 232, 194, 255)
FLOOR_D = (224, 184, 126, 255)
FLAKE_L = (255, 246, 224, 255)
FLAKE_M = (238, 206, 148, 255)
FLAKE_D = (214, 170, 110, 255)


def dither(d, box, color, step=3, offset=0):
    """1px 단위 스티플. 최종 해상도에서 바로 찍어야 체크무늬가 아니라 고운 질감으로 보인다."""
    x0, y0, x1, y1 = box
    for y in range(y0, y1):
        for x in range(x0, x1):
            if (x + y + offset) % step == 0:
                d.point((x, y), fill=color)


_seed = 20260803


def rnd():
    global _seed
    _seed = (_seed * 1103515245 + 12345) & 0x7FFFFFFF
    return _seed / 0x7FFFFFFF


def wood_post(d, x0, x1, y0, y1):
    """둥근 느낌의 나무 기둥 - 가운데는 밝고 양 옆으로 갈수록 어두워지는 베벨."""
    d.rectangle([x0, y0, x1, y1], fill=WOOD)
    mid = (x0 + x1) // 2
    d.rectangle([x0, y0, x0 + 3, y1], fill=WOOD_DD)
    d.rectangle([x1 - 3, y0, x1, y1], fill=WOOD_DD)
    d.rectangle([mid - 4, y0, mid + 4, y1], fill=WOOD_LL)
    d.line([(x0 + 5, y0), (x0 + 5, y1)], fill=WOOD_D)
    d.line([(x1 - 5, y0), (x1 - 5, y1)], fill=WOOD_D)


def main():
    floor_top = TOP_TRIM_H + WALL_ROWS
    img = Image.new("RGBA", (W, H), GLASS)
    d = ImageDraw.Draw(img)

    # ================= 유리벽 (장식용 - 햄스터 행동 반경 밖) =================
    d.rectangle([POST_W, TOP_TRIM_H, W - POST_W, floor_top], fill=GLASS)
    dither(d, (POST_W, TOP_TRIM_H, W - POST_W, TOP_TRIM_H + 24), GLASS_L, 3)
    dither(d, (POST_W, floor_top - 26, W - POST_W, floor_top), GLASS_D, 3)

    # 유리 반사광 - 대각선 밝은 띠 두 줄로 "유리"라는 걸 알려준다
    for band_x, band_w in [(120, 46), (760, 34)]:
        for i in range(band_w):
            x0 = band_x + i
            d.line(
                [(x0, TOP_TRIM_H), (x0 - 70, floor_top)],
                fill=(*GLASS_SHINE[:3], 40),
            )

    # ================= 바닥 (햄스터 행동 반경 전체 - 화면 대부분) =================
    d.rectangle([POST_W, floor_top, W - POST_W, H - BOTTOM_TRIM_H], fill=FLOOR)
    dither(d, (POST_W, floor_top, W - POST_W, floor_top + 26), FLOOR_L, 3)
    dither(d, (POST_W, H - BOTTOM_TRIM_H - 30, W - POST_W, H - BOTTOM_TRIM_H), FLOOR_D, 3)

    # 톱밥/모래 알갱이 - 가늘고 긴 대시(톱밥 조각)와 작고 둥근 알갱이(모래)를 섞어서
    # 실 아까보다 더 "쌓여 있는 것" 같은 질감을 낸다.
    for _ in range(1100):
        x = POST_W + 8 + rnd() * (W - POST_W * 2 - 16)
        y = floor_top + 10 + rnd() * (H - BOTTOM_TRIM_H - floor_top - 18)
        r = rnd()
        color = FLAKE_L if r < 0.48 else FLAKE_M if r < 0.85 else FLAKE_D
        shape = rnd()
        if shape < 0.55:
            # 얇고 살짝 굽은 톱밥 조각
            length = 4 + rnd() * 7
            horizontal = rnd() < 0.6
            if horizontal:
                d.line([(x - length / 2, y), (x + length / 2, y - 1)], fill=color, width=1)
            else:
                d.line([(x, y - length / 2), (x + 1, y + length / 2)], fill=color, width=1)
        else:
            # 둥근 알갱이 - 크기를 2단계로 섞는다
            radius = 1 if rnd() < 0.7 else 2
            d.ellipse([x - radius, y - radius, x + radius, y + radius], fill=color)

    # ================= 나무 테두리 프레임 =================
    # 아래쪽 받침대
    d.rectangle([0, H - BOTTOM_TRIM_H, W, H], fill=WOOD)
    d.line([(0, H - BOTTOM_TRIM_H), (W, H - BOTTOM_TRIM_H)], fill=WOOD_LL, width=2)
    d.line([(0, H - 2), (W, H - 2)], fill=WOOD_DD, width=2)

    # 위쪽 나무 테두리 + 그 안의 철망 뚜껑
    d.rectangle([0, 0, W, TOP_TRIM_H], fill=WOOD)
    d.line([(0, 0), (W, 0)], fill=WOOD_LL, width=2)
    mesh_pad = 10
    d.rectangle([POST_W + mesh_pad, mesh_pad, W - POST_W - mesh_pad, TOP_TRIM_H - 6], fill=MESH_FRAME)
    d.rectangle([POST_W + mesh_pad + 3, mesh_pad + 3, W - POST_W - mesh_pad - 3, TOP_TRIM_H - 9], fill=MESH)
    for x in range(POST_W + mesh_pad + 6, W - POST_W - mesh_pad, 16):
        d.line([(x, mesh_pad + 4), (x, TOP_TRIM_H - 10)], fill=MESH_WIRE, width=1)
    for y in range(mesh_pad + 4, TOP_TRIM_H - 9, 10):
        d.line([(POST_W + mesh_pad + 4, y), (W - POST_W - mesh_pad - 4, y)], fill=MESH_WIRE, width=1)
    d.line([(0, TOP_TRIM_H - 1), (W, TOP_TRIM_H - 1)], fill=WOOD_DD, width=2)

    # 좌우 모서리 기둥 - 뚜껑/받침대까지 이어지도록 전체 높이로 그린다 (맨 마지막에 그려 위에 덮는다)
    wood_post(d, 0, POST_W, 0, H)
    wood_post(d, W - POST_W, W, 0, H)

    img.save(OUT, "PNG")
    print(OUT, W, "x", H)


main()
