import React, { useEffect, useState } from 'react';
import { Select, Spin, Typography } from 'antd';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { presentationService } from '../../judging/services/presentationService';
import toast from 'react-hot-toast';

const { Text } = Typography;

interface PresentationControllerCardProps {
  trackId?: number | null;
  roundId?: number | null;
  mode?: 'track' | 'round';
  canGrant?: boolean;
}

const PresentationControllerCard: React.FC<PresentationControllerCardProps> = ({
  trackId,
  roundId,
  mode = 'track',
  canGrant = false,
}) => {
  const queryClient = useQueryClient();
  const [selectedJudgeId, setSelectedJudgeId] = useState<number | null>(null);
  const scopeId = mode === 'round' ? roundId : trackId;
  const enabled = Boolean(scopeId);

  const { data: controller, isLoading: loadingController } = useQuery({
    queryKey: ['presentationController', mode, scopeId],
    queryFn: async () => {
      if (!scopeId) return null;
      return mode === 'round'
        ? presentationService.getRoundController(scopeId)
        : presentationService.getTrackController(scopeId);
    },
    enabled,
  });

  const { data: judges = [], isLoading: loadingJudges } = useQuery({
    queryKey: ['trackJudges', trackId],
    queryFn: async () => {
      if (!trackId || mode !== 'track') return [];
      const data = await presentationService.listTrackJudges(trackId);
      return Array.isArray(data) ? data : data?.items || data?.data || [];
    },
    enabled: Boolean(trackId) && mode === 'track',
  });

  useEffect(() => {
    if (controller?.judgeId) {
      setSelectedJudgeId(controller.judgeId);
    }
  }, [controller?.judgeId]);

  const grantMutation = useMutation({
    mutationFn: async (judgeId: number) => {
      if (!scopeId) throw new Error('Thiếu track/round');
      if (mode === 'round') {
        return presentationService.setRoundController(scopeId, judgeId);
      }
      return presentationService.setTrackController(scopeId, judgeId);
    },
    onSuccess: async () => {
      toast.success('Đã cập nhật presentation controller.');
      await queryClient.invalidateQueries({ queryKey: ['presentationController', mode, scopeId] });
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Không thể gán controller.');
    },
  });

  if (!enabled) return null;

  return (
    <div
      style={{
        background: 'white',
        border: '1px solid #E5E7EB',
        borderRadius: '12px',
        padding: '16px',
        marginBottom: '12px',
      }}
    >
      <Text strong style={{ display: 'block', marginBottom: 8 }}>
        Người điều khiển {mode === 'round' ? 'vòng CK' : 'track'}
      </Text>
      {loadingController ? (
        <Spin size="small" />
      ) : (
        <Text type="secondary" style={{ display: 'block', marginBottom: canGrant ? 10 : 0 }}>
          {controller?.judgeName
            ? `${controller.judgeName} (ID: ${controller.judgeId})`
            : 'Chưa có controller — HEAD judge mặc định trên BE.'}
        </Text>
      )}
      {canGrant && mode === 'track' && (
        <Select
          style={{ width: '100%' }}
          placeholder="Chọn judge"
          loading={loadingJudges || grantMutation.isPending}
          value={selectedJudgeId ?? undefined}
          onChange={(value) => {
            setSelectedJudgeId(value);
            grantMutation.mutate(value);
          }}
          options={judges.map((row: any) => ({
            value: row.judgeId ?? row.judge_id ?? row.userId,
            label: row.judgeName ?? row.judge_name ?? row.name ?? `Judge #${row.judgeId ?? row.id}`,
          }))}
        />
      )}
    </div>
  );
};

export default PresentationControllerCard;
