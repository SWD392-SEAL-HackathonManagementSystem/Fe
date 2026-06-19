import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Spin, theme, Modal, Button, message } from 'antd';
import { FilePdfOutlined, EyeOutlined } from '@ant-design/icons';
import { personBApi, SubmissionRequest, SubmissionStatusResponse, DeadlineResponse } from '../../../../api/personB.api';
import toast from 'react-hot-toast';
import { useAppContext } from '../../../../app/AppContext';
import { studentSubmissionService } from '../services/studentSubmission.service';

// ─── Zod Validation Schema ────────────────────────────────────────────────────
const submissionSchema = z.object({
  repo_url: z
    .string()
    .min(1, 'Đường dẫn Repository là bắt buộc')
    .url('Định dạng URL không hợp lệ'),
  demo_url: z.string().url('Định dạng URL không hợp lệ').or(z.literal('')),
  slide_file: z
    .instanceof(File, { message: 'Vui lòng tải lên file slide PDF' })
    .refine((f) => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf'), {
      message: 'Chỉ chấp nhận file PDF',
    })
    .refine(
      async (f) => {
        const header = new Uint8Array(await f.slice(0, 4).arrayBuffer());
        return (
          header.length === 4 &&
          header[0] === 0x25 &&
          header[1] === 0x50 &&
          header[2] === 0x44 &&
          header[3] === 0x46
        );
      },
      {
        message:
          'File không phải PDF thật. Hãy xuất PDF từ PowerPoint/Google Slides (Tải xuống dạng PDF), không đổi đuôi file.',
      }
    )
    .optional(),
  late_reason: z.string().optional(),
});

type SubmissionFormValues = z.infer<typeof submissionSchema>;

const resolveSubmissionId = (data?: SubmissionStatusResponse | null): number | null => {
  if (!data) return null;
  const rawId = data.submission_id;
  if (rawId != null && rawId !== '') return Number(rawId);
  const path = data.slide_download_path;
  if (!path) return null;
  const match = path.match(/\/submissions\/(\d+)\/slide/);
  return match ? Number(match[1]) : null;
};

// ─── Status config ─────────────────────────────────────────────────────────────
const getStatusConfig = (status?: string, darkMode?: boolean) => {
  switch (status) {
    case 'ON_TIME':
      return {
        dot: '#16A34A',
        bg: darkMode ? 'rgba(22, 163, 74, 0.1)' : '#F0FDF4',
        border: darkMode ? 'rgba(22, 163, 74, 0.3)' : '#BBF7D0',
        label: 'Đã nộp (Đúng hạn)',
        sub: 'Bài nộp của bạn đã được ghi nhận thành công.',
        progress: 100,
      };
    case 'LATE_PENDING':
      return {
        dot: '#D97706',
        bg: darkMode ? 'rgba(217, 119, 6, 0.1)' : '#FFFBEB',
        border: darkMode ? 'rgba(217, 119, 6, 0.3)' : '#FDE68A',
        label: 'Nộp muộn — Đang chờ duyệt',
        sub: 'BTC sẽ xem xét và phê duyệt bài nộp của bạn.',
        progress: 70,
      };
    case 'REJECTED':
      return {
        dot: '#DC2626',
        bg: darkMode ? 'rgba(220, 38, 38, 0.1)' : '#FFF1F2',
        border: darkMode ? 'rgba(220, 38, 38, 0.3)' : '#FECDD3',
        label: 'Bị từ chối',
        sub: 'Bài nộp của bạn đã bị từ chối. Vui lòng liên hệ BTC.',
        progress: 0,
      };
    case 'INCOMPLETE':
      return {
        dot: '#DC2626',
        bg: darkMode ? 'rgba(220, 38, 38, 0.1)' : '#FFF1F2',
        border: darkMode ? 'rgba(220, 38, 38, 0.3)' : '#FECDD3',
        label: 'Nộp file thất bại — cần nộp lại',
        sub: 'File slide PDF chưa được lưu thành công. Vui lòng chọn file PDF và nộp lại.',
        progress: 25,
      };
    default:
      return {
        dot: '#EF4444',
        bg: darkMode ? 'rgba(239, 68, 68, 0.1)' : '#FFF1F2',
        border: darkMode ? 'rgba(239, 68, 68, 0.3)' : '#FECDD3',
        label: 'Chưa nộp bài',
        sub: 'Bạn vẫn còn thời gian để hoàn thiện',
        progress: 0,
      };
  }
};

