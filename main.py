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
import openpyxl

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

@app.get("/")
async def root():
    return {"status": "Omni-Doc API is completely healthy and running!"}

def extract_text(file_bytes, filename):
    ext = filename.split('.')[-1].lower()
    if ext == 'pdf':
        reader = PyPDF2.PdfReader(io.BytesIO(file_bytes))
        return "\n".join([page.extract_text() for page in reader.pages if page.extract_text()])
    elif ext == 'docx':
        doc = docx.Document(io.BytesIO(file_bytes))
        return "\n".join([p.text for p in doc.paragraphs])
    elif ext == 'xlsx':
        wb = openpyxl.load_workbook(io.BytesIO(file_bytes))
        text = ""
        for sheet in wb.worksheets:
            for row in sheet.iter_rows(values_only=True):
                text += " ".join([str(cell) for cell in row if cell is not None]) + "\n"
        return text
    return ""

@app.post("/analyze")
async def analyze_documents(prompt: str = Form(...), files: List[UploadFile] = File(...)):
    try:
        if GEMINI_API_KEY == "YOUR_API_KEY_HERE" or not GEMINI_API_KEY:
            raise HTTPException(status_code=400, detail="Please add your Gemini API Key to .env to use the extraction feature!")

        # Prepare multimodal content for Gemini
        # We start with the Master Prompt instructions
        ai_master_prompt = f"""
        You are an expert data extraction algorithm. Analyze the attached documents based on the user's prompt.
        You MUST return ONLY a valid JSON object with this exact structure:
        {{
            "message": "A brief text summary of what you found.",
            "extracted_data": [
                {{"Filename": "name of file", "Data_Point_1": "value", "Data_Point_2": "value"}}
            ]
        }}
        Make the keys in 'extracted_data' highly descriptive based on what the user asked for (e.g., "GST_Number", "Total_Amount", "Date").
        
        USER PROMPT: {prompt}
        """

        gemini_parts = [ai_master_prompt]

        for file in files:
            file_bytes = await file.read()
            if file.filename.lower().endswith('.pdf'):
                # Send PDF directly as a part for Vision/OCR processing
                gemini_parts.append({
                    "mime_type": "application/pdf",
                    "data": file_bytes
                })
            else:
                # Fallback text extraction for non-PDFs (like .docx)
                text = extract_text(file_bytes, file.filename)
                gemini_parts.append(f"\n--- CONTENT OF {file.filename} ---\n{text}\n")

        response = model.generate_content(gemini_parts)
        
        # Convert the AI's string response into a real Python dictionary
        ai_json_data = json.loads(response.text)
        
        return {
            "status": "success",
            "ai_data": ai_json_data
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))