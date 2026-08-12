import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth';
import * as bookController from '../controllers/books.controller';

const router = Router();

/**
 * @swagger
 * /books:
 *   get:
 *     summary: Retrieve a list of all books
 *     tags: [Books]
 *     responses:
 *       200:
 *         description: A list of books
 */
router.get('/', bookController.getBooks);
router.get('/genres', bookController.getGenres);

/**
 * @swagger
 * /books/{id}:
 *   get:
 *     summary: Get a book by its ID
 *     tags: [Books]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: The requested book
 */
/**
 * @swagger
 * /books/lookup/{isbn}:
 *   get:
 *     summary: Look up a book's title/author/subject by ISBN via OpenLibrary (staff, for the Add Book form)
 *     tags: [Books]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: isbn
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Title/author/genre found for the ISBN
 *       404:
 *         description: No book found for that ISBN
 */
router.get(
  '/lookup/:isbn',
  authenticate,
  authorize(['librarian', 'admin']),
  bookController.lookupBook
);

router.get(
  '/search-covers',
  authenticate,
  authorize(['librarian', 'admin']),
  bookController.searchCovers
);

router.post(
  '/:id/select-cover',
  authenticate,
  authorize(['librarian', 'admin']),
  bookController.selectCover
);

import multer from 'multer';
const upload = multer({ storage: multer.memoryStorage() });

router.post(
  '/:id/cover',
  authenticate,
  authorize(['librarian', 'admin']),
  upload.single('cover'),
  bookController.uploadCoverFile
);

router.get('/:id', bookController.getBookById);

/**
 * @swagger
 * /books:
 *   post:
 *     summary: Add a new book to the library
 *     tags: [Books]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               author:
 *                 type: string
 *               genre:
 *                 type: string
 *               isbn:
 *                 type: string
 *               total_copies:
 *                 type: integer
 *     responses:
 *       201:
 *         description: The created book
 */
router.post('/', authenticate, authorize(['librarian', 'admin']), bookController.createBook);

/**
 * @swagger
 * /books/{id}:
 *   put:
 *     summary: Update an existing book
 *     tags: [Books]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: The updated book
 */
router.put('/:id', authenticate, authorize(['librarian', 'admin']), bookController.updateBook);

/**
 * @swagger
 * /books/{id}:
 *   delete:
 *     summary: Delete a book
 *     tags: [Books]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Deletion confirmation
 */
router.delete('/:id', authenticate, authorize(['admin']), bookController.deleteBook);

/**
 * @swagger
 * /books/{id}/copies:
 *   get:
 *     summary: Get all inventory copies of a book
 *     tags: [Books]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of copies
 */
router.get(
  '/:id/copies',
  authenticate,
  authorize(['admin', 'librarian']),
  bookController.getBookCopies
);

/**
 * @swagger
 * /books/{id}/copies:
 *   post:
 *     summary: Add a new copy of a book
 *     tags: [Books]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               barcode:
 *                 type: string
 *     responses:
 *       201:
 *         description: Created book copy
 */
router.post(
  '/:id/copies',
  authenticate,
  authorize(['librarian', 'admin']),
  bookController.addBookCopy
);

export default router;
