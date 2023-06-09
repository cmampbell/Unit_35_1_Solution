const express = require('express');
const db = require("../db");
const ExpressError = require('../expressError');

const router = new express.Router();

router.get('/', async (req, res, next) => {
    try{
        const results = await db.query(`SELECT code, name FROM companies;`)
        if (results.rows.length === 0) throw new ExpressError('No results found', 404)
        return res.json({companies: results.rows })
    } catch (err) {
        next(err)
    }
})

router.get('/:code', async (req, res, next) => {
    try{
        const code = req.params.code
        const results = await db.query(`SELECT * FROM companies WHERE code=$1;`, [code])
        if (results.rows.length === 0) throw new ExpressError(`No result found for ${code}`, 404)

        const invoices = await db.query(`SELECT * FROM invoices WHERE comp_code=$1`, [code])
        return res.json({company: results.rows[0], invoices: invoices.rows})
    } catch (err) {
        next(err)
    }
})

router.post('/', async (req, res, next) => {
    try{
        const {name, code, description } = req.body;
        if(!name || !code || !description) throw new ExpressError(`Bad request`, 400)
        const results = await db.query(
            `INSERT INTO companies (name, code, description) 
            VALUES ($1, $2, $3) 
            RETURNING code, name, description`, [name, code, description])
        return res.status(201).json({company: results.rows[0]})
    } catch (err) {
        next(err);
    }
})

router.patch('/:code', async (req, res, next) => {
    try {
        const currCode = req.params.code
        const { name, code, description } = req.body;

        const found = await db.query(`SELECT * FROM companies WHERE code=$1;`, [currCode]);

        if (found.rows.length === 0) throw new ExpressError(`No result found for ${currCode}`, 404);

        const company = found.rows[0];

        if(company.name != name || company.code != code || company.description != description ){
            const results = await db.query(
                `UPDATE companies
                SET name = $1, code = $2, description = $3
                WHERE code = $4
                RETURNING code, name, description`, [name, code, description, currCode]
                )

            return res.json({company: results.rows[0]})
        } else {
            return res.json({company: company})
        }
    } catch(err) {
        next(err)
    }
})

router.delete('/:code', async (req, res, next) => {
    try{
        const code = req.params.code;
        const found = await db.query(`SELECT * FROM companies WHERE code=$1;`, [code])
        if (found.rows.length === 0) throw new ExpressError(`No result found for ${code}`, 404)

        const results = await db.query(`DELETE FROM companies WHERE code = $1 RETURNING name, code`, [code])
        return res.json({msg: 'Deleted', company: results.rows[0]})
    } catch (err) {
        next(err)
    }
})

module.exports = router;