import React from "react";
import Navbar from "../components/navbar";
import Footer from "../components/footer";
import "./styles.css";
import Catagory from "../components/Catagory";
import Items from "../components/Items";

function Home() {
  const slides = [
    `${process.env.PUBLIC_URL}/Gemini_Generated_Image_8902f58902f58902.png`,
    `${process.env.PUBLIC_URL}/Gemini_Generated_Image_87wu9t87wu9t87wu.png`,
    `${process.env.PUBLIC_URL}/Gemini_Generated_Image_7hd45l7hd45l7hd4.png`,
  ];

  return (
    <div>
      <Navbar />
      <div className="content">
        <section className="home-hero">
          <div className="home-hero-inner">
            <div className="home-hero-copy">
              {/* <div className="home-hero-badge">Sale up to 40% off</div> */}
              <h1 className="home-hero-title">Aloe Vera Natural Cosmetics</h1>
              <p className="home-hero-subtitle">
                Discover skincare, makeup, and beauty essentials — curated for
                everyday glow.
              </p>
              <div className="home-hero-actions">
                <a className="home-hero-btn primary" href="#trending-products">
                  Shop now
                </a>
                <a className="home-hero-btn ghost" href="/catagory">
                  Browse categories
                </a>
              </div>
              <div className="home-hero-highlights">
                <div className="home-hero-highlight">
                  <i className="fa-solid fa-truck-fast" aria-hidden="true"></i>
                  <span>Fast delivery</span>
                </div>
                <div className="home-hero-highlight">
                  <i className="fa-solid fa-shield-heart" aria-hidden="true"></i>
                  <span>Original products</span>
                </div>
                {/* <div className="home-hero-highlight">
                  <i className="fa-solid fa-leaf" aria-hidden="true"></i>
                  <span>Skin-friendly picks</span>
                </div> */}
              </div>
            </div>

            <div className="home-hero-media">
              <div
                id="homeHeroCarousel"
                className="carousel slide home-hero-carousel"
                data-bs-ride="carousel"
              >
                <div className="carousel-indicators">
                  {slides.map((_, index) => (
                    <button
                      type="button"
                      data-bs-target="#homeHeroCarousel"
                      data-bs-slide-to={index}
                      key={index}
                      className={index === 0 ? "active" : ""}
                      aria-label={`Slide ${index + 1}`}
                    ></button>
                  ))}
                </div>
                <div className="carousel-inner">
                  {slides.map((image, index) => (
                    <div
                      className={`carousel-item ${index === 0 ? "active" : ""}`}
                      data-bs-interval="9000"
                      key={image}
                    >
                      <img
                        src={image}
                        className="d-block w-100"
                        alt={`hero_${index}`}
                      />
                    </div>
                  ))}
                </div>
                <button
                  className="carousel-control-prev"
                  type="button"
                  data-bs-target="#homeHeroCarousel"
                  data-bs-slide="prev"
                >
                  <span
                    className="carousel-control-prev-icon"
                    aria-hidden="true"
                  ></span>
                  <span className="visually-hidden">Previous</span>
                </button>
                <button
                  className="carousel-control-next"
                  type="button"
                  data-bs-target="#homeHeroCarousel"
                  data-bs-slide="next"
                >
                  <span
                    className="carousel-control-next-icon"
                    aria-hidden="true"
                  ></span>
                  <span className="visually-hidden">Next</span>
                </button>
              </div>
            </div>
          </div>
        </section>
        <main className="main1">
          <Catagory />

          <div id="trending-products">
            <Items />
          </div>
        </main>
      </div>
      <Footer />
    </div>
  );
}

export default Home;