// ─── Component ─────────────────────────────────────────────────────────────────
const StudentSubmissionPage: React.FC = () => {
  const { token } = theme.useToken();
  const { darkMode } = useAppContext();
  const queryClient = useQueryClient();
  const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
  const studentId = userInfo.userId || userInfo.id || 'student-1';

  // ── Queries ──────────────────────────────────────────────────────────────────
  const {
    data: submissionData,
    isLoading: isSubLoading,
    error: subError,
    refetch: refetchSubmission,
  } = useQuery<SubmissionStatusResponse>({
    queryKey: ['studentSubmission', studentId],
    queryFn: async () => {
      try {
        return await personBApi.getStudentSubmission(studentId);
      } catch (err: any) {
        throw err;
      }
    },
    retry: false,
  });

  const {
    data: deadlineData,
    isLoading: isDeadlineLoading,
    error: deadlineError,
  } = useQuery<DeadlineResponse>({
    queryKey: ['currentDeadline'],
    queryFn: async () => {
      try {
        return await personBApi.getCurrentDeadline();
      } catch (err: any) {
        throw err;
      }
    },
    retry: false,
  });

  // ── Form ─────────────────────────────────────────────────────────────────────
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<SubmissionFormValues>({
    resolver: zodResolver(submissionSchema),
    defaultValues: { repo_url: '', demo_url: '', slide_file: undefined, late_reason: '' },
  });

  useEffect(() => {
    if (submissionData) {
      setValue('repo_url', submissionData.repo_url || '');
      setValue('demo_url', submissionData.demo_url || '');
    }
  }, [submissionData, setValue]);

  // ── Mutation ─────────────────────────────────────────────────────────────────
  const mutation = useMutation({
    mutationFn: async (data: SubmissionRequest) =>
      personBApi.submitStudentSubmission(studentId, data),
    onSuccess: (data) => {
      toast.success('Nộp bài thi thành công!');
      queryClient.setQueryData(['studentSubmission', studentId], data);
    },
    onError: (err: any) => {
      toast.error(`Lỗi nộp bài: ${err?.message || 'Không thể kết nối máy chủ'}`);
      queryClient.invalidateQueries({ queryKey: ['studentSubmission', studentId] });
    },
  });

  const onSubmit = (values: SubmissionFormValues) => {
    const hasExistingSlide = Boolean(
      submissionData?.slide_file ||
        submissionData?.slide_download_path ||
        submissionData?.has_slide
    );
    if (!values.slide_file && !hasExistingSlide) {
      toast.error('Vui lòng tải lên file slide PDF.');
      return;
    }
    mutation.mutate({
      repo_url: values.repo_url,
      demo_url: values.demo_url || undefined,
      slide_file: values.slide_file,
      late_reason: isOverdue ? values.late_reason : undefined,
    });
  };

  // ── Countdown ────────────────────────────────────────────────────────────────
  const [timeLeft, setTimeLeft] = useState<{
    days: number; hours: number; minutes: number; seconds: number;
  } | null>(null);
  const [isOverdue, setIsOverdue] = useState(false);

  useEffect(() => {
    if (!deadlineData?.deadline) return;
    const calc = () => {
      const diff = +new Date(deadlineData.deadline!) - +new Date();
      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        setIsOverdue(true);
        return;
      }
      setIsOverdue(false);
      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / 1000 / 60) % 60),
        seconds: Math.floor((diff / 1000) % 60),
      });
    };
    calc();
    const id = setInterval(calc, 1000);
    return () => clearInterval(id);
  }, [deadlineData]);

  const hasApiError = !!(subError || deadlineError);
  const statusConfig = getStatusConfig(submissionData?.status, darkMode);
  const isSubmitting = mutation.isPending || isSubLoading;
  const [isSlideModalVisible, setIsSlideModalVisible] = useState(false);
  const [slideBlobUrl, setSlideBlobUrl] = useState<string | null>(null);
  const [isLoadingSlide, setIsLoadingSlide] = useState(false);

  const submittedSlideName = submissionData?.slide_file || 'slide.pdf';
  const canViewSubmittedSlide = Boolean(
    submissionData?.has_slide ||
      submissionData?.slide_file ||
      submissionData?.slide_download_path
  );

  const handleViewSubmittedSlide = async () => {
    const submissionId = resolveSubmissionId(submissionData);
    if (!submissionId) {
      message.error('Không xác định được bài nộp để xem file.');
      return;
    }

    setIsSlideModalVisible(true);
    setIsLoadingSlide(true);
    setSlideBlobUrl(null);

    try {
      const blobData = (await studentSubmissionService.getSubmissionSlide(
        submissionId
      )) as unknown as Blob;
      const fileUrl = URL.createObjectURL(blobData);
      setSlideBlobUrl(fileUrl);
    } catch {
      message.error('Không thể mở file slide. Vui lòng thử lại sau.');
      setIsSlideModalVisible(false);
    } finally {
      setIsLoadingSlide(false);
    }
  };

  const handleCloseSlideModal = () => {
    setIsSlideModalVisible(false);
    if (slideBlobUrl) {
      URL.revokeObjectURL(slideBlobUrl);
      setSlideBlobUrl(null);
    }
  };

  useEffect(
    () => () => {
      if (slideBlobUrl) {
        URL.revokeObjectURL(slideBlobUrl);
      }
    },
    [slideBlobUrl]
  );

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div style={{ padding: '24px', maxWidth: '900px', margin: '0 auto' }}>

      {/* ── Error Banner ─────────────────────────────────────────────────────── */}
      {hasApiError && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#FFFBEB',
          border: '1px solid #FDE68A',
          borderRadius: '10px',
          padding: '12px 16px',
          marginBottom: '20px',
          gap: '12px',
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
            <span style={{ fontSize: '16px', marginTop: '1px' }}>⚠️</span>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#92400E' }}>
                Lỗi kết nối máy chủ
              </div>
              <div style={{ fontSize: '12px', color: '#B45309', marginTop: '2px' }}>
                Một số thông tin hiển thị có thể chưa đầy đủ do lỗi tải dữ liệu từ API Backend.
              </div>
            </div>
          </div>
          <button
            onClick={() => refetchSubmission()}
            style={{
              flexShrink: 0,
              padding: '6px 16px',
              background: '#F59E0B',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            Thử lại
          </button>
        </div>
      )}

      {/* ── Main layout ──────────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 220px', gap: '20px', alignItems: 'start' }}>

        {/* ══ LEFT: Form Card ══════════════════════════════════════════════════ */}
        <div style={{
          background: token.colorBgContainer,
          border: `1px solid ${token.colorBorderSecondary}`,
          borderRadius: '14px',
          padding: '28px',
          boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
        }}>
          {/* Title */}
          <h2 style={{ fontSize: '22px', fontWeight: 700, color: token.colorText, margin: '0 0 4px 0' }}>
            Nộp Bài Dự Thi
          </h2>
          <p style={{ fontSize: '13px', color: token.colorTextDescription, margin: '0 0 24px 0' }}>
            Vui lòng cung cấp đầy đủ liên kết sản phẩm của nhóm bạn dưới đây.
          </p>

          <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>

            {/* Repo URL */}
            <div>
              <label style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                fontSize: '13px', fontWeight: 600, color: darkMode ? '#E2E8F0' : '#374151', marginBottom: '6px',
              }}>
                <span style={{ fontSize: '14px' }}>🔗</span>
                Đường dẫn Repository (Yêu cầu)
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  {...register('repo_url')}
                  style={{
                    width: '100%',
                    padding: '9px 36px 9px 12px',
                    border: `1px solid ${errors.repo_url ? '#EF4444' : (darkMode ? '#334155' : '#D1D5DB')}`,
                    borderRadius: '8px',
                    fontSize: '13px',
                    color: darkMode ? 'white' : '#111827',
                    outline: 'none',
                    boxSizing: 'border-box',
                    background: errors.repo_url ? (darkMode ? '#7F1D1D' : '#FFF5F5') : (darkMode ? '#1E293B' : 'white'),
                    transition: 'border-color 150ms',
                  }}
                  placeholder="Ví dụ: https://github.com/myteam/seal-hackathon"
                  onFocus={e => { if (!errors.repo_url) e.target.style.borderColor = '#6366F1'; }}
                  onBlur={e => { if (!errors.repo_url) e.target.style.borderColor = (darkMode ? '#334155' : '#D1D5DB'); }}
                />
                {watch('repo_url') && (
                  <button
                    type="button"
                    onClick={() => setValue('repo_url', '')}
                    style={{
                      position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)',
                      background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', fontSize: '14px',
                    }}
                  >✕</button>
                )}
              </div>
              {errors.repo_url && (
                <span style={{ fontSize: '12px', color: '#EF4444', marginTop: '4px', display: 'block' }}>
                  {errors.repo_url.message}
                </span>
              )}
            </div>

            {/* Demo URL */}
            <div>
              <label style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                fontSize: '13px', fontWeight: 600, color: darkMode ? '#E2E8F0' : '#374151', marginBottom: '6px',
              }}>
                <span style={{ fontSize: '14px' }}>🚀</span>
                Đường dẫn Deploy Demo (Tùy chọn)
              </label>
              <input
                {...register('demo_url')}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  border: `1px solid ${errors.demo_url ? '#EF4444' : (darkMode ? '#334155' : '#D1D5DB')}`,
                  borderRadius: '8px',
                  fontSize: '13px',
                  color: darkMode ? 'white' : '#111827',
                  outline: 'none',
                  boxSizing: 'border-box',
                  background: errors.demo_url ? (darkMode ? '#7F1D1D' : '#FFF5F5') : (darkMode ? '#1E293B' : 'white'),
                  transition: 'border-color 150ms',
                }}
                placeholder="Ví dụ: https://myteam-demo.vercel.app"
                onFocus={e => { if (!errors.demo_url) e.target.style.borderColor = '#6366F1'; }}
                onBlur={e => { if (!errors.demo_url) e.target.style.borderColor = (darkMode ? '#334155' : '#D1D5DB'); }}
              />
              {errors.demo_url && (
                <span style={{ fontSize: '12px', color: '#EF4444', marginTop: '4px', display: 'block' }}>
                  {errors.demo_url.message}
                </span>
              )}
            </div>

            {/* Slide PDF upload */}
            <div>
              <label style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                fontSize: '13px', fontWeight: 600, color: darkMode ? '#E2E8F0' : '#374151', marginBottom: '6px',
              }}>
                <span style={{ fontSize: '14px' }}>📊</span>
                File Slide Thuyết trình PDF (Yêu cầu)
              </label>
              <input
                type="file"
                accept=".pdf,application/pdf"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  setValue('slide_file', file, { shouldValidate: true });
                }}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  border: `1px solid ${errors.slide_file ? '#EF4444' : (darkMode ? '#334155' : '#D1D5DB')}`,
                  borderRadius: '8px',
                  fontSize: '13px',
                  color: darkMode ? 'white' : '#111827',
                  boxSizing: 'border-box',
                  background: darkMode ? '#1E293B' : 'white',
                }}
              />
              {errors.slide_file && (
                <span style={{ fontSize: '12px', color: '#EF4444', marginTop: '4px', display: 'block' }}>
                  {errors.slide_file.message}
                </span>
              )}
              {(canViewSubmittedSlide || submissionData?.slide_file) && (
                <div style={{ fontSize: '12px', color: token.colorTextDescription, marginTop: '6px' }}>
                  Đã nộp: {submittedSlideName}
                  {canViewSubmittedSlide && (
                    <Button
                      type="link"
                      size="small"
                      icon={<EyeOutlined />}
                      loading={isLoadingSlide}
                      onClick={handleViewSubmittedSlide}
                      style={{ marginLeft: 4, padding: 0, height: 'auto' }}
                    >
                      Xem file đã nộp
                    </Button>
                  )}
                </div>
              )}

              <div style={{
                marginTop: '8px',
                background: darkMode ? 'rgba(22, 163, 74, 0.1)' : '#F0FDF4',
                border: `1px solid ${darkMode ? 'rgba(22, 163, 74, 0.3)' : '#BBF7D0'}`,
                borderRadius: '8px',
                padding: '10px 12px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '8px',
              }}>
                <span style={{ color: '#16A34A', fontSize: '14px', marginTop: '1px' }}>ℹ️</span>
                <span style={{ fontSize: '12px', color: darkMode ? '#4ADE80' : '#15803D', lineHeight: '1.5' }}>
                  <strong>Lưu ý:</strong> Tải file PDF thật (xuất &quot;Save as PDF&quot; / &quot;Tải xuống dạng PDF&quot;).
                  Không đổi đuôi .pptx/.docx thành .pdf.
                </span>
              </div>
            </div>

            {/* Overdue warning */}
            {isOverdue && (
              <div style={{
                background: darkMode ? 'rgba(217, 119, 6, 0.1)' : '#FFFBEB',
                border: `1px solid ${darkMode ? 'rgba(217, 119, 6, 0.3)' : '#FDE68A'}`,
                borderRadius: '8px',
                padding: '10px 14px',
                fontSize: '13px',
                color: darkMode ? '#FBBF24' : '#92400E',
                display: 'flex',
                gap: '8px',
                alignItems: 'flex-start',
              }}>
                <span>⏰</span>
                <span>
                  <strong>Nộp sau hạn chót.</strong> Hệ thống sẽ tự gán trạng thái LATE_PENDING.
                  BTC sẽ duyệt bài nộp muộn của bạn.
                </span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                width: '100%',
                padding: '13px',
                background: isSubmitting ? '#86EFAC' : 'linear-gradient(135deg, #16A34A 0%, #15803D 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                fontSize: '15px',
                fontWeight: 700,
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: isSubmitting ? 'none' : '0 4px 12px rgba(22,163,74,0.35)',
                transition: 'all 200ms',
                marginTop: '4px',
              }}
              onMouseEnter={e => {
                if (!isSubmitting) (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 6px 16px rgba(22,163,74,0.45)';
              }}
              onMouseLeave={e => {
                if (!isSubmitting) (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 12px rgba(22,163,74,0.35)';
              }}
            >
              {isSubmitting ? (
                <><Spin size="small" /><span style={{ marginLeft: '8px' }}>Đang nộp...</span></>
              ) : (
                <><span>▷</span> Nộp Bài Dự Thi</>
              )}
            </button>
          </form>
        </div>

        {/* ══ RIGHT: Sidebar ═══════════════════════════════════════════════════ */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

          {/* Countdown Card */}
          <div style={{
            background: token.colorBgContainer,
            border: `1px solid ${token.colorBorderSecondary}`,
            borderRadius: '12px',
            padding: '16px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          }}>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              marginBottom: '10px',
            }}>
              <span style={{
                fontSize: '10px', fontWeight: 700, color: token.colorTextDescription,
                textTransform: 'uppercase', letterSpacing: '0.06em',
              }}>
                THỜI GIAN CÒN LẠI
              </span>
              <span style={{ color: '#6366F1', fontSize: '14px' }}>🕐</span>
            </div>

            {isDeadlineLoading ? (
              <div style={{ textAlign: 'center', padding: '12px 0' }}><Spin /></div>
            ) : timeLeft ? (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '6px', marginBottom: '8px' }}>
                  {[
                    { val: timeLeft.days, label: 'Ngày' },
                    { val: String(timeLeft.hours).padStart(2, '0'), label: 'Giờ' },
                    { val: String(timeLeft.minutes).padStart(2, '0'), label: 'Phút' },
                    { val: String(timeLeft.seconds).padStart(2, '0'), label: 'Giây' },
                  ].map(({ val, label }) => (
                    <div key={label} style={{
                      background: darkMode ? '#1E293B' : '#F9FAFB', borderRadius: '6px', padding: '6px 4px', textAlign: 'center',
                    }}>
                      <div style={{ fontSize: '18px', fontWeight: 800, color: isOverdue ? '#EF4444' : token.colorText, lineHeight: 1.2 }}>
                        {val}
                      </div>
                      <div style={{ fontSize: '9px', color: token.colorTextDescription, marginTop: '2px' }}>{label}</div>
                    </div>
                  ))}
                </div>
                {isOverdue ? (
                  <div style={{
                    textAlign: 'center', fontSize: '11px', fontWeight: 700,
                    color: '#DC2626', background: darkMode ? 'rgba(220, 38, 38, 0.1)' : '#FFF1F2', borderRadius: '6px', padding: '4px 8px',
                  }}>
                    ĐÃ QUÁ HẠN CHÓT!
                  </div>
                ) : (
                  <div style={{ fontSize: '10px', color: token.colorTextDescription, textAlign: 'center' }}>
                    Hạn chót: {new Date(deadlineData?.deadline || '').toLocaleString('vi-VN')}
                  </div>
                )}
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '10px 0' }}>
                <div style={{ fontSize: '20px', fontWeight: 800, color: token.colorText, marginBottom: '4px' }}>
                  Không có hạn chót active
                </div>
                <div style={{ fontSize: '11px', color: token.colorTextDescription }}>
                  Hệ thống đang mở nộp bài tự do
                </div>
              </div>
            )}
          </div>

          {/* Status Card */}
          <div style={{
            background: token.colorBgContainer,
            border: `1px solid ${token.colorBorderSecondary}`,
            borderRadius: '12px',
            padding: '16px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          }}>
            <span style={{
              fontSize: '10px', fontWeight: 700, color: token.colorTextDescription,
              textTransform: 'uppercase', letterSpacing: '0.06em',
              display: 'block', marginBottom: '12px',
            }}>
              TRẠNG THÁI BÀI NỘP
            </span>

            {isSubLoading ? (
              <div style={{ textAlign: 'center', padding: '8px 0' }}><Spin /></div>
            ) : (
              <div>
                {/* Dot + label */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '10px' }}>
                  <div style={{
                    width: '28px', height: '28px', borderRadius: '50%',
                    background: statusConfig.bg,
                    border: `1.5px solid ${statusConfig.border}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <div style={{
                      width: '10px', height: '10px', borderRadius: '50%',
                      background: statusConfig.dot,
                    }} />
                  </div>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: token.colorText }}>
                      {statusConfig.label}
                    </div>
                    <div style={{ fontSize: '11px', color: token.colorTextDescription, marginTop: '2px' }}>
                      {statusConfig.sub}
                    </div>
                  </div>
                </div>

                {/* Progress bar */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontSize: '10px', color: token.colorTextDescription }}>Tiến độ nhóm</span>
                    <span style={{ fontSize: '10px', fontWeight: 600, color: token.colorText }}>
                      {statusConfig.progress}%
                    </span>
                  </div>
                  <div style={{
                    height: '4px', background: darkMode ? '#334155' : '#F3F4F6', borderRadius: '999px', overflow: 'hidden',
                  }}>
                    <div style={{
                      height: '100%',
                      width: `${statusConfig.progress}%`,
                      background: statusConfig.progress === 100
                        ? '#16A34A'
                        : statusConfig.progress > 0
                          ? '#F59E0B'
                          : '#E5E7EB',
                      borderRadius: '999px',
                      transition: 'width 600ms ease',
                    }} />
                  </div>
                </div>

                {/* Submitted at */}
                {submissionData?.submitted_at && (
                  <div style={{
                    marginTop: '10px', paddingTop: '10px',
                    borderTop: `1px solid ${darkMode ? '#334155' : '#F3F4F6'}`,
                    fontSize: '10px', color: token.colorTextDescription,
                  }}>
                    Nộp lúc: <strong style={{ color: token.colorText }}>
                      {new Date(submissionData.submitted_at).toLocaleString('vi-VN')}
                    </strong>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Banner Card */}
          <div style={{
            borderRadius: '12px',
            overflow: 'hidden',
            position: 'relative',
            minHeight: '110px',
            background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 60%, #0F172A 100%)',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          }}>
            {/* Grid overlay */}
            <div style={{
              position: 'absolute', inset: 0,
              backgroundImage: 'linear-gradient(rgba(99,102,241,0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.12) 1px, transparent 1px)',
              backgroundSize: '20px 20px',
            }} />
            {/* Glow */}
            <div style={{
              position: 'absolute', bottom: '-20px', left: '50%', transform: 'translateX(-50%)',
              width: '120px', height: '60px',
              background: 'radial-gradient(ellipse, rgba(99,102,241,0.3) 0%, transparent 70%)',
            }} />
            {/* Laptop icon */}
            <div style={{
              position: 'absolute', top: '10px', right: '12px',
              fontSize: '32px', opacity: 0.5,
            }}>
              💻
            </div>
            {/* Text */}
            <div style={{ position: 'relative', padding: '16px 14px', paddingRight: '50px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'white', lineHeight: 1.4 }}>
                Biến ý tưởng thành hiện thực cùng{' '}
                <span style={{ color: '#818CF8' }}>HackOS Student Portal</span>.
              </div>
            </div>
          </div>

        </div>
      </div>

      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <FilePdfOutlined style={{ color: '#ff4d4f', fontSize: 20 }} />
            <span>Slide đã nộp: {submittedSlideName}</span>
          </div>
        }
        open={isSlideModalVisible}
        onCancel={handleCloseSlideModal}
        width={1000}
        style={{ top: 20 }}
        footer={[
          <Button key="close" onClick={handleCloseSlideModal}>
            Đóng
          </Button>,
        ]}
      >
        <div
          style={{
            height: '75vh',
            width: '100%',
            position: 'relative',
            background: '#f0f2f5',
            borderRadius: 8,
            overflow: 'hidden',
          }}
        >
          {isLoadingSlide ? (
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                textAlign: 'center',
              }}
            >
              <Spin size="large" />
              <div style={{ marginTop: 16, color: '#8c8c8c' }}>Đang tải file slide...</div>
            </div>
          ) : slideBlobUrl ? (
            <iframe
              src={`${slideBlobUrl}#toolbar=0`}
              title="PDF Viewer"
              width="100%"
              height="100%"
              style={{ border: 'none' }}
            />
          ) : (
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                color: '#ff4d4f',
              }}
            >
              Không thể hiển thị file PDF.
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default StudentSubmissionPage;
