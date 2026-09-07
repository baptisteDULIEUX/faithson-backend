import { Router } from 'express'
import * as ctrl from '../controllers/product.controller.js'
import { requireAdmin } from '../middlewares/requireAdmin.js'
import { uploadImage } from '../middlewares/upload.js'
import { query } from '../db.js'

const router = Router()

/* ---- Public ---- */
router.get('/products', ctrl.list)
router.get('/products/:id', ctrl.getOne)
router.get('/categories', ctrl.categories)

/* ---- Admin (gestion des produits) ---- */
router.post('/admin/products', requireAdmin, ctrl.create)
router.patch('/admin/products/:id', requireAdmin, ctrl.update)
router.delete('/admin/products/:id', requireAdmin, ctrl.remove)


/* ---- Upload image produit ---- */
router.post(
    '/admin/products/:id/image',
    requireAdmin,
    uploadImage.single('image'),
    async (req, res, next) => {
        try {
            if (!req.file) {
                return res.status(400).json({ error: 'Aucun fichier reçu.' })
            }
            const imageUrl = `/uploads/products/${req.file.filename}`
            await query(
                'UPDATE products SET image = $1, updated_at = now() WHERE id = $2',
                [imageUrl, req.params.id]
            )
            res.json({ ok: true, image: imageUrl })
        } catch (err) {
            next(err)
        }
    }
)

export default router
