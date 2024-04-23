const { status, stripeInstance } = require('../../../utils');

// webhooks
exports.webhookHandler = async (req, res) => {
    try {
        const stripeSignature = req.headers['stripe-signature'];

        let event = stripeInstance.webhooks.constructEvent(req.body, stripeSignature, process.env.STRIPE_WEBHOOKS_SECRET);

        /* eslint-disable no-unused-vars */
        let body;

        // Handle the event
        switch (event.type) {
            case 'payment_intent.succeeded':
                body = event.data.object;
                break;
            case 'payment_intent.payment_failed':
                body = event.data.object;
                break;
            case 'payment_intent.canceled':
                body = event.data.object;
                break;
            case 'charge.refunded':
                body = event.data.object;
                break;
            case 'charge.refund.updated':
                body = event.data.object;
                break;
            case 'checkout.session.expired':
                body = event.data.object;
                break;
            default:
                console.log(`Unhandled event type ${event.type}`);
        }
        /* eslint-disable no-unused-vars */

        // Return a res to acknowledge receipt of the event
        return res.json({ message: 'Webhook Success.', received: true });
    } catch (err) {
        return res.status(status.InternalServerError).json(`Webhook Error: ${err?.message}`);
    }
};

// create order
exports.createCheckout = async (req, res) => {
    try {
        // ** Stripes requires customer to created before creating checkout.
        const customer = await stripeInstance.customers.create({
            email: req.client?.email,
            name: req.client?.firstName + ' ' + req.client?.lastName,
            phone: req?.client?.mobile,
        });

        const date = new Date();
        const expiresAt = new Date(date.setMinutes(date.getMinutes() + 30));

        // ToDo: Find product or object to be purchased from db
        const product = {};
        const session = await stripeInstance.checkout.sessions.create({
            customer: customer?.id,
            line_items: [
                {
                    price_data: {
                        currency: 'inr',
                        unit_amount: product?.amount,
                        product_data: {
                            name: product?.name,
                            description: product?.description,
                            images: ['https://feeltechsolutions.com/wp-content/uploads/2023/03/ec-icon.e4144313.svg'], // ToDo : add product image URLs
                        },
                    },
                    quantity: 1,
                },
            ],
            expires_at: expiresAt,
            mode: 'payment',
            success_url: null, // ToDo: Add Success URL
            cancel_url: null, // ToDo: Add Cancel URL
        });

        // ToDo: Store checkout details in DB

        return res.status(status.OK).json({
            url: session?.url,
        });
    } catch (err) {
        return res.status(status.InternalServerError).json({
            message: 'Something went wrong while generating Stripe Order!',
            error: err?.message,
        });
    }
};
