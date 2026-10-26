const express = require('express')
const {authenticate, requireRole}= require('../middleware/auth')
const {handleUpload}=require('../middleware/upload')
const {saveMySignature}=require('../controllers/userController')

const router = express.Router();
router.use(authenticate)

router.post("/me/signature",requireRole("DIRECTOR"), handleUpload, saveMySignature)
module.exports=router;