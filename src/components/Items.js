import React from "react";
import "./Items.css";
import Usefetch from "../hooks/useGet";
import { Link } from "react-router-dom";

function Items() {
  const API_BASE_URL = process.env.REACT_APP_URL;
  const api = `${API_BASE_URL}/ip/item/allitems`;
  const { data } = Usefetch(api);

  const all_items = data?.all_Items;

  return (
    <>
      <h1 className="items"> products</h1>

      <div className="items">
        {all_items ? (
          all_items.map((item) => (
            <Link
              to={`/itemdetail/${item._id}`}
              className="links"
              key={item._id}
            >
              <div className="card product-card">
                {/* Category badge (FIXED) */}
                <span className="category-badge">
                  {item.Item_Category?.catagory_Name || "Other"}
                </span>

                {/* Image */}
                <div className="image-wrapper">
                  <img
                    src={item.Item_Images}
                    alt={item.Item_Description}
                    className="card-img-top"
                  />
                </div>

                <div className="card-body">
                  {/* Title */}
                  <h6 className="card-title">{item.Item_Name}</h6>

                  {/* Rating */}
                  <div className="rating">
                    <i className="fa-solid fa-star"></i>
                    <i className="fa-solid fa-star"></i>
                    <i className="fa-solid fa-star"></i>
                    <i className="fa-solid fa-star"></i>
                    <i className="fa-regular fa-star"></i>
                    <span className="review-count">(5.0k Reviews)</span>
                  </div>

                  {/* Price */}
                  <div className="price">
                    ${item.Item_Price?.toLocaleString()}
                  </div>

                  {/* Buttons */}
                  <div className="actions">
                    <button className="btn-outline">Add to Cart</button>
                    <button className="btn-filled">Buy Now</button>
                  </div>
                </div>
              </div>
            </Link>
          ))
        ) : (
          <div className="spinner-border text-warning" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        )}
      </div>
    </>
  );
}

export default Items;
