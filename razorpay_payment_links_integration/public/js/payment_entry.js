frappe.ui.form.on("Payment Entry", {
    refresh: function (frm) {
        if (frm.doc.razorpay_payment_link) {
            frm.add_custom_button(__('Resend Notification'), () => {
                frappe.call({
                    method: "razorpay_payment_links_integration.controller.resend_notification",
                    args: { "paymentLinkId": frm.doc.razorpay_payment_link },
                    callback: function (r) {
                        console.log(r);
                    }
                });
            })
        }
        if (!frm.doc.__islocal && frm.doc.mode_of_payment == "Razorpay Payment Link" && !frm.doc.razorpay_payment_link) {
            frm.add_custom_button(__("Create payment Link "), () => {
                if (!frm.doc.paid_amount) {
                    frm.get_field('paid_amount').input.focus()
                    frappe.throw(__('Please enter Paid Amount to send payment link!'))
                }
                if (!frm.doc.contact_person) {
                    frm.get_field('contact_person').input.focus()
                    frappe.throw(__('Please select Contact to send payment link!'))
                }

                frappe.call({
                    method: "razorpay_payment_links_integration.controller.create_payment_link",
                    args: {
                        doc: frm.doc
                    },
                    callback: function (r) {
                        frm.reload_doc();
                    }
                })
            })
        }
    },
    before_submit: function (frm) {
        if (frm.doc.razorpay_payment_link && frm.doc.razorpay_payment_status != "Paid") {
            frappe.warn('Are you sure you want to proceed?',
                'Payment Entry documents are supposed to be auto-submitted when the Payment confirmation is received from the Razorpay.',
                () => {
                    // action to perform if Continue is selected
                },
                'Continue',
                true // Sets dialog as minimizable
            )
        }
    }
})