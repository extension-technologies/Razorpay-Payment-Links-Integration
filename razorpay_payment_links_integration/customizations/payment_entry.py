# import frappe
# from razorpay_payment_links_integration.controller import create_payment_link

# def before_submit(self, method=None):
#     '''
#     send the pe_doc for create payment link
#     '''
#     payment_link_doc = create_payment_link(self)
#     if(payment_link_doc.get('error')):
#         frappe.throw(
#             title='Razorpay Error',
#             msg='Error while generating Razorpay Payment Link'
#         )
#     else: 
#         self.razorpay_payment_link = payment_link_doc.get('name')
