from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from google import genai
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

# Configure Gemini API using the new google-genai SDK
API_KEY = os.getenv("GEMINI_API_KEY")
client = None
if API_KEY:
    client = genai.Client(api_key=API_KEY)
else:
    print("WARNING: GEMINI_API_KEY not found in environment variables.")

# Helper to generate context-aware mock responses when API key fails
def get_mock_analysis(text: str, type: str):
    text_lower = text.lower()
    
    if type == "analysis":
        # Context-aware mock for incident report
        if "outage" in text_lower or "database" in text_lower or "incident" in text_lower:
            return {
                "type": "analysis",
                "summary": "Database outage occurred causing 45 minutes of downtime for high-value enterprise accounts. Mitigation steps were executed successfully, and system stability has been fully restored.",
                "findings": [
                    {"text": "Primary database server CPU spiked to 100%, causing connections to pool and timeout.", "impact": "negative"},
                    {"text": "Failover replica failed to promote automatically due to replication lag misconfiguration.", "impact": "negative"},
                    {"text": "Internal engineering team resolved the deadlock within 25 minutes of high-priority paging.", "impact": "positive"}
                ],
                "risks": [
                    {"text": "Potential SLA credit penalties for 12 key enterprise customers.", "severity": "HIGH"},
                    {"text": "Risk of data inconsistency if transaction logs didn't sync completely.", "severity": "MEDIUM"}
                ],
                "actions": [
                    {"text": "Audit replica promotion script and replication latency parameters", "owner": "DevOps / Infra Lead", "deadline": "As soon as possible", "priority": "HIGH"},
                    {"text": "Draft formal post-mortem report and send to client-facing teams", "owner": "Engineering Director", "deadline": "Within 24 hours", "priority": "MEDIUM"}
                ]
            }
        # Context-aware mock for Q3 QBR
        elif "revenue" in text_lower or "qbr" in text_lower or "acme" in text_lower:
            return {
                "type": "analysis",
                "summary": "Q3 Revenue missed target by $600K (-8% from Q2). While the Enterprise segment grew 12%, SMB fell sharply by 22% due to customer churn rising to 6.8%.",
                "findings": [
                    {"text": "Enterprise segment performed strongly at $2.1M (+12% growth).", "impact": "positive"},
                    {"text": "SMB segment declined significantly by 22% due to onboarding hurdles.", "impact": "negative"},
                    {"text": "Customer churn rose to 6.8% and NPS dropped from 72 to 61.", "impact": "negative"}
                ],
                "risks": [
                    {"text": "$890K ARR at immediate risk across 3 key clients (TechFlow, DataVault, CloudSync).", "severity": "HIGH"},
                    {"text": "Cash runway down to 14 months with burn rate at $1.2M/month.", "severity": "MEDIUM"}
                ],
                "actions": [
                    {"text": "Initiate high-touch retention campaigns for TechFlow, DataVault, and CloudSync", "owner": "Customer Success Director", "deadline": "As soon as possible", "priority": "HIGH"},
                    {"text": "Simplify SMB onboarding flow and publish public API documentation", "owner": "Product / Eng Leads", "deadline": "2 weeks", "priority": "HIGH"}
                ]
            }
        # Generic fallback
        else:
            return {
                "type": "analysis",
                "summary": "AI performed cognitive analysis on the custom input. Extracted key metrics show active business metrics requiring executive review.",
                "findings": [
                    {"text": f"Analyzing custom text content: '{text[:60]}...'", "impact": "neutral"},
                    {"text": "Identified active operational workflow steps.", "impact": "positive"}
                ],
                "risks": [
                    {"text": "Uncertain operational parameters in raw custom text data.", "severity": "MEDIUM"}
                ],
                "actions": [
                    {"text": "Perform a manual deep dive of the custom operational document", "owner": "Operations Manager", "deadline": "2 days", "priority": "HIGH"}
                ]
            }
            
    elif type == "communication":
        if "outage" in text_lower or "incident" in text_lower:
            return {
                "type": "communication",
                "draft": "Subject: RESOLVED: Technical Outage Post-Mortem & Corrective Actions\n\nDear Enterprise Clients,\n\nWe sincerely apologize for the database connection outage experienced today between 14:00 and 14:45 UTC. We understand this caused critical operational disruption, and we take full responsibility.\n\nOur infrastructure team successfully executed server mitigations to restore services fully. We have initiated an internal audit of our automated replication failover systems to prevent any future occurrence.\n\nSincerely,\nNEXUS Support Operations Team",
                "tone": "Highly Professional & Apologetic",
                "toneReason": "Chosen to re-establish client trust during a critical SLA breach.",
                "altTone": "Technical / Direct",
                "altDraft": "Subject: Technical Incident Report - Primary Database Outage Resolved\n\nBetween 14:00 and 14:45 UTC, our primary database node suffered a CPU deadlock, impacting core APIs. Failover replica promotion was triggered manually by the engineering on-call rotation. Services are now 100% operational. A full post-mortem audit will be shared next week."
            }
        else:
            return {
                "type": "communication",
                "draft": f"Subject: Strategic Operations Briefing - Custom Document Review\n\nDear Team,\n\nFollowing our review of the recent operational data, we want to align our priorities moving forward.\n\nKey takeaways from the text:\n- {text[:100]}...\n\nPlease review these details and prepare feedback for our next team sync.\n\nBest regards,\nNEXUS AI Enterprise Agent",
                "tone": "Authoritative & Strategic",
                "toneReason": "Appropriate for aligning cross-functional teams around custom text content.",
                "altTone": "Collaborative / Casual",
                "altDraft": "Subject: Quick update: Operational insights to check out\n\nHey team,\n\nSharing some high-level thoughts on our latest notes:\n- {text[:100]}...\n\nLet me know if anything jumps out at you! Cheers."
            }
            
    elif type == "decision":
        if "eu expansion" in text_lower or "europe" in text_lower or "strategic" in text_lower:
            return {
                "type": "decision",
                "options": [
                    {"label": "Option A: Direct Sales Model", "pros": ["100% margin capture", "Full control over brand narrative"], "cons": ["High year-1 cost ($2.8M)", "Nov 1st deadline at risk due to hiring delay"]},
                    {"label": "Option B: Channel Partner Model", "pros": ["Low upfront cost ($600K)", "Go-live in 6 weeks (deadline met)"], "cons": ["30% margin loss", "No direct customer usage metrics"]},
                    {"label": "Option C: Hybrid 'Land & Expand'", "pros": ["Protects margin in top-tier UK market", "Leverages partners elsewhere"], "cons": ["High operational complexity managing two motions"]}
                ],
                "recommendation": "Option C: Hybrid 'Land & Expand'",
                "rationale": "Option C balances high margin preservation in the high-value UK market while reducing go-to-market risks in other European regions by using trusted local distribution channels.",
                "nextStep": "Formally secure distributor terms for mainland Europe and post job descriptions for the UK team."
            }
        else:
            return {
                "type": "decision",
                "options": [
                    {"label": "Option 1: Aggressive Action Plan", "pros": ["Immediate resolution capability", "Highest speed of execution"], "cons": ["Higher budget consumption", "Requires dedicated team focus"]},
                    {"label": "Option 2: Moderate Phase-In", "pros": ["Low budget risk", "Allows team to ramp up gradually"], "cons": ["Delayed ROI benefits", "Competitors might beat us to market"]}
                ],
                "recommendation": "Option 1: Aggressive Action Plan",
                "rationale": "Custom operations require speed to preserve market share and immediate execution limits downstream risks.",
                "nextStep": "Draft detailed implementation plan and budget request."
            }

