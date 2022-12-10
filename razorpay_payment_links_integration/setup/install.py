import frappe
from frappe.desk.page.setup_wizard.setup_wizard import make_records


def before_install():
    records = [
        {"doctype": "Mode of Payment", "mode_of_payment": "Razorpay Payment Link", "enabled": 1, "type": "Bank"}
    ]
    make_records(records)