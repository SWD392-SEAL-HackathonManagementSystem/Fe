import dayjs from 'dayjs';

export const mapRoundToFE = (beData) => {
  if (!beData) return null;
  return {
    ...beData,
    sequence_order: beData.sequenceOrder,
    is_final: beData.isFinal,
    round_type: beData.roundType,
    late_submission_policy: beData.lateSubmissionPolicy,
    submission_open: beData.submissionOpen,
    submission_deadline: beData.submissionDeadline,
    coding_duration_hours: beData.codingDurationHours,
    problem_statement_url: beData.problemStatementUrl,
    problem_released_at: beData.problemReleasedAt,
    top_n_advance: beData.topNAdvance,
    wildcard_enabled: beData.wildcardEnabled,
    min_teams_final: beData.minTeamsFinal,
    tiebreak_rule: beData.tiebreakRule,
    is_active: beData.isActive,
  };
};

export const mapRoundToBE = (feData) => {
  if (!feData) return null;
  return {
    name: feData.name,
    sequenceOrder: feData.sequence_order ? parseInt(feData.sequence_order) : 1,
    isFinal: !!feData.is_final,
    roundType: feData.round_type || 'PRELIMINARY',
    lateSubmissionPolicy: feData.late_submission_policy || 'HARD_LOCK',
    submissionOpen: feData.submission_open ? dayjs(feData.submission_open).format('YYYY-MM-DDTHH:mm:ss') : null,
    submissionDeadline: feData.submission_deadline ? dayjs(feData.submission_deadline).format('YYYY-MM-DDTHH:mm:ss') : null,
    codingDurationHours: feData.coding_duration_hours ? parseInt(feData.coding_duration_hours) : null,
    problemStatementUrl: feData.problem_statement_url,
    problemReleasedAt: feData.problem_released_at ? dayjs(feData.problem_released_at).format('YYYY-MM-DDTHH:mm:ss') : null,
    topNAdvance: feData.top_n_advance ? parseInt(feData.top_n_advance) : null,
    wildcardEnabled: !!feData.wildcard_enabled,
    minTeamsFinal: feData.min_teams_final ? parseInt(feData.min_teams_final) : null,
    tiebreakRule: feData.tiebreak_rule || 'PENALTY_SCORE',
  };
};
