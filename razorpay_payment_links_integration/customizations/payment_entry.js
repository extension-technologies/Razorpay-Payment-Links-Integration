frappe.ui.form.on('Payment Entry', {
	refresh(frm){
        if(frm.doc.razorpay_payment_link){
            frm.add_custom_button(__('Resend Notification'), () => {
                frappe.call({
                    method: "razorpay_payment_links_integration.controller.resend_notification",
                    args: {"paymentLinkId": frm.doc.razorpay_payment_link},
                    callback: function(r) {
                        console.log(r);
                    }
                });
            })
        }
    }
})