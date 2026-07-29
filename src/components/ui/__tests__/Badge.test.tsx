import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Badge } from '../Badge'

describe('Badge', () => {
  it('renders children text', () => {
    render(<Badge>Test Badge</Badge>)
    expect(screen.getByText('Test Badge')).toBeInTheDocument()
  })

  it('renders with default props', () => {
    render(<Badge>Default</Badge>)
    const badge = screen.getByText('Default')
    expect(badge).toBeInTheDocument()
    expect(badge).toHaveClass('inline-flex')
  })

  it('renders with status variant', () => {
    render(<Badge variant="status">Status</Badge>)
    const badge = screen.getByText('Status')
    expect(badge).toHaveClass('inline-flex')
  })

  it('renders with dot variant', () => {
    const { container } = render(<Badge variant="dot" />)
    const dot = container.querySelector('span')
    expect(dot).toBeInTheDocument()
    expect(dot).toHaveClass('w-2', 'h-2', 'rounded-full')
  })

  it('applies color classes', () => {
    render(<Badge color="success">Success</Badge>)
    const badge = screen.getByText('Success')
    expect(badge.className).toContain('success')
  })

  it('applies size classes', () => {
    const { rerender } = render(<Badge size="sm">Small</Badge>)
    expect(screen.getByText('Small').className).toContain('px-2')

    rerender(<Badge size="md">Medium</Badge>)
    expect(screen.getByText('Medium').className).toContain('px-2.5')
  })

  it('applies custom className', () => {
    render(<Badge className="custom-class">Custom</Badge>)
    expect(screen.getByText('Custom').className).toContain('custom-class')
  })
})
