// const { Joi } = require('express-validation')

// module.exports = {
//     createSubscription:Joi.object({
//         body: Joi.object({
//             orgId: Joi.string().required(),
//             transactionId: Joi.string().required(),
//             purchase_date: Joi.string().required(),
//             duration: Joi.string(),
//             plan: Joi.string(),
//             items: Joi.array().items(Joi.object({
//                 type: Joi.string().required(),
//                 itemID: Joi.string().required(),
//                 qty: Joi.string().required(),
//             })),
//         }),
//     }),
//     checkPlan: Joi.object({
//         params: Joi.object({
//             key: Joi.string().required(),
//         }),
//     }),
//     details: Joi.object({
//         params: Joi.object({
//             id: Joi.number().required(),
//         }),
//     }),
// }
