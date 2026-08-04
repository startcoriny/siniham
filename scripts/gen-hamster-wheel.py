# 회전이 실제로 보이는 쳇바퀴 픽셀 아트 생성. 받침은 고정, 림/발판/스포크는 프레임마다 회전시킨다.
import math
from PIL import Image, ImageDraw

SCALE = 8
OUT = r"C:\developer\2026\sini-ham\client\src\assets\cage-items"
W, H = 108, 116
CX, CY = 54, 50

OUTLINE = (30, 28, 34, 255)

STEEL_DD = (58, 58, 70, 255)
STEEL_D = (86, 86, 100, 255)
STEEL = (128, 128, 142, 255)

SILVER_D = (172, 172, 180, 255)
SILVER = (206, 206, 214, 255)
SILVER_L = (236, 236, 242, 255)
SILVER_LL = (250, 250, 252, 255)

WOOD_D = (196, 168, 132, 255)
WOOD = (224, 200, 168, 255)
WOOD_L = (243, 227, 202, 255)

RUNG_COUNT = 10
SPOKE_COUNT = 4
R_OUTER = 38
R_OUTER_IN = 33
R_INNER = 24
R_INNER_IN = 21
R_HUB = 6


def new():
    img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    return img, ImageDraw.Draw(img)


def save(img, name):
    img.resize((img.width * SCALE, img.height * SCALE), Image.NEAREST).save(f"{OUT}\\{name}", "PNG")
    print(name, img.width * SCALE, "x", img.height * SCALE)


def ring(d, cx, cy, r_out, r_in, fill, outline=OUTLINE):
    d.ellipse([cx - r_out, cy - r_out, cx + r_out, cy + r_out], fill=fill, outline=outline)
    d.ellipse([cx - r_in, cy - r_in, cx + r_in, cy + r_in], fill=(0, 0, 0, 0))


def draw_stand(d):
    """받침. 회전하지 않는 고정 부분 - 바닥 발판과 축을 향해 뻗는 두 다리."""
    ground = H - 6
    base_top = ground - 6
    # 바닥 발판
    d.polygon(
        [(CX - 30, base_top), (CX + 30, base_top), (CX + 26, ground), (CX - 26, ground)],
        fill=WOOD, outline=OUTLINE,
    )
    d.line([(CX - 24, base_top + 2), (CX + 24, base_top + 2)], fill=WOOD_L)
    d.line([(CX - 22, ground - 2), (CX + 22, ground - 2)], fill=WOOD_D)

    # 두 다리 - 발판에서 축(중심) 높이까지 좁아지며 올라간다
    for side in (-1, 1):
        leg_bottom_out = CX + side * 22
        leg_bottom_in = CX + side * 12
        leg_top = CX + side * 3
        d.polygon(
            [
                (leg_bottom_out, base_top),
                (leg_bottom_in, base_top),
                (leg_top, CY + 2),
                (leg_top - side * 5, CY + 2),
            ],
            fill=STEEL_D,
            outline=OUTLINE,
        )
        d.line([(leg_top - side * 1, CY + 2), (leg_bottom_in - side * 2, base_top)], fill=STEEL)


def draw_disc(theta_deg):
    """회전하는 부분 - 외곽림/안쪽림/발판(rung)/스포크/허브. theta만큼 돌아간 상태로 그린다."""
    img, d = new()

    # 바깥 림, 안쪽 림 (자체가 원이라 회전해도 모양은 같지만, 두께 표현용 하이라이트는 고정 광원 기준)
    # 하이라이트/그림자 호는 테두리 안쪽에 그려야 검정 외곽선 밖으로 번지지 않는다.
    ring(d, CX, CY, R_OUTER, R_OUTER_IN, SILVER)
    d.arc([CX - R_OUTER + 2, CY - R_OUTER + 2, CX + R_OUTER - 2, CY + R_OUTER - 2], 200, 340, fill=SILVER_LL, width=2)
    d.arc([CX - R_OUTER + 2, CY - R_OUTER + 2, CX + R_OUTER - 2, CY + R_OUTER - 2], 20, 160, fill=SILVER_D, width=2)

    ring(d, CX, CY, R_INNER, R_INNER_IN, SILVER_D)
    d.arc([CX - R_INNER + 1, CY - R_INNER + 1, CX + R_INNER - 1, CY + R_INNER - 1], 200, 340, fill=SILVER_L, width=1)

    # 발판(rung) - 안쪽 림과 바깥 림을 잇는 나무 막대 N개, theta만큼 회전한 위치에서 시작.
    # 각도와 무관하게 폭이 같아야 자연스럽다 (예전 버전은 위/아래 발판만 눌러서 바늘처럼 보이는 버그가 있었다).
    for k in range(RUNG_COUNT):
        angle = math.radians(theta_deg + k * (360 / RUNG_COUNT))
        cos_a, sin_a = math.cos(angle), math.sin(angle)
        x_in = CX + cos_a * R_INNER_IN
        y_in = CY + sin_a * R_INNER_IN
        x_out = CX + cos_a * R_OUTER
        y_out = CY + sin_a * R_OUTER
        perp = (-sin_a * 2.4, cos_a * 2.4)
        d.polygon(
            [
                (x_in - perp[0], y_in - perp[1]),
                (x_in + perp[0], y_in + perp[1]),
                (x_out + perp[0], y_out + perp[1]),
                (x_out - perp[0], y_out - perp[1]),
            ],
            fill=WOOD if cos_a > -0.3 else WOOD_D,
            outline=OUTLINE,
        )

    # 스포크 - 발판 사이 각도(오프셋)에서 허브까지, X자 형태로 theta와 함께 회전
    for k in range(SPOKE_COUNT):
        angle = math.radians(theta_deg + (360 / RUNG_COUNT) / 2 + k * (360 / SPOKE_COUNT))
        cos_a, sin_a = math.cos(angle), math.sin(angle)
        x_out = CX + cos_a * R_INNER_IN
        y_out = CY + sin_a * R_INNER_IN
        d.line([(CX, CY), (x_out, y_out)], fill=STEEL_DD, width=3)
        d.line([(CX, CY), (x_out, y_out)], fill=STEEL, width=1)

    # 허브 - 고정된 것처럼 보이는 작은 축 캡 (회전해도 원형이라 티가 안 난다)
    d.ellipse([CX - R_HUB, CY - R_HUB, CX + R_HUB, CY + R_HUB], fill=STEEL, outline=OUTLINE)
    d.ellipse([CX - 2, CY - 3, CX + 1, CY], fill=STEEL_D)

    return img


def build(frame_count):
    """발판(10개, 36도 주기)과 스포크(4개, 90도 주기)가 함께 도는 무늬는 180도마다 완전히 반복된다.
    (36과 90의 최소공배수가 180) 그래서 프레임은 360도가 아니라 180도 구간만 나눠 만들어야
    프레임끼리 겹치지 않고 이어서 재생했을 때 매끄럽게 한 바퀴로 보인다."""
    static, sd = new()
    draw_stand(sd)

    frames = []
    for i in range(frame_count):
        theta = i * (180 / frame_count)
        frame = static.copy()
        frame.alpha_composite(draw_disc(theta))
        frames.append(frame)
    return frames


frames = build(12)
for i, frame in enumerate(frames, start=1):
    save(frame, f"wheel-spin/frame-{i:02d}.png")
save(frames[0], "wheel.png")
