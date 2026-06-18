import axiosClient from '../../../../shared/api/axiosClient';

const appendIfPresent = (formData, key, value) => {
  if (value !== undefined && value !== null && value !== '') {
    formData.append(key, String(value));
  }
};

export const studentSubmissionService = {
  submitMultipart: async ({
    teamId,
    trackId,
    roundId,
    repoUrl,
    demoUrl,
    lateReason,
    slideFile,
  }) => {
    const formData = new FormData();
    formData.append('teamId', String(teamId));
    appendIfPresent(formData, 'trackId', trackId);
    appendIfPresent(formData, 'roundId', roundId);
    formData.append('repoUrl', repoUrl);
    appendIfPresent(formData, 'demoUrl', demoUrl);
    appendIfPresent(formData, 'lateReason', lateReason);
    if (slideFile) {
      formData.append('slideFile', slideFile);
    }

    return axiosClient.post('/api/v1/submissions', formData);
  },
};