import { render, screen } from '@testing-library/react'
import App from './App'

it('renders the BEC accreditation portal shell', async () => {
  render(<App />)
  expect(await screen.findByRole('heading', { name: /Bangladesh Election Commission Accreditation Portal/i })).toBeInTheDocument()
  expect(screen.getByRole('link', { name: /apply now/i })).toBeInTheDocument()
  expect(screen.queryByText(/Demo credentials/i)).not.toBeInTheDocument()
  expect(screen.queryByText(/Seeded applications/i)).not.toBeInTheDocument()
  expect(screen.queryByRole('link', { name: /staff login/i })).not.toBeInTheDocument()
})
