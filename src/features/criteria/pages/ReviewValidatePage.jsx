import React, { useMemo } from 'react';
import { Card, Button, Typography, Tag, Space, Alert, Divider } from 'antd';
import { ArrowLeft, CheckCircle, XCircle, AlertTriangle, Lock, ExternalLink } from 'lucide-react';
import { useAppContext } from '../../../app/AppContext';
import { useNavigate, useParams } from 'react-router-dom';
import { formatDate } from '../../../shared/utils/date';

const { Title, Text, Paragraph } = Typography;

// Validation check item component
const ValidationItem = ({ status, title, detail, linkText, linkAction }) => {
  const getIcon = () => {
    switch (status) {
      case 'success':
        return <CheckCircle size={20} color="#52c41a" />;
      case 'error':
        return <XCircle size={20} color="#ff4d4f" />;
      case 'warning':
        return <AlertTriangle size={20} color="#faad14" />;
      default:
        return <CheckCircle size={20} color="#52c41a" />;
    }
  };

  const getStatusTag = () => {
    switch (status) {
      case 'success':
        return <Tag color="success">Success</Tag>;
      case 'error':
        return <Tag color="error">Error</Tag>;
      case 'warning':
        return <Tag color="warning">Warning</Tag>;
      default:
        return <Tag>Unknown</Tag>;
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 16,
        padding: '16px 24px',
        borderBottom: '1px solid #f0f0f0',
        background: status === 'error' ? '#fff2f0' : 'white',
      }}
    >
      <div style={{ marginTop: 2 }}>{getIcon()}</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 500, fontSize: 16, marginBottom: 4 }}>{title}</div>
        {status === 'error' && detail && (
          <div
            style={{
              background: '#fff1f0',
              border: '1px solid #ffccc7',
              padding: '6px 12px',
              borderRadius: 6,
              marginTop: 4,
              marginBottom: 8,
              fontSize: 13,
              color: '#cf1322',
              fontWeight: 500,
              display: 'inline-block',
            }}
          >
            Error: {detail}
          </div>
        )}
        {status === 'warning' && detail && (
          <div
            style={{
              background: '#fffbe6',
              border: '1px solid #ffe58f',
              padding: '6px 12px',
              borderRadius: 6,
              marginTop: 4,
              marginBottom: 8,
              fontSize: 13,
              color: '#ad6800',
              fontWeight: 500,
              display: 'inline-block',
            }}
          >
            Warning: {detail}
          </div>
        )}
        {status === 'success' && detail && (
          <Text type="secondary" style={{ fontSize: 12 }}>
            {detail}
          </Text>
        )}
        {linkText && linkAction && (
          <div style={{ marginTop: 8 }}>
            <Button type="link" size="small" onClick={linkAction} style={{ paddingLeft: 0 }}>
              {linkText} →
            </Button>
          </div>
        )}
      </div>
      <div>{getStatusTag()}</div>
    </div>
  );
};

