import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'

// Simple button component for testing
function SimpleButton({ 
  children, 
  onClick,
  disabled = false 
}: { 
  children: React.ReactNode
  onClick?: () => void
  disabled?: boolean 
}) {
  return (
    <button onClick={onClick} disabled={disabled}>
      {children}
    </button>
  )
}

describe('SimpleButton', () => {
  it('renders button text', () => {
    render(<SimpleButton>Click me</SimpleButton>)
    expect(screen.getByText('Click me')).toBeInTheDocument()
  })

  it('calls onClick when clicked', () => {
    const handleClick = jest.fn()
    render(<SimpleButton onClick={handleClick}>Click me</SimpleButton>)
    
    fireEvent.click(screen.getByText('Click me'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('can be disabled', () => {
    const handleClick = jest.fn()
    render(<SimpleButton onClick={handleClick} disabled>Click me</SimpleButton>)
    
    const button = screen.getByText('Click me')
    expect(button).toBeDisabled()
    
    fireEvent.click(button)
    expect(handleClick).not.toHaveBeenCalled()
  })

  it('has correct accessibility attributes', () => {
    render(<SimpleButton>Click me</SimpleButton>)
    
    const button = screen.getByRole('button', { name: 'Click me' })
    expect(button).toBeInTheDocument()
  })
})