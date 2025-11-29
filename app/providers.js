'use client'

import { ConfigProvider, theme } from 'antd'
import { AntdRegistry } from '@ant-design/nextjs-registry'

export function Providers({ children }) {
  return (
    <AntdRegistry>
      <ConfigProvider
        theme={{
          algorithm: theme.darkAlgorithm,
          token: {
            // Keep it simple - use Ant Design's defaults with minimal customization
            fontFamily: 'var(--font-geist-sans), -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          },
        }}
      >
        {children}
      </ConfigProvider>
    </AntdRegistry>
  )
}

