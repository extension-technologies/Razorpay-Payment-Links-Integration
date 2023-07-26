<a href="https://extensionerp.com"><img src="https://sgp1.digitaloceanspaces.com/cdn.extension/Extension-ERP-06-32.png" align="right" /></a>

# Razorpay Payment Links Integration

A frappe app for Razorpay Payment Links Integration.

## Setup
1. get-app:
```
bench get-app https://github.com/extension-technologies/Razorpay-Payment-Links-Integration.git --branch version-14
```
2. install-app:
```
bench install-app razorpay_payment_links_integration
```
3. Hope you have a ready Razorpay Account, and also enabled the Payment Links.
3. Setup Razorpay Credentials.

## Working
1. Create a Payment Entry and select payment mode as "Razorpay".
2. After saving Payment Entry, the Razorpay Link will be sent to customer's phone and email.
3. You can resend notification by pressing the button on the top of payment entry.
4. Same as resend you can cancel the payment link by pressing the button on the top of payment entry.
5. You can setup webhook in razorpay for payment links but passing the following API: `https://{your-domain}/api/method/razorpay_payments_link.controller.webhooks_handler`

#### License

MIT