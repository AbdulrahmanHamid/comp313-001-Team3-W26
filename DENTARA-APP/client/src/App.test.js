import { render, screen } from '@testing-library/react';
import App from './App';

test('renders learn react link', () => {
  render(<App />);
  const linkElement = screen.getByText(/learn react/i);
  expect(linkElement).toBeInTheDocument();
});
// App.test.js
// Basic UI tests for the main App component
// Done by Vaibhav Kalia
// Reason: Ensure the root App component renders correctly and keeps the main CTA visible.

/*import { render, screen } from '@testing-library/react';
import App from './App';

describe('App component', () => {
    test('renders learn react link', () => {
        render(<App />);
        const linkElement = screen.getByText(/learn react/i);
        expect(linkElement).toBeInTheDocument();
    });

    test('renders learn react link as an anchor element', () => {
        render(<App />);
        const linkElement = screen.getByText(/learn react/i);
        expect(linkElement.tagName.toLowerCase()).toBe('a');
    });

    test('learn react link is visible to the user', () => {
        render(<App />);
        const linkElement = screen.getByText(/learn react/i);
        expect(linkElement).toBeVisible();
    });
});
*/