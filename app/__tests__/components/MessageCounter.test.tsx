import { render, screen } from '@testing-library/react'
import { MessageCounter } from '@/components/MessageCounter'

describe('MessageCounter', () => {
  it('should render with count', () => {
    render(<MessageCounter count={5} />)
    expect(screen.getByText('5')).toBeInTheDocument()
  })

  it('should render with zero count', () => {
    render(<MessageCounter count={0} />)
    expect(screen.getByText('0')).toBeInTheDocument()
  })

  it('should render with large count', () => {
    render(<MessageCounter count={999} />)
    expect(screen.getByText('999')).toBeInTheDocument()
  })
})