# Omni-Doc AI Parser

A full-stack application that uses Google's Gemini AI to parse and extract structured data from PDF and DOCX documents.

## Project Structure

This project consists of:
- **FastAPI Backend**: Located in the root directory (`main.py`). Handles document processing and AI extraction.
- **Next.js Frontend**: Located in the `doc-parser-ui` directory. Provides the user interface.

## Prerequisites

- Python 3.8+
- Node.js 18+
- A Google Gemini API Key

## Backend Setup

1. Navigate to the root directory.
2. Create a `.env` file and add your Gemini API Key:
   ```env
   GEMINI_API_KEY="your_api_key_here"
   ```
3. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Run the FastAPI server:
   ```bash
   uvicorn main:app --reload
   ```
   The backend will start at `http://localhost:8000`.

## Frontend Setup

1. Navigate to the `doc-parser-ui` directory:
   ```bash
   cd doc-parser-ui
   ```
2. Install npm dependencies:
   ```bash
   npm install
   ```
3. Run the Next.js development server:
   ```bash
   npm run dev
   ```
   The frontend will start at `http://localhost:3000`.

## Features
- Upload PDF and DOCX files.
- Provide custom prompts to guide data extraction.
- Relies on Gemini 2.5 Flash to intelligently parse documents and output strict JSON.
