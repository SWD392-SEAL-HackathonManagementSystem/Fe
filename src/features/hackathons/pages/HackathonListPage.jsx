import React, { useState } from 'react';
import { Button, Card, Col, Row, Empty, Space, Typography, Popconfirm, message, Tag, Input, Select } from 'antd';
import { Plus, Edit, Trash2, Settings, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../../../shared/components/ui/PageHeader';
import StatusBadge from '../../../shared/components/ui/StatusBadge';
import { ROUTES } from '../../../shared/constants/routes';
import { useAppContext } from '../../../app/AppContext';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { Search: AntSearch } = Input;

const HackathonListPage = () => {
  const navigate = useNavigate();
  const { hackathons, deleteHackathon } = useAppContext();
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const handleDelete = (id) => {
    deleteHackathon(id);
    message.success('Hackathon deleted successfully');
  };

  const filteredHackathons = hackathons.filter(h => {
    const matchesSearch = h.name.toLowerCase().includes(searchText.toLowerCase()) || 
                          h.slug.toLowerCase().includes(searchText.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || h.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div>
      <PageHeader 
        title="Event Configuration" 
        subtitle="Manage and configure your hackathon events"
        extra={
          <Button 
            type="primary" 
            icon={<Plus size={16} />} 
            onClick={() => navigate(ROUTES.HACKATHON_CREATE)}
          >
            Create Event
          </Button>
        }
      />

      <Card style={{ marginBottom: 24, borderRadius: 12 }}>
        <Row gutter={16} align="middle">
          <Col xs={24} md={12} lg={8}>
            <AntSearch
              placeholder="Search by name or slug..."
              allowClear
              enterButton={<Search size={16} />}
              onSearch={setSearchText}
              onChange={e => setSearchText(e.target.value)}
              style={{ width: '100%' }}
            />
          </Col>
          <Col xs={24} md={6} lg={4}>
            <Select 
              defaultValue="ALL" 
              style={{ width: '100%' }} 
              onChange={setStatusFilter}
            >
              <Option value="ALL">All Status</Option>
              <Option value="DRAFT">Draft</Option>
              <Option value="PUBLISHED">Published</Option>
              <Option value="ONGOING">Ongoing</Option>
              <Option value="COMPLETED">Completed</Option>
            </Select>
          </Col>
          <Col xs={24} md={6} lg={4}>
            <Text type="secondary">{filteredHackathons.length} events found</Text>
          </Col>
        </Row>
      </Card>

      {filteredHackathons.length === 0 ? (
        <Card style={{ textAlign: 'center', padding: '40px 0', borderRadius: 12 }}>
          <Empty description={searchText || statusFilter !== 'ALL' ? "No matches found" : "No events found"} />
          {!searchText && statusFilter === 'ALL' && (
            <Button 
              type="primary" 
              icon={<Plus size={16} />} 
              style={{ marginTop: 16 }}
              onClick={() => navigate(ROUTES.HACKATHON_CREATE)}
            >
              Create Your First Event
            </Button>
          )}
        </Card>
      ) : (
        <Row gutter={[24, 24]}>
          {filteredHackathons.map((hackathon) => (
            <Col xs={24} sm={12} lg={8} key={hackathon.id}>
              <Card
                hoverable
                cover={
                  <div style={{ height: 160, overflow: 'hidden', position: 'relative' }}>
                    <img
                      alt={hackathon.name}
                      src={hackathon.banner_url || 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?ixlib=rb-1.2.1&auto=format&fit=crop&w=1050&q=80'}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    <div style={{ position: 'absolute', top: 12, right: 12 }}>
                      <StatusBadge status={hackathon.status} />
                    </div>
                  </div>
                }
                actions={[
                  <Button 
                    type="text" 
                    icon={<Settings size={16} />} 
                    key="setup"
                    onClick={() => navigate(`/hackathons/${hackathon.id}/setup`)}
                  >
                    Setup
                  </Button>,
                  <Popconfirm
                    title="Delete Hackathon"
                    description="Are you sure you want to delete this hackathon? This action cannot be undone."
                    onConfirm={() => handleDelete(hackathon.id)}
                    okText="Yes"
                    cancelText="No"
                    key="delete"
                  >
                    <Button type="text" danger icon={<Trash2 size={16} />}>
                      Delete
                    </Button>
                  </Popconfirm>
                ]}
              >
                <Card.Meta
                  title={<Title level={4}>{hackathon.name}</Title>}
                  description={
                    <div>
                      <div style={{ marginBottom: 8 }}>
                        <Tag color="blue">{hackathon.season} {hackathon.year}</Tag>
                      </div>
                      <Paragraph ellipsis={{ rows: 2 }}>{hackathon.description}</Paragraph>
                      <div style={{ fontSize: 12, color: '#8c8c8c' }}>
                        Reg: {hackathon.registration_start} - {hackathon.registration_end}
                      </div>
                    </div>
                  }
                />
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </div>
  );
};


export default HackathonListPage;
