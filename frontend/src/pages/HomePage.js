import React from 'react';
import { Link } from 'react-router-dom';
import './HomePage.css';

const products = [
  {
    name: 'Délice le Yaourt',
    flavor: 'Fraise',
    image: '/image/produit%201.jpg',
    accent: 'hero-rose',
  },
  {
    name: 'Délice Le Nature',
    flavor: 'Nature',
    image: '/image/produit%202.jpg',
    accent: 'hero-green',
  },
  {
    name: 'Délice Mamzouj',
    flavor: 'Fruits rouges',
    image: '/image/produit%203.jpg',
    accent: 'hero-sky',
  },
  {
    name: 'Délice aux Fruits',
    flavor: 'Pêche',
    image: '/image/produit%204.png',
    accent: 'hero-orange',
  },
  {
    name: 'Délice Max',
    flavor: 'Fraise intense',
    image: '/image/produit%204.png',
    accent: 'hero-red',
  },
];

const highlights = [
  { value: '45+', label: 'années de qualité' },
  { value: '5', label: 'gammes gourmandes' },
  { value: '100%', label: 'saveurs inspirées' },
];

export default function HomePage() {
  return (
    <div className="home-page">
      <header className="topbar">
        <div className="brand-lockup">
          <img src="/image/logo.jpg" alt="Délice Danone" className="brand-logo" />
          <div>
            <div className="brand-name">Délice</div>
            <div className="brand-subtitle">Une expérience douce et gourmande</div>
          </div>
        </div>
        <nav className="topbar-nav" aria-label="Navigation principale">
          <a href="#produits">Produits</a>
          <a href="#qualite">Qualité</a>
          <a href="#histoire">Histoire</a>
        </nav>
        <Link to="/login" className="topbar-cta">Connexion</Link>
      </header>

      <main>
        <section className="hero-section">
          <div className="hero-copy">
            <span className="eyebrow">Bien se nourrir, ça fait grandir</span>
            <h1>
              Le goût du lait,
              <br />
              la douceur du quotidien.
            </h1>
            <p>
              Une vitrine inspirée des codes Delice Danone, avec des couleurs douces,
              des vagues fluides et des cartes produits qui mettent les visuels au centre.
            </p>
            <div className="hero-actions">
              <a href="#produits" className="primary-btn">Découvrir</a>
              <Link to="/login" className="secondary-btn">Accéder à l’espace admin</Link>
            </div>
            <div className="highlight-row">
              {highlights.map((item) => (
                <article className="highlight-card" key={item.label}>
                  <strong>{item.value}</strong>
                  <span>{item.label}</span>
                </article>
              ))}
            </div>
          </div>

          <div className="hero-visual">
            <div className="hero-badge">Plus de 45 ans de qualité supérieure</div>
            <div className="hero-logo-shell">
              <img src="/image/logo.jpg" alt="Logo Délice" />
            </div>
            <div className="floating-product floating-left">
              <img src="/image/produit%203.jpg" alt="Délice Mamzouj" />
            </div>
            <div className="floating-product floating-right">
              <img src="/image/produit%204.png" alt="Délice Max" />
            </div>
          </div>
        </section>

        <div className="wave wave-top" aria-hidden="true" />

        <section id="produits" className="products-section">
          <div className="section-heading">
            <span className="section-kicker">Nos gammes</span>
            <h2>Découvrir notre large gamme de produits</h2>
            <p>
              Des packagings lumineux, des couleurs franches et des cartes produit qui donnent envie
              de parcourir la collection.
            </p>
          </div>

          <div className="product-grid">
            {products.map((product) => (
              <article className={`product-card ${product.accent}`} key={product.name}>
                <div className="product-image-wrap">
                  <img src={product.image} alt={product.name} />
                </div>
                <div className="product-content">
                  <h3>{product.name}</h3>
                  <p>{product.flavor}</p>
                  <span>Découvrir</span>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section id="qualite" className="quality-section">
          <div className="quality-copy">
            <span className="section-kicker light">Qualité supérieure</span>
            <h2>Bien se nourrir, grandir en bonne santé</h2>
            <p>
              On reprend les codes visuels de la marque avec des courbes douces, une profondeur
              bleue et des mises en avant très centrées sur le produit.
            </p>
            <div className="benefits-list">
              <div>
                <strong>Calcium</strong>
                <span>Pour le quotidien</span>
              </div>
              <div>
                <strong>Goût</strong>
                <span>Des saveurs franches</span>
              </div>
              <div>
                <strong>Confort</strong>
                <span>Un design chaleureux</span>
              </div>
            </div>
          </div>
          <div className="quality-visual">
            <img src="/image/produit%201.jpg" alt="Délice le Yaourt" />
          </div>
        </section>

        <div className="wave wave-bottom" aria-hidden="true" />

        <section id="histoire" className="story-section">
          <div className="story-card">
            <h2>Une direction artistique simple et douce</h2>
            <p>
              Le front est pensé pour rester lisible, rassurant et gourmand, avec des espaces
              respirants et une hiérarchie très claire autour des visuels produits.
            </p>
          </div>
          <div className="story-card story-card-alt">
            <h2>Une base prête pour vos ajouts</h2>
            <p>
              Les images présentes dans <span>/frontend/image</span> sont utilisées comme base,
              et la structure peut ensuite être enrichie avec d’autres produits ou bannières.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
