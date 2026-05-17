// ===== NEXUS AI - Analysis Engine =====

const SampleData = {
  analysis: `Q3 2025 QUARTERLY BUSINESS REVIEW — ACME CORP

Revenue: $4.2M (down 8% from Q2). Target was $4.8M — missed by $600K.
Top performer: Enterprise segment at $2.1M (+12%). SMB segment declined 22%.
Customer churn increased to 6.8% (from 4.2% in Q2). 
NPS dropped from 72 to 61. Main complaints: slow onboarding, lack of API docs.
3 key clients (TechFlow, DataVault, CloudSync) flagged as at-risk — total ARR $890K.
Sales pipeline: $6.1M in Q4 pipeline, but 40% is early-stage. 
Marketing spend increased 15% but MQL-to-SQL conversion dropped to 11%.
Engineering shipped 2 of 5 planned features. Technical debt backlog grew 30%.
Headcount: 3 senior engineers resigned. Avg time-to-hire: 67 days.
Cash runway: 14 months at current burn rate ($1.2M/month).`,

  communication: `URGENT INCIDENT RESPONSE: PRODUCTION DATABASE OUTAGE

At 04:30 AM EST, a critical failure occurred in the primary production database cluster (US-East-1).
Downtime duration: 47 minutes. Total users affected: Approx. 45,000 active sessions dropped.
Root cause: A rogue automated migration script exhausted the connection pool, triggering a cascade failure across read replicas.
Impact: E-commerce checkout was unavailable, resulting in an estimated $120K in lost revenue. 
Resolution: The SRE team manually failed over to the secondary cluster and rolled back the migration by 05:17 AM EST.
Current status: All systems nominal. Database is operating at 98% capacity.
Next actions: We are implementing aggressive connection rate limiting and enforcing manual approvals for all tier-1 database migrations.

We need to draft an incident report for the enterprise clients and a separate update for the internal executive team. The tone should be highly apologetic but confident that the root cause is permanently fixed.`,

  decision: `STRATEGIC INITIATIVE: Q4 EUROPEAN MARKET EXPANSION

We are evaluating our go-to-market strategy for the upcoming EU expansion. Current budget allocated: $4.5M. Timeframe: Launch by Nov 1st.

Option A: The "Direct Sales" approach.
- Build local sales teams in London and Berlin (Est. cost $2.8M for year 1).
- High upfront investment but allows us to capture 100% margin and fully control the brand narrative.
- Hiring ramp-up will take at least 4 months, putting the Nov 1st deadline at severe risk.

Option B: The "Channel Partner" approach.
- Partner with established EU distributors (TechData UK, EuroCloud).
- Low upfront cost ($600K for enablement and co-marketing).
- Revenue split means we sacrifice 30% margins, and we lose direct visibility into customer usage patterns.
- Can go live in 6 weeks, easily beating the deadline.

Option C: A hybrid "Land and Expand" model.
- Focus strictly on the UK direct sales first ($1.2M cost), while using partners for the rest of Europe.
- Balances risk, protects margins in the highest-value market (UK), but creates operational complexity managing two parallel motions.

The Board expects a massive Q4 revenue spike from this expansion. If we miss the deadline, our Series C valuation will take a significant hit. What is the most pragmatic path forward?`
};

function analyzeText(text, type) {
  const words = text.split(/\s+/);
  const sentences = text.split(/[.!?]+/).filter(s => s.trim());
  
  if (type === 'analysis') return generateAnalysis(text, words, sentences);
  if (type === 'communication') return generateCommunication(text, words, sentences);
  if (type === 'decision') return generateDecision(text, words, sentences);
}

function extractNumbers(text) {
  const nums = [];
  const patterns = [
    /\$[\d,.]+[MKB]?/gi, /[\d,.]+%/g, /\d+\s*(months?|days?|years?|weeks?)/gi
  ];
  patterns.forEach(p => { const m = text.match(p); if (m) nums.push(...m); });
  return [...new Set(nums)];
}

function extractKeyPhrases(text) {
  const important = ['revenue','churn','risk','decline','increase','growth','delay',
    'budget','deadline','cost','pipeline','target','missed','dropped','concern',
    'impact','critical','urgent','strategy','migration','savings','competitive'];
  const found = [];
  const lower = text.toLowerCase();
  important.forEach(w => { if (lower.includes(w)) found.push(w); });
  return found;
}

