import frappe
from erpnext.accounts.doctype.payment_entry.payment_entry import (
	PaymentEntry
)

class PaymentEntry(PaymentEntry):
	def validate_transaction_reference(self):
		bank_account = self.paid_to if self.payment_type == "Receive" else self.paid_from
		bank_account_type = frappe.db.get_value("Account", bank_account, "account_type")

		if bank_account_type == "Bank" or bank_account_type == "Cash":
			if not self.reference_no or not self.reference_date:
				pass