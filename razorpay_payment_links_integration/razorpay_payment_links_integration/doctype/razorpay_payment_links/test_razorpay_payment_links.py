# Copyright (c) 2022, Sameer Chauhan and Contributors
# See license.txt

import frappe
from frappe.tests.utils import FrappeTestCase
from razorpay_payment_links_integration.controller import *

class TestRazorpayPaymentLinks(FrappeTestCase):
	pass

def test_create_payment_link():
	pe_doc = frappe.get_doc('Payment Entry', 'ACC-PAY-2022-00003').as_dict()
	create_payment_link(pe_doc)