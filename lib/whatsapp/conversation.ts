// lib/whatsapp/conversation.ts
// Handles incoming WhatsApp messages — conversational Claude layer
// Reads knowledge_base, live Meta data, agent_actions, and responds naturally

import Anthropic from '@anthropic-ai/sdk'
import { neon } from '@neondatabase/serverless'
import { sendWhatsAppMessage } from './client'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
const sql = neon(process.env.DATABASE_URL!)

export async function handleIncomingMessage(from: string, message: string): Promise<void> {

  console.log(`[whatsapp] Incoming from ${from}: ${message}`)

  try {
    // ── 1. Load context from DB ──────────────────────────────────────────────

    // Recent agent actions (last 7 days)
    const recentActions = await sql`
      SELECT action_type, details, created_at
      FROM agent_actions
      ORDER BY created_at DESC
      LIMIT 20
    `

    // Active campaign briefs
    const briefs = await sql`
      SELECT id, avatar, offer, daily_budget, cpl_cap, status, created_at
      FROM campaign_briefs
      WHERE status = 'active'
      LIMIT 10
    `

    // Knowledge base entries
    let knowledgeBase: { content: string; category: string; created_at: Date }[] = []
    try {
      knowledgeBase = await sql`
        SELECT content, category, created_at
        FROM knowledge_base
        ORDER BY created_at DESC
        LIMIT 50
      ` as { content: string; category: string; created_at: Date }[]
    } catch {
      // Table may not exist yet — non-fatal
      console.log('[whatsapp] knowledge_base table not found, skipping')
    }

    // Recent fatigue flags
    const fatigueFlags = await sql`
      SELECT ad_name, trigger_reason, frequency, ctr_current, ctr_drop_pct, detected_at, status
      FROM creative_fatigue_log
      ORDER BY detected_at DESC
      LIMIT 10
    `

    // ── 2. Check if this is a "new rule" or knowledge update ─────────────────
    const isKnowledgeUpdate = /^(new rule|remember|update rule|add rule|forget|ignore rule)/i.test(message.trim())

    if (isKnowledgeUpdate) {
      await handleKnowledgeUpdate(message, from)
      return
    }

    // ── 3. Build context for Claude ──────────────────────────────────────────
    const contextText = buildContext({ recentActions, briefs, knowledgeBase, fatigueFlags })

    const systemPrompt = `You are Buena Onda, an autonomous Meta ads management AI. You are talking to Mike, the owner of this system via WhatsApp.

You manage Mike's final expense life insurance Facebook ad campaigns. You have access to his campaign data, recent agent actions, and knowledge base.

YOUR PERSONALITY:
- Direct and concise — Mike is a no-BS guy, keep it tight
- Data-driven — always reference actual numbers when available
- Proactive — if you notice something worth flagging, mention it
- Conversational — this is WhatsApp, not a report. Talk like a sharp colleague

CAPABILITIES YOU CAN DISCUSS:
- Current campaign performance (CPL, spend, CTR, frequency)
- Recent actions taken by the agent
- Creative fatigue status
- Budget recommendations (always flag for approval, never promise auto-execution)
- Knowledge base rules and benchmarks
- Ad strategy and brainstorming

CURRENT SYSTEM DATA:
${contextText}

IMPORTANT RULES:
- Never auto-promise to execute budget changes — those require approval
- If Mike gives you a new rule, confirm you've noted it and tell him to prefix it with "New rule:" for it to be saved
- Keep responses under 300 words unless Mike asks for detail
- Use WhatsApp formatting: *bold* for emphasis, line breaks for readability
- If you don't have data to answer something, say so directly`

    // ── 4. Call Claude ───────────────────────────────────────────────────────
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 1000,
      messages: [
        {
          role: 'user',
          content: message,
        },
      ],
      system: systemPrompt,
    })

    const textBlock = response.content.find(b => b.type === 'text')
    const reply = textBlock && 'text' in textBlock ? textBlock.text : "Sorry, I couldn't process that. Try again."

    // ── 5. Send reply ────────────────────────────────────────────────────────
    await sendWhatsAppMessage(from, reply)

  } catch (err) {
    console.error('[whatsapp] Error handling message:', err)
    await sendWhatsAppMessage(from, "Something went wrong on my end. Try again in a moment.")
  }
}

// ── Knowledge base update handler ─────────────────────────────────────────────
async function handleKnowledgeUpdate(
  message: string,
  from: string
): Promise<void> {
  try {
    // Detect category
    let category = 'general'
    if (/cpl|cost per lead/i.test(message)) category = 'cpl'
    else if (/frequency/i.test(message)) category = 'frequency'
    else if (/ctr|click/i.test(message)) category = 'ctr'
    else if (/budget|spend/i.test(message)) category = 'budget'
    else if (/creative|hook|video|image/i.test(message)) category = 'creative'
    else if (/audience|avatar|demo/i.test(message)) category = 'audience'
    else if (/cpm/i.test(message)) category = 'cpm'

    await sql`
      INSERT INTO knowledge_base (content, category, source)
      VALUES (${message}, ${category}, 'whatsapp')
    `

    await sendWhatsAppMessage(
      from,
      `✅ Got it. Saved to knowledge base under *${category}*.\n\n_"${message}"_\n\nThis will be applied on the next agent cycle.`
    )
  } catch (err) {
    console.error('[whatsapp] Knowledge base insert error:', err)
    await sendWhatsAppMessage(from, "Couldn't save that rule — the knowledge base table may not exist yet. Run the migration first.")
  }
}

// ── Context builder ────────────────────────────────────────────────────────────
function buildContext({ recentActions, briefs, knowledgeBase, fatigueFlags }: {
  recentActions: Record<string, unknown>[]
  briefs: Record<string, unknown>[]
  knowledgeBase: Record<string, unknown>[]
  fatigueFlags: Record<string, unknown>[]
}): string {
  const sections: string[] = []

  if (briefs.length > 0) {
    sections.push(`ACTIVE CAMPAIGNS (${briefs.length}):
${briefs.map((b: Record<string, unknown>) => `- ${b.avatar} | Budget: $${b.daily_budget}/day | CPL Cap: $${b.cpl_cap}`).join('\n')}`)
  }

  if (recentActions.length > 0) {
    sections.push(`RECENT AGENT ACTIONS (last 7 days):
${recentActions.slice(0, 10).map((a: Record<string, unknown>) => {
  const details = a.details as Record<string, unknown>
  return `- [${new Date(a.created_at as string).toLocaleDateString()}] ${a.action_type}: ${details?.reason ?? 'no reason logged'}`
}).join('\n')}`)
  }

  if (fatigueFlags.length > 0) {
    const recent = fatigueFlags.slice(0, 5)
    sections.push(`CREATIVE FATIGUE FLAGS:
${recent.map((f: Record<string, unknown>) => `- ${f.ad_name} | Reason: ${f.trigger_reason} | Status: ${f.status}`).join('\n')}`)
  }

  if (knowledgeBase.length > 0) {
    sections.push(`KNOWLEDGE BASE (Mike's rules & benchmarks):
${knowledgeBase.map((k: Record<string, unknown>) => `- [${k.category}] ${k.content}`).join('\n')}`)
  }

  return sections.join('\n\n') || 'No campaign data available yet.'
}
