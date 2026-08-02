# idle 스프라이트에서 눈 감은 프레임(blink.png)을 만든다.
#
# 가만히 서 있을 때 아무 변화가 없어 정지 화면처럼 보이는 문제를 눈 깜박임으로 덜어낸다.
# 깜박임은 일정 간격 프레임 재생과 달리 "오래 뜨고 아주 잠깐 감는" 리듬이라 프레임 배열로 두면
# 낭비가 크다. 그래서 감은 눈 한 장만 만들고 HamsterSprite가 가끔 잠깐 바꿔치기한다.
#
# 처리. 눈 영역을 위아래 색으로 세로 보간해 지운 뒤, 그 자리에 눈꺼풀 선을 그린다.
# 주변이 바깥쪽은 털색, 안쪽은 크림색 주둥이라 단색으로 덮으면 티가 난다.
#
# 사용법. python scripts/gen-hamster-blink.py

import os
from PIL import Image

ROOT = os.path.join("client", "src", "assets", "hamsters")

APPEARANCES = ("golden", "gray")

# 눈으로 인정할 어두운 덩어리의 조건. 몸 외곽선(너무 큼), 귀 선(너무 길쭉), 머리 선(너무 납작)을 걸러낸다.
EYE_MIN_PIXELS = 200
EYE_MAX_PIXELS = 2000
EYE_MIN_RATIO = 0.8   # 높이/너비
EYE_MAX_RATIO = 2.5

LID_THICKNESS = 4
# 음수면 가운데가 아래로 처진 곡선이 된다. 감은 눈은 이쪽이 자연스럽다.
LID_ARCH = -3
# 눈 가장자리의 계단 픽셀까지 지우려면 잰 범위보다 조금 넓게 잡아야 한다.
ERASE_MARGIN = 3
# 주변 색을 뽑을 위치. 눈 테두리에 닿으면 회색 띠가 남아서 충분히 떨어뜨린다.
SAMPLE_OFFSET = 6


def find_eyes(img: Image.Image) -> list[tuple[int, int, int, int]]:
    """어두운 픽셀 덩어리 중 눈처럼 생긴 좌우 한 쌍을 찾는다.

    좌표를 스크립트에 박아두면 정규화 배율을 바꿀 때마다 조용히 어긋나서 매번 다시 찾는다.
    """
    px = img.load()
    width, height = img.size
    dark = set()
    for y in range(height):
        for x in range(width):
            r, g, b, a = px[x, y]
            if a > 200 and r < 90 and g < 80 and b < 80:
                dark.add((x, y))

    blobs = []
    remaining = set(dark)
    while remaining:
        stack = [remaining.pop()]
        blob = list(stack)
        while stack:
            cx, cy = stack.pop()
            for dx in (-1, 0, 1):
                for dy in (-1, 0, 1):
                    neighbour = (cx + dx, cy + dy)
                    if neighbour in remaining:
                        remaining.remove(neighbour)
                        stack.append(neighbour)
                        blob.append(neighbour)
        if EYE_MIN_PIXELS <= len(blob) <= EYE_MAX_PIXELS:
            blobs.append(blob)

    candidates = []
    for blob in blobs:
        xs = [p[0] for p in blob]
        ys = [p[1] for p in blob]
        box = (min(xs), min(ys), max(xs), max(ys))
        ratio = (box[3] - box[1] + 1) / (box[2] - box[0] + 1)
        if EYE_MIN_RATIO <= ratio <= EYE_MAX_RATIO:
            candidates.append((box, len(blob)))

    # 같은 높이에 있고 크기가 비슷한 두 개를 눈으로 본다.
    candidates.sort(key=lambda c: c[0][0])
    for i in range(len(candidates)):
        for j in range(i + 1, len(candidates)):
            (left, left_size), (right, right_size) = candidates[i], candidates[j]
            same_height = abs(left[1] - right[1]) <= 6 and abs(left[3] - right[3]) <= 6
            similar_size = min(left_size, right_size) / max(left_size, right_size) >= 0.6
            if same_height and similar_size:
                return [left, right]
    return []


def blend(a, b, t):
    return tuple(round(a[i] + (b[i] - a[i]) * t) for i in range(4))


def erase_eye(px, box, height):
    """눈을 지운다. 눈 위는 털색, 아래는 크림색 주둥이라 세로로 보간하면 자연스럽게 이어진다."""
    x0, y0, x1, y1 = box
    ex0, ey0 = x0 - ERASE_MARGIN, y0 - ERASE_MARGIN
    ex1, ey1 = x1 + ERASE_MARGIN, y1 + ERASE_MARGIN
    above_y = max(0, y0 - SAMPLE_OFFSET)
    below_y = min(height - 1, y1 + SAMPLE_OFFSET)
    span = ey1 - ey0 + 2
    for x in range(ex0, ex1 + 1):
        top = px[x, above_y]
        bottom = px[x, below_y]
        for y in range(ey0, ey1 + 1):
            px[x, y] = blend(top, bottom, (y - ey0 + 1) / span)


def draw_lid(px, box, color):
    """감은 눈꺼풀. 가운데가 살짝 처진 완만한 곡선으로 그린다."""
    x0, y0, x1, y1 = box
    width = x1 - x0
    center_y = (y0 + y1) // 2
    for x in range(x0, x1 + 1):
        t = (x - x0) / width if width else 0.5
        arch = round(LID_ARCH * (1 - (2 * t - 1) ** 2))
        top = center_y - arch
        for y in range(top, top + LID_THICKNESS):
            px[x, y] = color


def eye_color(img, box):
    """눈에서 가장 흔한 진한 색을 눈꺼풀 색으로 쓴다.

    가장 어두운 픽셀은 테두리의 순검정이라 눈꺼풀로 쓰면 너무 세다.
    """
    x0, y0, x1, y1 = box
    counts: dict[tuple[int, int, int], int] = {}
    for y in range(y0, y1 + 1):
        for x in range(x0, x1 + 1):
            r, g, b, a = img.getpixel((x, y))
            if a < 200 or r + g + b > 260:
                continue
            key = (r, g, b)
            counts[key] = counts.get(key, 0) + 1
    if not counts:
        return (74, 46, 30, 255)
    return (*max(counts, key=counts.get), 255)


def main() -> None:
    for folder in APPEARANCES:
        src = os.path.join(ROOT, folder, "idle.png")
        if not os.path.exists(src):
            print(f"  건너뜀 {src} (없음)")
            continue

        img = Image.open(src).convert("RGBA")
        boxes = find_eyes(img)
        if len(boxes) != 2:
            print(f"  건너뜀 {folder} (눈을 찾지 못함)")
            continue

        color = eye_color(img, boxes[0])
        px = img.load()
        for box in boxes:
            erase_eye(px, box, img.height)
        for box in boxes:
            draw_lid(px, box, color)

        dst = os.path.join(ROOT, folder, "blink.png")
        img.save(dst, "PNG", optimize=True)
        print(f"  {dst} 생성 (눈 {boxes}, 눈꺼풀 색 {color[:3]})")


if __name__ == "__main__":
    main()
