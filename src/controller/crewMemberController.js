const { CrewMember } = require('../model');

// Get all crew members
const getAllCrewMembers = async (req, res) => {
  try {
    const { role } = req.query;
    const where = role ? { role } : {};
    const crew = await CrewMember.findAll({
      where,
      order: [['full_name', 'ASC']]
    });
    res.json(crew);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get crew member by ID
const getCrewMemberById = async (req, res) => {
  try {
    const crew = await CrewMember.findByPk(req.params.id);
    if (!crew) return res.status(404).json({ error: 'Crew member not found' });
    res.json(crew);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Create new crew member
const createCrewMember = async (req, res) => {
  try {
    const crew = await CrewMember.create(req.body);
    res.status(201).json(crew);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update crew member
const updateCrewMember = async (req, res) => {
  try {
    const [updated] = await CrewMember.update(req.body, {
      where: { crew_id: req.params.id }
    });
    if (updated) {
      const updatedCrew = await CrewMember.findByPk(req.params.id);
      res.json(updatedCrew);
    } else {
      res.status(404).json({ error: 'Crew member not found' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete crew member
const deleteCrewMember = async (req, res) => {
  try {
    const deleted = await CrewMember.destroy({
      where: { crew_id: req.params.id }
    });
    if (deleted) {
      res.status(204).send();
    } else {
      res.status(404).json({ error: 'Crew member not found' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getAllCrewMembers,
  getCrewMemberById,
  createCrewMember,
  updateCrewMember,
  deleteCrewMember
};
