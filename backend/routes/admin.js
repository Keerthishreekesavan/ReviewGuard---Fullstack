const express = require('express');
const { protect } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleCheck');
const { getUsers, updateUserRole, toggleUserStatus, getStaffList, deleteUser } = require('../controllers/adminController');

const router = express.Router();

// All admin routes require auth + admin role
router.use(protect, requireRole('admin'));

router.get('/users', getUsers);
router.get('/staff', getStaffList);
router.put('/users/:id/role', updateUserRole);
router.put('/users/:id/toggle-status', toggleUserStatus);
router.delete('/users/:id', deleteUser);

module.exports = router;
