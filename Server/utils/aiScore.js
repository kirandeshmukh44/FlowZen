// Server-side port of Client/src/utils/aiScore.js — keep formulas in sync.
// AI Score (0-100) = normalize( Wi*importance + Wu*urgency - We*effort )

const DEFAULT_WEIGHTS = { importance: 100, urgency: 100, effort: 100 };

function calculateUrgency(deadline) {
    if (!deadline) return 5;
    const now = new Date().getTime();
    const due = new Date(deadline).getTime();
    const diffDays = Math.ceil((due - now) / (1000 * 60 * 60 * 24));

    if (diffDays <= 0) return 10;
    if (diffDays === 1) return 9;
    if (diffDays <= 3) return 8;
    if (diffDays <= 7) return 6;
    if (diffDays <= 14) return 4;
    return 2;
}

const PRIORITY_TO_IMPORTANCE = { Low: 3, Medium: 5, High: 8, Critical: 10 };

function computeAIScore(task, weights = DEFAULT_WEIGHTS) {
    const Wi = Number(weights.importance ?? 100);
    const Wu = Number(weights.urgency ?? 100);
    const We = Number(weights.effort ?? 100);

    const importance = Number(task.importance ?? PRIORITY_TO_IMPORTANCE[task.priority] ?? 5);
    const urgency = task.urgency !== undefined && task.urgency !== null
        ? Number(task.urgency)
        : calculateUrgency(task.deadline);
    const effort = Number(task.effort ?? 3);

    const rawScore = (Wi * importance) + (Wu * urgency) - (We * effort);
    const minRaw = (Wi * 1) + (Wu * 1) - (We * 10);
    const maxRaw = (Wi * 10) + (Wu * 10) - (We * 1);
    const range = maxRaw - minRaw || 1;

    const normalized = Math.round(((rawScore - minRaw) / range) * 100);
    return Math.max(5, Math.min(99, normalized));
}

module.exports = { computeAIScore, calculateUrgency, DEFAULT_WEIGHTS, PRIORITY_TO_IMPORTANCE };
