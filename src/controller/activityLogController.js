const { Op, fn, col, literal } = require('sequelize');
const sequelize = require('../config/database');
const SystemLog = require('../model/SystemLog');
const User = require('../model/User');

const getLogs = async (req, res) => {
  try {
    const { page = 1, limit = 50, search, action, status, role, dateFrom, dateTo } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const where = {};
    if (action && action !== 'ALL') where.action = action;
    if (status && status !== 'ALL') where.status = status;
    if (role && role !== 'ALL') where.role = role;
    if (dateFrom || dateTo) {
      where.created_at = {};
      if (dateFrom) where.created_at[Op.gte] = new Date(dateFrom);
      if (dateTo) where.created_at[Op.lte] = new Date(dateTo);
    }
    if (search) {
      where[Op.or] = [
        { username: { [Op.like]: `%${search}%` } },
        { ip_address: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } },
        { resource: { [Op.like]: `%${search}%` } },
      ];
    }
    const { count, rows } = await SystemLog.findAndCountAll({
      where,
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset,
      include: [{ model: User, as: 'user', attributes: ['full_name'], required: false }],
    });
    const data = rows.map(log => ({ ...log.toJSON(), full_name: log.user?.full_name || null }));
    res.json({ success: true, data, total: count, page: parseInt(page), totalPages: Math.ceil(count / parseInt(limit)) });
  } catch (err) {
    console.error('[getLogs]', err);
    res.status(500).json({ success: false, message: 'Failed to fetch logs', error: err.message });
  }
};

const getLogStats = async (req, res) => {
  try {
    const [actionStats, statusStats] = await Promise.all([
      SystemLog.findAll({ attributes: ['action', [fn('COUNT', col('log_id')), 'count']], group: ['action'], raw: true }),
      SystemLog.findAll({ attributes: ['status', [fn('COUNT', col('log_id')), 'count']], group: ['status'], raw: true }),
    ]);
    res.json({ success: true, data: { actionStats, statusStats } });
  } catch (err) {
    console.error('[getLogStats]', err);
    res.status(500).json({ success: false, message: 'Failed to fetch stats', error: err.message });
  }
};

const getSecurityEvents = async (req, res) => {
  try {
    const { page = 1, limit = 50, search } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const baseWhere = { [Op.or]: [{ action: 'LOGIN_FAILED' }, { status: 'FAILED' }] };
    if (search) {
      baseWhere[Op.and] = [{ [Op.or]: [
        { username: { [Op.like]: `%${search}%` } },
        { ip_address: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } },
      ]}];
    }
    const { count, rows } = await SystemLog.findAndCountAll({
      where: baseWhere,
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset,
      include: [{ model: User, as: 'user', attributes: ['full_name'], required: false }],
    });
    const data = rows.map(log => ({ ...log.toJSON(), full_name: log.user?.full_name || null }));
    const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const topIps = await SystemLog.findAll({
      attributes: ['ip_address', [fn('COUNT', col('log_id')), 'count']],
      where: { [Op.or]: [{ action: 'LOGIN_FAILED' }, { status: 'FAILED' }], created_at: { [Op.gte]: since24h }, ip_address: { [Op.not]: null } },
      group: ['ip_address'],
      order: [[literal('count'), 'DESC']],
      limit: 10,
      raw: true,
    });
    const [totalFailed, failedLogins24h] = await Promise.all([
      SystemLog.count({ where: { status: 'FAILED' } }),
      SystemLog.count({ where: { action: 'LOGIN_FAILED', created_at: { [Op.gte]: since24h } } }),
    ]);
    const securityScore = Math.round(Math.max(0, 100 - Math.min(failedLogins24h * 2, 50) - Math.min(totalFailed / 10, 30)));
    res.json({ success: true, data, total: count, page: parseInt(page), totalPages: Math.ceil(count / parseInt(limit)), topIps, stats: { totalFailed, failedLogins24h, securityScore } });
  } catch (err) {
    console.error('[getSecurityEvents]', err);
    res.status(500).json({ success: false, message: 'Failed to fetch security events', error: err.message });
  }
};

const getDbStats = async (req, res) => {
  try {
    const tables = [
      'ambulances','case_approvals','case_escalations','case_queries',
      'districts','documents','enquiries','flight_assignments',
      'hospitals','invoices','notifications','permissions',
      'post_operation_reports','referral_authorities','system_logs','users',
    ];
    const counts = await Promise.all(tables.map(async (table) => {
      try {
        const [result] = await sequelize.query('SELECT COUNT(*) as count FROM `' + table + '`');
        return { table, count: parseInt(result[0].count) };
      } catch { return { table, count: 0 }; }
    }));
    const lastActivities = await SystemLog.findAll({
      attributes: ['resource', [fn('MAX', col('created_at')), 'last_activity']],
      group: ['resource'],
      raw: true,
    });
    const lastActivityMap = {};
    lastActivities.forEach(r => { lastActivityMap[r.resource] = r.last_activity; });
    const tableData = counts.map(({ table, count }) => ({
      name: table,
      records: count,
      lastActivity: lastActivityMap[table] || lastActivityMap[table.replace(/_/g, '-')] || null,
    }));
    let connectionStatus = 'Active';
    try { await sequelize.authenticate(); } catch { connectionStatus = 'Error'; }
    res.json({ success: true, data: { tables: tableData, totalTables: tables.length, totalRecords: counts.reduce((s, t) => s + t.count, 0), connectionStatus } });
  } catch (err) {
    console.error('[getDbStats]', err);
    res.status(500).json({ success: false, message: 'Failed to fetch DB stats', error: err.message });
  }
};

module.exports = { getLogs, getLogStats, getSecurityEvents, getDbStats };
