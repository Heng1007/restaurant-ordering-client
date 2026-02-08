import React, { useEffect, useState } from 'react';
import { Layout, Table, Tag, Typography, message, Statistic, Card, Row, Col, Button, Select, Popconfirm, Pagination } from 'antd';
import { SmileOutlined, MehOutlined, FrownOutlined, CheckCircleOutlined, ClockCircleOutlined, CloseCircleOutlined, TrophyOutlined, ReloadOutlined, LogoutOutlined } from '@ant-design/icons';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const { Header, Content } = Layout;
const { Title, Text } = Typography;
const { Option } = Select;

// 👇 对应后端的 Order 模型
interface OrderItem {
    foodId: number;
    food: { name: string; price: number };
    quantity: number;
}

interface Order {
    id: number;
    userId: number;
    orderDate: string;
    totalPrice: number;
    customerNote: string;
    sentiment: string; // 👈 AI 分析结果
    status: string;
    items: OrderItem[];
}

interface TopSpender {
    customerId: number;
    totalSpent: number;
}

const OrdersPage: React.FC = () => {
    const navigate = useNavigate();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(false);
    const [stats, setStats] = useState({ totalOrders: 0, totalRevenue: 0 });
    const [topSpender, setTopSpender] = useState<TopSpender | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 8;

    const BACKEND_URL = "https://heng-food-api-amc2aab4hdebekhg.southeastasia-01.azurewebsites.net"; // ⚠️ 确认端口

    // Check admin access
    useEffect(() => {
        const role = localStorage.getItem('role');
        if (role !== 'Admin') {
            message.error('Access denied. Admin only.');
            navigate('/menu');
            return;
        }
        fetchOrders();
        fetchTopSpender();
    }, []);

    const fetchTopSpender = async () => {
        try {
            const token = localStorage.getItem('token');
            if(token) {
                 // Try to fetch top spender statistics
                 // Note: Ensure your backend has this endpoint or similar. 
                 // If using /api/Order/TopSpender or /api/Stats/TopSpender
                 try {
                     const response = await axios.get(`${BACKEND_URL}/api/Order/TopSpender`, {
                        headers: { Authorization: `Bearer ${token}` }
                     });
                     setTopSpender(response.data);
                 } catch(e) {
                     console.log("Top Spender endpoint might not be ready", e);
                 }
            }
        } catch (error) {
             console.error("Failed to fetch top spender");
        }
    };

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/login');
                return;
            }

            // 调用后端 GetOrders 接口
            const response = await axios.get(`${BACKEND_URL}/api/Order`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            const data: Order[] = response.data;
            setOrders(data);

            // 前端简单算一下统计数据 (也可以用后端 StatsController)
            const revenue = data.reduce((sum, order) => sum + order.totalPrice, 0);
            setStats({ totalOrders: data.length, totalRevenue: revenue });

        } catch (error) {
            message.error('Failed to load orders.');
        } finally {
            setLoading(false);
        }
    };

    // 👇 处理 AI 情感的显示逻辑
    const renderSentiment = (sentiment: string) => {
        switch (sentiment) {
            case 'Positive':
                return <Tag icon={<SmileOutlined />} style={{ background: '#E6F7E9', color: '#0D7A1F', border: 'none', borderRadius: 20, padding: '4px 12px' }}>Positive</Tag>;
            case 'Negative':
                return <Tag icon={<FrownOutlined />} style={{ background: '#FFF1F0', color: '#CF1322', border: 'none', borderRadius: 20, padding: '4px 12px' }}>Negative</Tag>;
            case 'Mixed':
                return <Tag icon={<MehOutlined />} style={{ background: '#FFF7E6', color: '#D46B08', border: 'none', borderRadius: 20, padding: '4px 12px' }}>Mixed</Tag>;
            default:
                return <Tag style={{ background: '#F5F5F5', color: '#595959', border: 'none', borderRadius: 20, padding: '4px 12px' }}>Neutral</Tag>;
        }
    };

    // 👇 处理订单状态颜色
    const renderStatus = (status: string) => {
        switch (status) {
            case 'Pending': return <Tag icon={<ClockCircleOutlined />} style={{ background: '#E6F0FF', color: '#0958D9', border: 'none', borderRadius: 20, padding: '4px 12px' }}>Pending</Tag>;
            case 'Delivered': return <Tag icon={<CheckCircleOutlined />} style={{ background: '#E6F7E9', color: '#0D7A1F', border: 'none', borderRadius: 20, padding: '4px 12px' }}>Delivered</Tag>;
            case 'Cancelled': return <Tag icon={<CloseCircleOutlined />} style={{ background: '#FFF1F0', color: '#CF1322', border: 'none', borderRadius: 20, padding: '4px 12px' }}>Cancelled</Tag>;
            default: return <Tag style={{ background: '#F5F5F5', color: '#595959', border: 'none', borderRadius: 20, padding: '4px 12px' }}>{status}</Tag>;
        }
    }

    const handleLogout = () => {
        localStorage.clear();
        navigate('/login');
    };

    // 🛠️ 处理状态更新 (调用你的 Patch 接口)
    const handleStatusChange = async (orderId: number, newStatus: string) => {
        try {
            const token = localStorage.getItem('token');
            console.log(`Updating order ${orderId} to status ${newStatus}`);
            await axios.patch(`${BACKEND_URL}/api/Order/${orderId}/Status`, { status: newStatus }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            message.success(`Order #${orderId} updated to ${newStatus}`);
            fetchOrders();
        } catch (e) {
            message.error("Failed to update status");
        }
    };

    // ❌ 取消订单
    const handleCancelOrder = async (orderId: number) => {
        try {
            const token = localStorage.getItem('token');
            await axios.post(`${BACKEND_URL}/api/Order/${orderId}/Cancel`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            message.success('Order Cancelled');
            fetchOrders();
        } catch (error) {
            message.error('Failed to cancel order');
        }
    };

    const columns = [
        {
            title: 'Order ID',
            dataIndex: 'id',
            key: 'id',
            render: (id: number) => <b>#{id}</b>,
        },
        {
            title: 'Date',
            dataIndex: 'orderDate',
            key: 'orderDate',
            render: (date: string) => new Date(date).toLocaleDateString() + ' ' + new Date(date).toLocaleTimeString(),
        },
        {
            title: 'Items',
            key: 'items',
            render: (_: any, record: Order) => (
                <ul style={{ paddingLeft: 20, margin: 0 }}>
                    {record.items.map((item, idx) => (
                        <li key={idx}>
                            {item.food?.name} x {item.quantity}
                        </li>
                    ))}
                </ul>
            ),
        },
        {
            title: 'Total (RM)',
            dataIndex: 'totalPrice',
            key: 'totalPrice',
            render: (val: number) => `RM ${val.toFixed(2)}`,
        },
        {
            title: 'Customer Note',
            dataIndex: 'customerNote',
            key: 'customerNote',
            render: (text: string) => <span style={{ fontStyle: 'italic', color: '#666' }}>"{text || 'No note'}"</span>
        },
        {
            title: 'AI Sentiment', // 👈 亮点在这里！
            dataIndex: 'sentiment',
            key: 'sentiment',
            render: (sentiment: string) => renderSentiment(sentiment),
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status: string, record: Order) => (
                // 下拉框让管理员直接改状态
                <Select
                    defaultValue={status}
                    style={{ width: 120 }}
                    onChange={(val) => handleStatusChange(record.id, val)}
                    bordered={false}
                >
                    <Option value="Pending">Pending</Option>
                    <Option value="InProgress">In Progress</Option>
                    <Option value="Delivered">Delivered</Option>
                    <Option value="Cancelled">Cancelled</Option>
                </Select>
            )
        },
        {
            title: 'Action',
            key: 'action',
            render: (_: any, record: Order) => (
                record.status === 'Pending' && (
                    <Popconfirm
                        title="Cancel this order?"
                        onConfirm={() => handleCancelOrder(record.id)}
                        okText="Yes"
                        cancelText="No"
                    >
                        <Button danger type="text" size="small" style={{ borderRadius: 8 }}>Cancel</Button>
                    </Popconfirm>
                )
            )
        },
    ];

    return (
        <Layout style={{ minHeight: '100vh', background: '#F5F7FA' }}>
            {/* Premium Header */}
            <Header style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                background: '#FFFFFF', 
                padding: '0 48px', 
                height: 72,
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
                position: 'sticky',
                top: 0,
                zIndex: 100
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ 
                            width: 40, 
                            height: 40, 
                            background: '#1890FF',
                            borderRadius: 10,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <span style={{ fontSize: 20 }}>🍔</span>
                        </div>
                        <Title level={4} style={{ margin: 0, color: '#1F1F1F', fontWeight: 600 }}>FoodDelivery</Title>
                    </div>
                    <nav style={{ display: 'flex', gap: 8 }}>
                        <Button type="text" onClick={() => navigate('/menu')} style={{ fontWeight: 500, color: '#595959', borderRadius: 8 }}>Menu</Button>
                        <Button type="text" style={{ fontWeight: 600, color: '#1890FF', background: '#E6F7FF', borderRadius: 8 }}>Orders</Button>
                    </nav>
                </div>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <Text style={{ color: '#8C8C8C' }}>Hi, {localStorage.getItem('username') || 'User'}</Text>
                    <Button 
                        icon={<LogoutOutlined />} 
                        onClick={handleLogout} 
                        style={{ borderRadius: 50, height: 44, border: 'none', background: '#FFF1F0', color: '#CF1322' }}
                    >Logout</Button>
                </div>
            </Header>

            <Content style={{ padding: '40px 48px', maxWidth: 1400, margin: '0 auto', width: '100%' }}>
                {/* Page Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
                    <div>
                        <Title level={2} style={{ margin: 0, color: '#1F1F1F', fontWeight: 600 }}>Orders</Title>
                        <Text style={{ color: '#8C8C8C', fontSize: 15 }}>Real-time orders monitored by Azure AI Sentiment Analysis</Text>
                    </div>
                    <Button 
                        icon={<ReloadOutlined />} 
                        onClick={fetchOrders}
                        style={{ borderRadius: 50, height: 44, border: 'none', background: '#FFFFFF', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
                    >Refresh</Button>
                </div>

                {/* Stats Cards */}
                <Row gutter={24} style={{ marginBottom: 32 }}>
                    <Col xs={24} sm={12} lg={6}>
                        <Card 
                            style={{ 
                                borderRadius: 16, 
                                border: 'none', 
                                boxShadow: '0 4px 24px rgba(0, 0, 0, 0.06)',
                                background: '#FFFFFF'
                            }}
                            styles={{ body: { padding: 24 } }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                <div style={{ 
                                    width: 48, 
                                    height: 48, 
                                    background: '#E6F0FF', 
                                    borderRadius: 12,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    <ClockCircleOutlined style={{ fontSize: 22, color: '#0958D9' }} />
                                </div>
                                <div>
                                    <Text style={{ color: '#8C8C8C', fontSize: 13 }}>Total Orders</Text>
                                    <div style={{ fontSize: 28, fontWeight: 700, color: '#1F1F1F' }}>{stats.totalOrders}</div>
                                </div>
                            </div>
                        </Card>
                    </Col>
                    <Col xs={24} sm={12} lg={6}>
                        <Card 
                            style={{ 
                                borderRadius: 16, 
                                border: 'none', 
                                boxShadow: '0 4px 24px rgba(0, 0, 0, 0.06)',
                                background: '#FFFFFF'
                            }}
                            styles={{ body: { padding: 24 } }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                <div style={{ 
                                    width: 48, 
                                    height: 48, 
                                    background: '#E6F7E9', 
                                    borderRadius: 12,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    <CheckCircleOutlined style={{ fontSize: 22, color: '#0D7A1F' }} />
                                </div>
                                <div>
                                    <Text style={{ color: '#8C8C8C', fontSize: 13 }}>Total Revenue</Text>
                                    <div style={{ fontSize: 28, fontWeight: 700, color: '#1F1F1F' }}>RM {stats.totalRevenue.toFixed(2)}</div>
                                </div>
                            </div>
                        </Card>
                    </Col>
                    <Col xs={24} sm={12} lg={6}>
                        <Card 
                            style={{ 
                                borderRadius: 16, 
                                border: 'none', 
                                boxShadow: '0 4px 24px rgba(0, 0, 0, 0.06)',
                                background: '#FFFFFF'
                            }}
                            styles={{ body: { padding: 24 } }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                <div style={{ 
                                    width: 48, 
                                    height: 48, 
                                    background: '#FFF7E6', 
                                    borderRadius: 12,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    <TrophyOutlined style={{ fontSize: 22, color: '#D46B08' }} />
                                </div>
                                <div>
                                    <Text style={{ color: '#8C8C8C', fontSize: 13 }}>Top Spender</Text>
                                    <div style={{ fontSize: 20, fontWeight: 700, color: '#1F1F1F' }}>
                                        {topSpender ? `User #${topSpender.customerId}` : 'N/A'}
                                    </div>
                                    {topSpender && <Text style={{ color: '#D46B08', fontSize: 13, fontWeight: 500 }}>RM {topSpender.totalSpent.toFixed(2)}</Text>}
                                </div>
                            </div>
                        </Card>
                    </Col>
                    <Col xs={24} sm={12} lg={6}>
                        <Card 
                            style={{ 
                                borderRadius: 16, 
                                border: 'none', 
                                boxShadow: '0 4px 24px rgba(0, 0, 0, 0.06)',
                                background: '#FFFFFF'
                            }}
                            styles={{ body: { padding: 24 } }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                <div style={{ 
                                    width: 48, 
                                    height: 48, 
                                    background: '#F0E6FF', 
                                    borderRadius: 12,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    <SmileOutlined style={{ fontSize: 22, color: '#722ED1' }} />
                                </div>
                                <div>
                                    <Text style={{ color: '#8C8C8C', fontSize: 13 }}>AI System</Text>
                                    <div style={{ fontSize: 20, fontWeight: 700, color: '#0D7A1F' }}>Active</div>
                                </div>
                            </div>
                        </Card>
                    </Col>
                </Row>

                {/* Orders Table */}
                <Card 
                    style={{ 
                        borderRadius: 16, 
                        border: 'none', 
                        boxShadow: '0 4px 24px rgba(0, 0, 0, 0.06)'
                    }}
                    styles={{ body: { padding: 0 } }}
                >
                    <div style={{ minHeight: 520, maxHeight: 520, overflow: 'auto' }}>
                        <Table
                            columns={columns}
                            dataSource={orders.slice((currentPage - 1) * pageSize, currentPage * pageSize)}
                            rowKey="id"
                            loading={loading}
                            pagination={false}
                            style={{ borderRadius: 16 }}
                        />
                    </div>
                    <div style={{ 
                        display: 'flex', 
                        justifyContent: 'flex-end', 
                        padding: '16px 24px',
                        borderTop: '1px solid #F0F0F0',
                        background: '#FFFFFF'
                    }}>
                        <Pagination
                            current={currentPage}
                            total={orders.length}
                            pageSize={pageSize}
                            onChange={(page) => setCurrentPage(page)}
                            showSizeChanger={false}
                        />
                    </div>
                </Card>
            </Content>
        </Layout>
    );
};

export default OrdersPage;