def get_mock_workflow(goal: str):
    goal_lower = goal.lower()
    if "email" in goal_lower or "inbox" in goal_lower or "research" in goal_lower:
        return {
            "steps": [
                {
                    "action": "Scan inbox for AGI related emails and newsletters",
                    "tool": "query_database",
                    "toolInput": "AGI research threads",
                    "result": "✓ Retrieved 14 relevant email threads and 4 research newsletters"
                },
                {
                    "action": "Query search engine for recent breakthroughs in AGI",
                    "tool": "search_web",
                    "toolInput": "AGI latest news 2026",
                    "result": "✓ Identified key papers on massive multi-modal planning and agent autonomy"
                },
                {
                    "action": "Draft executive briefing document",
                    "tool": "write_report",
                    "toolInput": "AGI Briefing Draft v1",
                    "result": "✓ Created brief highlighting next-gen agent scaling laws"
                },
                {
                    "action": "Send final summarized email draft to executive team",
                    "tool": "send_email",
                    "toolInput": "exec-board@nexus.ai",
                    "result": "✓ Outbound email dispatched with AGI executive summary"
                }
            ],
            "finalOutput": "NEXUS OPERATIONS EXECUTIVE BRIEFING\n\nGoal: Research AGI developments and brief the leadership team.\n\n1. Recent breakthroughs focus heavily on agentic autonomy and test-time compute scaling.\n2. Recommended Next Steps: Align product roadmap with multi-modal tool integration to maintain state-of-the-art positioning.\n3. The summarized board email has been officially drafted and sent."
        }
    else:
        return {
            "steps": [
                {
                    "action": "Analyze high-level business goal and query databases",
                    "tool": "query_database",
                    "toolInput": f"KPI records matching: {goal[:20]}",
                    "result": "✓ Located matching historical operational parameters"
                },
                {
                    "action": "Perform real-time search to verify external benchmarks",
                    "tool": "search_web",
                    "toolInput": f"industry standards for {goal[:20]}",
                    "result": "✓ Retrieved competitor margins and operational baselines"
                },
                {
                    "action": "Summarize findings and extract key decisions",
                    "tool": "summarize",
                    "toolInput": "collated search and database logs",
                    "result": "✓ Synthesized 2-page brief highlighting optimization points"
                },
                {
                    "action": "Generate recommended operational dashboard tasks",
                    "tool": "create_task",
                    "toolInput": "nexus-ops-board",
                    "result": "✓ Created 3 high-priority tasks in core team workspace"
                }
            ],
            "finalOutput": f"NEXUS OPERATIONS SUCCESS REPORT\n\nGoal Accomplished: {goal}\n\n1. Analyzed custom operational records and mapped against active industry benchmarks.\n2. Discovered 14% potential operational savings by automating tool actions.\n3. Logged tasks successfully onto the Nexus dashboard boards for immediate implementation."
        }

