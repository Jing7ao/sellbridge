"""Regenerate brand video with improved prompt."""
import sys, time, json, urllib.request, os
from volcenginesdkarkruntime import Ark

API_KEY = "ark-a57fbfe5-00b5-446f-ac64-df35f3fc6d89-ad51c"
BASE_URL = "https://ark.cn-beijing.volces.com/api/v3"
OUTPUT_DIR = r"c:\Users\高景涛\Desktop\高景涛\cross-border-saas\public"
MODEL = "doubao-seedance-2-0-260128"

PROMPT = """A premium seamless looping brand background video for a SaaS platform login page, 10 seconds, 16:9 widescreen.

Rich flowing gradients of deep indigo, royal purple, and soft violet moving like liquid silk across the frame.
Gently glowing particles drifting slowly upward like luminous dust motes caught in warm light.
Thin elegant golden lines tracing smooth arc paths across the screen, suggesting global shipping routes and connectivity.
A subtle hexagonal geometric mesh appearing and fading in gentle waves.
The motion is slow, smooth, hypnotic — like breathing underwater. Not chaotic or fast.
Color palette: deep indigo base with violet and amethyst midtones, accented by warm amber and rose gold highlights.
Brightness is medium — dark enough for white text to be readable, but with luminous glowing areas that give visual depth and warmth.
The center area is slightly brighter, naturally drawing the eye to where login text would appear.
Absolutely no text, no logos, no human figures, no landscapes, no buildings.
Pure abstract motion graphics with a luxury tech aesthetic — think Apple product launch meets Southeast Asian silk weaving patterns.
The final frame must seamlessly dissolve back into the first frame for perfect infinite looping."""

def main():
    client = Ark(base_url=BASE_URL, api_key=API_KEY)
    print(f"Creating Seedance 2.0 video with refined prompt...")
    print(f"Model: {MODEL} | Duration: 10s | Ratio: 16:9 | Resolution: 720p")

    result = client.content_generation.tasks.create(
        model=MODEL,
        content=[{"type": "text", "text": PROMPT}],
        duration=10,
        ratio="16:9",
        resolution="1080p",
        watermark=False,
    )
    task_id = result.id
    print(f"Task created: {task_id}")

    attempts = 0
    while attempts < 60:
        time.sleep(10)
        attempts += 1
        task = client.content_generation.tasks.get(task_id=task_id)
        status = task.status
        print(f"  [{attempts}] Status: {status}")
        if status == "succeeded":
            video_url = task.content.video_url
            print(f"Video generated!")
            os.makedirs(OUTPUT_DIR, exist_ok=True)
            output_path = os.path.join(OUTPUT_DIR, "brand-video.mp4")
            print(f"Downloading to {output_path}...")
            urllib.request.urlretrieve(video_url, output_path)
            size_mb = os.path.getsize(output_path) / (1024 * 1024)
            print(f"Done! {size_mb:.1f} MB")
            return
        elif status == "failed":
            err = task.model_dump().get('error', 'Unknown')
            print(f"Failed: {err}")
            sys.exit(1)
    print("Timed out")
    sys.exit(1)

if __name__ == "__main__":
    main()
