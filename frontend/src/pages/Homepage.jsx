"use client";

import { Link } from "react-router-dom";
import "../styles/Homepage.css";

export default function Homepage() {
  return (
    <div className="homepage">
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <h1 className="hero-title">Prosperous Data Hub</h1>
          <p className="hero-subtitle">Buy affordable internet data bundles instantly in Ghana</p>
          <p className="hero-description">
            Purchase MTN, Telecel, and AirtelTigo data bundles with ease. Fund your wallet securely 
            and enjoy fast, reliable data services without hassles.
          </p>
          <div className="hero-buttons">
            <Link to="/login" className="btn btn-primary">
              Login
            </Link>
            <Link to="/register" className="btn btn-secondary">
              Register
            </Link>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="about">
        <div className="container">
          <h2>About Prosperous Data Hub</h2>
          <p>
            We are a Ghana-based VTU (Virtual Top-Up) platform dedicated to providing affordable 
            and reliable mobile data, airtime, and bill payment services to customers across the country. 
            Our mission is to make digital services accessible and convenient for everyone.
          </p>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="services">
        <div className="container">
          <h2>Our Services</h2>
          <div className="services-grid">
            <div className="service-card">
              <div className="service-icon">📱</div>
              <h3>Buy MTN Data</h3>
              <p>Get instant MTN data bundles at competitive rates with fast delivery.</p>
            </div>
            <div className="service-card">
              <div className="service-icon">📡</div>
              <h3>Buy Telecel Data</h3>
              <p>Access Telecel data packages instantly with flexible bundle options.</p>
            </div>
            <div className="service-card">
              <div className="service-icon">🌐</div>
              <h3>Buy AirtelTigo Data</h3>
              <p>Purchase AirtelTigo data with ease and enjoy seamless connectivity.</p>
            </div>
            <div className="service-card">
              <div className="service-icon">💰</div>
              <h3>Fund Wallet</h3>
              <p>Easily load your wallet via secure payment methods to make purchases.</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="how-it-works">
        <div className="container">
          <h2>How It Works</h2>
          <div className="steps">
            <div className="step">
              <div className="step-number">1</div>
              <h3>Create Account</h3>
              <p>Sign up with your details and verify your email or phone number.</p>
            </div>
            <div className="step">
              <div className="step-number">2</div>
              <h3>Fund Wallet</h3>
              <p>Add money to your wallet using our secure payment gateway.</p>
            </div>
            <div className="step">
              <div className="step-number">3</div>
              <h3>Buy Data Instantly</h3>
              <p>Select your provider and bundle, and receive data credits instantly.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="contact">
        <div className="container">
          <h2>Get in Touch</h2>
          <div className="contact-info">
            <div className="contact-item">
              <strong>Phone:</strong>
              <p>+233 (XXX) XXX-XXXX</p>
            </div>
            <div className="contact-item">
              <strong>Email:</strong>
              <p>support@prosperousdatahub.com</p>
            </div>
            <div className="contact-item">
              <strong>Location:</strong>
              <p>Accra, Ghana</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <p>&copy; 2026 Prosperous Data Hub. All rights reserved.</p>
      </footer>
    </div>
  );
}
