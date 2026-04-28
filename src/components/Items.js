import React, { useEffect, useRef, useState } from "react";
import "./Items.css";
import { Link } from "react-router-dom";
import { useCart } from "../contexts/CartContext";
import { useToast } from "@chakra-ui/react";

function Items() {
  const Toast = useToast();
  const { addToCart } = useCart();
  const API_BASE_URL = process.env.REACT_APP_URL;
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const loaderRef = useRef(null);

  const fetchItems = async (pageNumber) => {
    setLoading(true);
    try {
      const res = await fetch(
        `${API_BASE_URL}/ip/item/allitems?page=${pageNumber}&limit=12`
      );
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Unable to load products");
      }

      setItems((prev) =>
        pageNumber === 1 ? data.all_Items : [...prev, ...(data.all_Items || [])]
      );
      setHasMore(Boolean(data.hasMore));
      setError(null);
    } catch (fetchError) {
      setError(fetchError.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setItems([]);
    setPage(1);
    setHasMore(true);
    fetchItems(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [API_BASE_URL]);

  useEffect(() => {
    if (!loaderRef.current || loading || !hasMore) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setPage((prev) => prev + 1);
        }
      },
      { rootMargin: "300px" }
    );
    observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [loading, hasMore]);

  useEffect(() => {
    if (page === 1) return;
    fetchItems(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const handleAddToCart = (e, item) => {
    e.preventDefault();
    addToCart(item);
    Toast({
      title: `${item.Item_Name} added to cart!`,
      status: "success",
      duration: 5000,
      isClosable: true,
      position: "bottom",
    });
  };

  const discountedItems = items.filter(
    (item) => item.Item_BoughtPrice > item.Item_SellingPrice
  );
  const promoItems = discountedItems.slice(0, 2).length
    ? discountedItems.slice(0, 2)
    : items.slice(0, 2);
  const heroItems = items.slice(0, 12);
  const remainingItems = items.slice(12);

  return (
    <>
      <div className="items-header-row">
        <h1 className="items-title">Products</h1>
        {loading && page === 1 && (
          <div className="spinner-border text-warning" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        )}
      </div>

      <div className="items">
        {heroItems.map((item) => (
          <Link
            to={`/itemdetail/${item._id}`}
            className="links"
            key={item._id}
          >
            <div className="card product-card">
              <span className="category-badge">
                {item.Item_Category?.catagory_Name || "Other"}
              </span>
              <div className="image-wrapper">
                <img
                  src={item.Item_Images}
                  alt={item.Item_Description}
                  className="card-img-top"
                />
              </div>
              <div className="card-body">
                <h6 className="card-title">{item.Item_Name}</h6>
                <div className="rating">
                  <i className="fa-solid fa-star"></i>
                  <i className="fa-solid fa-star"></i>
                  <i className="fa-solid fa-star"></i>
                  <i className="fa-solid fa-star"></i>
                  <i className="fa-regular fa-star"></i>
                  <span className="review-count">(5.0k Reviews)</span>
                </div>
                <div className="price">
                  ETB {Number(item.Item_Price ?? item.Item_SellingPrice).toLocaleString()}
                </div>
                <div className="actions">
                  <button
                    className="btn-outline"
                    onClick={(e) => handleAddToCart(e, item)}
                  >
                    Add to Cart
                  </button>
                  <button className="btn-filled">Buy Now</button>
                </div>
              </div>
            </div>
          </Link>
        ))}

        {items.length >= 12 && (
          <div className="promo-block" key="promo-block">
            <div className="promo-card">
              <div>
                <p className="promo-label">Featured Deal</p>
                <h2>Shop the best discounts</h2>
                <p>
                  Discover hand-picked offers and limited-time savings right
                  inside the shop. Scroll on to see more products and daily
                  deals.
                </p>
                <button className="btn-filled promo-button" type="button">
                  Browse deals
                </button>
              </div>
            </div>
            <div className="discounted-grid">
              {promoItems.map((item) => (
                <Link
                  to={`/itemdetail/${item._id}`}
                  className="links discounted-card"
                  key={`promo-${item._id}`}
                >
                  <div className="discounted-image">
                    <img
                      src={item.Item_Images}
                      alt={item.Item_Name}
                      className="card-img-top"
                    />
                  </div>
                  <div className="discounted-content">
                    <span className="discount-tag">Discount deal</span>
                    <h6>{item.Item_Name}</h6>
                    <p>
                      Now ETB {Number(item.Item_Price ?? item.Item_SellingPrice).toLocaleString()}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {remainingItems.map((item) => (
          <Link
            to={`/itemdetail/${item._id}`}
            className="links"
            key={item._id}
          >
            <div className="card product-card">
              <span className="category-badge">
                {item.Item_Category?.catagory_Name || "Other"}
              </span>
              <div className="image-wrapper">
                <img
                  src={item.Item_Images}
                  alt={item.Item_Description}
                  className="card-img-top"
                />
              </div>
              <div className="card-body">
                <h6 className="card-title">{item.Item_Name}</h6>
                <div className="rating">
                  <i className="fa-solid fa-star"></i>
                  <i className="fa-solid fa-star"></i>
                  <i className="fa-solid fa-star"></i>
                  <i className="fa-solid fa-star"></i>
                  <i className="fa-regular fa-star"></i>
                  <span className="review-count">(5.0k Reviews)</span>
                </div>
                <div className="price">
                  ETB {Number(item.Item_Price ?? item.Item_SellingPrice).toLocaleString()}
                </div>
                <div className="actions">
                  <button
                    className="btn-outline"
                    onClick={(e) => handleAddToCart(e, item)}
                  >
                    Add to Cart
                  </button>
                  <button className="btn-filled">Buy Now</button>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {error && <p className="items-error">{error}</p>}
      {loading && page > 1 && (
        <div className="items-loading">Loading more products…</div>
      )}
      {!hasMore && !loading && items.length > 0 && (
        <p className="items-end">You have reached the end of the product list.</p>
      )}
      <div ref={loaderRef} className="items-loader" />
    </>
  );
}

export default Items;
