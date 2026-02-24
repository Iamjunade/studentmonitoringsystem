
/**
 * Service to handle SMS transmission via Android HTTP SMS Gateway.
 */

// FOR TESTING/DEMO: Override all outgoing messages to this number
const TEST_PHONE_NUMBER = "9177328305";

export const smsService = {
  /**
   * Sends an SMS using the backend API proxy.
   * Note: In this demo mode, all messages are routed to the TEST_PHONE_NUMBER if configured.
   */
  sendSMS: async (payload: { phone: string; message: string; recipient: string }): Promise<{ success: boolean; error?: string }> => {
    // We use the override number if it's a demo/test environment
    const targetPhone = TEST_PHONE_NUMBER || payload.phone;
    
    console.log(`[SMS SYSTEM] Dispatching request to backend for ${targetPhone}...`);

    try {
      const response = await fetch('/api/send-sms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone: targetPhone,
          message: payload.message
        }),
      });

      if (response.ok) {
        return { success: true };
      } else {
        const errorData = await response.json();
        return { success: false, error: errorData.error || "Failed to send SMS" };
      }
    } catch (error) {
      console.error("[SMS SERVICE ERROR]", error);
      return { success: false, error: "Network error calling backend" };
    }
  }
};
