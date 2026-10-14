const router = require('express').Router();
const controller = require('../controller/authController');
const auth = require('../middleware/authenticateToken');
const role = require('../middleware/requireRole');
router.post('/login', controller.loginUser);
router.post('/logout', controller.logoutUser);
router.get('/protected', auth, (req, res) => res.json({ user: { id: req.user.id, username: req.user.username, usertype: req.user.usertype } }));
router.post('/register', auth, role('admin'), controller.registerUser);
router.put('/edit/:id', auth, role('admin'), controller.editUser);
router.delete('/delete/:id', auth, role('admin'), controller.deleteUser);
module.exports = router;

