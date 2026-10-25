const express = require("express");
const { authenticate, requireRole } = require("../middleware/auth.js");
const {
  createVoucher,
  getMyVouchers,
  getVoucherById,
  deleteDraftVoucher,
  updateDraftVoucher,
} = require("../controllers/voucherController");
const{uploadEmployeeSignature}=require("../controllers/uploadController.js")
const { handleUpload } = require("../middleware/upload");
const router = express.Router();

router.use(authenticate);
router.post("/", requireRole("EMPLOYEE"), createVoucher);
router.post("/me", requireRole("EMPLOYEE"), getMyVouchers);
router.get("/:id", requireRole("EMPLOYEE"), getVoucherById);
router.delete("/:id", requireRole("EMPLOYEE"), deleteDraftVoucher);
router.put("/:id", requireRole("EMPLOYEE"), updateDraftVoucher);
router.post("/:id/signature", requireRole("EMPLOYEE"), handleUpload, uploadEmployeeSignature);

module.exports = router;
