# Copyright (c) 2022, Sameer Chauhan and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document

class RazorpayPaymentLinks(Document):
	def on_update(self):
		if(self.get('payment_for')):
			if(self.get('status') == "Paid"):
				try:
					pe_doc = frappe.get_doc('Payment Entry', self.get('payment_for'))
					if(pe_doc.razorpay_payment_status != "Paid" and pe_doc.docstatus != 1):
						pe_doc.razorpay_payment_status = "Paid"
						pe_doc.reference_no = self.get('reference_no') if self.get('reference_no') else ""
						pe_doc.reference_date = self.get('reference_date') if self.get('reference_date') else None
						pe_doc.docstatus = 1
						pe_doc.save(ignore_permissions=True)
				except:
					frappe.log_error('Razorpay Payment entry submit failed', 'Razorpay Payment entry submit failed')
			else:
				frappe.db.set_value('Payment Entry', self.get('payment_for'), 'razorpay_payment_status', self.status)

