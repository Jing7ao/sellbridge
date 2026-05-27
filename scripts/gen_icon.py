from PIL import Image, ImageDraw
import math

size = 512
img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
draw = ImageDraw.Draw(img)

margin = 32
r = 112  # radius (14/64 * 512)
x1, y1, x2, y2 = margin, margin, size - margin, size - margin

# Draw rounded rect with gradient
for y in range(y1, y2):
    ratio = (y - y1) / (y2 - y1)
    r_val = int(99 + (139 - 99) * ratio)
    g_val = int(102 + (92 - 102) * ratio)
    b_val = int(241 + (246 - 241) * ratio)
    for x in range(x1, x2):
        inside = True
        if x < x1 + r and y < y1 + r:
            if (x - (x1 + r)) ** 2 + (y - (y1 + r)) ** 2 > r ** 2:
                inside = False
        if x > x2 - r and y < y1 + r:
            if (x - (x2 - r)) ** 2 + (y - (y1 + r)) ** 2 > r ** 2:
                inside = False
        if x < x1 + r and y > y2 - r:
            if (x - (x1 + r)) ** 2 + (y - (y2 - r)) ** 2 > r ** 2:
                inside = False
        if x > x2 - r and y > y2 - r:
            if (x - (x2 - r)) ** 2 + (y - (y2 - r)) ** 2 > r ** 2:
                inside = False
        if inside:
            img.putpixel((x, y), (r_val, g_val, b_val, 255))

# Draw white S letter
scale = (size - 2 * margin) / 56.0
ox, oy = margin - 4 * scale, margin - 4 * scale

def pt(x, y):
    return (ox + x * scale, oy + y * scale)

def bezier_point(t, p0, p1, p2, p3):
    u = 1 - t
    x = u**3 * p0[0] + 3*u**2*t * p1[0] + 3*u*t**2 * p2[0] + t**3 * p3[0]
    y = u**3 * p0[1] + 3*u**2*t * p1[1] + 3*u*t**2 * p2[1] + t**3 * p3[1]
    return (x, y)

beziers = [
    ((20,20), (20,16), (44,16), (44,20)),
    ((44,20), (44,26), (20,24), (20,30)),
    ((20,30), (20,36), (44,38), (44,44)),
    ((44,44), (44,48), (20,48), (20,44)),
]

stroke_w = 6 * scale
points = []
for bez in beziers:
    for i in range(51):
        t = i / 50.0
        x, y = bezier_point(t, bez[0], bez[1], bez[2], bez[3])
        points.append(pt(x, y))

for i in range(len(points) - 1):
    x1, y1 = points[i]
    x2, y2 = points[i + 1]
    r2 = int(stroke_w / 2)
    for dx in range(-r2, r2 + 1):
        for dy in range(-r2, r2 + 1):
            if dx*dx + dy*dy <= r2*r2:
                nx, ny = int(x1 + dx), int(y1 + dy)
                if margin <= nx < size - margin and margin <= ny < size - margin:
                    img.putpixel((nx, ny), (255, 255, 255, 255))

# Round caps
for px, py in [points[0], points[-1]]:
    r2 = int(stroke_w / 2)
    for dx in range(-r2, r2 + 1):
        for dy in range(-r2, r2 + 1):
            if dx*dx + dy*dy <= r2*r2:
                nx, ny = int(px + dx), int(py + dy)
                if margin <= nx < size - margin and margin <= ny < size - margin:
                    img.putpixel((nx, ny), (255, 255, 255, 255))

img.save(r"c:\Users\13639\sellbridge\public\brand-icon.png")
print("PNG saved")
