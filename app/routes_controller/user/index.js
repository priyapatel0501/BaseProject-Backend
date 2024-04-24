const router = require('express').Router();
const auth = require('../../middlewares/middleware');
const authPermission = require('../../middlewares/permission.middleware');
const controller = require('./lib/controller');
const { modules, status } = require('../../../utils');
const {
    validationRules,
    loginRules,
    updateRules,
    updatePassword,
    updateProfileRules,
    ForgotPasswordLink,
    updatePasswordForUser,
} = require('./lib/validation');

const multer = require('multer');
const { expressValidate } = require('../../../utils/lib/common-function');

// allowed types for multer
const allowedType = ['image/png', 'image/jpeg', 'image/jpg'];

// diskStorage object for multer : contains path for storing image
const fileStorage = multer.diskStorage({
    destination: 'uploads/profile',
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    },
});

// checking if uploaded file is allowed
const fileFilter = (req, file, cb) => {
    if (allowedType.includes(file.mimetype)) {
        return cb(null, true);
    } else {
        req.fileValidationError = true;
        return cb(null, false, req.fileValidationError);
    }
};

// checking if multer throwed any error
const multerMiddleware = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        let errorMessage = 'File upload error!';
        if (err?.code == 'LIMIT_UNEXPECTED_FILE') {
            errorMessage = `${err?.message} ${err?.field}`;
        }
        return res.status(status.InternalServerError).json({ message: errorMessage });
    }
    if (req.fileValidationError) {
        return res.status(status.BadRequest).json({ message: 'Only .png, .jpg and .jpeg format allowed!' });
    }
    next();
};

// multer upload object
const uploads = multer({
    storage: fileStorage,
    fileFilter: fileFilter,
});

// get all User
router.get('/user', auth, authPermission([modules.setup_user_view, modules.setup_user]), controller.findAll);

// get User by Id
router.get('/user/:id', auth, authPermission([modules.setup_user_view, modules.setup_user, modules.setup_user_edit]), controller.findById);

router.post(
    '/user',
    auth,
    authPermission([modules.setup_user_add]),
    uploads.single('profileImage'),
    multerMiddleware,
    validationRules(),
    expressValidate,
    controller.create
);

// login
router.post('/login', loginRules(), expressValidate, controller.login);

// update User
router.put(
    '/user/:id',
    auth,
    authPermission([modules.setup_user_edit]),
    uploads.single('profileImage'),
    multerMiddleware,
    updateRules(),
    expressValidate,
    controller.update
);

// update User status
router.put('/user/status/:id', auth, authPermission([modules.setup_user_edit]), controller.updateStatus);

// delete User
router.delete('/user/:id', auth, authPermission([modules.setup_user_delete]), controller.delete);

/** PROFILE APIS */

// get User by token
router.get('/token', auth, controller.verifyToken);

// find user by token
router.get('/profile', auth, controller.findByToken);

// get user by token
router.get('/validate-token', controller.validateToken);

// update Profile
router.put(
    '/profile',
    auth,
    uploads.single('profileImage'),
    multerMiddleware,
    updateProfileRules(),
    expressValidate,
    controller.updateProfile
);

// update Profile
router.put('/profile/remove-image', auth, controller.removeProfileImage);

// update User password
router.put('/profile/change-password', auth, updatePassword(), expressValidate, controller.updatePassword);

// password change with send mail
router.put('/admin/user-reset-password/:id', auth, updatePasswordForUser(), expressValidate, controller.updateUserPassword);

// email verification apis
// SEVL => Send Email Verification Link
router.get(`/verify`, auth, controller.SEVL);

// email verify
router.get(`/email-verify`, controller.validateEmail);

// forget password apis
// SEVLFP => Send Email Verification Link Forget Password
router.post('/user/forgot-password', ForgotPasswordLink(), expressValidate, controller.SEVLFP);

// reset password
router.post('/reset-password', updatePasswordForUser(), expressValidate, controller.resetPassword);

// user wise login
router.get('/mock-user/:id', auth, authPermission([modules.setup_user_mock_login]), controller.mockUserLogin);

module.exports = router;
