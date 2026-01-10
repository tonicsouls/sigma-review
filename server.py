import os
import json
import subprocess
import logging
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from pathlib import Path

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

# Configuration - specific to this user's environment
PROJECT_ROOT = Path(r"C:\Users\Darry\OneDrive\Brain Candy portal OMBU\ROOT_BODY_X\Organs_apps\VSCodeWorkingDocs\COS-CE-2026_0106")
SIGMA_V3_DIR = PROJECT_ROOT / "externaldata/proposal/SIGMA/v3"
OMEGA_DIR = PROJECT_ROOT / "externaldata/proposal/OMEGA/HOUR_01"
GENERATOR_SCRIPT = SIGMA_V3_DIR / "sigma_generator.py"

@app.route('/health', methods=['GET'])
def health():
    return jsonify({"status": "ok", "mode": "sigma_v3_bridge", "v3_connected": SIGMA_V3_DIR.exists()})

@app.route('/update_prompt', methods=['POST'])
def update_prompt():
    """
    Updates the text content in image_prompts.txt or script.txt (in OMEGA source folder).
    """
    data = request.json
    block_id = data.get('blockId')
    asset_type = data.get('assetType') # 'image_prompts' or 'script'
    content = data.get('content')
    
    if not block_id or not asset_type:
         return jsonify({"error": "Missing blockId or assetType"}), 400

    block_dir = OMEGA_DIR / f"block_{block_id}"
    
    if not block_dir.exists():
        logger.error(f"Source block directory not found at OMEGA: {block_dir}")
        return jsonify({"error": f"Source Block {block_id} not found at {block_dir}"}), 404

    try:
        if asset_type == 'script':
            script_file = block_dir / "script.txt"
            script_file.write_text(content, encoding='utf-8')
            logger.info(f"Updated script for Block {block_id}")
        elif asset_type == 'image_prompts':
            prompts_file = block_dir / "image_prompts.txt"
            prompts_file.write_text(content, encoding='utf-8')
            logger.info(f"Updated image_prompts for Block {block_id}")
        return jsonify({"status": "saved", "path": str(block_dir)})
    except Exception as e:
        logger.error(f"Error saving file: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/generate', methods=['POST'])
def generate():
    """
    Triggers the sigma generation script in SIGMA/v3.
    """
    data = request.json
    block_id = data.get('blockId')
    targets = data.get('targets')
    force = data.get('force', False)
    
    if not block_id:
        return jsonify({"error": "Missing blockId"}), 400

    # Command for sigma_generator.py
    cmd = ["python", str(GENERATOR_SCRIPT), "--block", str(block_id)]
    if force: cmd.append("--force")
    if targets and len(targets) > 0:
        cmd.append("--regenerate")
        cmd.extend(targets)

    logger.info(f"Running command: {' '.join(cmd)}")
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, cwd=str(SIGMA_V3_DIR))
        if result.returncode == 0:
            return jsonify({"status": "success", "log": result.stdout})
        else:
            return jsonify({"error": "Generation failed", "details": result.stderr, "stdout": result.stdout}), 500
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/scorpion/manifest', methods=['GET'])
def get_manifest():
    """
    Returns a list of available blocks in the SIGMA/v3 directory.
    """
    blocks = []
    if SIGMA_V3_DIR.exists():
        # Specifically filter for block_ folders
        for item in sorted(SIGMA_V3_DIR.iterdir()):
            if item.is_dir() and item.name.startswith("block_"):
                blocks.append(f"Hour 1 - Sanitation/{item.name}")
    return jsonify({"blocks": blocks})

@app.route('/api/scorpion/<path:subpath>', methods=['GET'])
def get_block_or_asset(subpath):
    # incoming subpath e.g. "Hour 1 - Sanitation/block_001" or "Hour 1 - Sanitation/block_001/slide_a.png"
    
    parts = Path(subpath).parts
    if len(parts) < 2:
        return jsonify({"error": "Invalid path"}), 400
        
    block_name = parts[1] if parts[0].startswith("Hour") else parts[0]
    block_id = block_name.replace("block_", "")
    
    # If it's a file request (image, audio)
    if subpath.lower().endswith(('.png', '.jpg', '.jpeg', '.wav')):
        fname = parts[-1]
        file_path = SIGMA_V3_DIR / block_name / fname
        if file_path.exists():
            return send_file(file_path)
            
        # Fallback to OMEGA for audio if not in V3
        if subpath.endswith('.wav'):
             omega_audio = OMEGA_DIR / block_name / "audio.wav"
             if omega_audio.exists():
                  return send_file(omega_audio)
                  
        return jsonify({"error": f"File {fname} not found in {block_name}"}), 404

    # If it's a block data request
    block_v3_dir = SIGMA_V3_DIR / block_name
    if not block_v3_dir.exists():
        return jsonify({"error": "Block directory not found"}), 404

    # 1. Parse Generation Log for Visual Atoms
    atoms = []
    log_file = block_v3_dir / "_generation_log.json"
    if log_file.exists():
        try:
            log_data = json.loads(log_file.read_text(encoding='utf-8'))
            for slide in log_data.get('slides', []):
                atoms.append({
                    "atom_id": f"visual-{slide['slide_id']}",
                    "atom_type": "visual",
                    "asset_id": f"slide_{slide['slide_id']}.png",
                    "metadata": {
                        "prompt": "Loading from OMEGA...",
                        "timestamp": slide.get('timestamp', '0:00'),
                        "slide_num": slide.get('image_num', '1')
                    }
                })
        except Exception as e:
            logger.error(f"Error parsing log {log_file}: {e}")

    # 2. Parse OMEGA for Script and Full Prompts
    omega_block_dir = OMEGA_DIR / block_name
    script_content = ""
    if omega_block_dir.exists():
        # Script
        sf = omega_block_dir / "script.txt"
        if sf.exists(): script_content = sf.read_text(encoding='utf-8')
        
        # Prompts (try image_prompts.txt or prompts_debug.md)
        pf = omega_block_dir / "image_prompts.txt"
        if not pf.exists(): pf = omega_block_dir / "prompts_debug.md"
        
        if pf.exists():
            p_text = pf.read_text(encoding='utf-8')
            # Extract real prompts and update visual atoms
            for atom in atoms:
                slide_num = atom['metadata'].get('slide_num')
                import re
                # Try IMAGE 1: or Image 1: format
                match = re.search(fr'IMAGE {slide_num}.*?:\s*\n(.+?)(?=\nIMAGE|$)', p_text, re.DOTALL | re.IGNORECASE)
                if match:
                    atom['metadata']['prompt'] = match.group(1).strip()

    # 3. Add Script Atom
    atoms.insert(0, {
        "atom_id": "script-001",
        "atom_type": "script",
        "content": {
            "SCENARIO": "Full Script",
            "COSMETOLOGY_CONNECTION": "N/A",
            "THE_LAW": "N/A",
            "full_text": script_content
        }
    })

    return jsonify({
        "block_id": block_id,
        "block_title": f"Block {block_id} - Sanitation",
        "hour_name": "Hour 1",
        "duration_minutes": 5,
        "atoms": atoms
    })

if __name__ == '__main__':
    logger.info(f"Starting Sigma V3 Bridge Server...")
    logger.info(f"V3 Source: {SIGMA_V3_DIR}")
    logger.info(f"Omega Source: {OMEGA_DIR}")
    app.run(port=5000, debug=True)
