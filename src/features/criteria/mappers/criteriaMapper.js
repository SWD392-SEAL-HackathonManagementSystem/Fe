export const mapCriterionToFE = (beData) => {
  if (!beData) return null;
  return {
    id: beData.id,
    track_id: beData.trackId,
    round_id: beData.roundId,
    source_criteria_id: beData.sourceCriteriaId,
    name: beData.name,
    type: beData.type,
    weight: beData.weight,
    max_score: beData.maxScore,
    description: beData.description,
    rubric_url: beData.rubricUrl,
    display_order: beData.displayOrder,
  };
};

export const mapCriterionToBE = (feData) => {
  if (!feData) return null;
  return {
    name: feData.name,
    type: feData.type,
    weight: Number(feData.weight),
    maxScore: Number(feData.max_score),
    description: feData.description,
    rubricUrl: feData.rubric_url || null,
    displayOrder: feData.display_order ? Number(feData.display_order) : 0,
  };
};
