frappe.provide("erpnext.accounts.dimensions");
cur_frm.cscript.tax_table = "Advance Taxes and Charges";
// frappe.ui.form.off("set_account_currency_and_balance")

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
        if (frm.doc.razorpay_payment_link && (frm.doc.razorpay_payment_status !="Cancelled" && frm.doc.razorpay_payment_status !="Paid" )) {
            frm.add_custom_button(__('Cancel Payment Link'), () => {
                frappe.call({
                    method: "razorpay_payment_links_integration.controller.cancel_payment_link",
                    args: { "paymentLinkId": frm.doc.razorpay_payment_link },
                    callback: function (r) {
                        console.log(r);
                        frm.reload_doc()
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
        //  frm.set_value('login_user',frappe.user.full_name)
    },
    before_submit: async function (frm) {
        if (frm.doc.razorpay_payment_link && frm.doc.razorpay_payment_status != "Paid") {
            let promise = new Promise((resolve, reject) => {
                frappe.confirm('Payment Entry documents are supposed to be auto-submitted when the Payment confirmation is received from the Razorpay. Do you still want to continue?', () => {
                    resolve()
                },
                    () => {
                        reject()
                    }).get_primary_btn().css('background-color', 'red').css('color', 'white')
            });
            await promise.catch(() => {
                throw '';
                frappe.validated = false;
            });
        }
    },
    mode_of_payment: function(frm){
        if (frm.doc.mode_of_payment != "Razorpay Payment Link"&& frm.doc.posting_date) {
            // frappe.msgprint('Please Enter Reference No and Reference Date')
            frm.set_df_property('reference_no','reqd',1);
            frm.set_df_property("reference_date", "reqd", 1);
            // frm.save();
        };
    },
    set_account_currency_and_balance: function(frm, account, currency_field,
        balance_field, callback_function) {

    var company_currency = frappe.get_doc(":Company", frm.doc.company).default_currency;
    if (frm.doc.posting_date && account) {
        frappe.call({
            method: "erpnext.accounts.doctype.payment_entry.payment_entry.get_account_details",
            args: {
                "account": account,
                "date": frm.doc.posting_date,
                "cost_center": frm.doc.cost_center
            },
            callback: function(r, rt) {
                if(r.message) {
                    frappe.run_serially([
                        () => frm.set_value(currency_field, r.message['account_currency']),
                        () => {
                            frm.set_value(balance_field, r.message['account_balance']);

                            if(frm.doc.payment_type=="Receive" && currency_field=="paid_to_account_currency") {
                                frm.toggle_reqd(["reference_no", "reference_date"],
                                    (r.message['account_type'] == "Bank" ? 0 : 1|| r.message['account_type'] == "Cash"? 0 : 1));
                                if(!frm.doc.received_amount && frm.doc.paid_amount)
                                    frm.events.paid_amount(frm);
                            } else if(frm.doc.payment_type=="Pay" && currency_field=="paid_from_account_currency") {
                                frm.toggle_reqd(["reference_no", "reference_date"],
                                    (r.message['account_type'] == "Bank" ? 0 : 1 || r.message['account_type'] == "Cash" ? 0 : 1));

                                if(!frm.doc.paid_amount && frm.doc.received_amount)
                                    frm.events.received_amount(frm);

                                if (frm.doc.paid_from_account_currency == frm.doc.paid_to_account_currency
                                    && frm.doc.paid_amount != frm.doc.received_amount) {
                                        if (company_currency != frm.doc.paid_from_account_currency &&
                                            frm.doc.payment_type == "Pay") {
                                                frm.doc.paid_amount = frm.doc.received_amount;
                                            }
                                    }
                            }
                        },
                        () => {
                            if(callback_function) callback_function(frm);

                            frm.events.hide_unhide_fields(frm);
                            frm.events.set_dynamic_labels(frm);
                        }
                    ]);
                }
            }
        });
    }
},
    sales_order_id: function(frm) {
        var sales_order = frm.doc.sales_order_id;
        frappe.model.with_doc('Sales Order', sales_order, function() {
            var sales_order_doc = frappe.model.get_doc('Sales Order', sales_order);
            frm.set_value('party', sales_order_doc.customer);
            frm.set_value('party_name', sales_order_doc.customer_name);
        });
    },
    validate:function(frm) {
        let total = 0;
        frm.doc.references.forEach(i => {
            total += i.tds
        })
        // console.log(total)
        if (!frm.doc.deductions || frm.doc.deductions.length == 0){
            let new_row = frm.add_child("deductions");
            if (frm.doc.company=="Mycorporation Consultants Private Limited"){
                new_row.account = 'TDS Receivable - MCPL'
                new_row.cost_center = "Main - MCPL"
                new_row.amount = isNaN(total) ? 0 : total
                frm.refresh_field('deductions')
            } else if (frm.doc.company=="Brivan Consultants Private Limited") {
                new_row.account = 'TDS Receivable - BCL'
                new_row.cost_center = "Main - BCL"
                new_row.amount = total
            } else{
                new_row.account = 'TDS Receivable - KJ'
                new_row.cost_center = "Main - KJ "
                new_row.amount = total
            }}
    
            if (frm.doc.deductions.length > 0){
            for (let b = 0;b<frm.doc.deductions.length; b++){

                if (frm.doc.deductions[b].account != "TDS Payable - MCPL" && frm.doc.deductions[b].account != "TDS - BCL" && frm.doc.deductions[b].account != "TDS Receivable - KJ" ){
                    let new_row = frm.add_child("deductions");
                    if (frm.doc.company=="Mycorporation Consultants Private Limited"){
                        new_row.account = 'TDS Receivable - MCPL'
                        new_row.cost_center = "Main - MCPL"
                        new_row.amount = total
                        frm.refresh_field('deductions')
                    } else if (frm.doc.company=="Brivan Consultants Private Limited") {
                        new_row.account = 'TDS Receivable - BCL'
                        new_row.cost_center = "Main - BCL"
                        new_row.amount =total
                    } else{
                        new_row.account = 'TDS Receivable - KJ'
                        new_row.cost_center = "Main - KJ "
                        new_row.amount = total
                    }}
                else if(frm.doc.deductions[b].account == "TDS Receivable - MCPL" || frm.doc.deductions[b].account == "TDS Receivable - BCL" || frm.doc.deductions[b].account == "TDS Receivable - KJ" ){
                    frm.doc.deductions[b].amount =  isNaN(total) ? 0 : total
                    frm.refresh_field('deductions')
                }
            }
        }}
})

frappe.ui.form.on('Payment Entry Reference', {
        references_remove(frm){
            let total = 0
            frm.doc.references.forEach(i => {
                total += i.tds
            })
            for (let b = 0;b<frm.doc.deductions.length; b++){

                if (frm.doc.deductions[b].account != "TDS Receivable - MCPL" ||frm.doc.deductions[b].account != "TDS Receivable - BCL" ||frm.doc.deductions[b].account == "TDS Receivable - KJ"){
                    return
                }
                else if(frm.doc.deductions[b].account == "TDS Receivable - MCPL"||frm.doc.deductions[b].account == "TDS Receivable - BCL"||frm.doc.deductions[b].account == "TDS Receivable - KJ"){
                    
                    frm.doc.deductions[b].amount = 0
                    frm.doc.deductions[b].amount =  total
                    frm.refresh_field('deductions')
                }
            }
        
        }
    
    
})