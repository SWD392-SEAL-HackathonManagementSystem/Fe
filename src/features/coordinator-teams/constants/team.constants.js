
export const TEAM_STATUS = {
  PENDING: 'PENDING',        
  ACTIVE: 'ACTIVE',         
  REJECTED: 'REJECTED',     
  ELIMINATED: 'ELIMINATED', 
};

export const TEAM_STATUS_COLORS = {
  [TEAM_STATUS.PENDING]: 'gold',
  [TEAM_STATUS.ACTIVE]: 'green',
  [TEAM_STATUS.REJECTED]: 'red',
  [TEAM_STATUS.ELIMINATED]: 'default',
};

export const TEAM_STATUS_LABELS = {
  [TEAM_STATUS.PENDING]: 'Chờ duyệt',
  [TEAM_STATUS.ACTIVE]: 'Đã duyệt',
  [TEAM_STATUS.REJECTED]: 'Bị từ chối',
  [TEAM_STATUS.ELIMINATED]: 'Bị loại',
};


export const MEMBER_ROLE = {
  LEADER: 'LEADER',
  MEMBER: 'MEMBER',
};

export const MEMBER_ROLE_LABELS = {
  [MEMBER_ROLE.LEADER]: 'Trưởng nhóm',
  [MEMBER_ROLE.MEMBER]: 'Thành viên',
};

export const MEMBER_STATUS = {
  PENDING: 'PENDING',     
  ACCEPTED: 'ACCEPTED',  
  REJECTED: 'REJECTED',  
  LEFT: 'LEFT',          
};

export const MEMBER_STATUS_COLORS = {
  [MEMBER_STATUS.PENDING]: 'orange',
  [MEMBER_STATUS.ACCEPTED]: 'green',
  [MEMBER_STATUS.REJECTED]: 'red',
  [MEMBER_STATUS.LEFT]: 'default',
};


export const TAB_KEYS = {
  APPROVAL: 'approval_tab',
  ALLOCATION: 'allocation_tab',
};


export const TEAM_ERROR_CODES = {
  TEAM_NAME_DUPLICATE: 'TEAM_NAME_DUPLICATE',
  TEAM_LOCKED: 'TEAM_LOCKED',
  TEAM_HAS_MENTOR: 'TEAM_HAS_MENTOR_CANNOT_DISBAND',
  TRACK_ALREADY_ACTIVE: 'TRACK_ALREADY_ACTIVE', 
};

export const TEAM_ERROR_MESSAGES = {
  [TEAM_ERROR_CODES.TEAM_NAME_DUPLICATE]: 'Tên đội này đã tồn tại trong Hackathon, vui lòng chọn tên khác.',
  [TEAM_ERROR_CODES.TEAM_LOCKED]: 'Đội này đã bị khóa hệ thống, không thể thao tác thêm.',
  [TEAM_ERROR_CODES.TEAM_HAS_MENTOR]: 'Không thể giải tán đội đã được phân công Mentor!',
  [TEAM_ERROR_CODES.TRACK_ALREADY_ACTIVE]: 'Vòng thi đã bắt đầu, không thể bốc thăm đổi Track nữa!',
};