function generateAnalysis(text, words, sentences) {
  const numbers = extractNumbers(text);
  const phrases = extractKeyPhrases(text);
  const hasNegative = /decline|drop|miss|churn|risk|delay|resign|concern/i.test(text);
  const hasPositive = /growth|increase|performer|advantage|opportunity/i.test(text);

  const risks = [];
  if (/churn|at-risk|resign/i.test(text)) risks.push({ text: 'Customer/talent retention issues detected — immediate intervention needed', severity: 'HIGH' });
  if (/miss|decline|drop/i.test(text)) risks.push({ text: 'Performance metrics trending below targets — course correction required', severity: 'HIGH' });
  if (/delay|debt|backlog/i.test(text)) risks.push({ text: 'Delivery and technical debt accumulation threatening roadmap', severity: 'MEDIUM' });
  if (/burn|runway|cash/i.test(text)) risks.push({ text: 'Financial runway requires monitoring — optimize spend efficiency', severity: 'MEDIUM' });
  if (/pipeline|conversion/i.test(text)) risks.push({ text: 'Sales pipeline quality concerns — conversion optimization needed', severity: 'LOW' });
  if (risks.length === 0) risks.push({ text: 'No critical risks detected — maintain current monitoring cadence', severity: 'LOW' });

  const actions = [];
  if (/churn|at-risk/i.test(text)) actions.push({ text: 'Launch customer success intervention for at-risk accounts', owner: 'VP Customer Success', deadline: 'This week', priority: 'HIGH' });
  if (/resign|hire|headcount/i.test(text)) actions.push({ text: 'Accelerate hiring pipeline — engage external recruiters for critical roles', owner: 'VP Engineering', deadline: 'Next 2 weeks', priority: 'HIGH' });
  if (/NPS|complaint|onboarding/i.test(text)) actions.push({ text: 'Conduct root cause analysis on NPS decline and implement quick wins', owner: 'Product Lead', deadline: '10 days', priority: 'MEDIUM' });
  if (/pipeline|marketing|MQL/i.test(text)) actions.push({ text: 'Audit marketing spend ROI and reallocate budget to high-converting channels', owner: 'CMO', deadline: 'End of month', priority: 'MEDIUM' });
  if (/feature|engineering|debt/i.test(text)) actions.push({ text: 'Dedicate 20% of next sprint to technical debt reduction', owner: 'Engineering Lead', deadline: 'Next sprint', priority: 'LOW' });
  if (actions.length === 0) actions.push({ text: 'Schedule quarterly strategy review based on findings', owner: 'Operations Lead', deadline: 'Next week', priority: 'MEDIUM' });

  const summaryParts = [];
  if (hasNegative && hasPositive) summaryParts.push('The data reveals a mixed performance landscape with bright spots in selective segments but concerning downward trends in key metrics.');
  else if (hasNegative) summaryParts.push('The analysis reveals multiple concerning trends that require immediate executive attention.');
  else summaryParts.push('Overall performance indicators are positive with opportunities for optimization.');
  
  summaryParts.push(`Key metrics identified: ${numbers.slice(0, 5).join(', ') || 'qualitative data primarily'}.`);
  summaryParts.push('Immediate action is recommended on the highest-severity items below to prevent further degradation.');

  const findings = [];
  sentences.forEach(s => {
    const trimmed = s.trim();
    if (trimmed.length > 20) {
      if (/decline|drop|miss|churn|risk|resign|concern|delay/i.test(trimmed))
        findings.push({ text: trimmed, impact: 'negative' });
      else if (/growth|increase|performer|advantage|up\s/i.test(trimmed))
        findings.push({ text: trimmed, impact: 'positive' });
    }
  });
  if (findings.length === 0) sentences.slice(0, 4).forEach(s => { if (s.trim().length > 15) findings.push({ text: s.trim(), impact: 'neutral' }); });

  return { type: 'analysis', summary: summaryParts.join(' '), findings: findings.slice(0, 6), risks, actions };
}

