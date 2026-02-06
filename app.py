import os
import time
import json
import google.generativeai as genai
from flask import Flask, render_template, request, jsonify

# --- CONFIGURATION ---
GOOGLE_API_KEY = "AIzaSyAmhD5nPUCNBwBlrqn1ZETj2-GSOIoyszY" # 🔑 Replace with your actual key
genai.configure(api_key=GOOGLE_API_KEY)
model = genai.GenerativeModel("gemini-2.5-flash")

app = Flask(__name__)
UPLOAD_FOLDER = 'uploads'

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/analyze", methods=["POST"])
def analyze():
    video_path = None
    cloud_file_name = None
    try:
        if 'video' not in request.files:
            return jsonify({"error": "No video file found"}), 400
        
        # Get the question selected by the user in the frontend
        q_asked = request.form.get("question", "General Introduction")
        
        video_file = request.files['video']
        timestamp = int(time.time())
        video_path = os.path.join(UPLOAD_FOLDER, f"interview_{timestamp}.webm")
        video_file.save(video_path)

        # 1. Upload to Gemini Cloud
        user_video = genai.upload_file(path=video_path)
        cloud_file_name = user_video.name

        # 2. Wait for processing loop
        while user_video.state.name == "PROCESSING":
            time.sleep(2)
            user_video = genai.get_file(cloud_file_name)

        # 3. Request Multi-modal Analysis with Question Context
        # We explicitly tell Gemini to check for "Accuracy" against the question asked.
        prompt = f"""
        Analyze this interview video for the following question: "{q_asked}"
        
        Evaluate the candidate based on:
        1. Technical Accuracy: Does the answer correctly address "{q_asked}"? 
        2. Soft Skills: Critical review of eye contact, posture, and facial expressions.
        3. Communication: Tone of voice, speaking pace, and use of filler words.

        Return ONLY a JSON object with this exact structure:
        {{
          "transcript": "...",
          "accuracy_score": 0-100,
          "confidence_score": 0-100,
          "eye_contact": "Summary of eye contact performance",
          "facial_expressions": "Summary of visual cues",
          "speaking_style": "Summary of tone and pace",
          "technical_feedback": "Detailed critique of the answer's technical correctness",
          "feedback_points": ["Specific Tip 1", "Specific Tip 2", "Specific Tip 3"]
        }}
        """

        # Using generation_config to force JSON response
        response = model.generate_content(
            [prompt, user_video],
            generation_config={"response_mime_type": "application/json"}
        )
        
        return jsonify(json.loads(response.text))

    except Exception as e:
        print(f"Server Error: {str(e)}")
        return jsonify({"error": str(e)}), 500
    
    finally:
        # 4. Cleanup: Remove local file and Cloud file to protect privacy and save space
        if cloud_file_name:
            try:
                genai.delete_file(cloud_file_name)
            except:
                pass
        if video_path and os.path.exists(video_path):
            os.remove(video_path)
    

if __name__ == "__main__":
    app.run(debug=True)
