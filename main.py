from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import google.generativeai as genai
import os
import json
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

# Enable CORS for local testing
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure Gemini API
API_KEY = os.getenv("GEMINI_API_KEY")
if API_KEY:
    genai.configure(api_key=API_KEY)
else:
    print("WARNING: GEMINI_API_KEY not found in environment variables.")

class AnalysisRequest(BaseModel):
    text: str
    type: str

@app.post("/api/analyze")
async def analyze_text(req: AnalysisRequest):
    if not API_KEY:
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY not configured on server.")
    
    try:
        model = genai.GenerativeModel('gemini-1.5-flash')
        
        if req.type == "analysis":
            prompt = f"""
            Analyze the following business text and return a strict JSON object with this exact structure:
            {{
                "type": "analysis",
                "summary": "A 2-3 sentence executive summary",
                "findings": [
                    {{"text": "Key finding 1", "impact": "positive"}}, 
                    {{"text": "Key finding 2", "impact": "negative"}}
                ],
                "risks": [
                    {{"text": "Risk description", "severity": "HIGH"}}
                ],
                "actions": [
                    {{"text": "Action to take", "owner": "Role", "deadline": "Timeframe", "priority": "HIGH"}}
                ]
            }}
            Impact must be 'positive', 'negative', or 'neutral'. Severity/priority must be 'HIGH', 'MEDIUM', or 'LOW'.
            Limit to 5 findings, 3 risks, and 3 actions. Return ONLY valid JSON, no markdown blocks.
            
            Text:
            {req.text}
            """
        elif req.type == "communication":
            prompt = f"""
            Analyze the following text and draft a professional business communication. Return strict JSON:
            {{
                "type": "communication",
                "draft": "Subject: ...\\n\\nDear Team,\\n...",
                "tone": "Brief description of tone used",
                "toneReason": "Why this tone was chosen",
                "altTone": "An alternative tone",
                "altDraft": "The alternative draft text"
            }}
            Return ONLY valid JSON, no markdown blocks.
            
            Text:
            {req.text}
            """
        elif req.type == "decision":
            prompt = f"""
            Analyze the following text and outline decision options. Return strict JSON:
            {{
                "type": "decision",
                "options": [
                    {{"label": "Option A: Name", "pros": ["Pro 1", "Pro 2"], "cons": ["Con 1", "Con 2"]}}
                ],
                "recommendation": "The recommended option label",
                "rationale": "Why this is recommended",
                "nextStep": "Immediate next action"
            }}
            Return ONLY valid JSON, no markdown blocks.
            
            Text:
            {req.text}
            """
        else:
            raise HTTPException(status_code=400, detail="Invalid analysis type")
            
        response = model.generate_content(prompt)
        text_resp = response.text.strip()
        # Clean up markdown block if the model accidentally returns it
        if text_resp.startswith("```json"):
            text_resp = text_resp[7:]
        if text_resp.endswith("```"):
            text_resp = text_resp[:-3]
            
        return json.loads(text_resp)
        
    except Exception as e:
        print(f"Error generating content: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to process with Gemini API: {str(e)}")

class WorkflowRequest(BaseModel):
    goal: str

@app.post("/api/workflow")
async def run_workflow(req: WorkflowRequest):
    if not API_KEY:
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY not configured on server.")
    
    try:
        model = genai.GenerativeModel('gemini-1.5-flash')
        prompt = f"""
        You are an autonomous workflow agent. The user has given you a high-level business goal.
        You must break this goal down into 4-6 logical execution steps using the available tools:
        [search_web, read_file, send_email, create_task, query_database, summarize, write_report]
        
        For each step, invent a realistic action, the tool used, the tool input, and a realistic successful result.
        Finally, generate a highly detailed 'finalOutput' string representing the final deliverable.
        
        Return a strict JSON object with this exact structure:
        {{
            "steps": [
                {{
                    "action": "Description of what is being done",
                    "tool": "tool_name_from_list",
                    "toolInput": "Input given to tool",
                    "result": "✓ Realistic result of the tool execution"
                }}
            ],
            "finalOutput": "The complete, detailed final deliverable (e.g., a report, email, or summary) with newlines (\\n)"
        }}
        Return ONLY valid JSON, no markdown blocks.

        Business Goal:
        {req.goal}
        """
        response = model.generate_content(prompt)
        text_resp = response.text.strip()
        if text_resp.startswith("```json"):
            text_resp = text_resp[7:]
        if text_resp.endswith("```"):
            text_resp = text_resp[:-3]
            
        return json.loads(text_resp)
        
    except Exception as e:
        print(f"Error generating workflow: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to process workflow with Gemini API: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
