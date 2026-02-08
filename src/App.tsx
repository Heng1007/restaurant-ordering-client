import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import LoginPage from './pages/loginPage';
import MenuPage from './pages/MenuPage';
import OrdersPage from './pages/OrdersPage';

// Premium Minimalist Theme Configuration
const premiumTheme = {
  token: {
    // Color Palette
    colorPrimary: '#1890FF',
    colorSuccess: '#0D7A1F',
    colorWarning: '#D46B08',
    colorError: '#CF1322',
    colorBgContainer: '#FFFFFF',
    colorBgLayout: '#F5F7FA',
    colorBorder: '#E8ECF0',
    colorText: '#1F1F1F',
    colorTextSecondary: '#595959',
    colorTextTertiary: '#8C8C8C',
    
    // Border Radius
    borderRadius: 12,
    borderRadiusLG: 16,
    borderRadiusSM: 8,
    
    // Font
    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', Roboto, sans-serif",
    fontSize: 14,
    fontSizeLG: 16,
    fontSizeHeading1: 32,
    fontSizeHeading2: 24,
    fontSizeHeading3: 20,
    
    // Spacing
    padding: 16,
    paddingLG: 24,
    paddingXL: 32,
    margin: 16,
    marginLG: 24,
    
    // Shadows
    boxShadow: '0 4px 24px rgba(0, 0, 0, 0.06)',
    boxShadowSecondary: '0 8px 32px rgba(0, 0, 0, 0.1)',
  },
  components: {
    Button: {
      borderRadius: 50,
      controlHeight: 44,
      fontWeight: 500,
    },
    Card: {
      borderRadiusLG: 16,
      boxShadowTertiary: '0 4px 24px rgba(0, 0, 0, 0.06)',
    },
    Input: {
      borderRadius: 12,
      controlHeight: 48,
    },
    Modal: {
      borderRadiusLG: 20,
    },
    Table: {
      borderRadius: 16,
      headerBg: '#F5F7FA',
      headerColor: '#595959',
    },
    Tag: {
      borderRadiusSM: 20,
    },
    Select: {
      borderRadius: 12,
    },
  },
};

function App() {
  return (
    <ConfigProvider theme={premiumTheme}>
      <BrowserRouter>
        <Routes>
          {/* 默认路径跳转到 /login */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          
          {/* 登录页 */}
          <Route path="/login" element={<LoginPage />} />
          
          <Route path="/menu" element={<MenuPage />} />
          <Route path="/orders" element={<OrdersPage />} />
        </Routes>
      </BrowserRouter>
    </ConfigProvider>
  );
}

export default App;