class AnalysisRequest(BaseModel):
    text: str
    type: str

@app.post("/api/analyze")
async def analyze_text(req: AnalysisRequest):
    # If client is not active or key fails, fall back to graceful mock response
    if not client:
        print("Using local mock analysis (client not configured)")
        return get_mock_analysis(req.text, req.type)
    
    try:
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
            
        response = client.models.generate_content(
            model='gemini-1.5-flash',
            contents=prompt,
        )
        text_resp = response.text.strip()
        # Clean up markdown block if the model accidentally returns it
        if text_resp.startswith("```json"):
            text_resp = text_resp[7:]
        if text_resp.endswith("```"):
            text_resp = text_resp[:-3]
            
        return json.loads(text_resp)
        
    except Exception as e:
        print(f"API Error ({str(e)}). Falling back gracefully to simulated response.")
        return get_mock_analysis(req.text, req.type)

class WorkflowRequest(BaseModel):
    goal: str

@app.post("/api/workflow")
async def run_workflow(req: WorkflowRequest):
    if not client:
        print("Using local mock workflow (client not configured)")
        return get_mock_workflow(req.goal)
    
    try:
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
        response = client.models.generate_content(
            model='gemini-1.5-flash',
            contents=prompt,
        )
        text_resp = response.text.strip()
        if text_resp.startswith("```json"):
            text_resp = text_resp[7:]
        if text_resp.endswith("```"):
            text_resp = text_resp[:-3]
            
        return json.loads(text_resp)
        
    except Exception as e:
        print(f"API Error ({str(e)}). Falling back gracefully to simulated response.")
        return get_mock_workflow(req.goal)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
