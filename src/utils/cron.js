const Class = require('../models/class.model');

/**
 * Background task to automatically update class statuses based on time.
 * - Marks scheduled classes as 'ongoing' if their start time has passed.
 * - Marks ongoing classes as 'completed' if their duration is over.
 * - Marks scheduled classes as 'missed' if they are past their end time and weren't started.
 */
const updateClassStatusAutomatically = async () => {
    try {
        const now = new Date();
        
        // The logic for automatic status updates is disabled as per user request to use manual updates by teacher.
        /*
        // 1. Mark scheduled classes as 'ongoing' if they are within their window
        const scheduledClasses = await Class.find({ status: 'scheduled' });
        for (const classItem of scheduledClasses) {
            const classStartTime = new Date(classItem.date);
            const [hours, minutes] = classItem.time.split(':');
            classStartTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

            const durationMs = (classItem.duration || 60) * 60 * 1000;
            const classEndTime = new Date(classStartTime.getTime() + durationMs);

            if (now >= classStartTime && now < classEndTime) {
                classItem.status = 'ongoing';
                await classItem.save();
                console.log(`[Cron] Class ${classItem._id} marked as ongoing`);
            } else if (now >= classEndTime) {
                classItem.status = 'completed';
                classItem.missed = !classItem.conducted;
                await classItem.save();
                console.log(`[Cron] Class ${classItem._id} marked as completed/missed`);
            }
        }

        // 2. Mark ongoing classes as 'completed' if their time is up
        const ongoingClasses = await Class.find({ status: 'ongoing' });
        for (const classItem of ongoingClasses) {
            const classStartTime = new Date(classItem.date);
            const [hours, minutes] = classItem.time.split(':');
            classStartTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

            const durationMs = (classItem.duration || 60) * 60 * 1000;
            const classEndTime = new Date(classStartTime.getTime() + durationMs);

            if (now >= classEndTime) {
                classItem.status = 'completed';
                if (!classItem.actualEndTime) classItem.actualEndTime = now;
                await classItem.save();
                console.log(`[Cron] Ongoing class ${classItem._id} completed automatically`);
            }
        }
        */

    } catch (error) {
        console.error('[Cron Error] Failed to update class statuses:', error);
    }
};

const initCron = () => {
    console.log('🕒 Initializing Background Class Monitor...');
    // Run every 1 minute
    setInterval(updateClassStatusAutomatically, 60 * 1000);
    // Also run immediately on start
    updateClassStatusAutomatically();
};

module.exports = { initCron };
