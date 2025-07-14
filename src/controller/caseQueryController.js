const { CaseQuery, Enquiry ,  User} = require('../model');
const { ValidationError, ForeignKeyConstraintError } = require('sequelize');

exports.createCaseQuery = async (req, res) => {
  try {
    const { enquiry_id, query_text } = req.body;
    console.log('createCaseQuery - Request body:', { enquiry_id, query_text });

    if (!req.user) {
      console.log('createCaseQuery - No user in request');
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const raised_by_user_id = req.user.user_id;
    console.log('createCaseQuery - User:', { raised_by_user_id });

    if (!enquiry_id || !query_text) {
      return res.status(400).json({ success: false, message: 'enquiry_id and query_text are required' });
    }

    const enquiry = await Enquiry.findByPk(enquiry_id);
    if (!enquiry) {
      return res.status(404).json({ success: false, message: 'Enquiry not found' });
    }

    const caseQuery = await CaseQuery.create({
      enquiry_id,
      raised_by_user_id,
      query_text,
    });

    res.status(201).json({ success: true, data: caseQuery });
  } catch (err) {
    console.error('Create case query error:', err);
    if (err instanceof ValidationError) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: err.errors.map(e => ({ field: e.path, message: e.message })),
      });
    }
    if (err instanceof ForeignKeyConstraintError) {
      return res.status(400).json({ success: false, message: 'Invalid enquiry_id or user_id', error: err.message });
    }
    res.status(500).json({ success: false, message: 'Failed to create case query', error: err.message });
  }
};
exports.respondToCaseQuery = async (req, res) => {
  try {
    const { query_id } = req.params;
    const { response_text } = req.body;
    const responded_by_user_id = req.user.user_id;

    if (!response_text) {
      return res.status(400).json({ success: false, message: 'response_text is required' });
    }

    const caseQuery = await CaseQuery.findByPk(query_id);
    if (!caseQuery) {
      return res.status(404).json({ success: false, message: 'Case query not found' });
    }

    caseQuery.response_text = response_text;
    caseQuery.responded_by_user_id = responded_by_user_id;
    caseQuery.responded_at = new Date();
    await caseQuery.save();

    res.json({ success: true, data: caseQuery });
  } catch (err) {
    console.error('Respond to case query error:', err);
    res.status(500).json({ success: false, message: 'Failed to respond to case query', error: err.message });
  }
};

exports.getAllCaseQueries = async (req, res) => {
  try {
    const { enquiry_id } = req.query;
    console.log('getAllCaseQueries - Query params:', { enquiry_id });
    const where = enquiry_id ? { enquiry_id } : {};
    const caseQueries = await CaseQuery.findAll({
      where,
      attributes: [
        'query_id', 'query_code', 'enquiry_id', 'query_text',
        'response_text', 'created_at', 'responded_at'
      ],
      include: [
        {
          model: Enquiry,
          as: 'enquiry',
          attributes: ['enquiry_id', 'enquiry_code', 'patient_name', 'status']
        },
        {
          model: User,
          as: 'raisedBy',
          attributes: ['user_id', 'full_name', 'role']
        },
        {
          model: User,
          as: 'respondedBy',
          attributes: ['user_id', 'full_name', 'role'],
          required: false
        },
      ],
      order: [['created_at', 'DESC']],
    });
    console.log('Fetched queries:', caseQueries.length);
    res.json({ success: true, data: caseQueries });
  } catch (err) {
    console.error('Error fetching case queries:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch case queries', error: err.message });
  }
};
exports.getCaseQueryById = async (req, res) => {
  try {
    const { query_id } = req.params;
    const caseQuery = await CaseQuery.findByPk(query_id, {
      attributes: [
        'query_id','query_code','enquiry_id','query_text',
        'response_text','created_at','responded_at'
      ],
      include: [
        {
          model: Enquiry,
          as: 'enquiry',
          attributes: ['enquiry_id','enquiry_code','patient_name','status']
        },
        {
          model: User,
          as: 'raisedBy',
          attributes: ['user_id','full_name','role']
        },
        {
          model: User,
          as: 'respondedBy',
          attributes: ['user_id','full_name','role'],
          required: false
        },
      ],
    });

    if (!caseQuery) {
      return res.status(404).json({ success: false, message: 'Case query not found' });
    }

    res.json({ success: true, data: caseQuery });
  } catch (err) {
    console.error('Error fetching case query:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch case query', error: err.message });
  }
};
