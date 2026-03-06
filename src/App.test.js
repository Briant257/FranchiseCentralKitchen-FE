<<<<<<< HEAD
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders login page', () => {
  render(<App />);
  expect(screen.getByRole('heading', { name: /Central Kitchen/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /Đăng nhập/i })).toBeInTheDocument();
=======
import { render, screen } from "@testing-library/react";
import App from "./App";

test("renders login page", () => {
  render(<App />);
  expect(
    screen.getByRole("heading", { name: /Central Kitchen/i }),
  ).toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: /Đăng nhập/i }),
  ).toBeInTheDocument();
>>>>>>> 84ecd4c (fix conflict)
});
