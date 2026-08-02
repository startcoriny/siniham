# 햄스터 스프라이트를 같은 규격으로 정규화한다.
#
# 문제. 원본은 캔버스 비율(1536x1024 / 512x512 / 1024x1024)도, 그 안에서 햄스터가 차지하는 비율도
# 파일마다 달랐다. HamsterSprite는 전부 같은 정사각 상자에 그리므로 행동마다 크기가 2배 넘게 달라 보였다.
#
# 처리. 알파 기준으로 잘라내고, 불투명 면적의 제곱근을 기준으로 크기를 맞춘 뒤,
# 정사각 캔버스에 가로 중앙 + 바닥 정렬로 다시 배치한다. 면적을 기준으로 삼는 이유는
# 자세가 바뀌어도(앉기/걷기/눕기) 몸집은 일정하기 때문이다. 가로나 세로 하나만 쓰면
# 걷는 자세처럼 납작한 그림이 과하게 커지거나 작아진다.
#
# 소품이 함께 그려진 파일(사람 손, 쳇바퀴, 물병)은 면적이 부풀려지므로 파일별 보정값을 둔다.
#
# 사용법. python scripts/normalize-hamster-sprites.py <원본폴더> <출력폴더>
# 원본을 그대로 덮어쓰면 재실행할 때마다 리샘플링이 누적되므로 원본 사본을 따로 두고 실행한다.

import math
import os
import sys
from PIL import Image

CANVAS = 512
# 불투명 면적의 제곱근 목표값. 이 값이 화면에 보이는 햄스터의 몸집을 정한다.
TARGET_AREA_SQRT = 260
# 바닥 정렬 기준선. 걷다가 멈춰도 발 위치가 튀지 않게 모든 그림의 아래를 여기에 맞춘다.
BASELINE_Y = 500
CANVAS_MARGIN = 12
ALPHA_THRESHOLD = 40

# 화면에 쓰이지 않는 작업 파일. 프레임을 잘라낸 원본 시트라 정규화하면 안 된다.
SKIP_FILES = {"sheet-source.png"}

# 파일별 보정값 (1.0보다 크면 더 크게 그린다).
#
# 소품이 같이 그려져 면적이 부풀려지는 것들과, 시점 차이로 실루엣이 달라 보이는 것들을 맞춘다.
# 걷기는 옆모습이라 몸이 길게 퍼지고 먹기/서있기는 정면이라 뭉쳐 보인다. 면적이 같아도 실루엣 폭이
# 23% 차이나서 걷다가 멈추면 작아진 것처럼 보였다. 양쪽을 가운데로 당겨 전환이 덜 튀게 한다.
SCALE_OVERRIDES = {
    "pet": 1.30,      # 사람 손이 위쪽에 함께 그려져 있다
    "wheel": 1.28,    # 쳇바퀴가 햄스터를 감싸고 있다
    "drink": 1.10,    # 물병이 옆에 함께 그려져 있다
    "sleep": 0.94,    # 몸을 말고 누운 자세라 면적 기준이면 조금 커진다
    "walk": 0.90,     # 옆모습이라 몸이 길게 퍼져 커 보인다
    "idle": 1.06,     # 아래는 정면 자세. 뭉쳐 보여 작아 보인다
    "eat": 1.06,
    "wash": 1.06,
    "cheek": 1.06,
    "look": 1.06,
}


def override_for(name: str) -> float:
    stem = os.path.splitext(os.path.basename(name))[0]
    for prefix, value in SCALE_OVERRIDES.items():
        # drink1.png, sleep2.png, wash3.png 처럼 뒤에 번호가 붙는 시안도 함께 처리한다
        if stem.startswith(prefix):
            return value
    return 1.0


def content_bbox(mask: Image.Image) -> tuple[int, int, int, int] | None:
    """행/열별 픽셀 수로 경계를 잡는다.

    단순 getbbox()는 배경 제거 과정에서 남은 옅은 픽셀 몇 개에도 경계가 캔버스 끝까지 늘어난다
    (walk2.png가 실제로 그랬다). 픽셀이 일정 수 이상 있는 행과 열만 내용으로 친다.
    """
    width, height = mask.size
    pixels = mask.load()
    row_counts = [0] * height
    col_counts = [0] * width
    for y in range(height):
        for x in range(width):
            if pixels[x, y]:
                row_counts[y] += 1
                col_counts[x] += 1

    def span(counts: list[int]) -> tuple[int, int] | None:
        peak = max(counts)
        if peak == 0:
            return None
        floor = max(2, int(peak * 0.02))
        kept = [i for i, value in enumerate(counts) if value >= floor]
        return (kept[0], kept[-1] + 1) if kept else None

    rows, cols = span(row_counts), span(col_counts)
    if not rows or not cols:
        return None
    return (cols[0], rows[0], cols[1], rows[1])


def normalize(src_path: str, dst_path: str, override_key: str) -> str | None:
    img = Image.open(src_path).convert("RGBA")
    mask = img.getchannel("A").point(lambda v: 255 if v >= ALPHA_THRESHOLD else 0)
    bbox = content_bbox(mask)
    if not bbox:
        return None

    opaque_area = sum(1 for v in mask.crop(bbox).getdata() if v)
    if opaque_area == 0:
        return None

    scale = (TARGET_AREA_SQRT / math.sqrt(opaque_area)) * override_for(override_key)
    cropped = img.crop(bbox)
    # 어떤 그림도 캔버스를 넘지 않게 막는다. 넘치면 잘려 나간다.
    limit = CANVAS - 2 * CANVAS_MARGIN
    scale = min(scale, limit / cropped.width, limit / cropped.height)
    new_w = max(1, round(cropped.width * scale))
    new_h = max(1, round(cropped.height * scale))
    resized = cropped.resize((new_w, new_h), Image.LANCZOS)

    canvas = Image.new("RGBA", (CANVAS, CANVAS), (0, 0, 0, 0))
    canvas.alpha_composite(resized, ((CANVAS - new_w) // 2, BASELINE_Y - new_h))

    os.makedirs(os.path.dirname(dst_path), exist_ok=True)
    canvas.save(dst_path, "PNG", optimize=True)
    return f"{cropped.width}x{cropped.height} -> {new_w}x{new_h}"


def main() -> None:
    if len(sys.argv) != 3:
        print("사용법: python scripts/normalize-hamster-sprites.py <원본폴더> <출력폴더>")
        raise SystemExit(1)

    source_root, output_root = sys.argv[1], sys.argv[2]
    total_before = 0
    total_after = 0

    for dirpath, _, filenames in os.walk(source_root):
        for filename in sorted(filenames):
            if not filename.endswith(".png") or filename in SKIP_FILES:
                continue
            src = os.path.join(dirpath, filename)
            relative = os.path.relpath(src, source_root)
            dst = os.path.join(output_root, relative)

            # walk-01/frame-01.png 처럼 폴더 이름이 행동을 나타내는 경우 폴더명으로 보정값을 찾는다
            parent = os.path.basename(dirpath)
            key = parent if filename.startswith("frame-") else filename

            result = normalize(src, dst, key)
            if result is None:
                print(f"  건너뜀(내용 없음) {relative}")
                continue
            total_before += os.path.getsize(src)
            total_after += os.path.getsize(dst)
            print(f"  {relative:34} {result}")

    print(f"\n용량 {total_before / 1048576:.1f}MB -> {total_after / 1048576:.1f}MB")


if __name__ == "__main__":
    main()