const ReviewValidatePage = ({ hackathonId: propHackathonId }) => {
  const navigate = useNavigate();
  const params = useParams();
  const { hackathons, tracks, rounds, criteria } = useAppContext();

  const hId = propHackathonId || parseInt(params.hackathonId);
  const hackathon = hackathons.find((h) => h.id === hId);

  // Gather data for this hackathon
  const hackathonTracks = useMemo(() => tracks.filter((t) => t.hackathon_id === hId), [tracks, hId]);
  const trackIds = useMemo(() => hackathonTracks.map((t) => t.id), [hackathonTracks]);
  const hackathonRounds = useMemo(() => rounds.filter((r) => trackIds.includes(r.track_id)), [rounds, trackIds]);
  const roundIds = useMemo(() => hackathonRounds.map((r) => r.id), [hackathonRounds]);
  const hackathonCriteria = useMemo(() => criteria.filter((c) => roundIds.includes(c.round_id)), [criteria, roundIds]);

  // ===== VALIDATION CHECKS =====

  // 1. Tracks & Rounds
  const hasAtLeastOneTrack = hackathonTracks.length >= 1;
  const tracksWithEnoughRounds = hackathonTracks.every(
    (t) => hackathonRounds.filter((r) => r.track_id === t.id).length >= 2
  );
  const tracksWithoutEnoughRounds = hackathonTracks.filter(
    (t) => hackathonRounds.filter((r) => r.track_id === t.id).length < 2
  );

  // 2. Criteria & Scoring
  const roundsWithCriteria = hackathonRounds.every(
    (r) => hackathonCriteria.filter((c) => c.round_id === r.id).length >= 1
  );
  const roundsWithoutCriteria = hackathonRounds.filter(
    (r) => hackathonCriteria.filter((c) => c.round_id === r.id).length < 1
  );

  // Weight validation per round
  const weightErrors = [];
  hackathonRounds.forEach((r) => {
    const roundCri = hackathonCriteria.filter((c) => c.round_id === r.id);
    if (roundCri.length > 0) {
      const totalWeight = roundCri.reduce((sum, c) => sum + c.weight, 0);
      if (Math.abs(totalWeight - 1.0) > 0.001) {
        const track = hackathonTracks.find((t) => t.id === r.track_id);
        weightErrors.push({
          roundId: r.id,
          roundName: r.name,
          trackName: track?.name || 'Unknown',
          totalWeight: totalWeight.toFixed(2),
        });
      }
    }
  });

  // 3. Schedule
  const hasSchedule = hackathon?.event_start && hackathon?.event_end;

  // Count errors and warnings
  const errors = [];
  const warnings = [];

  if (!hasAtLeastOneTrack) errors.push('No tracks configured');
  if (!tracksWithEnoughRounds && hasAtLeastOneTrack)
    errors.push('Some tracks have less than 2 rounds');
  if (!roundsWithCriteria && hackathonRounds.length > 0)
    warnings.push('Some rounds have no criteria');
  if (weightErrors.length > 0)
    errors.push(`Weight mismatch in ${weightErrors.length} round(s)`);

  const totalErrors = errors.length + weightErrors.length;
  const hasBlockingErrors = totalErrors > 0 || !hasAtLeastOneTrack;

  if (!hackathon) {
    return (
      <div style={{ padding: 24 }}>
        <Alert type="error" message="Hackathon not found" />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 960, margin: '0 auto' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 24,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Title level={3} style={{ margin: 0 }}>
            Review & Validate Configuration
          </Title>
          <Tag
            style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: 12,
            }}
          >
            ID: HCK-{hackathon.id}
          </Tag>
        </div>
        <Button
          type="text"
          onClick={() => navigate(-1)}
          style={{ fontSize: 16 }}
        >
          ✕
        </Button>
      </div>

      {/* Description */}
      <Paragraph type="secondary" style={{ fontSize: 16, marginBottom: 24 }}>
        Before activating the hackathon, please review the critical configuration requirements.
        All errors must be resolved to proceed. Warnings are highly recommended to address
        but will not block activation.
      </Paragraph>

      {/* Section 1: Tracks & Rounds */}
      <Card
        title={<Title level={4} style={{ margin: 0 }}>Tracks & Rounds</Title>}
        style={{ marginBottom: 24, borderRadius: 12, overflow: 'hidden' }}
        styles={{ body: { padding: 0 } }}
      >
        <ValidationItem
          status={hasAtLeastOneTrack ? 'success' : 'error'}
          title="At least 1 Track configured"
          detail={
            hasAtLeastOneTrack
              ? `${hackathonTracks.length} Track(s) currently configured (${hackathonTracks.map((t) => t.name).join(', ')}).`
              : 'No tracks have been configured yet.'
          }
          linkText={!hasAtLeastOneTrack ? 'Go to Track Settings' : null}
          linkAction={
            !hasAtLeastOneTrack
              ? () => navigate(`/hackathons/${hId}/setup`)
              : null
          }
        />
        <ValidationItem
          status={
            !hasAtLeastOneTrack
              ? 'warning'
              : tracksWithEnoughRounds
              ? 'success'
              : 'error'
          }
          title="Each Track has ≥2 Rounds"
          detail={
            tracksWithEnoughRounds
              ? 'All tracks have at least 2 rounds configured.'
              : tracksWithoutEnoughRounds.length > 0
              ? `Track(s) '${tracksWithoutEnoughRounds.map((t) => t.name).join("', '")}' have fewer than 2 rounds.`
              : 'Configure tracks first.'
          }
          linkText={!tracksWithEnoughRounds ? 'Go to Round Settings' : null}
          linkAction={
            !tracksWithEnoughRounds
              ? () => navigate(`/hackathons/${hId}/setup`)
              : null
          }
        />
      </Card>

      {/* Section 2: Criteria & Scoring */}
      <Card
        title={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Title level={4} style={{ margin: 0 }}>Criteria & Scoring</Title>
            {(weightErrors.length > 0 || !roundsWithCriteria) && (
              <Tag color="error" icon={<XCircle size={12} />}>
                Action Required
              </Tag>
            )}
          </div>
        }
        style={{
          marginBottom: 24,
          borderRadius: 12,
          overflow: 'hidden',
          borderColor: weightErrors.length > 0 ? '#ff4d4f' : undefined,
        }}
        styles={{ body: { padding: 0 } }}
      >
        <ValidationItem
          status={roundsWithCriteria ? 'success' : 'warning'}
          title="Each Round has ≥1 Criteria"
          detail={
            roundsWithCriteria
              ? 'All configured rounds have associated scoring rubrics.'
              : `${roundsWithoutCriteria.length} round(s) have no criteria defined.`
          }
          linkText={!roundsWithCriteria ? 'Go to Criteria Settings' : null}
          linkAction={
            !roundsWithCriteria
              ? () => navigate(`/hackathons/${hId}/setup`)
              : null
          }
        />
        <ValidationItem
          status={weightErrors.length === 0 ? 'success' : 'error'}
          title="Total weight per Round = 1.0"
          detail={
            weightErrors.length === 0
              ? 'All rounds have criteria weights that sum to 1.0.'
              : weightErrors
                  .map(
                    (e) =>
                      `Track '${e.trackName}' → Round '${e.roundName}' weights sum to ${e.totalWeight}.`
                  )
                  .join(' | ')
          }
          linkText={weightErrors.length > 0 ? 'Go to Rubric Settings' : null}
          linkAction={
            weightErrors.length > 0
              ? () => navigate(`/hackathons/${hId}/criteria/${weightErrors[0].roundId}`)
              : null
          }
        />
      </Card>

      {/* Section 3: Schedule & Personnel */}
      <Card
        title={<Title level={4} style={{ margin: 0 }}>Schedule & Personnel</Title>}
        style={{ marginBottom: 24, borderRadius: 12, overflow: 'hidden' }}
        styles={{ body: { padding: 0 } }}
      >
        <ValidationItem
          status={hasSchedule ? 'success' : 'warning'}
          title="Kickoff schedule set"
          detail={
            hasSchedule
              ? `Start: ${formatDate(hackathon.event_start, 'MMM DD, YYYY')}. End: ${formatDate(hackathon.event_end, 'MMM DD, YYYY')}.`
              : 'Event schedule has not been configured.'
          }
        />
        <ValidationItem
          status="warning"
          title="Judges assigned to all Rounds"
          detail="Judge assignment feature is not yet implemented. Please assign judges manually."
          linkText="Manage Judges"
          linkAction={() => {}}
        />
      </Card>

      {/* Activation Area */}
      <Card
        style={{
          marginTop: 32,
          borderRadius: 12,
          borderLeft: hasBlockingErrors ? '4px solid #ff4d4f' : '4px solid #52c41a',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 16,
          }}
        >
          <div style={{ flex: 1, minWidth: 300 }}>
            <Title level={3} style={{ margin: 0, marginBottom: 8 }}>
              Ready to Open Hackathon
            </Title>
            <Paragraph type="secondary" style={{ fontSize: 16, margin: 0, maxWidth: 600 }}>
              {hasBlockingErrors ? (
                <>
                  Your event configuration has{' '}
                  <strong style={{ color: '#ff4d4f' }}>
                    {totalErrors} critical error{totalErrors !== 1 ? 's' : ''}
                  </strong>{' '}
                  that must be resolved before you can activate the hackathon and open registrations.
                </>
              ) : (
                <>
                  All critical checks have passed. You can now activate the hackathon and open registrations.
                </>
              )}
            </Paragraph>
          </div>
          <Button
            type="primary"
            size="large"
            disabled={hasBlockingErrors}
            icon={hasBlockingErrors ? <Lock size={16} /> : null}
            style={{
              height: 48,
              paddingLeft: 32,
              paddingRight: 32,
              borderRadius: 8,
              fontWeight: 600,
            }}
          >
            {hasBlockingErrors ? 'Activate Hackathon' : '🚀 Activate Hackathon'}
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default ReviewValidatePage;
