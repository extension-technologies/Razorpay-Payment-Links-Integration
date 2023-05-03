import frappe
import razorpay
import json


class RazorpayController():

    def __init__(self):
        """
        Function to init the razorpay creds
        """
        self.razorpay_creds = frappe.get_doc('Razorpay Credentials', 'Razorpay Credentials')

        self.client = razorpay.Client(auth=(self.razorpay_creds.api_id, self.razorpay_creds.api_key))
        self.client.set_app_details({"title" : "Razorpay Payment Links Integration", "version" : "0.0.1"})

    def get_client(self):
        return self.client

    def resend_notification(self, paymentLinkId):
        self.client.payment_link.notifyBy(paymentLinkId, "sms")
        self.client.payment_link.notifyBy(paymentLinkId, "email")

    def cancel_payment_link(self,paymentLinkId):
        self.client.payment_link.cancel(paymentLinkId)


@frappe.whitelist()
def resend_notification(**kwargs):
    paymentLinkId = kwargs['paymentLinkId']
    RazorpayController().resend_notification(paymentLinkId)


@frappe.whitelist()
def cancel_payment_link(**kwargs):
    paymentLinkId = kwargs['paymentLinkId']
    RazorpayController().cancel_payment_link(paymentLinkId)
    

@frappe.whitelist()
def create_payment_link(**Kwargs):
    """
    create request on the basis of pe_doc
    then create a new Razorpay Payment link record if payment link is created
    """
    pe_doc=json.loads(Kwargs['doc'])
    
    contact_doc = frappe.get_doc('Contact', pe_doc.get('contact_person'))

    request = {}
    request['amount'] = int(pe_doc.get('paid_amount')) * 100 # convert it to smallest value
    request['currency'] = "INR"

    request['description'] = ""
    for ref in pe_doc.get('references', []):
        request['description'] = request['description'] + f"{ref.get('reference_doctype')}: {ref.get('reference_name')}, "

    request['customer'] = {}
    request['customer']['name'] = f"{contact_doc.get('first_name') or ''} {contact_doc.get('middle_name') or ''} {contact_doc.get('last_name') or ''}"
    request['customer']['email'] = contact_doc.get('email_id', '')
    request['customer']['contact'] = contact_doc.get('mobile_no', '')

    request['notify'] = {
            "sms": True,
            "email": True,
            "whatsapp": True
        }
    request['reminder_enable'] = True

    razorpayObj = RazorpayController().get_client()
    link_obj = razorpayObj.payment_link.create(request)

    if(link_obj.get('error')):
        frappe.log_error('Razorpay create_payment_link Error', link_obj)
        return {'error': True}
    else:
        doc = frappe.new_doc('Razorpay Payment Links')
        doc.payment_for = pe_doc.get('name')
        doc.razorpay_id = link_obj.get('id')
        doc.link = link_obj.get('short_url')
        doc.amount = link_obj.get('amount')
        doc.insert()
        frappe.db.set_value('Payment Entry', pe_doc.get('name'), 'razorpay_payment_link', doc.name)
        return doc


@frappe.whitelist(allow_guest=True)
def webhooks_handler():
    data = json.loads(frappe.request.data)
    frappe.log_error('Razorpay webhook data', f'{data}')
    doc = False

    try:
        event = data.get('event')
        razorpay_id = data.get('payload').get('payment_link').get('entity').get('id')
        doc = frappe.get_doc('Razorpay Payment Links', razorpay_id)
    except:
        frappe.log_error('Razorpay Webhook Error', data)

    if(doc):
        if(event == "payment_link.paid"): 
            doc.status = "Paid"
            doc.reference_date = frappe.utils.today()
            payment = data.get('payload').get('payment').get('entity')
            if(payment.get('method') == "upi"):
                doc.reference_no = payment.get('acquirer_data').get('rrn')
            elif(payment.get('method') == "netbanking"):
                doc.reference_no = payment.get('acquirer_data').get('bank_transaction_id')
            elif(payment.get('method') == "card"):
                doc.reference_no = payment.get('acquirer_data').get('auth_code')

        if(event == "payment_link.cancelled"): doc.status = "Cancelled"
        if(event == "payment_link.expired"): doc.status = "Expired"

        doc.save(ignore_permissions=True)
        return True