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
            colorPrimary: '#1677ff',
            borderRadius: 6,
            fontFamily: 'var(--font-geist-sans), -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          },
        }}
      >
        {children}
      </ConfigProvider>
    </AntdRegistry>
  )
}

