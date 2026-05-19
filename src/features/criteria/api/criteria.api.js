const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1';

const handleResponse = async (response) => {
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const error = new Error(data?.message || 'API Error');
    error.status = response.status;
    error.data = data;
    throw error;
  }
  return data;
};

// Theo tài liệu fr-04-criteria.md, API được định nghĩa cho Round:
// Tuy nhiên ở giao diện V5.0 ta có khái niệm Track.
// Cần sử dụng endpoint phù hợp (nếu trackId != null thì gọi sang /tracks/..., nếu roundId thì gọi /rounds/...)
// Tạm thời nếu tài liệu chỉ quy định /rounds/ thì dùng roundId. Nhưng thiết kế mở rộng:
const getParentPath = (roundId, trackId) => {
  if (trackId) return `/tracks/${trackId}`;
  return `/rounds/${roundId}`;
};

// Chuyển snake_case (từ UI) thành camelCase (cho Backend)
const toCamelCase = (obj) => {
  if (!obj) return obj;
  return {
    ...obj,
    maxScore: obj.max_score !== undefined ? obj.max_score : obj.maxScore,
    displayOrder: obj.display_order !== undefined ? obj.display_order : obj.displayOrder,
    rubricUrl: obj.rubric_url !== undefined ? obj.rubric_url : obj.rubricUrl,
  };
};

// Chuyển camelCase (từ Backend) thành snake_case (cho UI)
const toSnakeCase = (obj) => {
  if (!obj) return obj;
  return {
    ...obj,
    max_score: obj.maxScore !== undefined ? obj.maxScore : obj.max_score,
    display_order: obj.displayOrder !== undefined ? obj.displayOrder : obj.display_order,
    rubric_url: obj.rubricUrl !== undefined ? obj.rubricUrl : obj.rubric_url,
  };
};

export const criteriaApi = {
  // 1. GET list criteria
  getCriteria: async (roundId, trackId) => {
    const path = getParentPath(roundId, trackId);
    const response = await fetch(`${BASE_URL}${path}/criteria`);
    const data = await handleResponse(response);
    if (data && data.data && data.data.items) {
      data.data.items = data.data.items.map(toSnakeCase);
    }
    return data;
  },

  // 2. GET weight summary
  getWeightSummary: async (roundId, trackId) => {
    const path = getParentPath(roundId, trackId);
    const response = await fetch(`${BASE_URL}${path}/criteria/weight-summary`);
    return handleResponse(response);
  },

  // 3. POST create one
  createCriterion: async (roundId, trackId, payload) => {
    const path = getParentPath(roundId, trackId);
    const response = await fetch(`${BASE_URL}${path}/criteria`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(toCamelCase(payload))
    });
    return handleResponse(response);
  },

  // 4. POST batch create
  createBatchCriteria: async (roundId, trackId, items) => {
    const path = getParentPath(roundId, trackId);
    const response = await fetch(`${BASE_URL}${path}/criteria/batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: items.map(toCamelCase) })
    });
    return handleResponse(response);
  },

  // 5. POST clone
  cloneCriteria: async (roundId, trackId, sourceRoundId, replaceExisting = false) => {
    const path = getParentPath(roundId, trackId);
    const response = await fetch(`${BASE_URL}${path}/criteria/clone`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sourceRoundId, replaceExisting })
    });
    return handleResponse(response);
  },

  // 6. PUT update
  updateCriterion: async (id, payload) => {
    const response = await fetch(`${BASE_URL}/criteria/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(toCamelCase(payload))
    });
    return handleResponse(response);
  },

  // 7. DELETE
  deleteCriterion: async (id) => {
    const response = await fetch(`${BASE_URL}/criteria/${id}`, {
      method: 'DELETE'
    });
    return handleResponse(response);
  }
};
