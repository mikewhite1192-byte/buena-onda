// lib/whatsapp/client.ts
// Sends WhatsApp messages via Meta Cloud API

const BASE = 'https://graph.facebook.com/v19.0'

function getToken() {
  const token = process.env.WHATSAPP_TOKEN
  if (!token) throw new Error('WHATSAPP_TOKEN not set')
  return token
}

function getPhoneNumberId() {
  const id = process.env.WHATSAPP_PHONE_NUMBER_ID
  if (!id) throw new Error('WHATSAPP_PHONE_NUMBER_ID not set')
  return id
}

export async function sendWhatsAppMessage(to: string, message: string): Promise<boolean> {
  const token = getToken()
  const phoneNumberId = getPhoneNumberId()

  const res = await fetch(`${BASE}/${phoneNumberId}/messages`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to,
      type: 'text',
      text: { body: message },
    }),
  })

  const json = await res.json()
  if (json.error) {
    console.error('[whatsapp] Send error:', json.error)
    return false
  }

  console.log(`[whatsapp] Message sent to ${to}`)
  return true
}

// Notify Mike when agent takes an action
export async function notifyAgentAction(action: string, reason: string, result: string): Promise<void> {
  const mikeNumber = process.env.MIKE_WHATSAPP_NUMBER
  if (!mikeNumber) return

  const message = `🤖 *Buena Onda Agent Action*\n\n*Action:* ${action}\n*Reason:* ${reason}\n*Result:* ${result}\n\n_Reply to this message to ask questions or give instructions._`

  await sendWhatsAppMessage(mikeNumber, message)
}
