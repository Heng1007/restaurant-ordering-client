import React, { useState } from 'react';
import { Card, Form, Input, Button, Typography, message, Alert } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;

const LoginPage: React.FC = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false); // 控制按钮转圈圈
    const [errorMsg, setErrorMsg] = useState('');  // 存放错误信息
    const [isRegister, setIsRegister] = useState(false); // Toggle between Login and Register

    // 👇 这个 URL 必须跟你后端运行的地址一模一样！
    // 如果你的后端是 https://localhost:7001，请改这里
    const BACKEND_URL = "https://heng-food-api-amc2aab4hdebekhg.southeastasia-01.azurewebsites.net";

    const onFinish = async (values: any) => {
        console.log('Input:', values);
        setLoading(true);
        setErrorMsg('');

        try {
            // Determine API endpoint based on mode
            const endpoint = isRegister ? '/api/Auth/register' : '/api/Auth/login';

            // 🚀 发送真实的 HTTP 请求给 .NET 后端
            const response = await axios.post(`${BACKEND_URL}${endpoint}`, {
                username: values.username,
                password: values.password
            });

            if (isRegister) {
                // Registration Successful
                message.success('Registration Successful! Please log in.');
                setIsRegister(false); // Switch back to login mode
            } else {
                // Login Successful
                message.success('Login Successful! Redirecting...');
                const token = response.data;
                localStorage.setItem('token', token);
                localStorage.setItem('username', values.username);
                
                // Decode JWT to get role
                try {
                    const payload = JSON.parse(atob(token.split('.')[1]));
                    const role = payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] || payload.role || 'User';
                    localStorage.setItem('role', role);
                } catch (e) {
                    localStorage.setItem('role', 'User');
                }
                
                // 3. 延迟 1 秒跳转到主页 (Menu Page)
                setTimeout(() => {
                    navigate('/menu');
                }, 1000);
            }

        } catch (error: any) {
            // 如果失败 (401/500)：
            console.error('Login Failed:', error);

            // ✅ 修复代码 (只提取 Message 字段)
            const responseData = error.response?.data;

            // 检查 responseData 是不是对象？如果是，取它的 Message 属性
            // 注意：后端 C# 的属性是 Message (大写开头)，但 JSON 传过来通常可能变成 message (小写开头) 或 Message
            // 所以我们要保险一点，两个都试一下，或者直接取 string
            let msg = '';

            if (typeof responseData === 'object' && responseData !== null) {
                // 尝试取 Message 或 message，如果没有就转成字符串
                msg = responseData.Message || responseData.message || JSON.stringify(responseData);
            } else {
                // 如果本来就是字符串 (比如旧的接口)，直接用
                msg = responseData || 'Network Error or Wrong Credentials';
            }

            setErrorMsg(msg);
            message.error(isRegister ? 'Registration Failed' : 'Login Failed');
        } finally {
            setLoading(false); // 无论成功失败，停止转圈
        }
    };

    return (
        <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '100vh',
            background: '#F5F7FA',
            padding: 24
        }}>
            <Card
                bordered={false}
                style={{
                    maxWidth: 420,
                    width: '100%',
                    borderRadius: 24,
                    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.08)',
                    padding: '16px'
                }}
            >
                <div style={{ textAlign: 'center', marginBottom: 40 }}>
                    {/* Premium Logo */}
                    <div style={{ 
                        width: 64, 
                        height: 64, 
                        background: '#1890FF',
                        borderRadius: 16,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 20px',
                        boxShadow: '0 8px 24px rgba(24, 144, 255, 0.3)'
                    }}>
                        <span style={{ fontSize: 28, filter: 'brightness(0) invert(1)' }}>🍔</span>
                    </div>
                    <Title level={2} style={{ color: '#1F1F1F', marginBottom: 8, fontWeight: 600 }}>
                        {isRegister ? 'Create Account' : 'Welcome Back'}
                    </Title>
                    <Text style={{ color: '#8C8C8C', fontSize: 15 }}>
                        {isRegister ? 'Join our food delivery platform' : 'Sign in to manage your orders'}
                    </Text>
                </div>

                {/* Error Alert */}
                {errorMsg && (
                    <Alert
                        message={errorMsg}
                        type="error"
                        showIcon
                        style={{ 
                            marginBottom: 24, 
                            borderRadius: 12,
                            border: 'none',
                            background: '#FFF1F0'
                        }}
                    />
                )}

                <Form
                    name="login_form"
                    onFinish={onFinish}
                    layout="vertical"
                    size="large"
                >
                    <Form.Item
                        name="username"
                        rules={[{ required: true, message: 'Please enter your username' }]}
                    >
                        <Input 
                            prefix={<UserOutlined style={{ color: '#8C8C8C' }} />} 
                            placeholder="Username"
                            style={{ 
                                height: 52, 
                                borderRadius: 12,
                                border: '1.5px solid #E8ECF0',
                                fontSize: 15
                            }}
                        />
                    </Form.Item>

                    <Form.Item
                        name="password"
                        rules={[{ required: true, message: 'Please enter your password' }]}
                    >
                        <Input.Password 
                            prefix={<LockOutlined style={{ color: '#8C8C8C' }} />} 
                            placeholder="Password"
                            style={{ 
                                height: 52, 
                                borderRadius: 12,
                                border: '1.5px solid #E8ECF0',
                                fontSize: 15
                            }}
                        />
                    </Form.Item>

                    <Form.Item style={{ marginBottom: 16, marginTop: 32 }}>
                        <Button 
                            type="primary" 
                            htmlType="submit" 
                            block 
                            loading={loading} 
                            style={{ 
                                height: 52, 
                                fontSize: 16, 
                                fontWeight: 600,
                                borderRadius: 50,
                                boxShadow: '0 8px 24px rgba(24, 144, 255, 0.35)'
                            }}
                        >
                            {isRegister ? 'Create Account' : 'Sign In'}
                        </Button>
                    </Form.Item>

                    <div style={{ textAlign: 'center' }}>
                        <Button 
                            type="link" 
                            onClick={() => setIsRegister(!isRegister)}
                            style={{ color: '#595959', fontWeight: 500 }}
                        >
                            {isRegister ? 'Already have an account? Sign in' : "Don't have an account? Register"}
                        </Button>
                    </div>
                </Form>

                <div style={{ textAlign: 'center', marginTop: 32, paddingTop: 24, borderTop: '1px solid #F0F0F0' }}>
                    <Text style={{ color: '#8C8C8C', fontSize: 13 }}>
                        Powered by .NET 8 + Azure AI
                    </Text>
                </div>
            </Card>
        </div>
    );
};

export default LoginPage;