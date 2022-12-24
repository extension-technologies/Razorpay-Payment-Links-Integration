frappe.ui.form.on("Payment Entry", {
	refresh: function(frm) {
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
    },
        mode_of_payment (frm) {
            if (frm.doc.mode_of_payment!="Razorpay Payment Link") {
                frm.add_custom_button(__("Create payment Link ") ,()=> {
                    frappe.call({
                        method:"razorpay_payment_links_integration.controller.create_payment_link",
                        args:{
                            doc: frm.doc
                            },
                        callback: function(r) {
                            console.log(r);
                    }
                })
                
            })
            
        }
    },
        razorpay_payment_status(frm) {
		    if (razorpay_payment_status=="Paid") {
		        frm.save('Submit');
		    // } else if (razorpay_payment_status=="Cancelled") {
            //     frm.save('Cancel');
            // } else if (razorpay_payment_status=="Expired") {
            //      frm.save('Cancel');
            // }
	    }
    }
})