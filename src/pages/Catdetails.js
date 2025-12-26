import React from "react";
import Navbar from "../components/navbar";
import Footer from "../components/footer";
import "./styles.css";
import "../components/Items.css";

import Catagory from "../components/Catagory";
import { Link, useParams } from "react-router-dom";
import Usefetch from "../hooks/useGet";

function Cat_details() {
    const API_BASE_URL = process.env.REACT_APP_URL ;

  const _id = useParams();
  const id = _id.id;
  console.log(id);
  const api = `${API_BASE_URL}/ip/item/catitems/${id}`;
  const { data } = Usefetch(api);
  const all_items = data.cat_one;
  return (
    <div>
      <Navbar />
      <div className="content">
        <main className="main1">
          <div className="coll1">
            <Catagory />
          </div>
          <div className="coll2">
                  <h1 className="items"> products</h1>

            <div className="items">
              {/* card starts */}
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
              {/* card ends  */}
            </div>
          </div>
        </main>
      </div>
      <Footer />
    </div>
  );
}

export default Cat_details;
