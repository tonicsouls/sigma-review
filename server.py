import os
import json
import subprocess
import logging
from flask import Flask, request, jsonify
from flask_cors import CORS
from pathlib import Path

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

app = Flask(__name__)
# Enable CORS for all routes, allowing requests from localhost:5173
CORS(app, resources={r"/*": {"origins": "*"}})

# Configuration - specific to this user's environment
# C:\Users\Darry\OneDrive\Brain Candy portal OMBU\ROOT_BODY_X\Organs_apps\VSCodeWorkingDocs\COS-CE-2026_0106
PROJECT_ROOT = Path(r"C:\Users\Darry\OneDrive\Brain Candy portal OMBU\ROOT_BODY_X\Organs_apps\VSCodeWorkingDocs\COS-CE-2026_0106")
DRAFT_DIR = PROJECT_ROOT / "externaldata/proposal/BETA/01012026_content_F/Hour 1 - Sanitation"
GENERATOR_SCRIPT = PROJECT_ROOT / "tools/ce_media_generator_omega.py"

@app.route('/health', methods=['GET'])
def health():
    return jsonify({"status": "ok", "mode": "omega_bridge"})

@app.route('/update_prompt', methods=['POST'])
def update_prompt():
    """
    Updates the text content in image_prompts.txt or script.txt.
    Does NOT trigger generation, just saves the file.
    """
    data = request.json
    block_id = data.get('blockId')
    asset_type = data.get('assetType') # 'image_prompts' or 'script'
    content = data.get('content')
    
    # Validation
    if not block_id or not asset_type:
         return jsonify({"error": "Missing blockId or assetType"}), 400

    block_dir_name = f"block_{block_id}"
    block_dir = DRAFT_DIR / block_dir_name
    
    if not block_dir.exists():
        logger.error(f"Block directory not found: {block_dir}")
        return jsonify({"error": f"Block {block_id} not found at {block_dir}"}), 404

    try:
        if asset_type == 'script':
            script_file = block_dir / "script.txt"
            # Simple overwrite for script
            script_file.write_text(content, encoding='utf-8')
            logger.info(f"Updated script for Block {block_id}")

        elif asset_type == 'image_prompts':
            prompts_file = block_dir / "image_prompts.txt"
            # Overwrite the entire image prompts file
            prompts_file.write_text(content, encoding='utf-8')
            logger.info(f"Updated image_prompts for Block {block_id}")

        return jsonify({"status": "saved", "path": str(block_dir)})
    except Exception as e:
        logger.error(f"Error saving file: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/generate', methods=['POST'])
def generate():
    """
    Triggers the python generation script.
    """
    data = request.json
    block_id = data.get('blockId')
    targets = data.get('targets') # ['slide_a', 'slide_b'] or empty for all
    force = data.get('force', False)
    
    if not block_id:
        return jsonify({"error": "Missing blockId"}), 400

    # Build Command
    # python tools/ce_media_generator_omega.py --block 001 [--force] [--regenerate slide_a slide_b]
    cmd = ["python", str(GENERATOR_SCRIPT), "--block", str(block_id)]
    
    if force:
        cmd.append("--force")
        
    if targets and len(targets) > 0:
        cmd.append("--regenerate")
        cmd.extend(targets)

    logger.info(f"Running command: {' '.join(cmd)}")

    # Launch background process
    try:
        # Running synchronously for now to report status back immediately
        # In production for long jobs, we might want a job queue
        result = subprocess.run(cmd, capture_output=True, text=True)
        
        if result.returncode == 0:
            logger.info("Generation successful")
            return jsonify({
                "status": "success", 
                "log": result.stdout,
                "targets": targets
            })
        else:
            logger.error(f"Generation failed: {result.stderr}")
            return jsonify({
                "error": "Generation failed", 
                "details": result.stderr,
                "stdout": result.stdout
            }), 500
            
    except Exception as e:
        logger.error(f"Execution error: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/scorpion/manifest', methods=['GET'])
def get_manifest():
    """
    Returns a list of available blocks in the OMEGA directory.
    Starting simple: Just listing the direct subdirectories appropriately.
    """
    # Look in the configured DRAFT_DIR (or should we look in OMEGA?)
    # The generator READS from DRAFT_DIR and WRITES to OMEGA_DIR.
    # The Review Studio probably wants to see the INPUT (Draft) so it can trigger generation?
    # OR it wants to see the OUTPUT (Omega) to verify?
    # Given "Regen" context, we probably want to load the DRAFT structure as the "Source of Truth"
    # and then overlay the OMEGA assets if they exist.
    
    # Let's stick to DRAFT_DIR for structure for now as that has the scripts.
    
    blocks = []
    if DRAFT_DIR.exists():
        for item in DRAFT_DIR.iterdir():
            if item.is_dir() and item.name.startswith("block_"):
                # Format: "Hour 1 - Sanitation/block_001"
                # The frontend expects a relative path string that it passes back to fetchBlock
                blocks.append(f"{DRAFT_DIR.name}/{item.name}")
    
    return jsonify({"blocks": blocks})

@app.route('/api/scorpion/<path:subpath>', methods=['GET'])
def get_block_or_asset(subpath):
    """
    Serves either a Block JSON (constructed on fly) or a raw asset file.
    """
    # subpath e.g. "Hour 1 - Sanitation/block_001"
    
    # 1. Check if it's a request for the Block Data
    # The frontend calls fetchBlock with the path from manifest.
    
    # We need to distinguish between "Fetch Data" and "Fetch Image"
    # The frontend just GETs the URL.
    
    full_path = PROJECT_ROOT / "externaldata/proposal/BETA/01012026_content_F" / subpath
    
    if not full_path.exists():
         # Try OMEGA for assets?
         # If asking for an image that was generated: "slide_a.jpeg"
         # It might reside in OMEGA_DIR
         # Let's check OMEGA mapping.
         
         # Hacky path mapping for assets:
         # incoming: .../block_001/slide_a.jpeg
         # real: .../OMEGA/HOUR_01/block_001/images/slide_a.jpeg
         
         parts = Path(subpath).parts
         if len(parts) >= 2 and parts[-1].lower().endswith(('.jpg', '.jpeg', '.png', '.wav')):
             block_name = parts[-2] # block_001
             fname = parts[-1]
             omega_path = PROJECT_ROOT / "externaldata/proposal/OMEGA/HOUR_01" / block_name / "images" / fname
             if omega_path.exists():
                 return send_file(omega_path)
             
         return jsonify({"error": "Not found"}), 404

    if full_path.is_dir():
        # Construct the "ScorpionBlock" JSON on the fly from the directory contents
        block_id = full_path.name.replace("block_", "")
        
        # Parse script
        script_content = ""
        script_file = full_path / "script.txt"
        if script_file.exists():
            script_content = script_file.read_text(encoding='utf-8')
            
        # Parse prompts
        prompts = []
        prompts_file = full_path / "image_prompts.txt"
        if prompts_file.exists():
            # Quick Regex Parse
            import re
            p_text = prompts_file.read_text(encoding='utf-8')
            matches = re.findall(r'IMAGE (\d+) \(([^)]+)\):\s*\n(.+?)(?=\nIMAGE \d+|$)', p_text, re.DOTALL)
            for m in matches:
                prompts.append({
                    "id": m[0],
                    "timestamp": m[1],
                    "text": m[2].strip()
                })

        # Construct Atoms
        atoms = []
        
        # Script Atom
        atoms.append({
            "atom_id": "script-001",
            "atom_type": "script",
            "content": {
                "SCENARIO": script_content[:100] + "...", # Placeholder parsing
                "COSMETOLOGY_CONNECTION": "Parsed connection...", 
                "THE_LAW": "Parsed law..."
            }
        })
        
        # Visual Atoms
        for p in prompts:
            slide_char = chr(96 + int(p['id']))
            atoms.append({
                "atom_id": f"visual-{p['id']}",
                "atom_type": "visual",
                "asset_id": f"slide_{slide_char}.jpeg", # Expected filename
                "metadata": {
                    "prompt": p['text'],
                    "description": f"Timestamp: {p['timestamp']}"
                }
            })
            
        return jsonify({
            "block_id": block_id,
            "block_title": f"Block {block_id}",
            "lesson_title": "Sanitation",
            "hour_name": "Hour 1",
            "duration_minutes": 5,
            "tdlr_citation": "101.1",
            "atoms": atoms
        })
        
    # If it's a file (and we didn't catch it in OMEGA check above)
    from flask import send_file
    return send_file(full_path)

if __name__ == '__main__':
    print(f"Starting Omega Server...")
    print(f"Project Root: {PROJECT_ROOT}")
    print(f"DRAFT_DIR: {DRAFT_DIR}")
    print(f"Generator: {GENERATOR_SCRIPT}")
    app.run(port=5000, debug=True)