function generateCommunication(text, words, sentences) {
  const isNegative = /delay|issue|problem|concern|risk|cancel|miss/i.test(text);
  const isUpdate = /update|inform|announce|share|notify/i.test(text);
  const hasStakeholders = /stakeholder|investor|client|CEO|board|team/i.test(text);
  
  const tone = isNegative ? 'Professional & Transparent with Forward-Looking Framing' : 'Confident & Informative';
  const toneReason = isNegative 
    ? 'The content involves challenges that require honest communication while maintaining stakeholder confidence.'
    : 'The content is informational and benefits from a clear, confident delivery.';

  const subject = sentences[0] ? sentences[0].trim().substring(0, 60) + '...' : 'Business Update';
  
  let draft = '';
  if (isNegative) {
    draft = `Subject: Project Update — Revised Timeline & Path Forward

Dear Stakeholders,

I'm writing to provide a transparent update on our current progress and the strategic adjustments we're implementing to ensure long-term success.

CURRENT STATUS:
${sentences.slice(0, 3).map(s => '• ' + s.trim()).join('\n')}

WHAT WE'RE DOING ABOUT IT:
• We have conducted a thorough root-cause analysis and identified the key drivers
• A dedicated task force has been assembled to accelerate resolution  
• We are implementing additional safeguards to prevent recurrence
• Weekly progress updates will be shared with all stakeholders

REVISED EXPECTATIONS:
${sentences.slice(3, 5).map(s => '• ' + s.trim()).join('\n') || '• Detailed timeline to follow within 48 hours'}

I want to emphasize that our fundamental business trajectory remains strong. These adjustments position us better for sustainable growth and reflect our commitment to quality over rushed delivery.

I welcome any questions and am available for a detailed discussion at your convenience.

Best regards,
[Your Name]
[Title]`;
  } else {
    draft = `Subject: ${subject}

Dear Team,

I'm pleased to share the following update on our progress and key developments.

KEY HIGHLIGHTS:
${sentences.slice(0, 4).map(s => '• ' + s.trim()).join('\n')}

NEXT STEPS:
• Continue monitoring key metrics and performance indicators
• Schedule follow-up review for end of week
• Distribute detailed report to department leads

Please don't hesitate to reach out if you have questions or need additional context.

Best regards,
[Your Name]
[Title]`;
  }

  let altDraft = isNegative 
    ? draft.replace('Dear Stakeholders', 'Hi Team').replace('I\'m writing to provide a transparent update', 'Quick update for everyone').replace('Best regards,', 'Thanks,')
    : draft.replace('Dear Team', 'Dear Executive Committee').replace('I\'m pleased to share', 'Please find below a formal summary of');

  return {
    type: 'communication',
    draft, tone, toneReason,
    altTone: isNegative ? 'Casual & Direct (for internal team use)' : 'Formal & Executive (for board-level communication)',
    altDraft
  };
}

function generateDecision(text, words, sentences) {
  const options = [];
  const optionPatterns = text.match(/option\s*[a-c][:.]?\s*[^\n.]+/gi) || [];
  
  if (optionPatterns.length >= 2) {
    optionPatterns.forEach((opt, i) => {
      const label = opt.replace(/option\s*[a-c][:.]?\s*/i, '').trim();
      options.push({
        label: `Option ${String.fromCharCode(65 + i)}: ${label}`,
        pros: ['Addresses identified need', 'Feasible within current constraints'],
        cons: ['Requires resource allocation', 'Involves transition risk']
      });
    });
  } else {
    options.push(
      { label: 'Proceed with conservative approach', pros: ['Lower risk', 'Minimal disruption', 'Preserves current momentum'], cons: ['Slower growth', 'May miss market window'] },
      { label: 'Aggressive pivot strategy', pros: ['Higher growth potential', 'First-mover advantage', 'Better long-term positioning'], cons: ['Higher execution risk', 'Resource intensive', 'Team strain'] },
      { label: 'Hybrid phased approach', pros: ['Balanced risk/reward', 'Allows course correction', 'Team buy-in easier'], cons: ['Slower than aggressive option', 'Complexity in execution'] }
    );
  }

  // Enrich options from text context
  if (/cost|saving|spend|budget|price/i.test(text)) {
    options[0].pros.push('Cost-optimized path with predictable spend');
    if (options[1]) options[1].cons.push('Higher upfront investment required');
  }
  if (/expertise|team|skill|experience/i.test(text)) {
    options[0].pros.push('Leverages existing team expertise');
    if (options[1]) options[1].cons.push('May require new skill acquisition');
  }
  if (/competitive|advantage|ML|AI|innovation/i.test(text)) {
    if (options[1]) options[1].pros.push('Strengthens competitive differentiation');
    if (options[2]) options[2].pros.push('Captures innovation benefits incrementally');
  }

  const recIdx = options.length >= 3 ? 2 : 0;
  
  return {
    type: 'decision',
    options,
    recommendation: options[recIdx].label,
    rationale: `This option provides the optimal balance of risk mitigation and strategic advancement. It accounts for current constraints (team expertise, timeline, budget) while positioning for future growth. The phased nature allows for data-driven course corrections, reducing the likelihood of costly missteps.`,
    nextStep: 'Schedule a 60-minute decision workshop with key stakeholders within 48 hours. Prepare a one-page brief summarizing the recommendation and circulate 24 hours before the meeting.'
  };
}

