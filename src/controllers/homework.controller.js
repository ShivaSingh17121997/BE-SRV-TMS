const Homework = require('../models/homework.model');
const Student = require('../models/student.model');

exports.createHomework = async (req, res) => {
    try {
        const homework = new Homework(req.body);
        await homework.save();
        res.status(201).json({ success: true, data: { homework } });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

exports.getAllHomework = async (req, res) => {
    try {
        const { teacherId, studentId, page = 1, limit = 10 } = req.query;
        const query = {};
        if (teacherId) query.teacherId = teacherId;
        
        if (studentId) {
            // First, find if there's a Student document associated with this user ID
            const studentProfile = await Student.findOne({ userId: studentId });
            if (studentProfile) {
                // If found, fetch homework for that student profile
                query.studentId = studentProfile._id;
            } else {
                // If not found, fall back to direct ID check
                query.studentId = studentId;
            }
        }

        const homeworks = await Homework.find(query)
            .populate('teacherId', 'name')
            .populate('studentId', 'name')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(Number(limit));

        const total = await Homework.countDocuments(query);

        res.status(200).json({
            success: true,
            data: {
                homeworks,
                pagination: {
                    total,
                    page: Number(page),
                    limit: Number(limit),
                    totalPages: Math.ceil(total / limit)
                }
            }
        });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

exports.updateHomework = async (req, res) => {
    try {
        const homework = await Homework.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!homework) return res.status(404).json({ success: false, message: 'Homework not found' });
        res.status(200).json({ success: true, data: { homework } });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

exports.deleteHomework = async (req, res) => {
    try {
        const homework = await Homework.findByIdAndDelete(req.params.id);
        if (!homework) return res.status(404).json({ success: false, message: 'Homework not found' });
        res.status(200).json({ success: true, message: 'Homework deleted successfully' });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};
