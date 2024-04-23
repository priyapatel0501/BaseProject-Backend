const { status, razorpayInstance } = require('../../../utils');
const { validateWebhookSignature } = require('razorpay/dist/utils/razorpay-utils');
const CryptoJS = require('crypto-js');

// webhooks
exports.webhookHandler = async (req, res) => {
    try {
        const validateRequest = validateWebhookSignature(
            JSON.stringify(req.body),
            req.headers['x-razorpay-signature'],
            process.env.RAZORPAY_WEBHOOKS_SECRET
        );

        if (!validateRequest) {
            return res.status(status.BadRequest).json({ message: 'Invalid Request' });
        }

        /* eslint-disable-next-line no-unused-vars */
        const entity = req.body?.payload?.payment?.entity;

        // Handle the event
        switch (req.body.event) {
            case 'payment.authorized':
                console.log('Event:', req.body.event);
                break;
            case 'payment.captured':
                console.log('Event:', req.body.event);
                break;
            case 'refund.processed':
                console.log('Event:', req.body.event);
                break;
            default:
                console.log(`Unhandled event type ${req.body.event}`);
        }
        // Return a res to acknowledge receipt of the event
        return res.json({ message: 'Webhook Success.', received: true });
    } catch (err) {
        return res.status(status.InternalServerError).json(`Webhook Error: ${err?.message}`);
    }
};

// create order
exports.createOrder = async (req, res) => {
    try {
        // razorpay order options
        var options = {
            amount: req.body?.amount,
            currency: 'INR',
            payment: {
                capture: 'automatic',
                capture_options: {
                    automatic_expiry_period: 12,
                    manual_expiry_period: 7200,
                    refund_speed: 'optimum',
                },
            },
        };

        // generating order
        const order = await razorpayInstance.orders.create(options);
        if (!order) {
            return res.status(status.BadRequest).json({
                message: 'Failed to regenerate RazorPay order.',
            });
        }

        // ToDo: Store order details in DB
        const data = {
            razorpay: order,
        };
        return res.status(status.OK).json({ message: 'Payment order generated', data: data });
    } catch (err) {
        return res.status(status.InternalServerError).json({
            message: 'Something went wrong while creating Order!',
            error: err?.message,
        });
    }
};

// order success
exports.orderSuccess = async (req, res) => {
    try {
        // ToDo find order from db
        const order = {};
        // const order = await RazorPay.findOne({
        //     where: {
        //         orderId: req.body?.orderId,
        //         userId: req.client?.id,
        //     },
        // });

        if (!order) {
            return res.status(status.NotFound).json({
                message: 'Payment Order Does not exist!',
            });
        }

        // generating signature string from orderId and paymentId
        let rpString = req.body?.orderId + '|' + req.body?.paymentId;
        let expectedSignature = CryptoJS.HmacSHA256(rpString, process.env.RAZORPAY_SECRET).toString();

        let formData = {
            paymentId: req.body?.paymentId,
            signature: req.body?.signature,
        };

        if (expectedSignature === req.body?.razorpaySignature) {
            formData.status = 'authorized';
        } else {
            formData.status = 'failed';
            formData.failedReason = 'Invalid Signature!';
        }

        // Todo update in db

        if (formData.status == 'failed') {
            return res.status(status.OK).json({ message: 'Payment Failed', data: order });
        }
        return res.status(status.OK).json({ message: 'Payment Successful', data: order });
    } catch (err) {
        console.error(err?.message);
        return res.status(status.InternalServerError).json({
            message: 'Something went wrong while checking payment!',
            error: err.message,
        });
    }
};

// order failed
exports.orderFailed = async (req, res) => {
    try {
        // ToDo find order from db
        const order = {};
        // const order = await RazorPay.findOne({
        //     where: {
        //         orderId: req.body?.orderId,
        //         userId: req.client?.id,
        //     },
        // });

        if (!order) {
            return res.status(status.NotFound).json({
                message: 'Payment Order Does not exist!',
            });
        }

        // let formData = {
        // 	status: 'failed',
        // 	failedReason: req.body.failedReason,
        // };

        // Todo update in db

        return res.status(status.OK).json({ message: 'Payment Updated', data: order });
    } catch (err) {
        console.error(err?.message);
        return res.status(status.InternalServerError).json({
            message: 'Something went wrong while checking payment!',
            error: err.message,
        });
    }
};
