from . import __version__ as app_version

app_name = "razorpay_payment_links_integration"
app_title = "Razorpay Payment Links Integration"
app_publisher = "Extension Technologies | Sameer Chauhan"
app_description = "A frappe app for Razorpay Payment Links Integration"
app_email = "hello@extensionerp.com"
app_license = "MIT"
app_icon = "octicon credit-card"
app_color = "blue"
app_version = "0.0.3"

doctype_js = {
	"Payment Entry" : "razorpay_payment_links_integration.customizations.payment_entry.js"
	}

before_install = "razorpay_payment_links_integration.setup.install.before_install"

doc_events = {
	"Payment Entry": {
		"before_submit": "razorpay_payment_links_integration.customizations.payment_entry.before_submit"
	}
}

fixtures = [
    {"dt": "Custom Field", "filters": [["module", "=", "Razorpay Payment Links Integration"]]},
    {"dt": "Property Setter", "filters": [["module", "=", "Razorpay Payment Links Integration"]]}
    ]