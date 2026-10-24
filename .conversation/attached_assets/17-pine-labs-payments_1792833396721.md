Only if the organisers want a real payment. Add Pine Labs payments.

- On the payment screen, replace the demo Pay button with "Pay with UPI (real money)", shown only after the buyer ticks "I approve this payment of Rs <amount>".
- Route POST /api/pay sends {order_id, amount_inr, buyer_name, buyer_approved: true} to AGENT_ID_PAYMENT_AGENT, which creates a Pine Labs payment request. Show its link or QR code.
- Check the order's payment status every 3 seconds until it is paid or failed. Only a confirmed payment moves the order past "Payment held".
- Label every screen clearly "Real payment" or "Demo payment". Show exactly what is being bought. Refunds go through /admin only.

Add AGENT_ID_PAYMENT_AGENT to Secrets first.
