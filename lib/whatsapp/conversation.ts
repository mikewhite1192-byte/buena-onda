// lib/whatsapp/conversation.ts
// Handles incoming WhatsApp messages — multi-user conversational Claude layer
// Looks up the user by their WhatsApp number, loads their client data, responds naturally

import Anthropic from '@anthropic-ai/sdk'
import { neon } from '@neondatabase/serverless'
import { sendWhatsAppMessage } from './client'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
const sql = neon(process.env.DATABASE_URL!)

export async function handleIncomingMessage(from: string, message: string): Promise<void> {
  console.log(`[whatsapp] Incoming from ${from}: ${message}`)

  try {
    // ── 1. Look up user by WhatsApp number ───────────────────────────────────
    const userRows = await sql`
      SELECT clerk_user_id FROM user_subscriptions
      WHERE whatsapp_number = ${from}
      LIMIT 1
    `

    if (userRows.length === 0) {
      console.log(`[whatsapp] No user found for number ${from} — ignoring`)
      return
    }

    const clerkUserId = userRows[0].clerk_user_id

    // ── 2. Load context from DB ──────────────────────────────────────────────

    // Their active clients
    const clients = await sql`
      SELECT id, name, vertical, meta_ad_account_id, cpl_target, roas_target, monthly_budget
      FROM clients
      WHERE owner_id = ${clerkUserId} AND status = 'active'
    `

    // Recent agent actions (last 7 days) for their clients
    const clientIds = clients.map(c => c.id)
    const recentActions = clientIds.length > 0 ? await sql`
      SELECT aa.action_type, aa.details, aa.created_at, cb.client_id
      FROM agent_actions aa
      JOIN campaign_briefs cb ON cb.id = aa.campaign_brief_id
      WHERE cb.client_id = ANY(${clientIds}::uuid[])
      ORDER BY aa.created_at DESC
      LIMIT 20
    ` : []

    // Recent ad metrics (last 7 days)
    const recentMetrics = clientIds.length > 0 ? await sql`
      SELECT am.ad_set_name, am.spend, am.leads, am.cpl, am.ctr, am.frequency, am.date_recorded, c.name AS client_name
      FROM ad_metrics am
      JOIN clients c ON c.meta_ad_account_id = am.ad_account_id
      WHERE c.id = ANY(${clientIds}::uuid[])
        AND am.date_recorded >= NOW() - INTERVAL '7 days'
      ORDER BY am.date_recorded DESC
      LIMIT 30
    ` : []

    // Knowledge base — owner-scoped so one tenant's instructions never leak
    // into another tenant's WhatsApp prompts. Legacy rows with NULL owner_id
    // are excluded so the cross-tenant contamination stops immediately.
    let knowledgeBase: { content: string; category: string }[] = []
    try {
      knowledgeBase = await sql`
        SELECT content, category FROM knowledge_base
        WHERE owner_id = ${clerkUserId}
        ORDER BY created_at DESC LIMIT 50
      ` as { content: string; category: string }[]
    } catch { /* non-fatal */ }

    // Creative fatigue flags
    const fatigueFlags = await sql`
      SELECT ad_name, trigger_reason, frequency, ctr_current, ctr_drop_pct, detected_at, status
      FROM creative_fatigue_log
      ORDER BY detected_at DESC LIMIT 10
    `

    // ── 3. Check for knowledge update ────────────────────────────────────────
    if (/^(new rule|remember|update rule|add rule|forget|ignore rule)/i.test(message.trim())) {
      await handleKnowledgeUpdate(message, from, clerkUserId)
      return
    }

    // ── 4. Build context for Claude ──────────────────────────────────────────
    const contextText = buildContext({ clients, recentActions, recentMetrics, knowledgeBase, fatigueFlags })

    const systemPrompt = `You are Buena Onda, an autonomous AI ads management platform. You are talking to one of your users via WhatsApp.

You manage their Meta ad campaigns automatically — monitoring performance, pausing underperformers, scaling winners, and detecting creative fatigue.

YOUR PERSONALITY:
- Direct and concise — no fluff, get to the point
- Data-driven — always reference actual numbers when available
- Proactive — if you notice something worth flagging, mention it
- Conversational — this is WhatsApp, not a report. Talk like a sharp colleague

CAPABILITIES YOU CAN DISCUSS:
- Current campaign performance (CPL, ROAS, spend, CTR, frequency)
- Recent actions taken by the agent
- Creative fatigue status
- Budget recommendations (flag for approval, don't promise auto-execution)
- Knowledge base rules and benchmarks
- Ad strategy and brainstorming

CURRENT DATA:
${contextText}

RULES:
- Never promise to auto-execute budget changes without approval
- If they give you a new rule, confirm it and tell them to prefix with "New rule:" to save it
- Keep responses under 300 words unless they ask for detail
- Use WhatsApp formatting: *bold* for emphasis, line breaks for readability
- If you don't have data to answer something, say so directly`

    // ── 5. Call Claude ───────────────────────────────────────────────────────
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 1000,
      system: systemPrompt,
      messages: [{ role: 'user', content: message }],
    })

    const textBlock = response.content.find(b => b.type === 'text')
    const reply = textBlock && 'text' in textBlock ? textBlock.text : "Sorry, couldn't process that. Try again."

    await sendWhatsAppMessage(from, reply)

  } catch (err) {
    console.error('[whatsapp] Error handling message:', err)
    await sendWhatsAppMessage(from, "Something went wrong on my end. Try again in a moment.")
  }
}

