const { CaseQuery, Enquiry ,  User} = require('../model');
const { ValidationError, ForeignKeyConstraintError } = require('sequelize');

exports.createCaseQuery = async (req, res) => {
  try {
    const { enquiry_id, query_text } = req.body;
    // Creating case query with provided data

    if (!req.user) {
      // No user in request
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const raised_by_user_id = req.user.user_id;
    // User authenticated successfully

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
    const { user } = req;
    
    console.log('getAllCaseQueries - Query params:', { enquiry_id });
    console.log('getAllCaseQueries - User:', user ? { user_id: user.user_id, role: user.role } : 'No user');
    
    let where = enquiry_id ? { enquiry_id } : {};
    let includeOptions = [
      {
        model: Enquiry,
        as: 'enquiry',
        attributes: ['enquiry_id', 'enquiry_code', 'patient_name', 'status', 'submitted_by_user_id']
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
    ];

    // If user is CMO, filter to show only queries related to their enquiries
    if (user && user.role === 'CMO') {
      includeOptions[0].where = { submitted_by_user_id: user.user_id };
      console.log('CMO filtering applied - showing only queries for enquiries created by user_id:', user.user_id);
    }

    const caseQueries = await CaseQuery.findAll({
      where,
      attributes: [
        'query_id', 'query_code', 'enquiry_id', 'query_text',
        'response_text', 'created_at', 'responded_at'
      ],
      include: includeOptions,
      order: [['created_at', 'DESC']],
    });
    
    console.log('Fetched queries:', caseQueries.length);
    
    res.json({ 
      success: true, 
      data: caseQueries,
      filtered: user && user.role === 'CMO',
      user_id: user ? user.user_id : null
    });
  } catch (err) {
    console.error('Error fetching case queries:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch case queries', error: err.message });
  }
};
exports.getCaseQueryById = async (req, res) => {
  try {
    const { query_id } = req.params;
    const { user } = req;
    
    let includeOptions = [
      {
        model: Enquiry,
        as: 'enquiry',
        attributes: ['enquiry_id','enquiry_code','patient_name','status', 'submitted_by_user_id']
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
    ];

    // If user is CMO, filter to show only queries related to their enquiries
    if (user && user.role === 'CMO') {
      includeOptions[0].where = { submitted_by_user_id: user.user_id };
    }

    const caseQuery = await CaseQuery.findByPk(query_id, {
      attributes: [
        'query_id','query_code','enquiry_id','query_text',
        'response_text','created_at','responded_at'
      ],
      include: includeOptions,
    });

    if (!caseQuery) {
      const message = user && user.role === 'CMO' 
        ? 'Case query not found or you do not have access to it' 
        : 'Case query not found';
      return res.status(404).json({ success: false, message });
    }

    res.json({ success: true, data: caseQuery });
  } catch (err) {
    console.error('Error fetching case query:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch case query', error: err.message });
  }
};
