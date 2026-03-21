import io
import json
from typing import List
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import PyPDF2
import docx
import os
from dotenv import load_dotenv
import google.generativeai as genai

load_dotenv() # Load variables from .env

# --- AI SETUP ---
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    GEMINI_API_KEY = "YOUR_API_KEY_HERE" # Fallback to prevent immediate crash if .env is missing, will be handled below

genai.configure(api_key=GEMINI_API_KEY)

# We configure the model to STRICTLY output JSON format
model = genai.GenerativeModel(
    'gemini-2.5-flash',
    generation_config={"response_mime_type": "application/json"}
)

app = FastAPI(title="Omni-Doc AI Parser")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_methods=["*"],
    allow_headers=["*"],
)

def extract_text(file_bytes, filename):
    ext = filename.split('.')[-1].lower()
    if ext == 'pdf':
        reader = PyPDF2.PdfReader(io.BytesIO(file_bytes))
        return "\n".join([page.extract_text() for page in reader.pages if page.extract_text()])
    elif ext == 'docx':
        doc = docx.Document(io.BytesIO(file_bytes))
        return "\n".join([p.text for p in doc.paragraphs])
    return ""

@app.post("/analyze")
async def analyze_documents(prompt: str = Form(...), files: List[UploadFile] = File(...)):
    try:
        combined_text = ""
        for file in files:
            content = await file.read()
            text = extract_text(content, file.filename)
            combined_text += f"\n--- START OF {file.filename} ---\n{text}\n--- END OF {file.filename} ---\n"

        if GEMINI_API_KEY == "YOUR_API_KEY_HERE" or not GEMINI_API_KEY:
            raise HTTPException(status_code=400, detail="Please add your Gemini API Key to main.py to use the extraction feature!")

        # The Master Prompt: Forcing the AI to act as a Data Engineer
        ai_prompt = f"""
        You are an expert data extraction algorithm. Analyze the documents based on the user's prompt.
        You MUST return ONLY a valid JSON object with this exact structure:
        {{
            "message": "A brief text summary of what you found.",
            "extracted_data": [
                {{"Filename": "name of file", "Data_Point_1": "value", "Data_Point_2": "value"}}
            ]
        }}
        Make the keys in 'extracted_data' highly descriptive based on what the user asked for (e.g., "GST_Number", "Total_Amount", "Date").
        
        USER PROMPT: {prompt}
        
        DOCUMENTS:
        {combined_text}
        """

        response = model.generate_content(ai_prompt)
        
        # Convert the AI's string response into a real Python dictionary
        ai_json_data = json.loads(response.text)
        
        return {
            "status": "success",
            "ai_data": ai_json_data
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))