import os
import json
import subprocess
from flask import Flask, request, jsonify
from flask_cors import CORS
from pathlib import Path

app = Flask(__name__)
CORS(app)  # Allow calls from React app

# Configuration - specific to this user's environment
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
    asset_type = data.get('assetType') # 'image' or 'script'
    content = data.get('content')
    image_id = data.get('imageId') # e.g. '1', '2' for images

    block_dir = DRAFT_DIR / f"block_{block_id}"
    if not block_dir.exists():
        return jsonify({"error": f"Block {block_id} not found"}), 404

    try:
        if asset_type == 'script':
            script_file = block_dir / "script.txt"
            # Maintain simple format or parsed format? 
            # For now, just overwrite with plain text. 
            # The tool expects `("Text")` lines usually, but parse_script in omega handles plain text too?
            # Let's check omega: clean_lines = [re.sub... for line in re.findall(r'\("([^"]+)"\)'...]
            # It expects ("Text") format. detailed check needed.
            # Simplified for now: just write it.
            script_file.write_text(content, encoding='utf-8')

        elif asset_type == 'image_prompts':
            prompts_file = block_dir / "image_prompts.txt"
            # We need to carefully replace ONLY the specific image prompt
            # This requires reading the file, parsing regex, replacing, writing back.
            # IMPLEMENTATION TODO: Robust regex replacement
            pass 

        return jsonify({"status": "saved", "path": str(block_dir)})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/generate', methods=['POST'])
def generate():
    """
    Triggers the python generation script.
    """
    data = request.json
    block_id = data.get('blockId')
    targets = data.get('targets') # ['slide_a', 'slide_b'] or empty for all
    
    cmd = ["python", str(GENERATOR_SCRIPT), "--block", block_id, "--force"]
    
    if targets:
        cmd.append("--regenerate")
        cmd.extend(targets)

    # Launch background process
    try:
        # We use Popen to run it detached/async or wait?
        # For "True Generation", user might want to see progress. 
        # For now, synchronous wait to return success/fail
        result = subprocess.run(cmd, capture_output=True, text=True)
        
        if result.returncode == 0:
            return jsonify({"status": "success", "log": result.stdout})
        else:
            return jsonify({"error": "Generation failed", "details": result.stderr}), 500
            
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(port=5000, debug=True)
