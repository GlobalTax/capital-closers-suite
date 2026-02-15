import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getCorsHeaders, requireAuth } from '../_shared/auth.ts';

interface SlideInput {
  slide_index: number;
  layout: string;
  headline: string;
  subline?: string;
  bullets?: string[];
  stats?: Array<{ value: string; label: string; prefix?: string; suffix?: string }>;
  bodyText?: string;
  teamMembers?: Array<{ name: string; role: string }>;
  columns?: Array<{ title: string; items: string[] }>;
}

interface ValidationReport {
  approval_decision: 'APPROVED' | 'NOT_APPROVED';
  approval_justification: string;
  professional_quality: {
    score: number;
    issues: string[];
  };
  credibility: {
    score: number;
    issues: string[];
  };
  confidentiality_compliance: {
    score: number;
    issues: string[];
  };
  investor_suitability: {
    score: number;
    issues: string[];
  };
  overall_quality_score: number;
  issues_per_slide: Array<{
    slide_index: number;
    issues: Array<{
      type: 'constraint_violation' | 'risky_claim' | 'inconsistent_term' | 'text_density' | 'invented_data';
      severity: 'low' | 'medium' | 'high';
      description: string;
      location: 'headline' | 'subline' | 'bullets' | 'stats' | 'body';
    }>;
  }>;
  suggested_fixes: Array<{
    slide_index: number;
    location: string;
    original: string;
    suggested: string;
    reason: string;
  }>;
  risk_flags: Array<{
    slide_index: number;
    flag: string;
    recommendation: string;
  }>;
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { user, error: authError } = await requireAuth(req, corsHeaders);
    if (authError) return authError;

    const { slides, inputs } = await req.json() as { 
      slides: SlideInput[]; 
      inputs?: Record<string, unknown>;
    };