// ── Knowledge base update ──────────────────────────────────────────────────────
async function handleKnowledgeUpdate(message: string, from: string, ownerId: string): Promise<void> {
  try {
    // Cap stored content at 500 chars so a malicious sender can't bloat the
    // tenant's prompt context indefinitely.
    const trimmed = message.trim().slice(0, 500)

    let category = 'general'
    if (/cpl|cost per lead/i.test(trimmed)) category = 'cpl'
    else if (/frequency/i.test(trimmed)) category = 'frequency'
    else if (/ctr|click/i.test(trimmed)) category = 'ctr'
    else if (/budget|spend/i.test(trimmed)) category = 'budget'
    else if (/creative|hook|video|image/i.test(trimmed)) category = 'creative'
    else if (/audience|avatar|demo/i.test(trimmed)) category = 'audience'
    else if (/roas|return/i.test(trimmed)) category = 'roas'
    else if (/cpm/i.test(trimmed)) category = 'cpm'

    await sql`INSERT INTO knowledge_base (content, category, source, owner_id) VALUES (${trimmed}, ${category}, 'whatsapp', ${ownerId})`

    await sendWhatsAppMessage(from,
      `✅ Got it. Saved to knowledge base under *${category}*.\n\n_"${message}"_\n\nThis will be applied on the next agent cycle.`
    )
  } catch (err) {
    console.error('[whatsapp] Knowledge base insert error:', err)
    await sendWhatsAppMessage(from, "Couldn't save that rule. Try again.")
  }
}

// ── Context builder ────────────────────────────────────────────────────────────
function buildContext({ clients, recentActions, recentMetrics, knowledgeBase, fatigueFlags }: {
  clients: Record<string, unknown>[]
  recentActions: Record<string, unknown>[]
  recentMetrics: Record<string, unknown>[]
  knowledgeBase: Record<string, unknown>[]
  fatigueFlags: Record<string, unknown>[]
}): string {
  const sections: string[] = []

  if (clients.length > 0) {
    sections.push(`ACTIVE CLIENTS (${clients.length}):\n` +
      clients.map(c =>
        `- ${c.name} | ${c.vertical} | CPL target: $${c.cpl_target ?? 'not set'} | Budget: $${c.monthly_budget ?? 'not set'}/mo`
      ).join('\n'))
  }

  if (recentMetrics.length > 0) {
    sections.push(`RECENT AD PERFORMANCE (last 7 days):\n` +
      recentMetrics.slice(0, 10).map(m =>
        `- [${m.client_name}] ${m.ad_set_name ?? 'Ad set'} | Spend: $${parseFloat(m.spend as string ?? '0').toFixed(0)} | Leads: ${m.leads} | CPL: $${parseFloat(m.cpl as string ?? '0').toFixed(2)} | CTR: ${parseFloat(m.ctr as string ?? '0').toFixed(2)}%`
      ).join('\n'))
  }

  if (recentActions.length > 0) {
    sections.push(`RECENT AGENT ACTIONS:\n` +
      recentActions.slice(0, 10).map(a => {
        const d = a.details as Record<string, unknown>
        return `- [${new Date(a.created_at as string).toLocaleDateString()}] ${a.action_type}: ${d?.reason ?? '—'}`
      }).join('\n'))
  }

  if (fatigueFlags.length > 0) {
    sections.push(`CREATIVE FATIGUE FLAGS:\n` +
      fatigueFlags.slice(0, 5).map(f =>
        `- ${f.ad_name} | ${f.trigger_reason} | Status: ${f.status}`
      ).join('\n'))
  }

  if (knowledgeBase.length > 0) {
    sections.push(`KNOWLEDGE BASE (rules & benchmarks):\n` +
      knowledgeBase.map(k => `- [${k.category}] ${k.content}`).join('\n'))
  }

  return sections.join('\n\n') || 'No data available yet.'
}
