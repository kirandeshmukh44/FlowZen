/**
 * FlowZen AI Priority Scoring Formula
 * 
 * Formula:
 * AI Score (0-100) = normalize( Wi * importance + Wu * urgency - We * effort )
 * 
 * Where:
 * - Wi: Weight of Importance (0 - 100)
 * - Wu: Weight of Urgency (0 - 100)
 * - We: Weight of Effort (0 - 100)
 * 
 * Task Attributes:
 * - importance: 1 to 10
 * - urgency: 1 to 10 (calculated from deadline proximity)
 * - effort: 1 to 10 (estimated hours scaled)
 */

export function calculateUrgency(deadline) {
  if (!deadline) return 5;
  const now = new Date().getTime();
  const due = new Date(deadline).getTime();
  const diffDays = Math.ceil((due - now) / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) return 10; // Overdue or due today
  if (diffDays === 1) return 9;
  if (diffDays <= 3) return 8;
  if (diffDays <= 7) return 6;
  if (diffDays <= 14) return 4;
  return 2;
}

export function computeAIScore(task, weights = { importance: 80, urgency: 70, effort: 30 }) {
  const Wi = Number(weights.importance ?? 80);
  const Wu = Number(weights.urgency ?? 70);
  const We = Number(weights.effort ?? 30);

  const importance = Number(task.importance ?? 5);
  const urgency = task.urgency !== undefined ? Number(task.urgency) : calculateUrgency(task.deadline);
  const effort = Number(task.effort ?? 3);

  // Raw score range: 
  // Max possible: Wi*10 + Wu*10 - We*1
  // Min possible: Wi*1 + Wu*1 - We*10
  const rawScore = (Wi * importance) + (Wu * urgency) - (We * effort);
  
  const minRaw = (Wi * 1) + (Wu * 1) - (We * 10);
  const maxRaw = (Wi * 10) + (Wu * 10) - (We * 1);
  const range = maxRaw - minRaw || 1;

  // Normalized to 0 - 100
  const normalized = Math.round(((rawScore - minRaw) / range) * 100);
  return Math.max(5, Math.min(99, normalized));
}

export function getTierFromScore(score) {
  if (score >= 80) return { label: 'High Priority', tier: 'high', color: 'rose' };
  if (score >= 50) return { label: 'Medium Priority', tier: 'medium', color: 'amber' };
  return { label: 'Low Priority', tier: 'low', color: 'cyan' };
}
