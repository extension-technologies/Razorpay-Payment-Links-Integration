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


@frappe.whitelist()
def resend_notification(**kwargs):
    paymentLinkId = kwargs['paymentLinkId']
    RazorpayController().resend_notification(paymentLinkId)
    
@frappe.whitelist()
def create_payment_link(**Kwargs):
    """
    create request on the basis of pe_doc
    then create a new Razorpay Payment link record if payment link is created
    """
    pe_doc=json.loads(Kwargs['doc'])
    frappe.log_error('create payment link',pe_doc)
    
    contact_doc = frappe.get_doc('Contact', pe_doc.get('contact_person'))

    request = {}
    request['amount'] = pe_doc.get('paid_amount')
    request['currency'] = "INR"
    request['description'] = "For SO" # to udpate

    request['customer'] = {}
    request['customer']['name'] = f"{contact_doc.get('first_name', '')} {contact_doc.get('middle_name', '')} {contact_doc.get('last_name')}"
    request['customer']['email'] = contact_doc.get('email_id', '')
    request['customer']['contact'] = contact_doc.get('mobile_no', '')

    request['notify'] = {
            "sms": True,
            "email": True,
            "whatsapp": True
        }
    request['reminder_enable'] = True
    request['callback_url'] = "https://erp.brivan.in/"
    request['callback_method'] = "get"

    razorpayObj = RazorpayController.get_client()
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
        return doc


@frappe.whitelist(allow_guest=True)
def webhooks_handler():
    data = json.loads(frappe.request.data)
    frappe.log_error('Razorpay', data)
    doc = False

    try:
        event = data.get('event')
        razorpay_id = data.get('payload').get('payment_link').get('entity').get('id')
        doc = frappe.get_doc('Razorpay Payment Links', razorpay_id)
    except:
        frappe.log_error('Razorpay Webhooks Error', data)

    if(doc):
        if(event == "payment_link.paid"): doc.status = "Paid"
        if(event == "payment_link.cancelled"): doc.status = "Cancelled"
        if(event == "payment_link.expired"): doc.status = "Expired"
        doc.save(ignore_permissions=True)