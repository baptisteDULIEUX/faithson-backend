import { Router } from 'express'
import * as ctrl from '../controllers/product.controller.js'
import { requireAdmin } from '../middlewares/requireAdmin.js'

const router = Router()

/* ---- Public ---- */
router.get('/products', ctrl.list)
router.get('/products/:id', ctrl.getOne)
router.get('/categories', ctrl.categories)

/* ---- Admin (gestion des produits) ---- */
router.post('/admin/products', requireAdmin, ctrl.create)
router.patch('/admin/products/:id', requireAdmin, ctrl.update)
router.delete('/admin/products/:id', requireAdmin, ctrl.remove)

export default router
