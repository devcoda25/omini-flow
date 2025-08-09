/**
 * @file This file contains utility functions for interacting with the WATI API.
 */

const WATI_API_ENDPOINT = process.env.WATI_API_ENDPOINT;
const WATI_ACCESS_TOKEN = process.env.WATI_ACCESS_TOKEN;

if (!WATI_API_ENDPOINT || !WATI_ACCESS_TOKEN) {
  console.warn(
    'WATI environment variables (WATI_API_ENDPOINT, WATI_ACCESS_TOKEN) are not set. WATI functionality will be disabled.'
  );
}

/**
 * Sends a template message to a WhatsApp number via WATI.
 *
 * @param whatsAppNumber The recipient's WhatsApp number (with country code).
 * @param templateName The name of the template to send.
 * @param broadcastName A descriptive name for this broadcast/session.
 * @param parameters An array of objects for personalizing the message.
 * @returns The response from the WATI API.
 * @see https://docs.wati.io/reference/messages_send-template-message
 */
export async function sendTemplateMessage(
  whatsAppNumber: string,
  templateName: string,
  broadcastName: string,
  parameters: { name: string; value: string }[]
) {
  if (!WATI_API_ENDPOINT || !WATI_ACCESS_TOKEN) {
    throw new Error('WATI environment variables are not configured.');
  }

  const url = `${WATI_API_ENDPOINT}/api/v1/sendTemplateMessage`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${WATI_ACCESS_TOKEN}`,
      },
      body: JSON.stringify({
        whatsappNumber: whatsAppNumber,
        template_name: templateName,
        broadcast_name: broadcastName,
        parameters: parameters,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        `WATI API Error: ${response.status} ${response.statusText} - ${JSON.stringify(errorData)}`
      );
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to send WATI template message:', error);
    throw error;
  }
}
