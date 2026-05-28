"""Generate 8s cooling summer scenery video with Seedance for social media."""
import sys, time, json, urllib.request, os
from volcenginesdkarkruntime import Ark

API_KEY = "ark-a57fbfe5-00b5-446f-ac64-df35f3fc6d89-ad51c"
BASE_URL = "https://ark.cn-beijing.volces.com/api/v3"
OUTPUT_DIR = r"c:\Users\13639\sellbridge\public"
MODEL = "doubao-seedance-2-0-260128"

PROMPT = """An 8-second ultra-high-quality vertical healing cinematic video (9:16) for a social media short, evoking a feeling of coolness and serenity during hot summer weather.

Scene: A pristine mountain forest stream flowing gently over smooth moss-covered rocks. Crystal-clear water visible with soft ripples catching dappled sunlight filtering through lush green tree canopy. Light mist hovering above the water surface, creating a cooling atmospheric haze. A gentle breeze subtly moving leaves and fern fronds at the edges of the frame.

Color palette: Cool refreshing tones — deep forest greens, translucent water blues, soft misty whites, with warm golden sun rays cutting through the coolness, creating a perfect balance.

Camera movement: Very slow and smooth cinematic pan, starting from the stream surface and gently tilting up through the filtered forest light to reveal the canopy. The motion is nearly imperceptible — meditative and calming.

Atmosphere: Breathing, alive, tranquil. The visual equivalent of stepping into air-conditioned nature. No text overlays, no human figures, no buildings, no animals.

Style: National Geographic nature documentary grade — photorealistic, rich in texture and depth, with soft natural lighting and a dreamy shallow depth of field effect. The feeling of a cool mountain morning captured in motion."""

def main():
    client = Ark(base_url=BASE_URL, api_key=API_KEY)
    print(f"Creating Seedance 2.0 cooling summer scenery (8s, 9:16, 1080p)...")
    print(f"Model: {MODEL} | Duration: 8s | Ratio: 9:16 | Resolution: 1080p")

    result = client.content_generation.tasks.create(
        model=MODEL,
        content=[{"type": "text", "text": PROMPT}],
        duration=8,
        ratio="9:16",
        resolution="1080p",
        watermark=False,
        generate_audio=True,
    )
    task_id = result.id
    print(f"Task created: {task_id}")

    attempts = 0
    while attempts < 60:
        time.sleep(15)
        attempts += 1
        task = client.content_generation.tasks.get(task_id=task_id)
        status = task.status
        print(f"  [{attempts}] Status: {status}")
        if status == "succeeded":
            video_url = task.content.video_url
            print(f"Video generated!")
            os.makedirs(OUTPUT_DIR, exist_ok=True)
            output_path = os.path.join(OUTPUT_DIR, "cooling-summer.mp4")
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
