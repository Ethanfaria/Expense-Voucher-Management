const express = require("express");
const { authenticate, requireRole } = require("../middleware/auth.js");
const {
  createVoucher,
  getMyVouchers,
  getVoucherById,
  deleteDraftVoucher,
  updateDraftVoucher,
  submitVoucher,
  approveVoucher,
  rejectVoucher, 
  getAllVouchers
} = require("../controllers/voucherController");
const{uploadEmployeeSignature}=require("../controllers/uploadController.js")
const { handleUpload } = require("../middleware/upload");
const router = express.Router();

router.use(authenticate);

//Employee
router.post("/", requireRole("EMPLOYEE"), createVoucher);
router.get("/me", requireRole("EMPLOYEE"), getMyVouchers);
router.get("/:id", requireRole("EMPLOYEE", "DIRECTOR", "ACCOUNTS"), getVoucherById);
router.delete("/:id", requireRole("EMPLOYEE"), deleteDraftVoucher);
router.put("/:id", requireRole("EMPLOYEE"), updateDraftVoucher);
router.post("/:id/signature", requireRole("EMPLOYEE"), handleUpload, uploadEmployeeSignature);
router.post("/:id/submit", requireRole("EMPLOYEE"), submitVoucher);

//Director
router.get( "/", requireRole("DIRECTOR", "ACCOUNTS"), getAllVouchers);
router.post("/:id/approve", requireRole("DIRECTOR"), handleUpload, approveVoucher);
router.post("/:id/reject", requireRole("DIRECTOR"), rejectVoucher);

module.exports = router;
