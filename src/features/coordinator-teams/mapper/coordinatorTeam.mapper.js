import dayjs from 'dayjs';

export const mapTeamForCoordinator = (team) => {
  if (!team) return null;

  return {
    key: team.id, 
    id: team.id,
    teamName: team.teamName || 'N/A',
    leaderName: team.leaderName || 'N/A',
    
    acceptedMemberCount: team.acceptedMemberCount || 0,
    memberStats: `${team.acceptedMemberCount || 0}/5`,
    isInvalidMemberCount: (team.acceptedMemberCount || 0) < 3 || (team.acceptedMemberCount || 0) > 5,
    
    status: team.status,
    statusColor: team.status === 'PENDING' ? 'gold' : team.status === 'ACTIVE' ? 'green' : 'red',
    
    registeredAt: team.createdAt ? dayjs(team.createdAt).format('DD/MM/YYYY HH:mm') : 'N/A',
    
    isLocked: Boolean(team.isLocked),
    
    members: Array.isArray(team.members) 
      ? team.members.map(m => ({
          userId: m.userId,
          fullName: m.fullName,
          email: m.email,
          role: m.roleInTeam
        }))
      : []
  };
};
