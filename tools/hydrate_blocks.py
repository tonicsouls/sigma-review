import os
import json
import shutil
from pathlib import Path

# Paths
V3_DIR = Path(r"C:\Users\Darry\OneDrive\Brain Candy portal OMBU\ROOT_BODY_X\Organs_apps\VSCodeWorkingDocs\COS-CE-2026_0106\externaldata\proposal\SIGMA\v3")
OMEGA_DIR = Path(r"C:\Users\Darry\OneDrive\Brain Candy portal OMBU\ROOT_BODY_X\Organs_apps\VSCodeWorkingDocs\COS-CE-2026_0106\externaldata\proposal\OMEGA\HOUR_01")
BETA_DIR = Path(r"C:\Users\Darry\OneDrive\Brain Candy portal OMBU\ROOT_BODY_X\Organs_apps\VSCodeWorkingDocs\COS-CE-2026_0106\externaldata\proposal\BETA\content_D\GOAL_ Generated cotnet as exmpletes, only h1b1-3 and h2blk1-3\content_ example")
DRAFT_DIR = Path(r"C:\Users\Darry\OneDrive\Brain Candy portal OMBU\ROOT_BODY_X\Organs_apps\VSCodeWorkingDocs\COS-CE-2026_0106\externaldata\proposal\DRAFT CONTENT")
PUBLIC_DIR = Path(r"C:\Users\Darry\OneDrive\Brain Candy portal OMBU\ROOT_BODY_X\Organs_apps\VSCodeWorkingDocs\COS-CE-2026_0106\externaldata\proposal\SIGMA_REVIEW_STUDIO\public\assets")

def hydrate_block(block_id, hour=1, source='v3'):
    block_name = f"block_{block_id}"
    
    if source == 'v3':
        src_dir = V3_DIR / block_name
        ext = ".png"
    else:
        src_dir = BETA_DIR / f"hour_{hour}" / block_name
        ext = ".jpeg"

    src_dir_exists = src_dir.exists()
    if not src_dir_exists:
        print(f"Warning: {block_name} (H{hour}) not found in {source}. Proceeding with DRAFT ONLY.")

    # 1. Setup Public Dirs
    img_dest = PUBLIC_DIR / "images" / block_name
    aud_dest = PUBLIC_DIR / "audio" / block_name
    man_dest = PUBLIC_DIR / "manifests"
    
    img_dest.mkdir(parents=True, exist_ok=True)
    aud_dest.mkdir(parents=True, exist_ok=True)
    man_dest.mkdir(parents=True, exist_ok=True)

    # 2. Copy Assets
    slides = []
    if src_dir_exists:
        for f in sorted(src_dir.glob(f"slide_*{ext}")):
            shutil.copy2(f, img_dest / f.name)
            slide_id = f.stem.split("_")[1]
            slides.append(slide_id)

    # Audio
    audio_wav_exists = False
    if src_dir_exists:
        audio_wav = src_dir / "audio.wav"
        if audio_wav.exists():
            shutil.copy2(audio_wav, aud_dest / "audio.wav")
            audio_wav_exists = True
        elif source == 'v3':
            audio_omega = OMEGA_DIR / block_name / "audio.wav"
            if audio_omega.exists():
                shutil.copy2(audio_omega, aud_dest / "audio.wav")
                audio_wav_exists = True

    # 3. Create Manifest Metadata (from DRAFT CONTENT)
    if hour == 1:
        draft_block_dir = DRAFT_DIR / "h1" / "Hour 1 - Sanitation" / block_name
    else:
        draft_block_dir = DRAFT_DIR / f"h{hour}" / block_name

    title = f"Block {block_id}"
    citation = "§83.100"
    content = {"SCENARIO": "N/A", "COSMETOLOGY_CONNECTION": "N/A", "THE_LAW": "N/A"}
    audio_script = "N/A"
    
    draft_man = draft_block_dir / "manifest.json"
    draft_script = draft_block_dir / "script.txt"

    if draft_man.exists():
        try:
            with open(draft_man, 'r', encoding='utf-8') as f:
                 d_data = json.load(f)
                 title = d_data.get('title', title)
                 citation = d_data.get('tdlr_citation', citation)
                 d_content = d_data.get('content', {})
                 content["SCENARIO"] = d_content.get('scenario', content["SCENARIO"])
                 content["COSMETOLOGY_CONNECTION"] = d_content.get('connection', content["COSMETOLOGY_CONNECTION"])
                 content["THE_LAW"] = d_content.get('law', content["THE_LAW"])
        except: pass
    
    if draft_script.exists():
        audio_script = draft_script.read_text(encoding='utf-8')

    prompts = {}
    if source == 'v3':
        omega_prompts_file = OMEGA_DIR / block_name / "image_prompts.txt"
        if not omega_prompts_file.exists():
            omega_prompts_file = OMEGA_DIR / block_name / "prompts_debug.md"
        if omega_prompts_file.exists():
             import re
             p_text = omega_prompts_file.read_text(encoding='utf-8')
             for s_id in slides:
                idx = ord(s_id) - ord('a') + 1
                match = re.search(fr'IMAGE {idx}.*?:\s*\n(.+?)(?=\nIMAGE|$)', p_text, re.DOTALL | re.IGNORECASE)
                if match: prompts[s_id] = match.group(1).strip()
    
    atoms = []
    # Visual Atoms
    for s_id in slides:
        atoms.append({
            "atom_id": f"vis-{block_id}-{s_id}",
            "atom_type": "visual",
            "asset_id": f"{block_name}/slide_{s_id}{ext}",
            "metadata": {
                "prompt": prompts.get(s_id, f"Shot {s_id.upper()}"),
                "description": f"Slide {s_id.upper()}"
            }
        })
    
    # Script Atom
    atoms.append({
        "atom_id": f"script-{block_id}", 
        "atom_type": "script", 
        "content": content,
        "metadata": {"full_script": audio_script}
    })
    
    # Audio Atom
    if audio_wav_exists:
        atoms.append({
            "atom_id": f"aud-{block_id}", 
            "atom_type": "audio", 
            "asset_id": f"{block_name}/audio.wav", 
            "metadata": {"linked_script_atom": f"script-{block_id}"}
        })

    manifest = {
        "block_id": block_id,
        "block_title": title,
        "lesson_title": f"Hour {hour} Lesson",
        "hour_name": f"Hour {hour}",
        "duration_minutes": 5,
        "tdlr_citation": citation,
        "atoms": atoms
    }

    # 5. Save Manifest
    with open(man_dest / f"h{hour}_block_{block_id}.json", "w", encoding='utf-8') as f:
        json.dump(manifest, f, indent=2)

    print(f"Hydrated h{hour}_block_{block_id} from {source}.")

if __name__ == "__main__":
    # Hour 1 from V3
    h1_v3 = ["001", "002", "003", "004", "005", "007", "008", "010", "011", "013", "014", "016", "017", "019", "020", "022"]
    for b in h1_v3: hydrate_block(b, 1, 'v3')
    
    # Demo blocks for H3/H4 from Beta
    hydrate_block("001", 3, 'beta')
    hydrate_block("002", 3, 'beta')
    hydrate_block("001", 4, 'beta')
    hydrate_block("002", 4, 'beta')
