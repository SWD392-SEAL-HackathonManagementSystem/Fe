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

interface ControllerInfo {
  judgeId?: number;
  judge_id?: number;
  judgeName?: string;
  judge_name?: string;
  source?: string;
}

const resolveControllerLabel = (controller: ControllerInfo | null | undefined, mode: 'track' | 'round') => {
  if (!controller) {
    return '';
  }

  const judgeName = controller.judgeName ?? controller.judge_name;
  const judgeId = controller.judgeId ?? controller.judge_id;

  if (judgeName && judgeId) {
    if (controller.source === 'HEAD_DEFAULT') {
      return `${judgeName} (HEAD judge mặc định)`;
    }
    if (controller.source === 'OVERRIDE') {
      return `${judgeName} (Coordinator chỉ định)`;
    }
    return `${judgeName} (ID: ${judgeId})`;
  }

  if (controller.source === 'UNASSIGNED') {
    return mode === 'track'
      ? 'Chưa có HEAD judge — Coordinator chọn judge giữ timer bên dưới.'
      : 'Chưa có judge giữ timer — Coordinator chọn judge bên dưới.';
  }

  return 'Chưa có controller.';
};

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

  const { data: controller, isLoading: loadingController } = useQuery<ControllerInfo | null>({
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
    queryKey: ['presentationJudges', mode, scopeId],
    queryFn: async () => {
      if (!scopeId) return [];
      const data =
        mode === 'round'
          ? await presentationService.listRoundJudges(scopeId)
          : await presentationService.listTrackJudges(scopeId);
      return Array.isArray(data) ? data : data?.items || data?.data || [];
    },
    enabled,
  });

  useEffect(() => {
    const controllerJudgeId = controller?.judgeId ?? controller?.judge_id;
    if (controllerJudgeId) {
      setSelectedJudgeId(controllerJudgeId);
    } else {
      setSelectedJudgeId(null);
    }
  }, [controller?.judgeId, controller?.judge_id]);

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

  const controllerLabel = resolveControllerLabel(controller, mode);
  const showJudgePicker = canGrant;

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
        <Text type="secondary" style={{ display: 'block', marginBottom: showJudgePicker ? 10 : 0 }}>
          {controllerLabel}
        </Text>
      )}
      {showJudgePicker && (
        <Select
          style={{ width: '100%' }}
          placeholder={mode === 'track' ? 'Chọn judge giữ timer' : 'Chọn judge giữ timer vòng CK'}
          loading={loadingJudges || grantMutation.isPending}
          value={selectedJudgeId ?? undefined}
          allowClear={false}
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
