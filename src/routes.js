import express from 'express';
import authMiddleware from './middlewares/auth';
import appMiddleware from './middlewares/app';
const routes = express.Router();

//Controllers
import adminController from './controllers/adminController';
import planController from './controllers/planController';
import faqController from './controllers/faqController';
import freeContentController from './controllers/freeContentController';
import paymentController from './controllers/paymentController';
import testimonyController from './controllers/testimonyController';
import paramController from './controllers/paramController';
import authController from './controllers/authController';
import couponController from './controllers/couponController';
import studentController from './controllers/studentController';
import faqCategoryController from './controllers/faqCategoryController';
import courseController from './controllers/courseController';


/*------Authentication---------*/
routes.post('/auth/signup', authController.signup);
routes.post('/auth/login', authController.login);
routes.post('/auth/recovery', authController.recoverPassword);
routes.post('/admins/auth/login', appMiddleware, authController.loginAdmin);


/*------Admins---------*/
// Permissions
routes.get('/admins/permissions', appMiddleware, authMiddleware, adminController.getAllPermissions);
routes.get('/users/permissions', appMiddleware, authMiddleware, adminController.getUserPermissions);
routes.post('/users/permissions', appMiddleware, authMiddleware, adminController.postPermission);
routes.delete('/users/permissions/:permission', appMiddleware, authMiddleware, adminController.deletePermission);

//Team
routes.get('/admins', appMiddleware, authMiddleware, adminController.get);
routes.get('/admins/:id', appMiddleware, authMiddleware, adminController.getById);
routes.post('/admins', appMiddleware, authMiddleware, adminController.register);
routes.put('/admins/:id', appMiddleware, authMiddleware, adminController.edit);
routes.delete('/admins/:id', appMiddleware, authMiddleware, adminController.delete);


/*------Students---------*/
routes.get('/students', appMiddleware, authMiddleware, studentController.get);
routes.get('/students/:id', appMiddleware, authMiddleware, studentController.getById);
routes.post('/students', appMiddleware, authMiddleware, studentController.registerStudent);
routes.put('/students/:id', appMiddleware, authMiddleware, studentController.editStudent);
// routes.put('/students/:id/password', authController.changePassword);


/*------Courses---------*/
routes.get('/courses/:studentId', appMiddleware, authMiddleware, courseController.get);
// routes.get('/courses/:id', );
// routes.post('/courses', );
// routes.put('/courses/:id', );
// routes.delete('/courses/:id', );


/*------Plans---------*/
routes.get('/plans', planController.getPlans);
routes.get('/plans/:id', planController.getPlanById);
// routes.post('/plans', );
// routes.put('/plans/:id', );


/*------FAQs---------*/
routes.get('/faqs', faqController.getFaqs);
routes.get('/faqs/:id', appMiddleware, authMiddleware, faqController.getFaqById);
routes.post('/faqs', appMiddleware, authMiddleware, faqController.postFaq);
routes.put('/faqs/:id', appMiddleware, authMiddleware, faqController.updateFaq);
routes.delete('/faqs/:id', appMiddleware, authMiddleware, faqController.deleteFaq);


/*------FAQs Categories---------*/
routes.get('/categories', appMiddleware, authMiddleware, faqCategoryController.get);
routes.get('/categories/:id', appMiddleware, authMiddleware, faqCategoryController.getById);
routes.post('/categories', appMiddleware, authMiddleware, faqCategoryController.post);
routes.put('/categories/:id', appMiddleware, authMiddleware, faqCategoryController.update);
routes.delete('/categories/:id', appMiddleware, authMiddleware, faqCategoryController.delete);


/*------Free Contents---------*/
routes.get('/free-contents', freeContentController.getFreeContents);
// routes.get('/free-contents/:id', );
// routes.post('/free-contents', );
// routes.put('/free-contents/:id', );
// routes.delete('/free-contents/:id');


/*------Coupons---------*/
routes.get('/coupons/:code/is-valid', couponController.isValid);
// routes.get('/coupons', );
// routes.get('/coupons/:id', );
// routes.post('/coupons', );
// routes.put('/coupons/:id', );
// routes.delete('/coupons/:id', );


/*------Parameters---------*/
routes.get('/parameters', paramController.getParams);
routes.get('/parameters/:key', paramController.getParamByKey);
routes.put('/parameters/:id', paramController.putParam);


/*------Payments---------*/
routes.post('/payments', paymentController.uniquePayment);
routes.post('/payments/recurrence', paymentController.recurrentPayment);
routes.post('/payments/webhook', paymentController.webhooks);

/*------Testimonials---------*/
routes.get('/testimonials', testimonyController.getTestimonials);
// routes.get('/testimonials/:id', );
// routes.post('/testimonials', );
// routes.put('/testimonials/:id', );
// routes.delete('/testimonials/:id', );


/*------Utils---------*/
routes.post('/forms', faqController.contactUs);


module.exports = routes;