"use client";

import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import "../styles/Navbar.css";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const closeMenu = () => {
    setIsOpen(false);
  };

  const isActive = (path) => {
    if (path === "/") {
      return location.pathname === "/";
    }
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo" onClick={closeMenu}>
          Prosperous Data Hub
        </Link>
        <div className={`menu-icon ${isOpen ? "active" : ""}`} onClick={toggleMenu}>
          <span></span>
          <span></span>
          <span></span>
        </div>
        <ul className={`nav-menu ${isOpen ? "active" : ""}`}>
          <li className="nav-item">
            <a
              href="/#"
              className={`nav-link ${isActive("/") ? "active" : ""}`}
              onClick={closeMenu}
            >
              Home
            </a>
          </li>
          <li className="nav-item">
            <a
              href="/#about"
              className="nav-link"
              onClick={closeMenu}
            >
              About
            </a>
          </li>
          <li className="nav-item">
            <a
              href="/#services"
              className="nav-link"
              onClick={closeMenu}
            >
              Services
            </a>
          </li>
          <li className="nav-item">
            <a
              href="/#contact"
              className="nav-link"
              onClick={closeMenu}
            >
              Contact
            </a>
          </li>
          <li className="nav-item">
            <Link
              to="/login"
              className={`nav-link ${isActive("/login") ? "active" : ""}`}
              onClick={closeMenu}
            >
              Login
            </Link>
          </li>
          <li className="nav-item">
            <Link
              to="/register"
              className={`nav-link ${isActive("/register") ? "active" : ""}`}
              onClick={closeMenu}
            >
              Register
            </Link>
          </li>
        </ul>
      </div>
    </nav>
  );
}
