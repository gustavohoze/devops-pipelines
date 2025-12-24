import express from 'express';
import {
  signUpController,
  signInController,
  signOutController,
} from '#controllers/auth.controller.js';

const router = express.Router();

router.post('/sign-up', signUpController);
router.post('/sign-in', signInController);
router.post('/sign-out', signOutController);

export default router;
