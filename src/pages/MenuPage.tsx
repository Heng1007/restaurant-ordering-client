import React, { useEffect, useState } from 'react';
import { Layout, Button, Typography, message, Tag, Modal, Form, Input, InputNumber, Upload, Badge, List, Popconfirm, Card, Row, Col, Drawer } from 'antd';
import { LogoutOutlined, PlusOutlined, ReloadOutlined, ShoppingCartOutlined, DeleteOutlined, HistoryOutlined, ClockCircleOutlined } from '@ant-design/icons';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const { Header, Content } = Layout;
const { Title, Text } = Typography;
const { TextArea } = Input;

// 📦 数据模型
interface FoodItem {
  id: number;
  name: string;
  price: number;
  imageUrl: string;
  isDeleted: boolean;
}

// 🛒 购物车项模型
interface CartItem extends FoodItem {
    quantity: number;
}

// 📋 订单历史模型
interface OrderHistoryItem {
    id: number;
    orderDate: string;
    totalPrice: number;
    status: string;
    customerNote: string;
    sentiment: string;
    items: { food: { name: string }; quantity: number }[];
}

const MenuPage: React.FC = () => {
  const navigate = useNavigate();
  const [foods, setFoods] = useState<FoodItem[]>([]);
  const [loading, setLoading] = useState(false);
  
  // 🟢 弹窗控制
  const [isAddFoodModalOpen, setIsAddFoodModalOpen] = useState(false);
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false); // 结账弹窗
  const [isHistoryOpen, setIsHistoryOpen] = useState(false); // 订单历史抽屉
  
  const [form] = Form.useForm();
  const [checkoutForm] = Form.useForm(); // 结账表单 (写备注用)

  // 🛒 购物车 State
  const [cart, setCart] = useState<CartItem[]>([]);
  
  // 📋 订单历史 State
  const [myOrders, setMyOrders] = useState<OrderHistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // ⚠️ 记得确认你的 IP 和端口！
  const BACKEND_URL = "https://heng-food-api-amc2aab4hdebekhg.southeastasia-01.azurewebsites.net"; 

  useEffect(() => {
    fetchFoods();
  }, []);

  // --- API: 获取食物列表 ---
  const fetchFoods = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) { navigate('/login'); return; }

      const response = await axios.get(`${BACKEND_URL}/api/Food`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFoods(response.data);
    } catch (error) {
      message.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  // --- API: 删除食物 (软删除) ---
  const handleDeleteFood = async (id: number) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${BACKEND_URL}/api/Food/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      message.success('Food deleted successfully');
      fetchFoods();
    } catch (error) {
      message.error('Failed to delete food');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('role');
    navigate('/login');
  };

  // Check if user is admin
  const isAdmin = localStorage.getItem('role') === 'Admin';

  // --- API: 取消订单 ---
  const handleCancelOrder = async (orderId: number) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${BACKEND_URL}/api/Order/${orderId}/Cancel`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      message.success('Order cancelled successfully');
      fetchMyHistory(); // Refresh the list
    } catch (error) {
      message.error('Failed to cancel order');
    }
  };

  // --- API: 获取我的订单历史 ---
  const fetchMyHistory = async () => {
    setHistoryLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${BACKEND_URL}/api/Order/MyOrders`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Sort by newest first
      const sorted = response.data.sort((a: OrderHistoryItem, b: OrderHistoryItem) => b.id - a.id);
      setMyOrders(sorted);
    } catch (error) {
      message.error('Failed to load order history');
    } finally {
      setHistoryLoading(false);
    }
  };

  const openHistory = () => {
    setIsHistoryOpen(true);
    fetchMyHistory();
  };

  // --- Logic: 添加到购物车 ---
  const addToCart = (food: FoodItem) => {
      setCart(prev => {
          const existing = prev.find(item => item.id === food.id);
          if (existing) {
              // 如果已经在购物车，数量 +1
              return prev.map(item => item.id === food.id ? { ...item, quantity: item.quantity + 1 } : item);
          }
          // 如果不在，新增一个
          return [...prev, { ...food, quantity: 1 }];
      });
      message.success(`Added ${food.name} to cart`);
  };

  // --- API: 提交订单 (核心功能！) ---
  const handleCheckout = async (values: any) => {
      if (cart.length === 0) {
          message.error("Cart is empty!");
          return;
      }

      try {
          const token = localStorage.getItem('token');
          
          // 1. 构造后端需要的 DTO 格式
          const orderPayload = {
              customerNote: values.note, // 👈 AI 要分析的就是这句话！
              items: cart.map(item => ({
                  foodItemId: item.id,
                  quantity: item.quantity
              }))
          };

          // 2. 发送 POST 请求
          await axios.post(`${BACKEND_URL}/api/Order`, orderPayload, {
              headers: { Authorization: `Bearer ${token}` }
          });

          message.success("Order placed! AI is analyzing your note...");
          
          // 3. 清理现场
          setCart([]);
          setIsCheckoutModalOpen(false);
          checkoutForm.resetFields();

          // 4. 打开订单历史抽屉让用户看到新订单
          setTimeout(() => {
            setIsHistoryOpen(true);
            fetchMyHistory();
          }, 500);

      } catch (error) {
          console.error(error);
          message.error("Failed to place order.");
      }
  };

  // --- API: 添加新菜品 (之前的逻辑) ---
  const handleAddFood = async (values: any) => {
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('name', values.name);
      formData.append('price', values.price);
      
      const fileObj = values.image?.file?.originFileObj || values.image?.fileList?.[0]?.originFileObj;
      if (fileObj) formData.append('image', fileObj); 

      await axios.post(`${BACKEND_URL}/api/Food`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      message.success('Food created!');
      setIsAddFoodModalOpen(false);
      form.resetFields();
      fetchFoods();
    } catch (error) {
      message.error('Failed to create food.');
    }
  };

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
              <Button type="text" style={{ fontWeight: 600, color: '#1890FF', background: '#E6F7FF', borderRadius: 8 }}>Menu</Button>
              {isAdmin && (
                <Button type="text" onClick={() => navigate('/orders')} style={{ fontWeight: 500, color: '#595959', borderRadius: 8 }}>Orders (Admin)</Button>
              )}
            </nav>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <Text style={{ color: '#8C8C8C' }}>Hi, {localStorage.getItem('username') || 'User'}</Text>
            <Button 
              icon={<HistoryOutlined />} 
              onClick={openHistory}
              style={{ borderRadius: 50, height: 44, border: 'none', background: '#F5F7FA' }}
            >My Orders</Button>
            <Badge count={cart.reduce((sum, item) => sum + item.quantity, 0)} offset={[-2, 2]}>
                <Button 
                  icon={<ShoppingCartOutlined />} 
                  onClick={() => setIsCheckoutModalOpen(true)}
                  style={{ 
                    borderRadius: 50, 
                    height: 44,
                    paddingLeft: 20,
                    paddingRight: 20,
                    fontWeight: 500,
                    background: '#F5F7FA',
                    border: 'none'
                  }}
                >Cart</Button>
            </Badge>
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
               <Title level={2} style={{ margin: 0, color: '#1F1F1F', fontWeight: 600 }}>Menu</Title>
               <Text style={{ color: '#8C8C8C', fontSize: 15 }}>Manage and browse your food items</Text>
             </div>
             <div style={{ display: 'flex', gap: 12 }}>
                 <Button 
                   icon={<ReloadOutlined />} 
                   onClick={fetchFoods}
                   style={{ borderRadius: 50, height: 44, border: 'none', background: '#FFFFFF', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
                 >Refresh</Button>
                 {isAdmin && (
                   <Button 
                     type="primary" 
                     icon={<PlusOutlined />} 
                     onClick={() => setIsAddFoodModalOpen(true)}
                     style={{ borderRadius: 50, height: 44, boxShadow: '0 4px 14px rgba(24, 144, 255, 0.35)' }}
                   >Add Food</Button>
                 )}
             </div>
        </div>

        {/* Food Cards Grid */}
        <Row gutter={[24, 24]}>
          {foods.map(food => (
            <Col xs={24} sm={12} md={8} lg={6} key={food.id}>
              <Card
                hoverable
                style={{ 
                  borderRadius: 16, 
                  overflow: 'hidden', 
                  border: 'none',
                  boxShadow: '0 4px 24px rgba(0, 0, 0, 0.06)',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column'
                }}
                styles={{ body: { padding: 20, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' } }}
              >
                {/* Image Container with Fixed Height */}
                <div style={{ 
                  position: 'relative', 
                  height: 160, 
                  background: '#F5F7FA', 
                  borderRadius: 12, 
                  overflow: 'hidden',
                  marginBottom: 16,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {food.imageUrl ? (
                    <img
                      alt={food.name}
                      src={BACKEND_URL + food.imageUrl}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                        (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                  ) : null}
                  <div style={{ 
                    position: 'absolute',
                    display: food.imageUrl ? 'none' : 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '100%',
                    height: '100%',
                    color: '#BFBFBF',
                    fontSize: 48
                  }}>
                    🍽️
                  </div>
                  {isAdmin && (
                    <Popconfirm
                      title="Delete this food?"
                      description="This will soft-delete the item."
                      onConfirm={() => handleDeleteFood(food.id)}
                      okText="Yes"
                      cancelText="No"
                    >
                      <Button 
                        danger 
                        type="text"
                        icon={<DeleteOutlined />} 
                        style={{ 
                          position: 'absolute', 
                          top: 8, 
                          right: 8, 
                          background: 'rgba(255,255,255,0.9)',
                          borderRadius: 8,
                          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                          width: 32,
                          height: 32,
                          padding: 0,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      />
                    </Popconfirm>
                  )}
                </div>

                {/* Food Info */}
                <div>
                  <Text strong style={{ fontSize: 15, color: '#1F1F1F', display: 'block', marginBottom: 12 }}>{food.name}</Text>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Tag style={{ 
                      background: '#E6F7E9', 
                      color: '#0D7A1F', 
                      border: 'none', 
                      borderRadius: 20,
                      padding: '4px 12px',
                      fontWeight: 600,
                      margin: 0
                    }}>
                      RM {food.price.toFixed(2)}
                    </Tag>
                    <Button 
                      type="primary"
                      icon={<PlusOutlined />} 
                      onClick={() => addToCart(food)}
                      style={{ borderRadius: 50, boxShadow: 'none', height: 36 }}
                    >Add</Button>
                  </div>
                </div>
              </Card>
            </Col>
          ))}
        </Row>

        {/* Loading State */}
        {loading && (
          <div style={{ textAlign: 'center', padding: 60 }}>
            <Text style={{ color: '#8C8C8C' }}>Loading menu...</Text>
          </div>
        )}

        {/* Empty State */}
        {!loading && foods.length === 0 && (
          <Card style={{ textAlign: 'center', padding: 60, borderRadius: 16, border: 'none', boxShadow: '0 4px 24px rgba(0, 0, 0, 0.06)' }}>
            <Text style={{ color: '#8C8C8C', fontSize: 16 }}>No food items yet. Add your first item!</Text>
          </Card>
        )}

        {/* Add Food Modal */}
        <Modal 
          title={<span style={{ fontSize: 20, fontWeight: 600 }}>Add New Food</span>}
          open={isAddFoodModalOpen} 
          onCancel={() => setIsAddFoodModalOpen(false)} 
          footer={null}
          width={440}
          styles={{ body: { paddingTop: 24 } }}
        >
            <Form form={form} layout="vertical" onFinish={handleAddFood}>
                <Form.Item name="name" label={<span style={{ fontWeight: 500 }}>Food Name</span>} rules={[{ required: true }]}>
                  <Input placeholder="e.g. Nasi Lemak" style={{ height: 48, borderRadius: 12 }} />
                </Form.Item>
                <Form.Item name="price" label={<span style={{ fontWeight: 500 }}>Price (RM)</span>} rules={[{ required: true }]}>
                  <InputNumber placeholder="e.g. 12.50" style={{ width: '100%', height: 48, borderRadius: 12 }} />
                </Form.Item>
                <Form.Item name="image" label={<span style={{ fontWeight: 500 }}>Food Image</span>}>
                  <Upload listType="picture-card" maxCount={1} beforeUpload={() => false}>
                    <div style={{ color: '#8C8C8C' }}>
                      <PlusOutlined />
                      <div style={{ marginTop: 8 }}>Upload</div>
                    </div>
                  </Upload>
                </Form.Item>
                <Button 
                  type="primary" 
                  htmlType="submit" 
                  block 
                  style={{ height: 52, borderRadius: 50, fontSize: 16, fontWeight: 600, marginTop: 8 }}
                >Create Food Item</Button>
            </Form>
        </Modal>

        {/* Checkout Modal */}
        <Modal 
            title={<span style={{ fontSize: 20, fontWeight: 600 }}>Your Cart</span>}
            open={isCheckoutModalOpen} 
            onCancel={() => setIsCheckoutModalOpen(false)}
            footer={null}
            width={480}
        >
            {cart.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <ShoppingCartOutlined style={{ fontSize: 48, color: '#D9D9D9', marginBottom: 16 }} />
                <Text style={{ display: 'block', color: '#8C8C8C' }}>Your cart is empty</Text>
              </div>
            ) : (
              <>
                <div style={{ background: '#F5F7FA', borderRadius: 16, padding: 20, marginBottom: 24 }}>
                  <List
                      itemLayout="horizontal"
                      dataSource={cart}
                      renderItem={(item) => (
                          <List.Item style={{ border: 'none', padding: '12px 0' }}>
                              <List.Item.Meta 
                                title={<span style={{ fontWeight: 600, color: '#1F1F1F' }}>{item.name}</span>} 
                                description={<span style={{ color: '#0D7A1F', fontWeight: 500 }}>RM {(item.price * item.quantity).toFixed(2)}</span>} 
                              />
                              <Tag style={{ background: '#E6F0FF', color: '#0958D9', border: 'none', borderRadius: 20 }}>x{item.quantity}</Tag>
                          </List.Item>
                      )}
                  />
                </div>
                
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  padding: '20px 24px', 
                  background: '#1F1F1F', 
                  borderRadius: 16,
                  marginBottom: 24
                }}>
                    <span style={{ color: '#FFFFFF', fontSize: 16, fontWeight: 500 }}>Total</span>
                    <span style={{ color: '#FFFFFF', fontSize: 20, fontWeight: 700 }}>RM {cart.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2)}</span>
                </div>

                <Form form={checkoutForm} layout="vertical" onFinish={handleCheckout}>
                    <Form.Item name="note" label={<span style={{ fontWeight: 500 }}>Special Instructions <Tag style={{ background: '#E6F0FF', color: '#0958D9', border: 'none', borderRadius: 20, marginLeft: 8 }}>AI Analyzed</Tag></span>}>
                        <TextArea 
                          rows={3} 
                          placeholder="e.g. I love spicy food! (Azure AI will analyze the sentiment)"
                          style={{ borderRadius: 12 }}
                        />
                    </Form.Item>
                    <Button 
                      type="primary" 
                      htmlType="submit" 
                      block 
                      size="large" 
                      icon={<ShoppingCartOutlined />}
                      style={{ height: 56, borderRadius: 50, fontSize: 16, fontWeight: 600 }}
                    >
                        Place Order
                    </Button>
                </Form>
              </>
            )}
        </Modal>

        {/* Order History Drawer */}
        <Drawer
          title={<span style={{ fontSize: 20, fontWeight: 600 }}>My Order History</span>}
          placement="right"
          onClose={() => setIsHistoryOpen(false)}
          open={isHistoryOpen}
          width={420}
          styles={{ body: { padding: 0 } }}
        >
          {historyLoading ? (
            <div style={{ textAlign: 'center', padding: 60 }}>
              <Text style={{ color: '#8C8C8C' }}>Loading orders...</Text>
            </div>
          ) : myOrders.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 60 }}>
              <HistoryOutlined style={{ fontSize: 48, color: '#D9D9D9', marginBottom: 16 }} />
              <Text style={{ display: 'block', color: '#8C8C8C' }}>No orders yet</Text>
            </div>
          ) : (
            <List
              itemLayout="vertical"
              dataSource={myOrders}
              renderItem={(order) => (
                <div style={{ padding: '20px 24px', borderBottom: '1px solid #F0F0F0' }}>
                  {/* Order Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <Text strong style={{ fontSize: 16, color: '#1F1F1F' }}>Order #{order.id}</Text>
                    <Tag style={{ 
                      background: order.status === 'Delivered' ? '#E6F7E9' : 
                                  order.status === 'Cancelled' ? '#FFF1F0' : 
                                  order.status === 'Pending' ? '#E6F0FF' : '#FFF7E6',
                      color: order.status === 'Delivered' ? '#0D7A1F' : 
                             order.status === 'Cancelled' ? '#CF1322' : 
                             order.status === 'Pending' ? '#0958D9' : '#D46B08',
                      border: 'none',
                      borderRadius: 20,
                      padding: '4px 12px'
                    }}>
                      {order.status}
                    </Tag>
                  </div>

                  {/* Date */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12, color: '#8C8C8C', fontSize: 13 }}>
                    <ClockCircleOutlined />
                    {new Date(order.orderDate).toLocaleString()}
                  </div>

                  {/* Items */}
                  <div style={{ background: '#F5F7FA', borderRadius: 12, padding: 12, marginBottom: 12 }}>
                    {order.items?.map((item, idx) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                        <Text style={{ color: '#595959' }}>{item.food?.name || 'Unknown'}</Text>
                        <Text style={{ color: '#8C8C8C' }}>x{item.quantity}</Text>
                      </div>
                    ))}
                  </div>

                  {/* Note & Sentiment */}
                  {order.customerNote && (
                    <div style={{ marginBottom: 12 }}>
                      <Text style={{ color: '#8C8C8C', fontSize: 13, fontStyle: 'italic' }}>"{order.customerNote}"</Text>
                      {order.sentiment && (
                        <Tag style={{ 
                          marginLeft: 8,
                          background: order.sentiment === 'Positive' ? '#E6F7E9' : 
                                      order.sentiment === 'Negative' ? '#FFF1F0' : '#F5F5F5',
                          color: order.sentiment === 'Positive' ? '#0D7A1F' : 
                                 order.sentiment === 'Negative' ? '#CF1322' : '#595959',
                          border: 'none',
                          borderRadius: 20
                        }}>
                          {order.sentiment}
                        </Tag>
                      )}
                    </div>
                  )}

                  {/* Total & Cancel */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    {order.status === 'Pending' ? (
                      <Popconfirm
                        title="Cancel this order?"
                        description="This action cannot be undone."
                        onConfirm={() => handleCancelOrder(order.id)}
                        okText="Yes, Cancel"
                        cancelText="No"
                      >
                        <Button danger type="text" size="small" style={{ borderRadius: 8 }}>Cancel Order</Button>
                      </Popconfirm>
                    ) : (
                      <div></div>
                    )}
                    <Text strong style={{ fontSize: 16, color: '#1F1F1F' }}>RM {order.totalPrice.toFixed(2)}</Text>
                  </div>
                </div>
              )}
            />
          )}
        </Drawer>

      </Content>
    </Layout>
  );
};

export default MenuPage;