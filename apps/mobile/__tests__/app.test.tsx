import React from 'react';
import App from '../App';

describe('app', () => {
  it('renders the Expo app shell without crashing', () => {
    expect(React.isValidElement(<App />)).toBe(true);
  });
});
