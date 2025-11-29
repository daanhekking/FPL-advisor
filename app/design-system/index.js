/**
 * FPL Advisor Design System
 * Centralized export for all design system components and utilities
 */

// Theme
export * from './theme'

// Components
export * from './components/Section'
export * from './components/StatusDisplay'
export * from './components/Loading'

// Utilities
export * from './utils/formatters'
export * from './utils/colors'

// Re-export commonly used Ant Design components with consistent naming
export {
  Button,
  Card,
  Table,
  Tabs,
  Tag,
  Badge,
  Space,
  Row,
  Col,
  Divider,
  Typography,
  Alert,
  Modal,
  Tooltip,
  Dropdown,
  Input,
  Select,
  Checkbox,
  Radio,
  Switch,
  DatePicker,
  Statistic,
  Progress,
  Timeline,
  Steps,
  Layout,
  Grid
} from 'antd'

// Re-export commonly used icons
export {
  RobotOutlined,
  TrophyOutlined,
  SwapOutlined,
  ReloadOutlined,
  SettingOutlined,
  DownOutlined,
  CheckCircleFilled,
  ExclamationCircleFilled,
  CloseCircleFilled,
  InfoCircleFilled,
  QuestionCircleFilled,
  LoadingOutlined,
  BugOutlined,
  ApiOutlined,
  DatabaseOutlined
} from '@ant-design/icons'

