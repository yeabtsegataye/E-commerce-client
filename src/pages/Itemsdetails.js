import React, { useEffect, useState } from "react";
import Navbar from "../components/navbar";
import Footer from "../components/footer";
import "./styles.css";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Avatar, Wrap, WrapItem } from "@chakra-ui/react";
import { UseAuthContext } from "../hooks/useAuthContext";
import { useCart } from "../contexts/CartContext";

function Itemsdetails() {
  const { user } = UseAuthContext();
  const API_BASE_URL = process.env.REACT_APP_URL;
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();

  const [items, setItems] = useState(null);
  const [loadError, setLoadError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setItems(null);
      setLoadError(null);
      try {
        const headers = {};
        if (user?.token) {
          headers.Authorization = `Bearer ${user.token}`;
        }
        const res = await fetch(`${API_BASE_URL}/ip/item/oneitem/${id}`, {
          headers,
        });
        const data = await res.json();
        if (cancelled) return;
        if (!res.ok) {
          setLoadError(data.message || "Could not load item");
          return;
        }
        setItems(data.all_Items);
      } catch (e) {
        if (!cancelled) setLoadError(e.message || "Network error");
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [API_BASE_URL, id, user?.token]);

  const isOwner =
    user && items && user.id === items.Item_poster?._id;

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this item?")) return;

    try {
      const res = await fetch(`${API_BASE_URL}/ip/item/itemsdelete`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: user.id,
          item_id: items._id,
        }),
      });

      const result = await res.json();

      if (res.ok) {
        alert("Item deleted successfully");
        window.location.href = "/";
      } else {
        alert(result.message || "Delete failed");
      }
    } catch (error) {
      console.error("Delete error:", error);
      alert("Something went wrong");
    }
  };

  const displayPrice = items?.Item_SellingPrice ?? items?.Item_Price ?? 0;

  const stockQty = typeof items?.StockQty === "number" ? items.StockQty : null;
  const inStock = stockQty === null ? null : stockQty > 0;

  const handleAddToCart = () => {
    if (!items) return;
    if (inStock === false) {
      alert("This item is out of stock.");
      return;
    }
    addToCart(items);
    navigate("/cart");
  };

  const ageNum = items != null ? Number(items.Item_Age) : NaN;
  const showAge = Number.isFinite(ageNum) && ageNum > 0;
  const showGender =
    items?.Item_Gender && items.Item_Gender !== "unisex";

  return (
    <div>
      <Navbar />

      <div className="item_content">
        <div className="item_d_grid item-detail-page">
          <div className="item_img_coll">
            {loadError && (
              <div className="item-detail-error">{loadError}</div>
            )}
            {!items && !loadError ? (
              <div className="spinner-border text-warning" role="status" />
            ) : items ? (
              <div className="item-detail-card">
                <div className="item-detail-media">
                  <img src={items.Item_Images} alt={items.Item_Name} />
                </div>

                <div className="item-detail-body">
                  <div className="item-detail-header">
                    <h2 className="item-detail-title">{items.Item_Name}</h2>
                    <div className="item-detail-price">
                      ETB {Number(displayPrice).toLocaleString()}
                    </div>
                  </div>

                  <div className="item-detail-meta">
                    <span className="item-pill">Brand: {items.Item_Brand}</span>
                    {items.Item_Category?.catagory_Name && (
                      <span className="item-pill">
                        Category: {items.Item_Category.catagory_Name}
                      </span>
                    )}
                    {items.Item_Condition && (
                      <span className="item-pill">Condition: {items.Item_Condition}</span>
                    )}
                    <span className="item-pill">Status: {items.Item_Status || "available"}</span>
                    {inStock !== null && (
                      <span className={`item-pill ${inStock ? "pill-ok" : "pill-warn"}`}>
                        {inStock ? "In stock" : "Out of stock"}
                      </span>
                    )}
                    {showAge && <span className="item-pill">Age: {items.Item_Age}</span>}
                    {showGender && (
                      <span className="item-pill">Gender: {items.Item_Gender}</span>
                    )}
                    {user?.isAdmin && items.Barcode && (
                      <span className="item-pill">Barcode: {items.Barcode}</span>
                    )}
                    {user?.isAdmin && stockQty !== null && (
                      <span className="item-pill">Stock qty: {stockQty}</span>
                    )}
                  </div>

                  <p className="item-detail-description">{items.Item_Description}</p>

                  {user?.isAdmin &&
                    typeof items.Item_BoughtPrice === "number" && (
                      <div className="item-admin-cost">
                        <span className="item-admin-cost-label">
                          Cost (buy) — admin only
                        </span>
                        <span className="item-admin-cost-value">
                          ETB{" "}
                          {Number(items.Item_BoughtPrice).toLocaleString()}
                        </span>
                      </div>
                    )}

                  <div className="item-detail-actions">
                    <button
                      className="btn-primary"
                      type="button"
                      onClick={handleAddToCart}
                      disabled={inStock === false}
                    >
                      {inStock === false ? "Out of stock" : "Add to cart"}
                    </button>
                    <Link className="btn-secondary" to="/cart">
                      View cart
                    </Link>
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          <div className="item_poster_coll">
            {items && (
              <>
                {items.Item_poster?.Address && (
                  <div className="item-detail-seller-card">
                    <h4 className="item-detail-seller-heading">Pickup area</h4>
                    <p className="item-detail-address">
                      {items.Item_poster.Address}
                    </p>
                  </div>
                )}

                <div className="user">
                  <div className="pp">
                    <Wrap>
                      <WrapItem>
                        <Avatar
                          size="md"
                          name={items.Item_poster?.Name}
                          src={items.Item_poster?.pic}
                        />
                      </WrapItem>
                    </Wrap>
                    <h4>{items.Item_poster?.Name}</h4>
                  </div>

                  <hr />

                  {items.Item_poster?.Phone && (
                    <a className="p" href={`tel:${items.Item_poster.Phone}`}>
                      <i className="fa-solid fa-phone">
                        <span> </span>
                        Call: {items.Item_poster.Phone}
                      </i>
                    </a>
                  )}
                </div>

                <div className="sefty">
                  <h4>Safety tips</h4>
                  <ul>
                    <li>Don't pay in advance</li>
                    <li>Meet in a public place</li>
                    <li>Inspect before paying</li>
                    <li>Pay only when satisfied</li>
                  </ul>
                </div>

                {isOwner && (
                  <div className="report">
                    <button className="delete-item-btn" type="button" onClick={handleDelete}>
                      Delete item
                    </button>
                  </div>
                )}

                {!isOwner && (
                  <div className="report">
                    <a
                      className="report-link"
                      href={`mailto:support@example.com?subject=${encodeURIComponent(
                        `Report item: ${items.Item_Name}`
                      )}&body=${encodeURIComponent(
                        `Item id: ${items._id}\nSeller: ${items.Item_poster?.Name || "-"}\n\nDescribe the issue:`
                      )}`}
                    >
                      Report issue
                    </a>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}

export default Itemsdetails;