// Workflow simulation data
const WorkflowTemplates = {
  research: {
    steps: [
      { action: 'Parsing business goal and identifying key objectives', tool: 'summarize', toolInput: 'goal_text', result: '✓ Identified 3 primary objectives and 2 constraints' },
      { action: 'Searching for market data and competitor intelligence', tool: 'search_web', toolInput: '"competitor analysis SaaS market 2025"', result: '✓ Retrieved 12 relevant sources with pricing data for 8 competitors' },
      { action: 'Querying internal database for historical performance', tool: 'query_database', toolInput: 'SELECT segment, revenue, growth_rate FROM performance WHERE quarter >= "Q1_2025"', result: '✓ Retrieved 4 quarters of performance data across 5 segments' },
      { action: 'Reading supplementary market report', tool: 'read_file', toolInput: '/reports/market_analysis_2025.pdf', result: '✓ Extracted 15 key data points and 3 trend indicators' },
      { action: 'Synthesizing findings into executive brief', tool: 'summarize', toolInput: 'combined_research_data', result: '✓ Generated executive summary with 3 strategic recommendations' },
      { action: 'Generating formatted report', tool: 'write_report', toolInput: '"Strategic Analysis Brief"', result: '✓ Report generated: 4 sections, 2 charts, 3 recommendations' },
      { action: 'Creating action items for product team', tool: 'create_task', toolInput: '"Review competitive pricing gaps" | Priority: HIGH', result: '✓ Created 3 tasks assigned to product team leads' },
      { action: 'Sending executive brief to stakeholders', tool: 'send_email', toolInput: 'exec-team@company.com | "Strategic Analysis Brief — Action Required"', result: '✓ Email sent to 5 recipients with report attached' }
    ],
    finalOutput: `STRATEGIC ANALYSIS BRIEF — EXECUTIVE SUMMARY

MARKET POSITION:
• Current market share: 12.3% (3rd in segment, up from 11.1%)
• Primary competitor pricing: 15-25% premium over our offering
• Key gap identified: Enterprise API integrations and AI-powered analytics

TOP 3 RECOMMENDATIONS:
1. [HIGH IMPACT] Launch enterprise API marketplace — est. $2.1M incremental ARR
   Risk: Medium | Timeline: Q3 2025 | Owner: VP Product
   
2. [MEDIUM IMPACT] Implement usage-based pricing tier — captures 340 prospect accounts
   Risk: Low | Timeline: Q2 2025 | Owner: Revenue Operations
   
3. [STRATEGIC] Acquire/partner for AI analytics capability — leapfrog competitors
   Risk: High | Timeline: Q4 2025 | Owner: CEO + Corp Dev

ACTION ITEMS CREATED:
☑ Review competitive pricing gaps (Product Team — Due: May 25)
☑ Draft API marketplace PRD (Engineering — Due: June 1)  
☑ Model usage-based pricing scenarios (Finance — Due: May 28)

GAPS:
• Could not access real-time competitor pricing — used last-quarter data
• Internal customer satisfaction survey data was not available in the database`
  },
  general: {
    steps: [
      { action: 'Analyzing goal and decomposing into subtasks', tool: 'summarize', toolInput: 'goal_decomposition', result: '✓ Decomposed into 4 actionable subtasks' },
      { action: 'Gathering relevant data from available sources', tool: 'search_web', toolInput: '"relevant industry data and benchmarks"', result: '✓ Collected data from 8 authoritative sources' },
      { action: 'Querying business database for internal metrics', tool: 'query_database', toolInput: 'SELECT * FROM metrics WHERE date >= CURRENT_DATE - 90', result: '✓ Retrieved 90 days of operational data' },
      { action: 'Analyzing and synthesizing all collected data', tool: 'summarize', toolInput: 'all_collected_data', result: '✓ Key patterns identified, synthesis complete' },
      { action: 'Generating comprehensive report', tool: 'write_report', toolInput: '"Business Analysis Report"', result: '✓ Report generated with findings and recommendations' },
      { action: 'Creating follow-up tasks', tool: 'create_task', toolInput: '"Implement recommended changes" | Priority: HIGH', result: '✓ Created 2 high-priority and 3 medium-priority tasks' }
    ],
    finalOutput: `BUSINESS ANALYSIS REPORT

EXECUTIVE SUMMARY:
The analysis reveals several opportunities for operational improvement and strategic advancement. Key findings are organized by impact level below.

KEY FINDINGS:
• Operational efficiency can be improved by approximately 23% through process automation
• Customer acquisition cost has increased 18% — requires channel optimization
• Team productivity metrics show strong performance in core functions

RECOMMENDATIONS:
1. Implement process automation for identified bottlenecks (Est. savings: $45K/quarter)
2. Reallocate marketing budget based on channel performance data
3. Invest in team development for emerging skill requirements

CREATED TASKS:
☑ Process automation assessment (Operations — Due: Next week)
☑ Marketing channel audit (Marketing — Due: 10 days)
☑ Team skills gap analysis (HR — Due: 2 weeks)
☑ Quarterly review scheduling (Management — Due: End of month)`
  }
};

window.SampleData = SampleData;
window.analyzeText = analyzeText;
window.WorkflowTemplates = WorkflowTemplates;