    if (!slides || !Array.isArray(slides) || slides.length === 0) {
      return new Response(
        JSON.stringify({ error: 'slides array is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'LOVABLE_API_KEY not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const systemPrompt = `You are approving a confidential M&A presentation for external distribution to investors.

YOUR TASK: Determine if this presentation should be APPROVED or NOT_APPROVED for external distribution.

EVALUATION CRITERIA (score each 1-10):

1. PROFESSIONAL QUALITY
   - Clean, error-free copy (no typos, grammar issues)
   - Proper formatting and structure
   - Consistent terminology throughout
   - Headlines max 10 words, bullets max 12 words each

2. CREDIBILITY  
   - All claims are factual and verifiable
   - Numbers have clear sources or context
   - No unqualified superlatives ("best", "leader" without evidence)
   - No invented or implied data

3. CONFIDENTIALITY COMPLIANCE
   - Proper confidentiality disclaimers present
   - No sensitive information exposed inappropriately
   - Appropriate NDA language if required
   - No personally identifiable information leaks

4. INVESTOR SUITABILITY
   - Professional investment tone (not marketing)
   - Clear value proposition
   - Appropriate level of detail for investors
   - No promotional or sales language

DECISION RULES:
- APPROVED: All criteria score >= 7 AND no high-severity issues
- NOT_APPROVED: Any criteria score < 7 OR any high-severity issue present

SEVERITY LEVELS:
- high: Must fix before sharing (invented data, legal risk, confidentiality breach)
- medium: Should fix (risky claims, moderate constraint violations)
- low: Optional improvements (terminology, minor density issues)

Be strict but fair. A presentation must meet investor-grade standards.`;

    const userPrompt = `Validate this M&A presentation:

SLIDES:
${JSON.stringify(slides, null, 2)}

${inputs ? `ORIGINAL INPUTS (for cross-reference):
${JSON.stringify(inputs, null, 2)}` : 'No original inputs provided for cross-reference.'}

Analyze each slide and return a validation report.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        tools: [{
          type: 'function',
          function: {
            name: 'submit_validation_report',
            description: 'Submit the approval decision and validation report for the M&A presentation',
            parameters: {
              type: 'object',
              properties: {
                approval_decision: {
                  type: 'string',
                  enum: ['APPROVED', 'NOT_APPROVED'],
                  description: 'Final decision for external distribution'
                },
                approval_justification: {
                  type: 'string',
                  description: 'Short justification for the approval decision (2-3 sentences)'
                },
                professional_quality: {
                  type: 'object',
                  properties: {
                    score: { type: 'number', minimum: 1, maximum: 10 },
                    issues: { type: 'array', items: { type: 'string' } }
                  },
                  required: ['score', 'issues']
                },
                credibility: {
                  type: 'object',
                  properties: {
                    score: { type: 'number', minimum: 1, maximum: 10 },
                    issues: { type: 'array', items: { type: 'string' } }
                  },
                  required: ['score', 'issues']
                },
                confidentiality_compliance: {
                  type: 'object',
                  properties: {
                    score: { type: 'number', minimum: 1, maximum: 10 },
                    issues: { type: 'array', items: { type: 'string' } }
                  },
                  required: ['score', 'issues']
                },
                investor_suitability: {
                  type: 'object',
                  properties: {
                    score: { type: 'number', minimum: 1, maximum: 10 },
                    issues: { type: 'array', items: { type: 'string' } }
                  },
                  required: ['score', 'issues']
                },
                overall_quality_score: {
                  type: 'number',
                  description: 'Overall quality score from 1-10',
                  minimum: 1,
                  maximum: 10
                },
                issues_per_slide: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      slide_index: { type: 'number' },
                      issues: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            type: { 
                              type: 'string',
                              enum: ['constraint_violation', 'risky_claim', 'inconsistent_term', 'text_density', 'invented_data']
                            },
                            severity: { 
                              type: 'string',
                              enum: ['low', 'medium', 'high']
                            },
                            description: { type: 'string' },
                            location: { 
                              type: 'string',
                              enum: ['headline', 'subline', 'bullets', 'stats', 'body']
                            }
                          },
                          required: ['type', 'severity', 'description', 'location']
                        }
                      }
                    },
                    required: ['slide_index', 'issues']
                  }
                },
                suggested_fixes: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      slide_index: { type: 'number' },
                      location: { type: 'string' },
                      original: { type: 'string' },
                      suggested: { type: 'string' },
                      reason: { type: 'string' }
                    },
                    required: ['slide_index', 'location', 'original', 'suggested', 'reason']
                  }
                },
                risk_flags: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      slide_index: { type: 'number' },
                      flag: { type: 'string' },
                      recommendation: { type: 'string' }
                    },
                    required: ['slide_index', 'flag', 'recommendation']
                  }
                }
              },
              required: ['approval_decision', 'approval_justification', 'professional_quality', 'credibility', 'confidentiality_compliance', 'investor_suitability', 'overall_quality_score', 'issues_per_slide', 'suggested_fixes', 'risk_flags']
            }
          }
        }],
        tool_choice: { type: 'function', function: { name: 'submit_validation_report' } },
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Payment required. Please add credits to your workspace.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: 'Failed to validate presentation' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall || toolCall.function.name !== 'submit_validation_report') {
      console.error('Unexpected response format:', JSON.stringify(data));
      return new Response(
        JSON.stringify({ error: 'Unexpected response format from AI' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const report: ValidationReport = JSON.parse(toolCall.function.arguments);

    // Calculate summary stats
    const totalIssues = report.issues_per_slide.reduce((sum, s) => sum + s.issues.length, 0);
    const highSeverityCount = report.issues_per_slide.reduce(
      (sum, s) => sum + s.issues.filter(i => i.severity === 'high').length, 0
    );

    return new Response(
      JSON.stringify({
        ...report,
        summary: {
          total_issues: totalIssues,
          high_severity: highSeverityCount,
          medium_severity: report.issues_per_slide.reduce(
            (sum, s) => sum + s.issues.filter(i => i.severity === 'medium').length, 0
          ),
          low_severity: report.issues_per_slide.reduce(
            (sum, s) => sum + s.issues.filter(i => i.severity === 'low').length, 0
          ),
          risk_flags_count: report.risk_flags.length,
          suggested_fixes_count: report.suggested_fixes.length,
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in validate-presentation:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
